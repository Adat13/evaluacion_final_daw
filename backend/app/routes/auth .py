from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token
from app import db
from app.models import User, UserRole
from app.schemas import UserRegisterSchema, UserLoginSchema, UserSchema
from marshmallow import ValidationError

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registrar nuevo usuario"""
    try:
        schema = UserRegisterSchema()
        data = schema.load(request.get_json())
    except ValidationError as err:
        return {'errors': err.messages}, 400
    
    # Verificar si el email ya existe
    if User.query.filter_by(email=data['email']).first():
        return {'error': 'El email ya está registrado'}, 409
    
    # Crear nuevo usuario
    user = User(
        email=data['email'],
        nombres=data['nombres'],
        apellidos=data['apellidos'],
        rol=data.get('rol', UserRole.ESTUDIANTE.value)
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return {
        'message': 'Usuario registrado exitosamente',
        'user': UserSchema().dump(user)
    }, 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login de usuario"""
    try:
        schema = UserLoginSchema()
        data = schema.load(request.get_json())
    except ValidationError as err:
        return {'errors': err.messages}, 400
    
    # Buscar usuario
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return {'error': 'Email o contraseña inválidos'}, 401
    
    if not user.activo:
        return {'error': 'Usuario inactivo'}, 403
    
    # Crear tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': UserSchema().dump(user)
    }, 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Obtener usuario actual"""
    from flask_jwt_extended import jwt_required, get_jwt_identity
    
    @jwt_required()
    def _get_current_user():
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return {'error': 'Usuario no encontrado'}, 404
        
        return UserSchema().dump(user), 200
    
    return _get_current_user()

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refrescar token de acceso"""
    from flask_jwt_extended import jwt_required, get_jwt_identity
    
    @jwt_required(refresh=True)
    def _refresh():
        user_id = int(get_jwt_identity())
        access_token = create_access_token(identity=str(user_id))
        return {'access_token': access_token}, 200
    
    return _refresh()
