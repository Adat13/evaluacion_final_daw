from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import (
    User, Docente, Curso, Oferta, Silabo, Matricula, Nota, Acta
)
from app.schemas import (
    OfertaSchema, DocenteSchema, NotaSchema, SilaboSchema,
    ActualizarNotasSchema, CursoSchema
)
from marshmallow import ValidationError
from datetime import datetime

docente_bp = Blueprint('docente', __name__, url_prefix='/api/docente')

@docente_bp.route('/cursos', methods=['GET'])
@jwt_required()
def get_cursos_docente():
    """Obtener cursos asignados al docente logueado"""
    user_id = int(get_jwt_identity())
    
    # Verificar que el usuario es docente
    docente = Docente.query.filter_by(usuario_id=user_id).first()
    if not docente:
        return {'error': 'No eres un docente'}, 403
    
    # Obtener ciclo académico (parámetro opcional)
    ciclo_id = request.args.get('ciclo_id', type=int)
    
    # Construir query
    query = Oferta.query.filter_by(docente_id=docente.id)
    
    if ciclo_id:
        query = query.filter_by(ciclo_id=ciclo_id)
    
    ofertas = query.all()
    
    # Construir respuesta con información adicional
    result = []
    for oferta in ofertas:
        curso_data = CursoSchema().dump(oferta.curso)
        result.append({
            'oferta_id': oferta.id,
            'seccion': oferta.seccion,
            'aula': oferta.aula,
            'cupo_maximo': oferta.cupo_maximo,
            'cantidad_estudiantes': len(oferta.matriculas),
            'estado_silabo': oferta.silabo.estado if oferta.silabo else 'PENDIENTE',
            'curso': curso_data
        })
    
    return jsonify(result), 200

@docente_bp.route('/cursos/<int:oferta_id>', methods=['GET'])
@jwt_required()
def get_detalle_curso(oferta_id):
    """Obtener detalle de un curso asignado al docente"""
    user_id = int(get_jwt_identity())
    
    # Verificar que el usuario es docente
    docente = Docente.query.filter_by(usuario_id=user_id).first()
    if not docente:
        return {'error': 'No eres un docente'}, 403
    
    # Obtener oferta
    oferta = Oferta.query.get(oferta_id)
    if not oferta or oferta.docente_id != docente.id:
        return {'error': 'No tienes acceso a este curso'}, 403
    
    # Obtener estudiantes matriculados
    estudiantes = []
    for matricula in oferta.matriculas:
        estudiantes.append({
            'codigo': matricula.estudiante.codigo,
            'nombre': f"{matricula.estudiante.usuario.nombres} {matricula.estudiante.usuario.apellidos}"
        })
    
    return jsonify({
        'oferta_id': oferta.id,
        'curso': CursoSchema().dump(oferta.curso),
        'seccion': oferta.seccion,
        'aula': oferta.aula,
        'horario': oferta.horario,
        'estudiantes': estudiantes,
        'silabo': SilaboSchema().dump(oferta.silabo) if oferta.silabo else None
    }), 200

@docente_bp.route('/cursos/<int:oferta_id>/silabo', methods=['POST'])
@jwt_required()
def upload_silabo(oferta_id):
    """Cargar o actualizar sílabo de un curso (archivo PDF/DOCX, máx 5MB)"""
    import os
    import uuid
    from flask import current_app
    from werkzeug.utils import secure_filename

    user_id = int(get_jwt_identity())

    docente = Docente.query.filter_by(usuario_id=user_id).first()
    if not docente:
        return {'error': 'No eres un docente'}, 403

    oferta = Oferta.query.get(oferta_id)
    if not oferta or oferta.docente_id != docente.id:
        return {'error': 'No tienes acceso a este curso'}, 403

    if 'file' not in request.files:
        return {'error': 'No se envió ningún archivo'}, 400

    file = request.files['file']
    if not file or file.filename == '':
        return {'error': 'No se seleccionó ningún archivo'}, 400

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    allowed = current_app.config.get('ALLOWED_SILABO_EXTENSIONS', {'pdf', 'docx'})
    if ext not in allowed:
        return {'error': f'Formato no permitido. Solo se aceptan: {", ".join(sorted(allowed))}'}, 400

    # Validar tamaño (además del límite global MAX_CONTENT_LENGTH de Flask)
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    max_size = current_app.config.get('MAX_CONTENT_LENGTH', 5 * 1024 * 1024)
    if size > max_size:
        return {'error': f'El archivo supera el tamaño máximo permitido ({max_size // (1024*1024)}MB)'}, 400

    # Obtener o crear sílabo
    silabo = oferta.silabo
    if not silabo:
        silabo = Silabo(oferta_id=oferta_id, numero_version=1)
    else:
        silabo.numero_version += 1

    safe_name = secure_filename(file.filename)
    stored_name = f"oferta{oferta_id}_v{silabo.numero_version}_{uuid.uuid4().hex[:8]}_{safe_name}"
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, stored_name))

    silabo.archivo_url = f"/api/uploads/silabos/{stored_name}"
    silabo.estado = 'CARGADO'
    silabo.fecha_carga = datetime.utcnow()

    db.session.add(silabo)
    db.session.commit()

    return {
        'message': 'Sílabo cargado exitosamente',
        'silabo': SilaboSchema().dump(silabo)
    }, 201

