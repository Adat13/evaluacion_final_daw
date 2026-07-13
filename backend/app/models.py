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

# --- MÓDULO MATRÍCULA (MAT-EST-001) ---

class PeriodoMatricula(db.Model):
    __tablename__ = 'periodos_matricula'

    id = db.Column(db.Integer, primary_key=True)
    ciclo = db.Column(db.String(20), nullable=False, unique=True)
    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=False)
    activo = db.Column(db.Boolean, default=True)
    costo_por_credito = db.Column(db.Float, default=45.0)

    def to_dict(self):
        return {
            'id': self.id,
            'ciclo': self.ciclo,
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'fecha_fin': self.fecha_fin.isoformat() if self.fecha_fin else None,
            'activo': self.activo,
            'costo_por_credito': self.costo_por_credito,
        }

class EstudiantePerfil(db.Model):
    __tablename__ = 'estudiantes_perfil'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    facultad = db.Column(db.String(100), default='Facultad de Ingeniería de Sistemas')
    escuela = db.Column(db.String(100), default='Ingeniería de Sistemas')
    ciclo_ingreso = db.Column(db.String(20), default='2022-I')
    estado_academico = db.Column(db.String(30), default='activo')
    tiene_deudas = db.Column(db.Boolean, default=False)
    cursos_aprobados = db.Column(db.Text, default='[]')

    user = db.relationship('User', backref=db.backref('perfil_academico', uselist=False))

    def get_cursos_aprobados(self):
        import json
        try:
            return json.loads(self.cursos_aprobados or '[]')
        except json.JSONDecodeError:
            return []

    def to_dict(self):
        return {
            'facultad': self.facultad,
            'escuela': self.escuela,
            'ciclo_ingreso': self.ciclo_ingreso,
            'estado_academico': self.estado_academico,
            'tiene_deudas': self.tiene_deudas,
            'cursos_aprobados': self.get_cursos_aprobados(),
        }

# M:N Relationship for Course Prerequisites
curso_prerrequisitos = db.Table('curso_prerrequisitos',
    db.Column('curso_id', db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), primary_key=True),
    db.Column('prerrequisito_id', db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), primary_key=True)
)

