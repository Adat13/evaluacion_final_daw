from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import (
    Curso, Facultad, Oferta, Acta, Docente, User, Nota, Matricula,
    CicloAcademico, Silabo, Estudiante, Administrador
)
from app.schemas import (
    CursoSchema, OfertaSchema, DocenteSchema, ActaSchema, SilaboSchema,
    FacultadSchema, CicloAcademicoSchema, NotaSchema, AdministradorSchema
)
from marshmallow import ValidationError
from datetime import datetime

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def _requiere_admin(user):
    return user and user.rol == 'administrador'


@admin_bp.route('/docentes', methods=['GET'])
@jwt_required()
def get_docentes():
    """Obtener lista de docentes (para asignación de cursos)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not _requiere_admin(user):
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403

    docentes = Docente.query.all()
    return jsonify(DocenteSchema().dump(docentes, many=True)), 200


@admin_bp.route('/administradores', methods=['GET'])
@jwt_required()
def get_administradores():
    """Obtener lista de administradores"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not _requiere_admin(user):
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403

    administradores = Administrador.query.all()
    return jsonify(AdministradorSchema().dump(administradores, many=True)), 200


@admin_bp.route('/facultades', methods=['GET'])
@jwt_required()
def get_facultades():
    """Obtener lista de facultades"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not _requiere_admin(user):
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403

    facultades = Facultad.query.all()
    return jsonify(FacultadSchema().dump(facultades, many=True)), 200


@admin_bp.route('/ciclos', methods=['GET'])
@jwt_required()
def get_ciclos():
    """Obtener lista de ciclos académicos"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not _requiere_admin(user):
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403

    ciclos = CicloAcademico.query.order_by(CicloAcademico.id.desc()).all()
    return jsonify(CicloAcademicoSchema().dump(ciclos, many=True)), 200


@admin_bp.route('/ofertas', methods=['GET'])
@jwt_required()
def get_ofertas():
    """Obtener lista de ofertas (secciones) del ciclo, con datos de curso/docente"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not _requiere_admin(user):
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403

    ciclo_id = request.args.get('ciclo_id', type=int)
    query = Oferta.query
    if ciclo_id:
        query = query.filter_by(ciclo_id=ciclo_id)

    ofertas = query.all()
    result = []
    for oferta in ofertas:
        result.append({
            'id': oferta.id,
            'curso': CursoSchema().dump(oferta.curso),
            'seccion': oferta.seccion,
            'aula': oferta.aula,
            'cupo_maximo': oferta.cupo_maximo,
            'docente': DocenteSchema().dump(oferta.docente) if oferta.docente else None,
            'cantidad_estudiantes': len(oferta.matriculas),
        })
    return jsonify(result), 200

@admin_bp.route('/cursos', methods=['GET'])
@jwt_required()
def get_cursos():
    """Obtener todos los cursos"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'administrador':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    cursos = Curso.query.all()
    return jsonify(CursoSchema().dump(cursos, many=True)), 200

@admin_bp.route('/cursos', methods=['POST'])
@jwt_required()
def crear_curso():
    """Crear nuevo curso"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'administrador':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    try:
        schema = CursoSchema()
        data = schema.load(request.get_json())
    except ValidationError as err:
        return {'errors': err.messages}, 400
    
    # Verificar código único
    if Curso.query.filter_by(codigo=data['codigo']).first():
        return {'error': 'El código del curso ya existe'}, 409
    
    curso = Curso(**data)
    db.session.add(curso)
    db.session.commit()
    
    return {
        'message': 'Curso creado exitosamente',
        'curso': CursoSchema().dump(curso)
    }, 201

@admin_bp.route('/cursos/<int:curso_id>', methods=['PUT'])
@jwt_required()
def actualizar_curso(curso_id):
    """Actualizar curso"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'administrador':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    curso = Curso.query.get(curso_id)
    if not curso:
        return {'error': 'Curso no encontrado'}, 404
    
    try:
        schema = CursoSchema()
        data = schema.load(request.get_json(), partial=True)
    except ValidationError as err:
        return {'errors': err.messages}, 400
    
    for key, value in data.items():
        setattr(curso, key, value)
    
    db.session.commit()
    
    return {
        'message': 'Curso actualizado exitosamente',
        'curso': CursoSchema().dump(curso)
    }, 200