@docente_bp.route('/cursos/<int:oferta_id>/notas', methods=['GET'])
@jwt_required()
def get_notas_docente(oferta_id):
    """Obtener notas de un curso del docente"""
    user_id = int(get_jwt_identity())
    
    docente = Docente.query.filter_by(usuario_id=user_id).first()
    if not docente:
        return {'error': 'No eres un docente'}, 403
    
    oferta = Oferta.query.get(oferta_id)
    if not oferta or oferta.docente_id != docente.id:
        return {'error': 'No tienes acceso a este curso'}, 403
    
    # Obtener notas de TODOS los matriculados (con o sin nota registrada aún)
    notas_data = []
    for matricula in oferta.matriculas:
        nota = Nota.query.filter_by(matricula_id=matricula.id).first()
        notas_data.append({
            'matricula_id': matricula.id,
            'codigo_estudiante': matricula.estudiante.codigo,
            'nombre': f"{matricula.estudiante.usuario.nombres} {matricula.estudiante.usuario.apellidos}",
            'nota': NotaSchema().dump(nota) if nota else {
                'pc1': None, 'pc2': None, 'pc3': None, 'ef': None,
                'promedio': None, 'estado': None
            }
        })

    return jsonify(notas_data), 200

@docente_bp.route('/cursos/<int:oferta_id>/notas', methods=['PUT'])
@jwt_required()
def update_notas_docente(oferta_id):
    """Actualizar notas de un curso"""
    user_id = int(get_jwt_identity())
    
    docente = Docente.query.filter_by(usuario_id=user_id).first()
    if not docente:
        return {'error': 'No eres un docente'}, 403
    
    oferta = Oferta.query.get(oferta_id)
    if not oferta or oferta.docente_id != docente.id:
        return {'error': 'No tienes acceso a este curso'}, 403
    
    try:
        data = request.get_json()
        schema = ActualizarNotasSchema()
        validated_data = schema.load(data)
    except ValidationError as err:
        return {'errors': err.messages}, 400
    
    matricula_id = validated_data.get('matricula_id')
    matricula = Matricula.query.get(matricula_id)
    
    if not matricula or matricula.oferta_id != oferta_id:
        return {'error': 'Matrícula no encontrada'}, 404
    
    # Obtener o crear nota
    nota = Nota.query.filter_by(matricula_id=matricula_id).first()
    if not nota:
        nota = Nota(matricula_id=matricula_id)
    
    # Actualizar notas
    nota.pc1 = validated_data.get('pc1', nota.pc1)
    nota.pc2 = validated_data.get('pc2', nota.pc2)
    nota.pc3 = validated_data.get('pc3', nota.pc3)
    nota.ef = validated_data.get('ef', nota.ef)
    
    # Calcular promedio
    nota.calcular_promedio()
    
    db.session.add(nota)
    db.session.commit()
    
    return {
        'message': 'Notas actualizadas exitosamente',
        'nota': NotaSchema().dump(nota)
    }, 200

@docente_bp.route('/cursos/<int:oferta_id>/notas/enviar', methods=['POST'])
@jwt_required()
def enviar_acta(oferta_id):
    """Enviar acta de notas para aprobación"""
    user_id = int(get_jwt_identity())
    
    docente = Docente.query.filter_by(usuario_id=user_id).first()
    if not docente:
        return {'error': 'No eres un docente'}, 403
    
    oferta = Oferta.query.get(oferta_id)
    if not oferta or oferta.docente_id != docente.id:
        return {'error': 'No tienes acceso a este curso'}, 403
    
    # Validar que todas las notas estén completas
    for matricula in oferta.matriculas:
        nota = Nota.query.filter_by(matricula_id=matricula.id).first()
        if not nota or nota.pc1 is None or nota.pc2 is None or nota.pc3 is None or nota.ef is None:
            return {'error': 'No todas las notas están completas'}, 400
    
    # Obtener o crear acta
    acta = oferta.acta
    if not acta:
        acta = Acta(oferta_id=oferta_id, usuario_id_creacion=user_id)
    
    acta.estado = 'ENVIADA'
    acta.fecha_envio = datetime.utcnow()
    
    db.session.add(acta)
    db.session.commit()
    
    return {
        'message': 'Acta enviada exitosamente',
        'acta': {'id': acta.id, 'estado': acta.estado}
    }, 200
