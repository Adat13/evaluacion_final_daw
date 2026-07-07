import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.models import db, User

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    
    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize DB
    db.init_app(app)
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Create DB tables and seed initial data
    with app.app_context():
        db.create_all()
        seed_data()
        
    return app

def seed_data():
    # Check if we already have users
    if User.query.first():
        return
        
    print("Seeding initial users and roles...")
    
    # 1. Administrator
    admin = User(
        username="admin",
        email="admin@uncp.edu.pe",
        name="Ing. Angel Administrador",
        role="administrador",
        phone="987654321",
        address="Av. Universitaria 123, El Tambo",
        document_type="DNI",
        document_number="77777777"
    )
    admin.set_password("admin123")
    db.session.add(admin)
    
    # 2. Docente (Carlos Rojas)
    docente = User(
        username="docente",
        email="crojas@uncp.edu.pe",
        name="Dr. Carlos Rojas",
        role="docente",
        phone="912345678",
        address="Jr. Huancavelica 456, Huancayo",
        document_type="DNI",
        document_number="88888888"
    )
    docente.set_password("docente123")
    db.session.add(docente)
    
    # 3. Estudiante (Juan Pérez)
    estudiante = User(
        username="student",
        email="jperez@uncp.edu.pe",
        name="Juan Pérez",
        role="estudiante",
        phone="999888777",
        address="Urb. San Antonio Mz C Lt 5, Huancayo",
        document_type="DNI",
        document_number="99999999"
    )
    estudiante.set_password("student123")
    db.session.add(estudiante)
    
    # 4. Dirección (Decanato FIS)
    direccion = User(
        username="director",
        email="decanato_fis@uncp.edu.pe",
        name="Dr. Decano FIS UNCP",
        role="direccion",
        phone="955555555",
        address="Av. Giraldez 999, Huancayo",
        document_type="DNI",
        document_number="11111111"
    )
    direccion.set_password("director123")
    db.session.add(direccion)
    
    db.session.commit()
    print("Seed complete.")
