from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False) # 'estudiante', 'docente', 'administrador', 'direccion'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Profile fields (AUTH-005)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(200), nullable=True)
    document_type = db.Column(db.String(10), nullable=True, default="DNI")
    document_number = db.Column(db.String(20), nullable=True)
    
    # Profiles Mapped 1:1
    estudiante_profile = db.relationship('Estudiante', backref='user', uselist=False, cascade="all, delete-orphan")
    docente_profile = db.relationship('Docente', backref='user', uselist=False, cascade="all, delete-orphan")
    
    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'phone': self.phone,
            'address': self.address,
            'document_type': self.document_type,
            'document_number': self.document_number,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    username = db.Column(db.String(50), nullable=True) # captured for audit persistence if user deleted
    action = db.Column(db.String(100), nullable=False) # 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'CHANGE_PASSWORD', etc.
    ip_address = db.Column(db.String(45), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text, nullable=True)
    
    user = db.relationship('User', backref=db.backref('audit_logs', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'action': self.action,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'details': self.details
        }

class Facultad(db.Model):
    __tablename__ = 'facultades'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    siglas = db.Column(db.String(10), unique=True, nullable=False)
    fecha_creacion = db.Column(db.Date, nullable=True)

    especialidades = db.relationship('Especialidad', backref='facultad', cascade="all, delete-orphan")
    docentes = db.relationship('Docente', backref='facultad', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'siglas': self.siglas,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None
        }

class Especialidad(db.Model):
    __tablename__ = 'especialidades'
    id = db.Column(db.Integer, primary_key=True)
    facultad_id = db.Column(db.Integer, db.ForeignKey('facultades.id', ondelete='CASCADE'), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    codigo = db.Column(db.String(10), unique=True, nullable=False)

    planes_estudio = db.relationship('PlanEstudios', backref='especialidad', cascade="all, delete-orphan")
    estudiantes = db.relationship('Estudiante', backref='especialidad', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'facultad_id': self.facultad_id,
            'nombre': self.nombre,
            'codigo': self.codigo
        }

class PlanEstudios(db.Model):
    __tablename__ = 'planes_estudio'
    id = db.Column(db.Integer, primary_key=True)
    especialidad_id = db.Column(db.Integer, db.ForeignKey('especialidades.id', ondelete='CASCADE'), nullable=False)
    codigo_plan = db.Column(db.String(20), unique=True, nullable=False)
    anio_aprobacion = db.Column(db.Integer, nullable=False)
    activo = db.Column(db.Boolean, default=True)

    cursos = db.relationship('Curso', backref='plan_estudios', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'especialidad_id': self.especialidad_id,
            'codigo_plan': self.codigo_plan,
            'anio_aprobacion': self.anio_aprobacion,
            'activo': self.activo
        }

# M:N Relationship for Course Prerequisites
curso_prerrequisitos = db.Table('curso_prerrequisitos',
    db.Column('curso_id', db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), primary_key=True),
    db.Column('prerrequisito_id', db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), primary_key=True)
)

class Curso(db.Model):
    __tablename__ = 'cursos'
    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('planes_estudio.id', ondelete='CASCADE'), nullable=False)
    codigo_curso = db.Column(db.String(15), unique=True, nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    creditos = db.Column(db.Integer, nullable=False)

    # Self-referencing M2M for prerequisites
    prerrequisitos = db.relationship(
        'Curso',
        secondary=curso_prerrequisitos,
        primaryjoin=(id == curso_prerrequisitos.c.curso_id),
        secondaryjoin=(id == curso_prerrequisitos.c.prerrequisito_id),
        backref=db.backref('es_prerrequisito_de', lazy='dynamic')
    )

    secciones = db.relationship('Seccion', backref='curso', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'plan_id': self.plan_id,
            'codigo_curso': self.codigo_curso,
            'nombre': self.nombre,
            'creditos': self.creditos,
            'prerrequisitos': [p.codigo_curso for p in self.prerrequisitos]
        }

class PeriodoAcad(db.Model):
    __tablename__ = 'periodos_acad'
    id = db.Column(db.Integer, primary_key=True)
    codigo_periodo = db.Column(db.String(10), unique=True, nullable=False)
    anio = db.Column(db.Integer, nullable=False)
    activo = db.Column(db.Boolean, default=True)

    secciones = db.relationship('Seccion', backref='periodo', cascade="all, delete-orphan")
    matriculas = db.relationship('Matricula', backref='periodo', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'codigo_periodo': self.codigo_periodo,
            'anio': self.anio,
            'activo': self.activo
        }

class Estudiante(db.Model):
    __tablename__ = 'estudiantes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    especialidad_id = db.Column(db.Integer, db.ForeignKey('especialidades.id', ondelete='RESTRICT'), nullable=False)
    codigo_estudiante = db.Column(db.String(15), unique=True, nullable=False)

    matriculas = db.relationship('Matricula', backref='estudiante', cascade="all, delete-orphan")
    documentos = db.relationship('SolicitudDocumento', backref='estudiante', cascade="all, delete-orphan")

    def to_dict(self):
        user_data = self.user.to_dict() if self.user else {}
        return {
            'id': self.id,
            'user_id': self.user_id,
            'especialidad_id': self.especialidad_id,
            'codigo_estudiante': self.codigo_estudiante,
            **user_data
        }

class Docente(db.Model):
    __tablename__ = 'docentes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    facultad_id = db.Column(db.Integer, db.ForeignKey('facultades.id', ondelete='RESTRICT'), nullable=False)
    codigo_docente = db.Column(db.String(15), unique=True, nullable=False)

    secciones = db.relationship('Seccion', backref='docente', cascade="all, delete-orphan")

    def to_dict(self):
        user_data = self.user.to_dict() if self.user else {}
        return {
            'id': self.id,
            'user_id': self.user_id,
            'facultad_id': self.facultad_id,
            'codigo_docente': self.codigo_docente,
            **user_data
        }

class Seccion(db.Model):
    __tablename__ = 'secciones'
    id = db.Column(db.Integer, primary_key=True)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), nullable=False)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_acad.id', ondelete='CASCADE'), nullable=False)
    docente_id = db.Column(db.Integer, db.ForeignKey('docentes.id', ondelete='SET NULL'), nullable=True)
    codigo_seccion = db.Column(db.String(10), nullable=False)
    capacidad = db.Column(db.Integer, default=40, nullable=False)
    horario = db.Column(db.String(100), nullable=True)
    silabo_url = db.Column(db.String(255), nullable=True)

    detalles_matricula = db.relationship('DetalleMatricula', backref='seccion', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'curso_id': self.curso_id,
            'periodo_id': self.periodo_id,
            'docente_id': self.docente_id,
            'codigo_seccion': self.codigo_seccion,
            'capacidad': self.capacidad,
            'horario': self.horario,
            'silabo_url': self.silabo_url
        }

