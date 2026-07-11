from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Estudiante, Matricula, DetalleMatricula, Nota, PeriodoAcad, Seccion, Curso, SolicitudDocumento, User, AuditLog
from app.utils import role_required

estudiante_bp = Blueprint('estudiante', __name__)

@estudiante_bp.route('/notas', methods=['GET'])
@jwt_required()
@role_required(['estudiante'])
def get_notas_estudiante():
    user_id = int(get_jwt_identity())
    estudiante = Estudiante.query.filter_by(user_id=user_id).first()
    if not estudiante:
        return jsonify({'error': 'Perfil de estudiante no encontrado'}), 404
        
    periodo_id = request.args.get('periodo_id', type=int)
    if not periodo_id:
        p_activo = PeriodoAcad.query.filter_by(activo=True).first()
        if p_activo:
            periodo_id = p_activo.id
            
    if not periodo_id:
        return jsonify({'error': 'No hay periodo académico activo o especificado'}), 400
        
    # Get student's matricula for this period
    matricula = Matricula.query.filter_by(estudiante_id=estudiante.id, periodo_id=periodo_id).first()
    if not matricula:
        return jsonify({
            'periodo_id': periodo_id,
            'notas': [],
            'resumen': {'total_creditos': 0, 'creditos_aprobados': 0, 'promedio_ponderado': 0.0}
        }), 200
        
    detalles = DetalleMatricula.query.filter_by(matricula_id=matricula.id).all()
    notas_data = []
    total_creditos = 0
    creditos_aprobados = 0
    suma_ponderada = 0
    creditos_evaluados = 0
    
    for d in detalles:
        nota = d.nota
        # Check if the section's grades are consolidated (official)
        is_official = (nota and nota.consolidated) or (s_acta := d.seccion.acta and s_acta.estado == 'CONSOLIDADA')
        
        nota_dict = {
            'nota_parcial1': float(nota.nota_parcial1) if (nota and is_official) else None,
            'nota_parcial2': float(nota.nota_parcial2) if (nota and is_official) else None,
            'evaluacion_continua': float(nota.evaluacion_continua) if (nota and is_official) else None,
            'examen_final': float(nota.examen_final) if (nota and is_official) else None,
            'promedio_final': float(nota.promedio_final) if (nota and is_official) else None,
            'estado': 'APROBADO' if (nota and is_official and float(nota.promedio_final) >= 10.5) else ('DESAPROBADO' if (nota and is_official) else 'EN_CURSO')
        }
        
        notas_data.append({
            'codigo_curso': d.seccion.curso.codigo_curso,
            'nombre_curso': d.seccion.curso.nombre,
            'creditos': d.seccion.curso.creditos,
            'seccion': d.seccion.codigo_seccion,
            'nota': nota_dict
        })
        
        # Calculate stats
        creditos_curso = d.seccion.curso.creditos
        total_creditos += creditos_curso
        if nota_dict['estado'] == 'APROBADO':
            creditos_aprobados += creditos_curso
            
        if nota_dict['promedio_final'] is not None:
            suma_ponderada += nota_dict['promedio_final'] * creditos_curso
            creditos_evaluados += creditos_curso
            
    promedio_ponderado = round(suma_ponderada / creditos_evaluados, 2) if creditos_evaluados > 0 else 0.0
    
    return jsonify({
        'periodo_id': periodo_id,
        'periodo_codigo': matricula.periodo.codigo_periodo,
        'estado_matricula': matricula.estado_matricula,
        'estado_pago': matricula.estado_pago,
        'notas': notas_data,
        'resumen': {
            'total_creditos': total_creditos,
            'creditos_aprobados': creditos_aprobados,
            'promedio_ponderado': promedio_ponderado
        }
    }), 200

