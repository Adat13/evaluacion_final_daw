from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Estudiante, Matricula, Nota, CicloAcademico
from app.schemas import NotaSchema
from datetime import datetime

estudiante_bp = Blueprint('estudiante', __name__, url_prefix='/api/estudiante')

@estudiante_bp.route('/notas', methods=['GET'])
@jwt_required()
def get_notas_estudiante():
    """Obtener notas del estudiante por ciclo académico"""
    user_id = int(get_jwt_identity())
    
    # Obtener estudiante
    estudiante = Estudiante.query.filter_by(usuario_id=user_id).first()
    if not estudiante:
        return {'error': 'No eres un estudiante'}, 403
    
    # Obtener ciclo académico (parámetro opcional)
    ciclo_id = request.args.get('ciclo_id', type=int)
    
    # Obtener ciclo académico actual si no se especifica
    if not ciclo_id:
        ciclo = CicloAcademico.query.filter_by(activo=True).first()
        if ciclo:
            ciclo_id = ciclo.id
    
    # Obtener matrículas del estudiante
    query = Matricula.query.filter_by(estudiante_id=estudiante.id)
    
    if ciclo_id:
        query = query.filter_by(ciclo_id=ciclo_id)
    
    matriculas = query.all()
    
    # Construir respuesta
    notas_data = []
    total_creditos = 0
    creditos_aprobados = 0
    suma_ponderada = 0
    creditos_evaluados = 0

    for matricula in matriculas:
        # Verificar que el acta está consolidada
        acta = matricula.oferta.acta
        if acta and acta.estado != 'CONSOLIDADA':
            estado_nota = 'PENDIENTE_PUBLICACION'
            nota_dict = {
                'pc1': None, 'pc2': None, 'pc3': None, 'ef': None,
                'promedio': None, 'estado': estado_nota
            }
        else:
            nota = Nota.query.filter_by(matricula_id=matricula.id).first()
            nota_dict = NotaSchema().dump(nota) if nota else {
                'pc1': None, 'pc2': None, 'pc3': None, 'ef': None,
                'promedio': None, 'estado': 'PENDIENTE'
            }
            estado_nota = nota_dict.get('estado', 'PENDIENTE')

        notas_data.append({
            'codigo_curso': matricula.oferta.curso.codigo,
            'nombre_curso': matricula.oferta.curso.nombre,
            'creditos': matricula.oferta.curso.creditos,
            'nota': nota_dict
        })

        # Calcular totales
        total_creditos += matricula.oferta.curso.creditos
        if estado_nota == 'APROBADO':
            creditos_aprobados += matricula.oferta.curso.creditos
        if nota_dict.get('promedio') is not None:
            suma_ponderada += nota_dict['promedio'] * matricula.oferta.curso.creditos
            creditos_evaluados += matricula.oferta.curso.creditos

    promedio_ponderado = round(suma_ponderada / creditos_evaluados, 2) if creditos_evaluados > 0 else 0

    return jsonify({
        'ciclo_id': ciclo_id,
        'notas': notas_data,
        'resumen': {
            'total_creditos': total_creditos,
            'creditos_aprobados': creditos_aprobados,
            'promedio_ponderado': promedio_ponderado
        }
    }), 200
