from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import (
    User, Curso, Oferta, Docente, Acta, CicloAcademico, 
    Matricula, Nota, Facultad, Especialidad
)
from sqlalchemy import func

direccion_bp = Blueprint('direccion', __name__, url_prefix='/api/direccion')

@direccion_bp.route('/cursos/supervision', methods=['GET'])
@jwt_required()
def supervision_academica():
    """Obtener indicadores de supervisión académica"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'direccion':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    ciclo_id = request.args.get('ciclo_id', type=int)
    facultad_id = request.args.get('facultad_id', type=int)
    especialidad_id = request.args.get('especialidad_id', type=int)
    
    # Obtener ciclo académico
    if not ciclo_id:
        ciclo = CicloAcademico.query.filter_by(activo=True).first()
        if ciclo:
            ciclo_id = ciclo.id
    
    # Consultas base
    ofertas_query = Oferta.query
    if ciclo_id:
        ofertas_query = ofertas_query.filter_by(ciclo_id=ciclo_id)
    if facultad_id:
        ofertas_query = ofertas_query.join(Curso).filter_by(facultad_id=facultad_id)
    
    ofertas = ofertas_query.all()
    
    # Calcular indicadores
    total_cursos = len(ofertas)
    cursos_con_docente = sum(1 for o in ofertas if o.docente_id)
    silabos_cargados = sum(1 for o in ofertas if o.silabo and o.silabo.estado in ['CARGADO', 'APROBADO'])
    silabos_aprobados = sum(1 for o in ofertas if o.silabo and o.silabo.estado == 'APROBADO')
    
    # Carga docente
    docentes_carga = {}
    for oferta in ofertas:
        if oferta.docente:
            if oferta.docente.id not in docentes_carga:
                docentes_carga[oferta.docente.id] = {
                    'nombre': f"{oferta.docente.usuario.nombres} {oferta.docente.usuario.apellidos}",
                    'total_cursos': 0,
                    'total_creditos': 0,
                    'total_horas': 0
                }
            docentes_carga[oferta.docente.id]['total_cursos'] += 1
            docentes_carga[oferta.docente.id]['total_creditos'] += oferta.curso.creditos
            # Calcular horas (aproximado: 2 horas por crédito)
            docentes_carga[oferta.docente.id]['total_horas'] += oferta.curso.creditos * 2
    
    carga_docentes = list(docentes_carga.values())
    
    # Cursos sin docente
    cursos_sin_docente = []
    for oferta in ofertas:
        if not oferta.docente:
            cursos_sin_docente.append({
                'codigo': oferta.curso.codigo,
                'nombre': oferta.curso.nombre,
                'seccion': oferta.seccion
            })
    
    # Indicadores
    indicadores = {
        'porcentaje_cursos_con_oferta': round((total_cursos / len(Curso.query.all()) * 100), 2) if len(Curso.query.all()) > 0 else 0,
        'porcentaje_secciones_con_docente': round((cursos_con_docente / total_cursos * 100), 2) if total_cursos > 0 else 0,
        'porcentaje_sylabos_cargados': round((silabos_cargados / total_cursos * 100), 2) if total_cursos > 0 else 0,
        'porcentaje_sylabos_aprobados': round((silabos_aprobados / total_cursos * 100), 2) if total_cursos > 0 else 0,
    }
    
    return jsonify({
        'ciclo_id': ciclo_id,
        'indicadores': indicadores,
        'carga_docentes': carga_docentes,
        'cursos_sin_docente': cursos_sin_docente,
        'total_cursos': total_cursos
    }), 200

@direccion_bp.route('/notas/indicadores', methods=['GET'])
@jwt_required()
def indicadores_academicos():
    """Obtener indicadores académicos de rendimiento"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.rol != 'direccion':
        return {'error': 'No tienes permisos para acceder a esta sección'}, 403
    
    ciclo_id = request.args.get('ciclo_id', type=int)
    facultad_id = request.args.get('facultad_id', type=int)
    especialidad_id = request.args.get('especialidad_id', type=int)
    
    # Obtener ciclo académico
    if not ciclo_id:
        ciclo = CicloAcademico.query.filter_by(activo=True).first()
        if ciclo:
            ciclo_id = ciclo.id
    
    # Obtener notas
    notas_query = Nota.query
    if ciclo_id:
        notas_query = notas_query.join(Matricula).filter_by(ciclo_id=ciclo_id)
    
    notas = notas_query.all()
    
    total_notas = len(notas)
    aprobados = sum(1 for n in notas if n.promedio and n.promedio >= 10.5)
    desaprobados = sum(1 for n in notas if n.promedio and n.promedio < 10.5)
    
    tasa_aprobacion = (aprobados / total_notas * 100) if total_notas > 0 else 0
    tasa_desaprobacion = (desaprobados / total_notas * 100) if total_notas > 0 else 0
    
    promedio_institucional = sum(n.promedio for n in notas if n.promedio) / total_notas if total_notas > 0 else 0
    
    # Actas consolidadas
    actas_consolidadas = Acta.query.filter_by(estado='CONSOLIDADA').count()
    actas_pendientes = Acta.query.filter(Acta.estado != 'CONSOLIDADA').count()
    
    return jsonify({
        'ciclo_id': ciclo_id,
        'indicadores': {
            'tasa_aprobacion': round(tasa_aprobacion, 2),
            'tasa_desaprobacion': round(tasa_desaprobacion, 2),
            'promedio_institucional': round(promedio_institucional, 2),
            'actas_consolidadas': actas_consolidadas,
            'actas_pendientes': actas_pendientes,
            'total_estudiantes_evaluados': total_notas
        }
    }), 200
