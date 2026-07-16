from marshmallow import Schema, fields, validate, ValidationError, post_load, pre_dump
from app.models import (
    User, Docente, Estudiante, Facultad, Especialidad, 
    CicloAcademico, Curso, Oferta, Matricula, Silabo, Nota, Acta
)

# ==================== User Schemas ====================
class UserRegisterSchema(Schema):
    """Schema para registro de usuario"""
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    nombres = fields.Str(required=True)
    apellidos = fields.Str(required=True)
    rol = fields.Str(validate=validate.OneOf(['estudiante', 'docente', 'administrador', 'direccion']))

class UserLoginSchema(Schema):
    """Schema para login"""
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class UserSchema(Schema):
    """Schema para usuario"""
    id = fields.Int()
    email = fields.Email()
    nombres = fields.Str()
    apellidos = fields.Str()
    rol = fields.Str()
    activo = fields.Bool()
    fecha_creacion = fields.DateTime()

# ==================== Facultad Schemas ====================
class FacultadSchema(Schema):
    """Schema para facultad"""
    id = fields.Int()
    nombre = fields.Str(required=True)
    codigo = fields.Str(required=True, validate=validate.Length(min=2, max=20))
    activa = fields.Bool()

# ==================== Especialidad Schemas ====================
class EspecialidadSchema(Schema):
    """Schema para especialidad"""
    id = fields.Int()
    nombre = fields.Str(required=True)
    codigo = fields.Str(required=True, validate=validate.Length(min=2, max=20))
    facultad_id = fields.Int(required=True)
    activa = fields.Bool()

# ==================== Ciclo Académico Schemas ====================
class CicloAcademicoSchema(Schema):
    """Schema para ciclo académico"""
    id = fields.Int()
    codigo = fields.Str(required=True)
    nombre = fields.Str(required=True)
    fecha_inicio = fields.Date(required=True)
    fecha_fin = fields.Date(required=True)
    fecha_limite_silabo = fields.Date(required=True)
    activo = fields.Bool()

# ==================== Curso Schemas ====================
class CursoSchema(Schema):
    """Schema para curso"""
    id = fields.Int()
    codigo = fields.Str(required=True)
    nombre = fields.Str(required=True)
    creditos = fields.Int(required=True, validate=validate.Range(min=1, max=6))
    tipo = fields.Str(validate=validate.OneOf(['obligatorio', 'electivo']))
    requisitos = fields.Str()
    facultad_id = fields.Int(required=True)
    ciclo_id = fields.Int(required=True)
    activo = fields.Bool()

# ==================== Docente Schemas ====================
class DocenteSchema(Schema):
    """Schema para docente"""
    id = fields.Int()
    usuario_id = fields.Int(required=True)
    codigo_docente = fields.Str(required=True)
    especialidad = fields.Str()
    activo = fields.Bool()
    usuario = fields.Nested(UserSchema)

# ==================== Administrador Schemas ====================
class AdministradorSchema(Schema):
    """Schema para administrador"""
    id = fields.Int()
    usuario_id = fields.Int(required=True)
    codigo_administrador = fields.Str(required=True)
    cargo = fields.Str()
    nivel_acceso = fields.Str()
    activo = fields.Bool()
    usuario = fields.Nested(UserSchema)

# ==================== Estudiante Schemas ====================
class EstudianteSchema(Schema):
    """Schema para estudiante"""
    id = fields.Int()
    usuario_id = fields.Int(required=True)
    codigo = fields.Str(required=True)
    especialidad_id = fields.Int(required=True)
    usuario = fields.Nested(UserSchema)

# ==================== Oferta Schemas ====================
class OfertaSchema(Schema):
    """Schema para oferta de curso"""
    id = fields.Int()
    curso_id = fields.Int(required=True)
    ciclo_id = fields.Int(required=True)
    docente_id = fields.Int()
    seccion = fields.Str(required=True, validate=validate.Length(max=2))
    cupo_maximo = fields.Int()
    aula = fields.Str()
    horario = fields.Dict()

# ==================== Matrícula Schemas ====================
class MatriculaSchema(Schema):
    """Schema para matrícula"""
    id = fields.Int()
    estudiante_id = fields.Int(required=True)
    oferta_id = fields.Int(required=True)
    ciclo_id = fields.Int(required=True)
    estado = fields.Str(validate=validate.OneOf(['activa', 'retirada', 'inhabilitada']))
    fecha_matricula = fields.DateTime()

# ==================== Nota Schemas ====================
class NotaSchema(Schema):
    """Schema para nota"""
    id = fields.Int()
    matricula_id = fields.Int(required=True)
    pc1 = fields.Float(validate=validate.Range(min=0, max=20), allow_none=True)
    pc2 = fields.Float(validate=validate.Range(min=0, max=20), allow_none=True)
    pc3 = fields.Float(validate=validate.Range(min=0, max=20), allow_none=True)
    ef = fields.Float(validate=validate.Range(min=0, max=20), allow_none=True)
    promedio = fields.Float()
    estado = fields.Str()

class ActualizarNotasSchema(Schema):
    """Schema para actualizar notas"""
    matricula_id = fields.Int(required=True)
    pc1 = fields.Float(validate=validate.Range(min=0, max=20), allow_none=True)
    pc2 = fields.Float(validate=validate.Range(min=0, max=20), allow_none=True)
    pc3 = fields.Float(validate=validate.Range(min=0, max=20), allow_none=True)
    ef = fields.Float(validate=validate.Range(min=0, max=20), allow_none=True)

# ==================== Sílabo Schemas ====================
class SilaboSchema(Schema):
    """Schema para sílabo"""
    id = fields.Int()
    oferta_id = fields.Int(required=True)
    estado = fields.Str()
    contenido = fields.Str()
    archivo_url = fields.Str()
    numero_version = fields.Int()
    fecha_carga = fields.DateTime()
    observaciones = fields.Str()

# ==================== Acta Schemas ====================
class ActaSchema(Schema):
    """Schema para acta"""
    id = fields.Int()
    oferta_id = fields.Int(required=True)
    estado = fields.Str()
    fecha_envio = fields.DateTime()
    fecha_aprobacion = fields.DateTime()
    fecha_consolidacion = fields.DateTime()
    observaciones = fields.Str()