class Matricula(db.Model):
    __tablename__ = 'matriculas'
    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id', ondelete='CASCADE'), nullable=False)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_acad.id', ondelete='RESTRICT'), nullable=False)
    fecha_matricula = db.Column(db.DateTime, default=datetime.utcnow)
    costo_total = db.Column(db.Numeric(10, 2), default=0.0, nullable=False)
    estado_pago = db.Column(db.String(20), default='pendiente', nullable=False)
    comprobante_pago = db.Column(db.String(100), nullable=True)
    estado_matricula = db.Column(db.String(20), default='solicitada', nullable=False)
    observacion = db.Column(db.Text, nullable=True)

    detalles = db.relationship('DetalleMatricula', backref='matricula', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'estudiante_id': self.estudiante_id,
            'periodo_id': self.periodo_id,
            'fecha_matricula': self.fecha_matricula.isoformat() if self.fecha_matricula else None,
            'costo_total': float(self.costo_total),
            'estado_pago': self.estado_pago,
            'comprobante_pago': self.comprobante_pago,
            'estado_matricula': self.estado_matricula,
            'observacion': self.observacion
        }

class DetalleMatricula(db.Model):
    __tablename__ = 'detalles_matricula'
    id = db.Column(db.Integer, primary_key=True)
    matricula_id = db.Column(db.Integer, db.ForeignKey('matriculas.id', ondelete='CASCADE'), nullable=False)
    seccion_id = db.Column(db.Integer, db.ForeignKey('secciones.id', ondelete='RESTRICT'), nullable=False)
    estado_curso = db.Column(db.String(20), default='inscrito', nullable=False)

    nota = db.relationship('Nota', backref='detalle_matricula', uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'matricula_id': self.matricula_id,
            'seccion_id': self.seccion_id,
            'estado_curso': self.estado_curso
        }

class Nota(db.Model):
    __tablename__ = 'notas'
    id = db.Column(db.Integer, primary_key=True)
    detalle_matricula_id = db.Column(db.Integer, db.ForeignKey('detalles_matricula.id', ondelete='CASCADE'), unique=True, nullable=False)
    nota_parcial1 = db.Column(db.Numeric(4, 2), default=0.0, nullable=False)
    nota_parcial2 = db.Column(db.Numeric(4, 2), default=0.0, nullable=False)
    evaluacion_continua = db.Column(db.Numeric(4, 2), default=0.0, nullable=False)
    examen_final = db.Column(db.Numeric(4, 2), default=0.0, nullable=False)
    promedio_final = db.Column(db.Numeric(4, 2), default=0.0, nullable=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    consolidada = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'detalle_matricula_id': self.detalle_matricula_id,
            'nota_parcial1': float(self.nota_parcial1),
            'nota_parcial2': float(self.nota_parcial2),
            'evaluacion_continua': float(self.evaluacion_continua),
            'examen_final': float(self.examen_final),
            'promedio_final': float(self.promedio_final),
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None,
            'consolidada': self.consolidada
        }

class SolicitudDocumento(db.Model):
    __tablename__ = 'solicitudes_documento'
    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id', ondelete='CASCADE'), nullable=False)
    tipo_documento = db.Column(db.String(50), nullable=False) # 'constancia_matricula', 'certificado_estudios', etc.
    fecha_solicitud = db.Column(db.DateTime, default=datetime.utcnow)
    estado = db.Column(db.String(20), default='solicitado', nullable=False) # 'solicitado', 'autorizado', 'emitido', 'rechazado'
    fecha_emision = db.Column(db.DateTime, nullable=True)
    qr_code_hash = db.Column(db.String(128), nullable=True)
    firma_digital_hash = db.Column(db.String(256), nullable=True)
    pdf_url = db.Column(db.String(255), nullable=True)
    observaciones = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'estudiante_id': self.estudiante_id,
            'tipo_documento': self.tipo_documento,
            'fecha_solicitud': self.fecha_solicitud.isoformat() if self.fecha_solicitud else None,
            'estado': self.estado,
            'fecha_emision': self.fecha_emision.isoformat() if self.fecha_emision else None,
            'qr_code_hash': self.qr_code_hash,
            'firma_digital_hash': self.firma_digital_hash,
            'pdf_url': self.pdf_url,
            'observaciones': self.observaciones
        }
