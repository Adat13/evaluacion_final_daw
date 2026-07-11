from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models import User

def role_required(allowed_roles):
    """
    Decorator to restrict access to endpoints based on user roles.
    allowed_roles: string or list of strings representing the allowed roles.
    e.g., @role_required(['administrador', 'direccion'])
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
        
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({'error': 'Usuario no autenticado o no encontrado'}), 401
                
            if user.role not in allowed_roles:
                return jsonify({'error': 'No tienes permisos para acceder a este recurso'}), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def is_password_secure(password):
    """
    Checks if a password meets the strength criteria:
    - Minimum 8 characters.
    - At least one uppercase letter.
    - At least one numerical digit.
    """
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres."
    if not any(char.isupper() for char in password):
        return False, "La contraseña debe contener al menos una letra mayúscula."
    if not any(char.isdigit() for char in password):
        return False, "La contraseña debe contener al menos un número."
    return True, ""