@admin_bp.route('/oferta', methods=['POST'])
@jwt_required()
def crear_oferta():
    """Crear oferta de curso"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'administrador':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    try:
        schema = OfertaSchema()
        data = schema.load(request.get_json())
    except ValidationError as err:
        return {'errors': err.messages}, 400
    
    oferta = Oferta(**data)
    db.session.add(oferta)
    db.session.commit()
    
    return {
        'message': 'Oferta creada exitosamente',
        'oferta': OfertaSchema().dump(oferta)
    }, 201

@admin_bp.route('/oferta/<int:oferta_id>/docente', methods=['PUT'])
@jwt_required()
def asignar_docente(oferta_id):
    """Asignar docente a una oferta"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'administrador':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    oferta = Oferta.query.get(oferta_id)
    if not oferta:
        return {'error': 'Oferta no encontrada'}, 404
    
    data = request.get_json()
    docente_id = data.get('docente_id')
    
    if not docente_id:
        return {'error': 'docente_id es requerido'}, 400
    
    docente = Docente.query.get(docente_id)
    if not docente:
        return {'error': 'Docente no encontrado'}, 404
    
    oferta.docente_id = docente_id
    db.session.commit()
    
    return {
        'message': 'Docente asignado exitosamente',
        'oferta': OfertaSchema().dump(oferta)
    }, 200

@admin_bp.route('/oferta/<int:oferta_id>/horario', methods=['PUT'])
@jwt_required()
def actualizar_horario(oferta_id):
    """Actualizar horario de una oferta"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'administrador':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    oferta = Oferta.query.get(oferta_id)
    if not oferta:
        return {'error': 'Oferta no encontrada'}, 404
    
    data = request.get_json()
    horario = data.get('horario')
    aula = data.get('aula')
    
    # Validar conflictos de horario
    # TODO: Implementar validación de conflictos
    
    oferta.horario = horario
    oferta.aula = aula
    db.session.commit()
    
    return {
        'message': 'Horario actualizado exitosamente',
        'oferta': OfertaSchema().dump(oferta)
    }, 200

@admin_bp.route('/actas', methods=['GET'])
@jwt_required()
def get_actas():
    """Obtener actas de notas"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'administrador':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    estado = request.args.get('estado')
    
    query = Acta.query
    if estado:
        query = query.filter_by(estado=estado)
    
    actas = query.all()
    
    result = []
    for acta in actas:
        result.append({
            'id': acta.id,
            'curso': acta.oferta.curso.codigo,
            'seccion': acta.oferta.seccion,
            'docente': f"{acta.oferta.docente.usuario.nombres} {acta.oferta.docente.usuario.apellidos}",
            'cantidad_estudiantes': len(acta.oferta.matriculas),
            'fecha_envio': acta.fecha_envio,
            'estado': acta.estado
        })
    
    return jsonify(result), 200

@admin_bp.route('/actas/<int:acta_id>', methods=['GET'])
@jwt_required()
def get_acta_detalle(acta_id):
    """Obtener detalle de un acta"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'administrador':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    acta = Acta.query.get(acta_id)
    if not acta:
        return {'error': 'Acta no encontrada'}, 404
    
    # Obtener notas
    notas = []
    for matricula in acta.oferta.matriculas:
        nota = Nota.query.filter_by(matricula_id=matricula.id).first()
        notas.append({
            'codigo': matricula.estudiante.codigo,
            'nombre': f"{matricula.estudiante.usuario.nombres} {matricula.estudiante.usuario.apellidos}",
            'nota': NotaSchema().dump(nota) if nota else None
        })
    
    return jsonify({
        'acta_id': acta.id,
        'curso': acta.oferta.curso.codigo,
        'docente': DocenteSchema().dump(acta.oferta.docente),
        'notas': notas,
        'estado': acta.estado,
        'observaciones': acta.observaciones
    }), 200

@admin_bp.route('/actas/<int:acta_id>/estado', methods=['PUT'])
@jwt_required()
def cambiar_estado_acta(acta_id):
    """Cambiar estado de un acta"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'administrador':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    acta = Acta.query.get(acta_id)
    if not acta:
        return {'error': 'Acta no encontrada'}, 404
    
    data = request.get_json()
    nuevo_estado = data.get('estado')
    observaciones = data.get('observaciones')
    
    estados_validos = ['BORRADOR', 'ENVIADA', 'OBSERVADA', 'APROBADA', 'CONSOLIDADA']
    if nuevo_estado not in estados_validos:
        return {'error': f'Estado inválido. Estados válidos: {estados_validos}'}, 400
    
    estado_anterior = acta.estado
    acta.estado = nuevo_estado
    
    if nuevo_estado == 'OBSERVADA':
        acta.observaciones = observaciones
    elif nuevo_estado == 'APROBADA':
        acta.fecha_aprobacion = datetime.utcnow()
    elif nuevo_estado == 'CONSOLIDADA':
        acta.fecha_consolidacion = datetime.utcnow()
    
    db.session.commit()
    
    return {
        'message': f'Acta cambiada a estado {nuevo_estado}',
        'acta': ActaSchema().dump(acta)
    }, 200
