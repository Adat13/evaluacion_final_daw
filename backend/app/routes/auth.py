from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User, AuditLog
from app.utils import is_password_secure

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Nombre de usuario y contraseña requeridos'}), 400
        
    user = User.query.filter_by(username=username).first()
    ip_addr = request.remote_addr
    
    if user and user.check_password(password):
        # Successful login
        access_token = create_access_token(identity=str(user.id))
        
        # Audit Log
        log = AuditLog(
            user_id=user.id,
            username=user.username,
            action="LOGIN_SUCCESS",
            ip_address=ip_addr,
            details=f"Usuario {user.username} inició sesión exitosamente."
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    else:
        # Failed login
        # If user exists, we can log the attempt
        user_attempted = User.query.filter_by(username=username).first()
        log = AuditLog(
            user_id=user_attempted.id if user_attempted else None,
            username=username,
            action="LOGIN_FAILED",
            ip_address=ip_addr,
            details=f"Intento fallido de inicio de sesión para el usuario: {username}"
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({'error': 'Credenciales incorrectas'}), 401

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    ip_addr = request.remote_addr
    
    if user:
        log = AuditLog(
            user_id=user.id,
            username=user.username,
            action="LOGOUT",
            ip_address=ip_addr,
            details=f"Usuario {user.username} cerró sesión."
        )
        db.session.add(log)
        db.session.commit()
        
    return jsonify({'message': 'Sesión cerrada correctamente'}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    return jsonify(user.to_dict()), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    data = request.get_json() or {}
    
    # Update allowed fields
    if 'phone' in data:
        user.phone = data['phone']
    if 'address' in data:
        user.address = data['address']
        
    db.session.commit()
    
    # Audit log
    log = AuditLog(
        user_id=user.id,
        username=user.username,
        action="UPDATE_PROFILE",
        ip_address=request.remote_addr,
        details=f"Usuario {user.username} actualizó su perfil (teléfono/dirección)."
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(user.to_dict()), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    data = request.get_json() or {}
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Contraseña actual y nueva contraseña requeridas'}), 400
        
    if not user.check_password(current_password):
        return jsonify({'error': 'La contraseña actual es incorrecta'}), 400
        
    is_secure, error_msg = is_password_secure(new_password)
    if not is_secure:
        return jsonify({'error': error_msg}), 400
        
    user.set_password(new_password)
    
    # Audit log
    log = AuditLog(
        user_id=user.id,
        username=user.username,
        action="CHANGE_PASSWORD",
        ip_address=request.remote_addr,
        details=f"Usuario {user.username} cambió su contraseña."
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'message': 'Contraseña actualizada correctamente'}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email es requerido'}), 400
        
    user = User.query.filter_by(email=email).first()
    
    # Simulación de envío SMTP (Requerimiento AUTH-003)
    if user:
        # En producción real, aquí se generaría un token y se enviaría por email.
        # Imprimimos en consola la simulación.
        print("================ SMTP SIMULATION ================")
        print(f"To: {email}")
        print(f"Subject: Recuperación de contraseña - FIS UNCP")
        print(f"Body: Hola {user.name}, usa el token de recuperación FIS-RECOVERY-2026 para restablecer tu cuenta.")
        print("=================================================")
        
        # Log entry
        log = AuditLog(
            user_id=user.id,
            username=user.username,
            action="FORGOT_PASSWORD_REQUEST",
            ip_address=request.remote_addr,
            details=f"Solicitud de recuperación de contraseña para el email: {email} (Usuario: {user.username})"
        )
        db.session.add(log)
        db.session.commit()
        
    return jsonify({
        'message': 'Si el correo electrónico existe en el sistema, se ha enviado un enlace de recuperación.',
        'simulation_info': 'Consola del backend muestra detalles del correo enviado.'
    }), 200