class Curso(db.Model):
    __tablename__ = 'cursos'
    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('planes_estudio.id', ondelete='CASCADE'), nullable=True)
    codigo_curso = db.Column(db.String(20), unique=True, nullable=True)
    codigo = db.Column(db.String(20), unique=True, nullable=True) # Benjamin's alias/column
    nombre = db.Column(db.String(150), nullable=False)
    creditos = db.Column(db.Integer, nullable=False)

    # Benjamin's fields
    horario = db.Column(db.String(80), nullable=True)
    dia_semana = db.Column(db.String(30), nullable=True)
    hora_inicio = db.Column(db.String(5), nullable=True)
    hora_fin = db.Column(db.String(5), nullable=True)
    cupos_max = db.Column(db.Integer, default=30)
    cupos_ocupados = db.Column(db.Integer, default=0)
    docente_nombre = db.Column(db.String(100), nullable=True)
    prerrequisito_codigo = db.Column(db.String(20), nullable=True)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_matricula.id'), nullable=True)

    # Relationships & properties
    periodo = db.relationship('PeriodoMatricula', backref=db.backref('cursos', lazy=True))
    
    # Self-referencing M2M for prerequisites (from HEAD)
    prerrequisitos = db.relationship(
        'Curso',
        secondary=curso_prerrequisitos,
        primaryjoin=(id == curso_prerrequisitos.c.curso_id),
        secondaryjoin=(id == curso_prerrequisitos.c.prerrequisito_id),
        backref=db.backref('es_prerrequisito_de', lazy='dynamic')
    )

    secciones = db.relationship('Seccion', backref='curso', cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if 'codigo_curso' in kwargs and 'codigo' not in kwargs:
            self.codigo = kwargs['codigo_curso']
        elif 'codigo' in kwargs and 'codigo_curso' not in kwargs:
            self.codigo_curso = kwargs['codigo']

    @property
    def cupos_disponibles(self):
        return max(0, self.cupos_max - self.cupos_ocupados)

    def to_dict(self):
        return {
            'id': self.id,
            'plan_id': self.plan_id,
            'codigo_curso': self.codigo_curso or self.codigo,
            'codigo': self.codigo or self.codigo_curso,
            'nombre': self.nombre,
            'creditos': self.creditos,
            'prerrequisitos': [p.codigo_curso for p in self.prerrequisitos] if hasattr(self, 'prerrequisitos') and self.prerrequisitos else [],
            'horario': self.horario,
            'dia_semana': self.dia_semana,
            'hora_inicio': self.hora_inicio,
            'hora_fin': self.hora_fin,
            'cupos_max': self.cupos_max,
            'cupos_ocupados': self.cupos_ocupados,
            'cupos_disponibles': self.cupos_disponibles,
            'docente_nombre': self.docente_nombre,
            'prerrequisito_codigo': self.prerrequisito_codigo,
            'periodo_id': self.periodo_id,
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

    def calcular_promedio(self):
        p1 = float(self.nota_parcial1) if self.nota_parcial1 else 0.0
        p2 = float(self.nota_parcial2) if self.nota_parcial2 else 0.0
        ec = float(self.evaluacion_continua) if self.evaluacion_continua else 0.0
        ef = float(self.examen_final) if self.examen_final else 0.0
        self.promedio_final = round((p1 + p2 + ec + ef) / 4, 2)

class Acta(db.Model):
    __tablename__ = 'actas'
    id = db.Column(db.Integer, primary_key=True)
    seccion_id = db.Column(db.Integer, db.ForeignKey('secciones.id', ondelete='CASCADE'), nullable=False)
    usuario_id_creacion = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    estado = db.Column(db.String(30), default='BORRADOR', nullable=False) # 'BORRADOR', 'ENVIADA', 'OBSERVADA', 'APROBADA', 'CONSOLIDADA'
    fecha_envio = db.Column(db.DateTime, nullable=True)
    fecha_aprobacion = db.Column(db.DateTime, nullable=True)
    fecha_consolidacion = db.Column(db.DateTime, nullable=True)
    observaciones = db.Column(db.Text, nullable=True)
    
    seccion = db.relationship('Seccion', backref=db.backref('acta', uselist=False, cascade="all, delete-orphan"))
    usuario_creacion = db.relationship('User', foreign_keys=[usuario_id_creacion])

    def to_dict(self):
        return {
            'id': self.id,
            'seccion_id': self.seccion_id,
            'usuario_id_creacion': self.usuario_id_creacion,
            'estado': self.estado,
            'fecha_envio': self.fecha_envio.isoformat() if self.fecha_envio else None,
            'fecha_aprobacion': self.fecha_aprobacion.isoformat() if self.fecha_aprobacion else None,
            'fecha_consolidacion': self.fecha_consolidacion.isoformat() if self.fecha_consolidacion else None,
            'observaciones': self.observaciones
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

class SolicitudMatricula(db.Model):
    __tablename__ = 'solicitudes_matricula'

    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(30), unique=True, nullable=False)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_matricula.id'), nullable=False)
    estado = db.Column(db.String(20), default='PENDIENTE')
    creditos_total = db.Column(db.Integer, default=0)
    monto_total = db.Column(db.Float, default=0.0)
    acepto_terminos = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Campos de pago y observaciones (MAT-ADM-001)
    pago_registrado = db.Column(db.Boolean, default=False)
    pago_monto = db.Column(db.Float, nullable=True)
    pago_fecha = db.Column(db.String(20), nullable=True)
    pago_voucher = db.Column(db.String(50), nullable=True)
    pago_metodo = db.Column(db.String(30), nullable=True)
    justificacion_pago = db.Column(db.Text, nullable=True)
    observaciones = db.Column(db.Text, nullable=True)

    estudiante = db.relationship('User', backref=db.backref('solicitudes_matricula', lazy=True))
    periodo = db.relationship('PeriodoMatricula', backref=db.backref('solicitudes', lazy=True))
    detalles = db.relationship('DetalleSolicitud', backref='solicitud', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_cursos=False):
        data = {
            'id': self.id,
            'codigo': self.codigo,
            'estudiante_id': self.estudiante_id,
            'estudiante_nombre': self.estudiante.name if self.estudiante else None,
            'estudiante_username': self.estudiante.username if self.estudiante else None,
            'periodo_id': self.periodo_id,
            'estado': self.estado,
            'creditos_total': self.creditos_total,
            'monto_total': self.monto_total,
            'acepto_terminos': self.acepto_terminos,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'ciclo': self.periodo.ciclo if self.periodo else None,
            'pago_registrado': self.pago_registrado,
            'pago_monto': self.pago_monto,
            'pago_fecha': self.pago_fecha,
            'pago_voucher': self.pago_voucher,
            'pago_metodo': self.pago_metodo,
            'justificacion_pago': self.justificacion_pago,
            'observaciones': self.observaciones,
        }
        if include_cursos:
            data['cursos'] = [d.curso.to_dict() for d in self.detalles if d.curso]
        return data

class DetalleSolicitud(db.Model):
    __tablename__ = 'detalle_solicitud_matricula'

    id = db.Column(db.Integer, primary_key=True)
    solicitud_id = db.Column(db.Integer, db.ForeignKey('solicitudes_matricula.id', ondelete='CASCADE'), nullable=False)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id', ondelete='CASCADE'), nullable=False)

    curso = db.relationship('Curso', backref=db.backref('detalles_solicitud', lazy=True))

class NotaHistorica(db.Model):
    __tablename__ = 'notas_historicas'

    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    curso_codigo = db.Column(db.String(20), nullable=False)
    curso_nombre = db.Column(db.String(150), nullable=False)
    creditos = db.Column(db.Integer, nullable=False)
    ciclo = db.Column(db.String(20), nullable=False)
    nota_final = db.Column(db.Integer, nullable=False)
    estado = db.Column(db.String(20), nullable=False) # 'APROBADO', 'DESAPROBADO'
    veces_matriculado = db.Column(db.Integer, default=1)

    estudiante = db.relationship('User', backref=db.backref('notas_historicas', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'estudiante_id': self.estudiante_id,
            'curso_codigo': self.curso_codigo,
            'curso_nombre': self.curso_nombre,
            'creditos': self.creditos,
            'ciclo': self.ciclo,
            'nota_final': self.nota_final,
            'estado': self.estado,
            'veces_matriculado': self.veces_matriculado
        }

class SolicitudCertificado(db.Model):
    __tablename__ = 'solicitudes_certificado'

    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(30), unique=True, nullable=False)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    tipo_documento = db.Column(db.String(50), nullable=False) # 'Constancia de Matrícula', 'Constancia de Notas', 'Certificado de Estudios', 'Constancia de Egresado'
    motivo = db.Column(db.Text, nullable=True)
    idioma = db.Column(db.String(20), default='Español')
    cantidad_copias = db.Column(db.Integer, default=1)
    estado = db.Column(db.String(30), default='PENDIENTE') # 'PENDIENTE', 'EN PROCESO', 'PENDIENTE_AUTORIZACION', 'EMITIDO', 'RECHAZADO', 'DENEGADO'
    motivo_rechazo = db.Column(db.Text, nullable=True)
    autorizado_por = db.Column(db.String(100), nullable=True)
    fecha_autorizacion = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    estudiante = db.relationship('User', backref=db.backref('solicitudes_certificado', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'codigo': self.codigo,
            'estudiante_id': self.estudiante_id,
            'estudiante_nombre': self.estudiante.name if self.estudiante else None,
            'estudiante_username': self.estudiante.username if self.estudiante else None,
            'tipo_documento': self.tipo_documento,
            'motivo': self.motivo,
            'idioma': self.idioma,
            'cantidad_copias': self.cantidad_copias,
            'estado': self.estado,
            'motivo_rechazo': self.motivo_rechazo,
            'autorizado_por': self.autorizado_por,
            'fecha_autorizacion': self.fecha_autorizacion,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
