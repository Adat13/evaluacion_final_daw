from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Seccion, DetalleMatricula, Nota, PeriodoAcad, Docente, Acta, User, AuditLog
from app.utils import role_required

direccion_bp = Blueprint('direccion', __name__)

@direccion_bp.route('/cursos/supervision', methods=['GET'])
@jwt_required()
@role_required(['direccion', 'administrador'])
def supervision_academica():
    user_id = int(get_jwt_identity())
    
    periodo_id = request.args.get('periodo_id', type=int)
    if not periodo_id:
        p_activo = PeriodoAcad.query.filter_by(activo=True).first()
        if p_activo:
            periodo_id = p_activo.id
            
    if not periodo_id:
        return jsonify({'error': 'No hay periodo académico activo'}), 400
        
    secciones = Seccion.query.filter_by(periodo_id=periodo_id).all()
    
    total_secciones = len(secciones)
    secciones_con_docente = sum(1 for s in secciones if s.docente_id)
    silabos_cargados = sum(1 for s in secciones if s.silabo_url)
    
    # Carga docente details
    docentes_carga = {}
    for s in secciones:
        if s.docente:
            did = s.docente.id
            if did not in docentes_carga:
                docentes_carga[did] = {
                    'nombre': s.docente.user.name,
                    'codigo_docente': s.docente.codigo_docente,
                    'total_secciones': 0,
                    'total_creditos': 0,
                    'total_horas': 0
                }
            docentes_carga[did]['total_secciones'] += 1
            docentes_carga[did]['total_creditos'] += s.curso.creditos
            # Approx 2 hours per credit
            docentes_carga[did]['total_horas'] += s.curso.creditos * 2
            
    carga_docentes_list = list(docentes_carga.values())
    
    # Secciones sin docente
    secciones_sin_docente = []
    for s in secciones:
        if not s.docente:
            secciones_sin_docente.append({
                'seccion_id': s.id,
                'codigo_curso': s.curso.codigo_curso,
                'nombre_curso': s.curso.nombre,
                'seccion': s.codigo_seccion
            })
            
    indicadores = {
        'porcentaje_secciones_con_docente': round((secciones_con_docente / total_secciones * 100), 2) if total_secciones > 0 else 0,
        'porcentaje_silabos_cargados': round((silabos_cargados / total_secciones * 100), 2) if total_secciones > 0 else 0,
        'total_secciones': total_secciones,
        'secciones_con_docente': secciones_con_docente,
        'silabos_cargados': silabos_cargados
    }
    
    return jsonify({
        'periodo_id': periodo_id,
        'indicadores': indicadores,
        'carga_docentes': carga_docentes_list,
        'secciones_sin_docente': secciones_sin_docente
    }), 200

@direccion_bp.route('/notas/indicadores', methods=['GET'])
@jwt_required()
@role_required(['direccion', 'administrador'])
def indicadores_academicos():
    user_id = int(get_jwt_identity())
    
    periodo_id = request.args.get('periodo_id', type=int)
    if not periodo_id:
        p_activo = PeriodoAcad.query.filter_by(activo=True).first()
        if p_activo:
            periodo_id = p_activo.id
            
    if not periodo_id:
        return jsonify({'error': 'No hay periodo académico activo'}), 400
        
    # Get all notes in the active period
    notas = Nota.query.join(DetalleMatricula).join(Seccion).filter(Seccion.periodo_id == periodo_id).all()
    
    total_notas = len(notas)
    aprobados = sum(1 for n in notas if float(n.promedio_final) >= 10.5)
    desaprobados = sum(1 for n in notas if float(n.promedio_final) < 10.5)
    
    tasa_aprobacion = (aprobados / total_notas * 100) if total_notas > 0 else 0.0
    tasa_desaprobacion = (desaprobados / total_notas * 100) if total_notas > 0 else 0.0
    promedio_institucional = sum(float(n.promedio_final) for n in notas) / total_notas if total_notas > 0 else 0.0
    
    actas_consolidadas = Acta.query.join(Seccion).filter(Seccion.periodo_id == periodo_id, Acta.estado == 'CONSOLIDADA').count()
    actas_pendientes = Acta.query.join(Seccion).filter(Seccion.periodo_id == periodo_id, Acta.estado != 'CONSOLIDADA').count()
    
    return jsonify({
        'periodo_id': periodo_id,
        'indicadores': {
            'tasa_aprobacion': round(tasa_aprobacion, 2),
            'tasa_desaprobacion': round(tasa_desaprobacion, 2),
            'promedio_institucional': round(promedio_institucional, 2),
            'actas_consolidadas': actas_consolidadas,
            'actas_pendientes': actas_pendientes,
            'total_notas_evaluadas': total_notas
        }
    }), 200

