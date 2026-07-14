import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models import db, Docente, Seccion, DetalleMatricula, Nota, Acta, User, AuditLog
from app.utils import role_required

docente_bp = Blueprint('docente', __name__)

@docente_bp.route('/cursos', methods=['GET'])
@jwt_required()
@role_required(['docente'])
def get_cursos_docente():
    user_id = int(get_jwt_identity())
    docente = Docente.query.filter_by(user_id=user_id).first()
    if not docente:
        return jsonify({'error': 'Perfil de docente no encontrado'}), 404
        
    secciones = Seccion.query.filter_by(docente_id=docente.id).all()
    result = []
    for s in secciones:
        result.append({
            'seccion_id': s.id,
            'codigo_seccion': s.codigo_seccion,
            'capacidad': s.capacidad,
            'horario': s.horario,
            'silabo_url': s.silabo_url,
            'curso': {
                'id': s.curso.id,
                'codigo_curso': s.curso.codigo_curso,
                'nombre': s.curso.nombre,
                'creditos': s.curso.creditos
            },
            'periodo': s.periodo.codigo_periodo,
            'cantidad_estudiantes': DetalleMatricula.query.filter_by(seccion_id=s.id).count(),
            'estado_acta': s.acta.estado if s.acta else 'PENDIENTE'
        })
    return jsonify(result), 200

@docente_bp.route('/cursos/<int:seccion_id>', methods=['GET'])
@jwt_required()
@role_required(['docente'])
def get_detalle_curso(seccion_id):
    user_id = int(get_jwt_identity())
    docente = Docente.query.filter_by(user_id=user_id).first()
    s = Seccion.query.get_or_404(seccion_id)
    if s.docente_id != docente.id:
        return jsonify({'error': 'No tienes permisos para ver esta sección'}), 403
        
    detalles = DetalleMatricula.query.filter_by(seccion_id=s.id).all()
    estudiantes = []
    for d in detalles:
        est = d.matricula.estudiante
        estudiantes.append({
            'detalle_matricula_id': d.id,
            'codigo_estudiante': est.codigo_estudiante,
            'nombre': est.user.name,
            'email': est.user.email
        })
        
    return jsonify({
        'seccion_id': s.id,
        'codigo_seccion': s.codigo_seccion,
        'horario': s.horario,
        'capacidad': s.capacidad,
        'silabo_url': s.silabo_url,
        'curso': {
            'id': s.curso.id,
            'codigo_curso': s.curso.codigo_curso,
            'nombre': s.curso.nombre,
            'creditos': s.curso.creditos
        },
        'estudiantes': estudiantes,
        'estado_acta': s.acta.estado if s.acta else 'PENDIENTE'
    }), 200

@docente_bp.route('/cursos/<int:seccion_id>/silabo', methods=['POST'])
@jwt_required()
@role_required(['docente'])
def upload_silabo(seccion_id):
    user_id = int(get_jwt_identity())
    docente = Docente.query.filter_by(user_id=user_id).first()
    s = Seccion.query.get_or_404(seccion_id)
    if s.docente_id != docente.id:
        return jsonify({'error': 'No tienes acceso a este curso'}), 403
        
    if 'file' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ['pdf', 'docx', 'doc']:
        return jsonify({'error': 'Formato no permitido. Solo se aceptan PDF o Word'}), 400
        
    # Save file
    os.makedirs(current_app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
    safe_name = secure_filename(file.filename)
    stored_name = f"seccion_{s.id}_{uuid.uuid4().hex[:8]}_{safe_name}"
    filepath = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), stored_name)
    file.save(filepath)
    
    # Update DB
    s.silabo_url = f"/api/uploads/silabos/{stored_name}"
    
    # Audit log
    log = AuditLog(
        user_id=user_id,
        username=docente.user.username,
        action="SILABO_UPLOAD",
        ip_address=request.remote_addr,
        details=f"Docente subió sílabo para la sección ID: {s.id} del curso {s.curso.nombre}."
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Sílabo cargado exitosamente',
        'silabo_url': s.silabo_url
    }), 200