@estudiante_bp.route('/cursos-disponibles', methods=['GET'])
@jwt_required()
@role_required(['estudiante'])
def get_cursos_disponibles():
    user_id = int(get_jwt_identity())
    estudiante = Estudiante.query.filter_by(user_id=user_id).first()
    if not estudiante:
        return jsonify({'error': 'Perfil de estudiante no encontrado'}), 404
        
    p_activo = PeriodoAcad.query.filter_by(activo=True).first()
    if not p_activo:
        return jsonify({'error': 'No hay un periodo académico activo para matricularse'}), 400
        
    # Get all sections in the active period
    secciones = Seccion.query.filter_by(periodo_id=p_activo.id).all()
    result = []
    for s in secciones:
        # Check current student count
        count = DetalleMatricula.query.filter_by(seccion_id=s.id).count()
        result.append({
            'seccion_id': s.id,
            'codigo_seccion': s.codigo_seccion,
            'capacidad': s.capacidad,
            'cupos_disponibles': max(0, s.capacidad - count),
            'horario': s.horario,
            'docente': s.docente.user.name if s.docente else 'Sin asignar',
            'curso': {
                'id': s.curso.id,
                'codigo_curso': s.curso.codigo_curso,
                'nombre': s.curso.nombre,
                'creditos': s.curso.creditos
            }
        })
    return jsonify(result), 200

@estudiante_bp.route('/matricula', methods=['POST'])
@jwt_required()
@role_required(['estudiante'])
def solicitar_matricula():
    user_id = int(get_jwt_identity())
    estudiante = Estudiante.query.filter_by(user_id=user_id).first()
    if not estudiante:
        return jsonify({'error': 'Perfil de estudiante no encontrado'}), 404
        
    p_activo = PeriodoAcad.query.filter_by(activo=True).first()
    if not p_activo:
        return jsonify({'error': 'No hay un periodo académico activo para matricularse'}), 400
        
    # Check if student already registered in this period
    matricula = Matricula.query.filter_by(estudiante_id=estudiante.id, periodo_id=p_activo.id).first()
    if matricula:
        return jsonify({'error': 'Ya cuentas con una matrícula en curso para este periodo'}), 400
        
    data = request.get_json() or {}
    seccion_ids = data.get('seccion_ids', [])
    comprobante = data.get('comprobante_pago')
    costo = float(data.get('costo_total', 120.00)) # Default/mock cost
    
    if not seccion_ids:
        return jsonify({'error': 'Debe seleccionar al menos un curso'}), 400
        
    if not comprobante:
        return jsonify({'error': 'Debe ingresar el código de comprobante de pago'}), 400
        
    # Validar existencia y capacidad de todas las secciones antes de crear registros
    for sid in seccion_ids:
        s = Seccion.query.get(sid)
        if not s or s.periodo_id != p_activo.id:
            return jsonify({'error': f'La sección con ID {sid} no es válida para el periodo activo.'}), 400
        count = DetalleMatricula.query.filter_by(seccion_id=sid).count()
        if count >= s.capacidad:
            return jsonify({'error': f'La sección {s.codigo_seccion} del curso {s.curso.nombre} no tiene cupos disponibles.'}), 400
            
    # Create Matricula
    matricula = Matricula(
        estudiante_id=estudiante.id,
        periodo_id=p_activo.id,
        costo_total=costo,
        estado_pago='pendiente',
        comprobante_pago=comprobante,
        estado_matricula='solicitada',
        observacion='Matrícula solicitada vía Intranet.'
    )
    db.session.add(matricula)
    db.session.flush() # Obtiene el ID de matrícula sin confirmar la transacción definitiva
    
    # Add Details
    for sid in seccion_ids:
        detalle = DetalleMatricula(
            matricula_id=matricula.id,
            seccion_id=sid,
            estado_curso='cursando'
        )
        db.session.add(detalle)
        db.session.flush()
        
        # Create empty grade record
        nota = Nota(detalle_matricula_id=detalle.id)
        db.session.add(nota)
        
    db.session.commit()
    
    # Audit log
    log = AuditLog(
        user_id=user_id,
        username=estudiante.user.username,
        action="MATRICULA_REQUEST",
        ip_address=request.remote_addr,
        details=f"Estudiante solicitó matrícula para el periodo {p_activo.codigo_periodo} con comprobante: {comprobante}."
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Solicitud de matrícula registrada con éxito',
        'matricula_id': matricula.id
    }), 201