@direccion_bp.route('/actas/<int:acta_id>/estado', methods=['PUT'])
@jwt_required()
@role_required(['direccion', 'administrador'])
def cambiar_estado_acta(acta_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    acta = Acta.query.get_or_404(acta_id)
    data = request.get_json() or {}
    nuevo_estado = data.get('estado')
    observaciones = data.get('observaciones')
    
    estados_validos = ['BORRADOR', 'ENVIADA', 'OBSERVADA', 'APROBADA', 'CONSOLIDADA']
    if nuevo_estado not in estados_validos:
        return jsonify({'error': f'Estado inválido. Estados válidos: {estados_validos}'}), 400
        
    acta.estado = nuevo_estado
    if nuevo_estado == 'OBSERVADA':
        acta.observaciones = observaciones
    elif nuevo_estado == 'APROBADA':
        acta.fecha_aprobacion = datetime.utcnow()
    elif nuevo_estado == 'CONSOLIDADA':
        acta.fecha_consolidacion = datetime.utcnow()
        # Consolidate all grades in the section
        detalles = DetalleMatricula.query.filter_by(seccion_id=acta.seccion_id).all()
        for d in detalles:
            nota = Nota.query.filter_by(detalle_matricula_id=d.id).first()
            if nota:
                nota.consolidada = True
                
    db.session.commit()
    
    # Audit log
    log = AuditLog(
        user_id=user_id,
        username=user.username,
        action="ACTA_STATUS_CHANGE",
        ip_address=request.remote_addr,
        details=f"Usuario {user.username} cambió estado del acta ID {acta.id} a {nuevo_estado}."
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': f'Acta actualizada a {nuevo_estado} con éxito',
        'acta': acta.to_dict()
    }), 200

@direccion_bp.route('/actas', methods=['GET'])
@jwt_required()
@role_required(['direccion', 'administrador'])
def get_actas():
    estado = request.args.get('estado')
    query = Acta.query
    if estado:
        query = query.filter_by(estado=estado)
    actas = query.all()
    result = []
    for a in actas:
        result.append({
            'id': a.id,
            'estado': a.estado,
            'fecha_envio': a.fecha_envio.isoformat() if a.fecha_envio else None,
            'seccion': {
                'id': a.seccion.id,
                'codigo_seccion': a.seccion.codigo_seccion,
                'curso': a.seccion.curso.nombre,
                'codigo_curso': a.seccion.curso.codigo_curso,
                'docente': a.seccion.docente.user.name if a.seccion.docente else 'Sin asignar'
            },
            'cantidad_estudiantes': DetalleMatricula.query.filter_by(seccion_id=a.seccion_id).count()
        })
    return jsonify(result), 200

@direccion_bp.route('/actas/<int:acta_id>', methods=['GET'])
@jwt_required()
@role_required(['direccion', 'administrador'])
def get_acta_detalle(acta_id):
    a = Acta.query.get_or_404(acta_id)
    detalles = DetalleMatricula.query.filter_by(seccion_id=a.seccion_id).all()
    notas = []
    for d in detalles:
        nota = d.nota
        notas.append({
            'codigo_estudiante': d.matricula.estudiante.codigo_estudiante,
            'nombre': d.matricula.estudiante.user.name,
            'nota': {
                'nota_parcial1': float(nota.nota_parcial1) if nota else 0.0,
                'nota_parcial2': float(nota.nota_parcial2) if nota else 0.0,
                'evaluacion_continua': float(nota.evaluacion_continua) if nota else 0.0,
                'examen_final': float(nota.examen_final) if nota else 0.0,
                'promedio_final': float(nota.promedio_final) if nota else 0.0
            }
        })
    return jsonify({
        'id': a.id,
        'estado': a.estado,
        'observaciones': a.observaciones,
        'seccion': {
            'id': a.seccion.id,
            'codigo_seccion': a.seccion.codigo_seccion,
            'curso': a.seccion.curso.nombre,
            'codigo_curso': a.seccion.curso.codigo_curso,
            'docente': a.seccion.docente.user.name if a.seccion.docente else 'Sin asignar'
        },
        'notas': notas
    }), 200
