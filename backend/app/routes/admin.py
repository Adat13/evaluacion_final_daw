from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, AuditLog
from app.utils import role_required, is_password_secure

admin_bp = Blueprint('admin', __name__)

# --- CRUD USUARIOS (ADM-ADM-001) ---

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required(['administrador'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@admin_bp.route('/users', methods=['POST'])
@jwt_required()
@role_required(['administrador'])
def create_user():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role')
    
    if not all([username, email, password, name, role]):
        return jsonify({'error': 'Todos los campos obligatorios son requeridos (username, email, password, name, role)'}), 400
        
    if role not in ['estudiante', 'docente', 'administrador', 'direccion']:
        return jsonify({'error': 'Rol inválido'}), 400
        
    # Check uniqueness
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'error': 'El nombre de usuario o email ya está en uso'}), 400
        
    is_secure, error_msg = is_password_secure(password)
    if not is_secure:
        return jsonify({'error': error_msg}), 400
        
    new_user = User(
        username=username,
        email=email,
        name=name,
        role=role,
        phone=data.get('phone'),
        address=data.get('address'),
        document_type=data.get('document_type', 'DNI'),
        document_number=data.get('document_number')
    )
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    
    # Audit log
    admin_id = int(get_jwt_identity())
    admin_user = User.query.get(admin_id)
    log = AuditLog(
        user_id=admin_id,
        username=admin_user.username if admin_user else 'admin',
        action="USER_CREATE",
        ip_address=request.remote_addr,
        details=f"Administrador creó al usuario: {username} con el rol: {role}."
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(new_user.to_dict()), 201

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@role_required(['administrador'])
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    data = request.get_json() or {}
    
    # Update email/name/role if provided
    if 'email' in data:
        user.email = data['email']
    if 'name' in data:
        user.name = data['name']
    if 'role' in data:
        if data['role'] in ['estudiante', 'docente', 'administrador', 'direccion']:
            user.role = data['role']
        else:
            return jsonify({'error': 'Rol inválido'}), 400
            
    if 'phone' in data:
        user.phone = data['phone']
    if 'address' in data:
        user.address = data['address']
    if 'document_type' in data:
        user.document_type = data['document_type']
    if 'document_number' in data:
        user.document_number = data['document_number']
        
    # Optional password update
    if 'password' in data and data['password']:
        user.set_password(data['password'])
        
    db.session.commit()
    
    # Audit log
    admin_id = int(get_jwt_identity())
    admin_user = User.query.get(admin_id)
    log = AuditLog(
        user_id=admin_id,
        username=admin_user.username if admin_user else 'admin',
        action="USER_UPDATE",
        ip_address=request.remote_addr,
        details=f"Administrador actualizó al usuario: {user.username}."
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(user.to_dict()), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required(['administrador'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    username_deleted = user.username
    db.session.delete(user)
    db.session.commit()
    
    # Audit log
    admin_id = int(get_jwt_identity())
    admin_user = User.query.get(admin_id)
    log = AuditLog(
        user_id=admin_id,
        username=admin_user.username if admin_user else 'admin',
        action="USER_DELETE",
        ip_address=request.remote_addr,
        details=f"Administrador eliminó al usuario: {username_deleted}."
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'message': f'Usuario {username_deleted} eliminado'}), 200


# --- BITÁCORA DE AUDITORÍA (ADM-DIR-001) ---

@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@role_required(['administrador', 'direccion'])
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
    return jsonify([log.to_dict() for log in logs]), 200
