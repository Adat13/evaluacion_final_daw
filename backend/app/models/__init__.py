from app import db
from datetime import datetime
from enum import Enum
import bcrypt


class UserRole(Enum):
    """Roles disponibles en el sistema"""
    ESTUDIANTE = 'estudiante'
    DOCENTE = 'docente'
    ADMINISTRADOR = 'administrador'
    DIRECCION = 'direccion'


class User(db.Model):
    """Modelo de Usuario base"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    nombres = db.Column(db.String(120), nullable=False)
    apellidos = db.Column(db.String(120), nullable=False)
    rol = db.Column(db.String(20), default=UserRole.ESTUDIANTE.value, nullable=False)
    activo = db.Column(db.Boolean, default=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    docente = db.relationship('Docente', uselist=False, back_populates='usuario')
    estudiante = db.relationship('Estudiante', uselist=False, back_populates='usuario')
    administrador = db.relationship('Administrador', uselist=False, back_populates='usuario')

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

    def __repr__(self):
        return f'<User {self.email}>'


class Facultad(db.Model):
    """Modelo de Facultad"""
    __tablename__ = 'facultades'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    codigo = db.Column(db.String(20), unique=True, nullable=False)
    activa = db.Column(db.Boolean, default=True)

    especialidades = db.relationship(
        'Especialidad',
        back_populates='facultad',
        cascade='all, delete-orphan'
    )

    cursos = db.relationship(
        'Curso',
        back_populates='facultad'
    )

    def __repr__(self):
        return f'<Facultad {self.codigo}>'


class Especialidad(db.Model):
    """Modelo de Especialidad"""
    __tablename__ = 'especialidades'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    codigo = db.Column(db.String(20), unique=True, nullable=False)

    facultad_id = db.Column(
        db.Integer,
        db.ForeignKey('facultades.id'),
        nullable=False
    )

    activa = db.Column(db.Boolean, default=True)

    facultad = db.relationship(
        'Facultad',
        back_populates='especialidades'
    )

    estudiantes = db.relationship(
        'Estudiante',
        back_populates='especialidad'
    )

    def __repr__(self):
        return f'<Especialidad {self.codigo}>'


class CicloAcademico(db.Model):
    """Modelo de Ciclo Académico"""
    __tablename__ = 'ciclos_academicos'

    id = db.Column(db.Integer, primary_key=True)

    codigo = db.Column(
        db.String(20),
        unique=True,
        nullable=False
    )

    nombre = db.Column(
        db.String(120),
        nullable=False
    )

    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=False)

    fecha_limite_silabo = db.Column(
        db.Date,
        nullable=False
    )

    activo = db.Column(
        db.Boolean,
        default=False
    )

    cursos = db.relationship(
        'Curso',
        back_populates='ciclo'
    )

    ofertas = db.relationship(
        'Oferta',
        back_populates='ciclo'
    )

    matriculas = db.relationship(
        'Matricula',
        back_populates='ciclo'
    )

    def __repr__(self):
        return f'<CicloAcademico {self.codigo}>'


class Curso(db.Model):
    """Modelo de Curso"""
    __tablename__ = 'cursos'

    id = db.Column(db.Integer, primary_key=True)

    codigo = db.Column(
        db.String(20),
        nullable=False
    )

    nombre = db.Column(
        db.String(200),
        nullable=False
    )

    creditos = db.Column(
        db.Integer,
        nullable=False
    )

    tipo = db.Column(
        db.String(20),
        default='obligatorio',
        nullable=False
    )

    requisitos = db.Column(
        db.String(255)
    )

    facultad_id = db.Column(
        db.Integer,
        db.ForeignKey('facultades.id'),
        nullable=False
    )

    ciclo_id = db.Column(
        db.Integer,
        db.ForeignKey('ciclos_academicos.id'),
        nullable=False
    )

    activo = db.Column(
        db.Boolean,
        default=True
    )

    fecha_creacion = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint(
            'codigo',
            'ciclo_id',
            name='uq_curso_ciclo'
        ),
    )

    facultad = db.relationship(
        'Facultad',
        back_populates='cursos'
    )

    ciclo = db.relationship(
        'CicloAcademico',
        back_populates='cursos'
    )

    ofertas = db.relationship(
        'Oferta',
        back_populates='curso',
        cascade='all, delete-orphan'
    )

    def __repr__(self):
        return f'<Curso {self.codigo}>'

class Oferta(db.Model):
    """Modelo de Oferta Académica"""
    __tablename__ = 'ofertas'

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    curso_id = db.Column(
        db.Integer,
        db.ForeignKey('cursos.id'),
        nullable=False
    )

    docente_id = db.Column(
        db.Integer,
        db.ForeignKey('docentes.id'),
        nullable=True
    )

    ciclo_id = db.Column(
        db.Integer,
        db.ForeignKey('ciclos_academicos.id'),
        nullable=False
    )

    seccion = db.Column(
        db.String(10),
        nullable=False
    )

    cupo_maximo = db.Column(
        db.Integer,
        default=40
    )

    aula = db.Column(
        db.String(50)
    )

    horario = db.Column(
        db.JSON
    )

    activo = db.Column(
        db.Boolean,
        default=True
    )

    fecha_creacion = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


    curso = db.relationship(
        'Curso',
        back_populates='ofertas'
    )

    docente = db.relationship(
        'Docente',
        back_populates='ofertas'
    )

    ciclo = db.relationship(
        'CicloAcademico',
        back_populates='ofertas'
    )

    matriculas = db.relationship(
        'Matricula',
        back_populates='oferta',
        cascade='all, delete-orphan'
    )

    silabo = db.relationship(
        'Silabo',
        back_populates='oferta',
        uselist=False
    )

    acta = db.relationship(
        'Acta',
        back_populates='oferta',
        uselist=False
    )


    def __repr__(self):
        return f'<Oferta {self.id}>'    

class Matricula(db.Model):
    """Modelo de Matrícula"""
    __tablename__ = 'matriculas'

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    estudiante_id = db.Column(
        db.Integer,
        db.ForeignKey('estudiantes.id'),
        nullable=False
    )

    oferta_id = db.Column(
        db.Integer,
        db.ForeignKey('ofertas.id'),
        nullable=False
    )

    ciclo_id = db.Column(
        db.Integer,
        db.ForeignKey('ciclos_academicos.id'),
        nullable=False
    )

    estado = db.Column(
        db.String(30),
        default='activa'
    )

    fecha_matricula = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


    estudiante = db.relationship(
        'Estudiante',
        back_populates='matriculas'
    )

    oferta = db.relationship(
        'Oferta',
        back_populates='matriculas'
    )

    ciclo = db.relationship(
        'CicloAcademico',
        back_populates='matriculas'
    )

    nota = db.relationship(
        'Nota',
        back_populates='matricula',
        uselist=False,
        cascade='all, delete-orphan'
    )


    def __repr__(self):
        return f'<Matricula {self.id}>'

class Silabo(db.Model):
    """Modelo de Sílabo"""
    __tablename__ = 'silabos'

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    oferta_id = db.Column(
        db.Integer,
        db.ForeignKey('ofertas.id'),
        nullable=False
    )

    contenido = db.Column(
        db.Text
    )

    archivo_url = db.Column(
        db.String(255)
    )

    estado = db.Column(
        db.String(30),
        default='PENDIENTE'
    )

    numero_version = db.Column(
        db.Integer,
        default=1
    )

    fecha_carga = db.Column(
        db.DateTime
    )

    observaciones = db.Column(
        db.Text
    )


    oferta = db.relationship(
        'Oferta',
        back_populates='silabo'
    )


    def __repr__(self):
        return f'<Silabo oferta_id={self.oferta_id}>'

class Nota(db.Model):
    """Modelo de Nota Académica"""
    __tablename__ = 'notas'

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    matricula_id = db.Column(
        db.Integer,
        db.ForeignKey('matriculas.id'),
        nullable=False
    )

    pc1 = db.Column(
        db.Float,
        nullable=True
    )

    pc2 = db.Column(
        db.Float,
        nullable=True
    )

    pc3 = db.Column(
        db.Float,
        nullable=True
    )

    ef = db.Column(
        db.Float,
        nullable=True
    )

    promedio = db.Column(
        db.Float,
        nullable=True
    )

    estado = db.Column(
        db.String(30),
        default='PENDIENTE'
    )


    matricula = db.relationship(
        'Matricula',
        back_populates='nota'
    )


    def calcular_promedio(self):

        notas = [
            self.pc1,
            self.pc2,
            self.pc3,
            self.ef
        ]

        notas_validas = [
            n for n in notas
            if n is not None
        ]

        if notas_validas:
            self.promedio = round(
                sum(notas_validas) / len(notas_validas),
                2
            )

            if self.promedio >= 10.5:
                self.estado = 'APROBADO'
            else:
                self.estado = 'DESAPROBADO'


    def __repr__(self):
        return f'<Nota matricula={self.matricula_id}>'

class Acta(db.Model):
    """Modelo de Acta de Notas"""
    __tablename__ = 'actas'

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    oferta_id = db.Column(
        db.Integer,
        db.ForeignKey('ofertas.id'),
        nullable=False
    )

    usuario_id_creacion = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False
    )

    estado = db.Column(
        db.String(30),
        default='BORRADOR'
    )

    fecha_envio = db.Column(
        db.DateTime,
        nullable=True
    )

    fecha_aprobacion = db.Column(
        db.DateTime,
        nullable=True
    )

    fecha_consolidacion = db.Column(
        db.DateTime,
        nullable=True
    )

    observaciones = db.Column(
        db.Text,
        nullable=True
    )


    oferta = db.relationship(
        'Oferta',
        back_populates='acta'
    )


    usuario_creacion = db.relationship(
        'User'
    )


    def __repr__(self):
        return f'<Acta oferta={self.oferta_id}>'

class Docente(db.Model):
    """Modelo de Docente"""
    __tablename__ = 'docentes'

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    usuario_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False,
        unique=True
    )

    codigo_docente = db.Column(
        db.String(20),
        unique=True,
        nullable=False
    )

    especialidad = db.Column(
        db.String(120)
    )

    activo = db.Column(
        db.Boolean,
        default=True
    )

    fecha_creacion = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


    usuario = db.relationship(
        'User',
        back_populates='docente'
    )

    ofertas = db.relationship(
        'Oferta',
        back_populates='docente',
        cascade='all, delete-orphan'
    )


    def __repr__(self):
        return f'<Docente {self.codigo_docente}>'


class Administrador(db.Model):
    """Modelo de Administrador"""
    __tablename__ = 'administradores'

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    usuario_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False,
        unique=True
    )

    codigo_administrador = db.Column(
        db.String(20),
        unique=True,
        nullable=False
    )

    cargo = db.Column(
        db.String(120)
    )

    nivel_acceso = db.Column(
        db.String(20),
        default='estandar'
    )

    activo = db.Column(
        db.Boolean,
        default=True
    )

    fecha_creacion = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    usuario = db.relationship(
        'User',
        back_populates='administrador'
    )

    def __repr__(self):
        return f'<Administrador {self.codigo_administrador}>'


class Estudiante(db.Model):
    """Modelo de Estudiante"""
    __tablename__ = 'estudiantes'

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    usuario_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False,
        unique=True
    )

    codigo = db.Column(
        db.String(20),
        unique=True,
        nullable=False
    )

    especialidad_id = db.Column(
        db.Integer,
        db.ForeignKey('especialidades.id'),
        nullable=False
    )

    usuario = db.relationship(
        'User',
        back_populates='estudiante'
    )

    especialidad = db.relationship(
        'Especialidad',
        back_populates='estudiantes'
    )

    matriculas = db.relationship(
        'Matricula',
        back_populates='estudiante',
        cascade='all, delete-orphan'
    )

    def __repr__(self):
        return f'<Estudiante {self.codigo}>'
    
