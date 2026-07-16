from app.routes.auth import auth_bp
from app.routes.docente import docente_bp
from app.routes.estudiante import estudiante_bp
from app.routes.admin import admin_bp
from app.routes.direccion import direccion_bp

__all__ = ['auth_bp', 'docente_bp', 'estudiante_bp', 'admin_bp', 'direccion_bp']
