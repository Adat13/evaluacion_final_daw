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
            'fecha_inicio': self.fecha_inicio.isoformat(),
            'fecha_fin': self.fecha_fin.isoformat(),
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


class Curso(db.Model):
    __tablename__ = 'cursos'

    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(20), unique=True, nullable=False)
    nombre = db.Column(db.String(150), nullable=False)
    creditos = db.Column(db.Integer, nullable=False)
    horario = db.Column(db.String(80), nullable=False)
    dia_semana = db.Column(db.String(30), nullable=False)
    hora_inicio = db.Column(db.String(5), nullable=False)
    hora_fin = db.Column(db.String(5), nullable=False)
    cupos_max = db.Column(db.Integer, default=30)
    cupos_ocupados = db.Column(db.Integer, default=0)
    docente_nombre = db.Column(db.String(100), nullable=True)
    prerrequisito_codigo = db.Column(db.String(20), nullable=True)
    periodo_id = db.Column(db.Integer, db.ForeignKey('periodos_matricula.id'), nullable=False)

    periodo = db.relationship('PeriodoMatricula', backref=db.backref('cursos', lazy=True))

    @property
    def cupos_disponibles(self):
        return max(0, self.cupos_max - self.cupos_ocupados)

    def to_dict(self):
        return {
            'id': self.id,
            'codigo': self.codigo,
            'nombre': self.nombre,
            'creditos': self.creditos,
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