@estudiante_bp.route('/matricula-actual', methods=['GET'])
@jwt_required()
@role_required(['estudiante'])
def get_matricula_actual():
    user_id = int(get_jwt_identity())
    estudiante = Estudiante.query.filter_by(user_id=user_id).first()
    if not estudiante:
        return jsonify({'error': 'Perfil de estudiante no encontrado'}), 404
        
    p_activo = PeriodoAcad.query.filter_by(activo=True).first()
    if not p_activo:
        return jsonify({'error': 'No hay un periodo académico activo'}), 400
        
    matricula = Matricula.query.filter_by(estudiante_id=estudiante.id, periodo_id=p_activo.id).first()
    if not matricula:
        return jsonify({'error': 'No se encontró solicitud de matrícula para el periodo actual'}), 404
        
    detalles = DetalleMatricula.query.filter_by(matricula_id=matricula.id).all()
    cursos = []
    for d in detalles:
        cursos.append({
            'codigo_curso': d.seccion.curso.codigo_curso,
            'nombre_curso': d.seccion.curso.nombre,
            'creditos': d.seccion.curso.creditos,
            'seccion': d.seccion.codigo_seccion,
            'horario': d.seccion.horario,
            'docente': d.seccion.docente.user.name if d.seccion.docente else 'Sin asignar'
        })
        
    return jsonify({
        'matricula_id': matricula.id,
        'fecha_matricula': matricula.fecha_matricula.isoformat() if matricula.fecha_matricula else None,
        'costo_total': float(matricula.costo_total),
        'estado_pago': matricula.estado_pago,
        'comprobante_pago': matricula.comprobante_pago,
        'estado_matricula': matricula.estado_matricula,
        'observacion': matricula.observacion,
        'periodo': matricula.periodo.codigo_periodo,
        'cursos': cursos
    }), 200

@estudiante_bp.route('/documentos', methods=['GET'])
@jwt_required()
@role_required(['estudiante'])
def get_documentos():
    user_id = int(get_jwt_identity())
    estudiante = Estudiante.query.filter_by(user_id=user_id).first()
    if not estudiante:
        return jsonify({'error': 'Perfil de estudiante no encontrado'}), 404
        
    solicitudes = SolicitudDocumento.query.filter_by(estudiante_id=estudiante.id).order_by(SolicitudDocumento.fecha_solicitud.desc()).all()
    return jsonify([s.to_dict() for s in solicitudes]), 200

@estudiante_bp.route('/documentos', methods=['POST'])
@jwt_required()
@role_required(['estudiante'])
def solicitar_documento():
    user_id = int(get_jwt_identity())
    estudiante = Estudiante.query.filter_by(user_id=user_id).first()
    if not estudiante:
        return jsonify({'error': 'Perfil de estudiante no encontrado'}), 404
        
    data = request.get_json() or {}
    tipo = data.get('tipo_documento')
    if not tipo or tipo not in ['constancia_matricula', 'certificado_estudios']:
        return jsonify({'error': 'Tipo de documento no válido'}), 400
        
    sol = SolicitudDocumento(
        estudiante_id=estudiante.id,
        tipo_documento=tipo,
        estado='solicitado',
        observaciones='Solicitado vía Intranet Estudiante.'
    )
    db.session.add(sol)
    
    # Audit log
    log = AuditLog(
        user_id=user_id,
        username=estudiante.user.username,
        action="DOCUMENT_REQUEST",
        ip_address=request.remote_addr,
        details=f"Estudiante solicitó documento tipo: {tipo}."
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Solicitud de documento registrada con éxito',
        'documento': sol.to_dict()
    }), 201
