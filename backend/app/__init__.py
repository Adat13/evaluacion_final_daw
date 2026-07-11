import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import datetime, date

# Import db and all models to ensure they register correctly with SQLAlchemy
from app.models import (
    db, User, AuditLog, Facultad, Especialidad, PlanEstudios,
    Curso, PeriodoAcad, Estudiante, Docente, Seccion,
    Matricula, DetalleMatricula, Nota, SolicitudDocumento, Acta
)

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    
    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize DB
    db.init_app(app)
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Global security headers
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    from app.routes.docente import docente_bp
    from app.routes.estudiante import estudiante_bp
    from app.routes.direccion import direccion_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(docente_bp, url_prefix='/api/docente')
    app.register_blueprint(estudiante_bp, url_prefix='/api/estudiante')
    app.register_blueprint(direccion_bp, url_prefix='/api/direccion')
    
    # Descarga de archivos (silabos)
    @app.route('/api/uploads/silabos/<path:filename>', methods=['GET'])
    def descargar_silabo(filename):
        from flask import send_from_directory
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)
    
    # Create DB tables and seed initial data
    with app.app_context():
        db.create_all()
        seed_data()
        
    return app

def seed_data():
    # Check if we already have users (implies db is seeded)
    if User.query.first():
        return
        
    print("Seeding initial users, academic entities, and profiles...")
    
    # 1. Base Users Creation
    # Administrador
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
    
    # Docente (Dr. Carlos Rojas)
    docente_user = User(
        username="docente",
        email="crojas@uncp.edu.pe",
        name="Dr. Carlos Rojas",
        role="docente",
        phone="912345678",
        address="Jr. Huancavelica 456, Huancayo",
        document_type="DNI",
        document_number="88888888"
    )
    docente_user.set_password("docente123")
    db.session.add(docente_user)
    
    # Estudiante (Juan Pérez)
    estudiante_user = User(
        username="student",
        email="jperez@uncp.edu.pe",
        name="Juan Pérez",
        role="estudiante",
        phone="999888777",
        address="Urb. San Antonio Mz C Lt 5, Huancayo",
        document_type="DNI",
        document_number="99999999"
    )
    estudiante_user.set_password("student123")
    db.session.add(estudiante_user)
    
    # Dirección (Decanato FIS)
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
    
    # Commit users to get their IDs
    db.session.commit()
    
    # 2. Academic structure
    # Facultad
    facultad_fis = Facultad(
        nombre="Ingeniería de Sistemas",
        siglas="FIS",
        fecha_creacion=date(1995, 10, 15)
    )
    db.session.add(facultad_fis)
    db.session.commit()
    
    # Especialidad
    carrera_sistemas = Especialidad(
        facultad_id=facultad_fis.id,
        nombre="Ingeniería de Sistemas",
        codigo="IS"
    )
    db.session.add(carrera_sistemas)
    db.session.commit()
    
    # Plan de estudios
    plan_2023 = PlanEstudios(
        especialidad_id=carrera_sistemas.id,
        codigo_plan="PLAN-2023-FIS",
        anio_aprobacion=2023,
        activo=True
    )
    db.session.add(plan_2023)
    db.session.commit()
    
    # Cursos
    curso_bd = Curso(
        plan_id=plan_2023.id,
        codigo_curso="IS-601",
        nombre="Taller de Base de Datos",
        creditos=4
    )
    curso_daw = Curso(
        plan_id=plan_2023.id,
        codigo_curso="IS-901",
        nombre="Desarrollo de Aplicaciones Web",
        creditos=4
    )
    curso_tesis = Curso(
        plan_id=plan_2023.id,
        codigo_curso="IS-902",
        nombre="Proyecto de Tesis I",
        creditos=4
    )
    db.session.add_all([curso_bd, curso_daw, curso_tesis])
    db.session.commit()
    
    # Relación de Prerrequisitos (bd es prerrequisito de daw)
    curso_daw.prerrequisitos.append(curso_bd)
    db.session.commit()
    
    # Periodo Académico
    periodo_actual = PeriodoAcad(
        codigo_periodo="2026-I",
        anio=2026,
        activo=True
    )
    db.session.add(periodo_actual)
    db.session.commit()
    
    # 3. Profiles Association
    # Docente
    docente_profile = Docente(
        user_id=docente_user.id,
        facultad_id=facultad_fis.id,
        codigo_docente="D-2026-001"
    )
    # Estudiante
    estudiante_profile = Estudiante(
        user_id=estudiante_user.id,
        especialidad_id=carrera_sistemas.id,
        codigo_estudiante="E-2026-0001"
    )
    db.session.add_all([docente_profile, estudiante_profile])
    db.session.commit()
    
    # 4. Secciones
    seccion_daw = Seccion(
        curso_id=curso_daw.id,
        periodo_id=periodo_actual.id,
        docente_id=docente_profile.id,
        codigo_seccion="A",
        capacidad=35,
        horario="Martes 10:00 - 12:00, Jueves 10:00 - 12:00",
        silabo_url="http://example.com/silabo_daw.pdf"
    )
    seccion_bd = Seccion(
        curso_id=curso_bd.id,
        periodo_id=periodo_actual.id,
        docente_id=docente_profile.id,
        codigo_seccion="A",
        capacidad=40,
        horario="Lunes 08:00 - 10:00, Miércoles 08:00 - 10:00",
        silabo_url="http://example.com/silabo_bd.pdf"
    )
    db.session.add_all([seccion_daw, seccion_bd])
    db.session.commit()
    
    # 5. Proceso de Matrícula
    matricula_juan = Matricula(
        estudiante_id=estudiante_profile.id,
        periodo_id=periodo_actual.id,
        costo_total=120.00,
        estado_pago="pagado",
        comprobante_pago="OP-4829102",
        estado_matricula="validada",
        observacion="Matrícula regular del semestre 2026-I."
    )
    db.session.add(matricula_juan)
    db.session.commit()
    
    # Detalle de Matrícula (Cursos Inscritos)
    det_daw = DetalleMatricula(
        matricula_id=matricula_juan.id,
        seccion_id=seccion_daw.id,
        estado_curso="cursando"
    )
    det_bd = DetalleMatricula(
        matricula_id=matricula_juan.id,
        seccion_id=seccion_bd.id,
        estado_curso="aprobado"
    )
    db.session.add_all([det_daw, det_bd])
    db.session.commit()
    
    # 6. Calificaciones (Notas)
    # Taller de BD (Aprobado en periodo anterior o consolidado)
    nota_bd = Nota(
        detalle_matricula_id=det_bd.id,
        nota_parcial1=15.00,
        nota_parcial2=16.00,
        evaluacion_continua=14.00,
        examen_final=18.00,
        promedio_final=16.10,
        consolidada=True
    )
    # DAW (Cursando con notas parciales registradas)
    nota_daw = Nota(
        detalle_matricula_id=det_daw.id,
        nota_parcial1=14.00,
        nota_parcial2=15.50,
        evaluacion_continua=16.00,
        examen_final=0.00, # Aún no rinde examen final
        promedio_final=11.38, # Promedio parcial proyectado
        consolidada=False
    )
    db.session.add_all([nota_bd, nota_daw])
    db.session.commit()
    
    # 7. Documento / Certificado Emitido
    constancia_juan = SolicitudDocumento(
        estudiante_id=estudiante_profile.id,
        tipo_documento="constancia_matricula",
        estado="emitido",
        fecha_emision=datetime.utcnow(),
        qr_code_hash="qr-2026-matricula-jperez-0001",
        firma_digital_hash="sha256-signature-98a7c6f5e4d3c2b1a0",
        pdf_url="http://example.com/constancia_jperez.pdf",
        observaciones="Firma digitalizada autorizada por Decanato FIS."
    )
    db.session.add(constancia_juan)
    db.session.commit()
    
    print("Seed complete.")