@docente_bp.route('/cursos/<int:seccion_id>/notas', methods=['GET'])
@jwt_required()
@role_required(['docente'])
def get_notas_docente(seccion_id):
    user_id = int(get_jwt_identity())
    docente = Docente.query.filter_by(user_id=user_id).first()
    s = Seccion.query.get_or_404(seccion_id)
    if s.docente_id != docente.id:
        return jsonify({'error': 'No tienes acceso a este curso'}), 403
        
    detalles = DetalleMatricula.query.filter_by(seccion_id=s.id).all()
    notas_data = []
    for d in detalles:
        nota = Nota.query.filter_by(detalle_matricula_id=d.id).first()
        notas_data.append({
            'detalle_matricula_id': d.id,
            'codigo_estudiante': d.matricula.estudiante.codigo_estudiante,
            'nombre': d.matricula.estudiante.user.name,
            'nota': {
                'id': nota.id if nota else None,
                'nota_parcial1': float(nota.nota_parcial1) if (nota and nota.nota_parcial1) else 0.0,
                'nota_parcial2': float(nota.nota_parcial2) if (nota and nota.nota_parcial2) else 0.0,
                'evaluacion_continua': float(nota.evaluacion_continua) if (nota and nota.evaluacion_continua) else 0.0,
                'examen_final': float(nota.examen_final) if (nota and nota.examen_final) else 0.0,
                'promedio_final': float(nota.promedio_final) if (nota and nota.promedio_final) else 0.0,
                'consolidada': nota.consolidada if nota else False
            }
        })
    return jsonify(notas_data), 200

@docente_bp.route('/cursos/<int:seccion_id>/notas', methods=['PUT'])
@jwt_required()
@role_required(['docente'])
def update_notas_docente(seccion_id):
    user_id = int(get_jwt_identity())
    docente = Docente.query.filter_by(user_id=user_id).first()
    s = Seccion.query.get_or_404(seccion_id)
    if s.docente_id != docente.id:
        return jsonify({'error': 'No tienes acceso a este curso'}), 403
        
    if s.acta and s.acta.estado == 'CONSOLIDADA':
        return jsonify({'error': 'El acta ya ha sido consolidada, no se pueden modificar las notas'}), 400
        
    data = request.get_json() or {}
    detalle_matricula_id = data.get('detalle_matricula_id')
    
    d = DetalleMatricula.query.get_or_404(detalle_matricula_id)
    if d.seccion_id != s.id:
        return jsonify({'error': 'El estudiante no pertenece a esta sección'}), 400
        
    nota = Nota.query.filter_by(detalle_matricula_id=d.id).first()
    if not nota:
        nota = Nota(detalle_matricula_id=d.id)
        
    np1 = float(data.get('nota_parcial1', 0.0))
    np2 = float(data.get('nota_parcial2', 0.0))
    ec = float(data.get('evaluacion_continua', 0.0))
    ef = float(data.get('examen_final', 0.0))
    
    for n_name, n_val in [('nota_parcial1', np1), ('nota_parcial2', np2), ('evaluacion_continua', ec), ('examen_final', ef)]:
        if not (0.0 <= n_val <= 20.0):
            return jsonify({'error': f'La calificación {n_name} debe estar entre 0.0 y 20.0.'}), 400
            
    nota.nota_parcial1 = np1
    nota.nota_parcial2 = np2
    nota.evaluacion_continua = ec
    nota.examen_final = ef
    
    nota.calcular_promedio()
    
    db.session.add(nota)
    
    # Audit log
    log = AuditLog(
        user_id=user_id,
        username=docente.user.username,
        action="GRADE_UPDATE",
        ip_address=request.remote_addr,
        details=f"Docente actualizó notas para DetalleMatricula ID: {d.id}. P1: {nota.nota_parcial1}, P2: {nota.nota_parcial2}, EC: {nota.evaluacion_continua}, EF: {nota.examen_final}, Promedio: {nota.promedio_final}"
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Notas actualizadas correctamente',
        'nota': nota.to_dict()
    }), 200

@docente_bp.route('/cursos/<int:seccion_id>/notas/enviar', methods=['POST'])
@jwt_required()
@role_required(['docente'])
def enviar_acta(seccion_id):
    user_id = int(get_jwt_identity())
    docente = Docente.query.filter_by(user_id=user_id).first()
    s = Seccion.query.get_or_404(seccion_id)
    if s.docente_id != docente.id:
        return jsonify({'error': 'No tienes acceso a este curso'}), 403
        
    # Verify all students have grades
    detalles = DetalleMatricula.query.filter_by(seccion_id=s.id).all()
    if not detalles:
        return jsonify({'error': 'No hay estudiantes matriculados en esta sección'}), 400
        
    for d in detalles:
        nota = Nota.query.filter_by(detalle_matricula_id=d.id).first()
        if not nota:
            return jsonify({'error': f'Faltan registrar notas para el estudiante: {d.matricula.estudiante.user.name}'}), 400
            
    # Find or create Acta
    acta = s.acta
    if not acta:
        acta = Acta(seccion_id=s.id, usuario_id_creacion=user_id)
        
    acta.estado = 'ENVIADA'
    acta.fecha_envio = datetime.utcnow()
    
    db.session.add(acta)
    
    # Audit log
    log = AuditLog(
        user_id=user_id,
        username=docente.user.username,
        action="ACTA_SEND",
        ip_address=request.remote_addr,
        details=f"Docente envió el acta de notas para la sección ID: {s.id} para aprobación."
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Acta de notas enviada correctamente para aprobación',
        'acta': acta.to_dict()
    }), 200

