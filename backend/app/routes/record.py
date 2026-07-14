from flask import Blueprint, jsonify, send_file, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, NotaHistorica, EstudiantePerfil, AuditLog
from app.utils import role_required
from datetime import datetime
from io import BytesIO
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

record_bp = Blueprint('record', __name__)

# Función helper para calcular los KPIs del record de un estudiante
def _calcular_kpis_estudiante(estudiante_id):
    notas = NotaHistorica.query.filter_by(estudiante_id=estudiante_id).all()
    
    # Promedio Ponderado Acumulado (PPA)
    suma_notas_creditos = sum(n.nota_final * n.creditos for n in notas)
    total_creditos_cursados = sum(n.creditos for n in notas)
    ppa = (suma_notas_creditos / total_creditos_cursados) if total_creditos_cursados > 0 else 0.0

    # Créditos aprobados (excluyendo desaprobados repetidos si hubiera)
    aprobados_dict = {}
    for n in notas:
        if n.estado == 'APROBADO':
            aprobados_dict[n.curso_codigo] = max(aprobados_dict.get(n.curso_codigo, 0), n.creditos)
    creditos_aprobados = sum(aprobados_dict.values())
    
    total_plan = 220
    avance = (creditos_aprobados / total_plan) * 100
    
    return {
        'total_plan': total_plan,
        'creditos_aprobados': creditos_aprobados,
        'creditos_pendientes': max(0, total_plan - creditos_aprobados),
        'ppa': round(ppa, 2),
        'avance': round(avance, 2)
    }

@record_bp.route('/mi-record', methods=['GET'])
@jwt_required()
@role_required(['estudiante'])
def mi_record():
    # Obtener el record del estudiante autenticado (REC-EST-001)
    user_id = int(get_jwt_identity())
    notas = NotaHistorica.query.filter_by(estudiante_id=user_id).all()
    
    # Agrupar notas por ciclo
    ciclos = {}
    for n in notas:
        ciclos.setdefault(n.ciclo, []).append(n.to_dict())
        
    kpis = _calcular_kpis_estudiante(user_id)
    return jsonify({
        'kpis': kpis,
        'ciclos': ciclos,
        'cursos_pendientes': [
            {'codigo': 'IS301', 'nombre': 'Desarrollo de Aplicaciones Web', 'creditos': 4},
            {'codigo': 'IS302', 'nombre': 'Base de Datos Avanzada', 'creditos': 3},
            {'codigo': 'IS303', 'nombre': 'Redes y Comunicaciones', 'creditos': 3}
        ]
    }), 200

@record_bp.route('/estudiante/<int:estudiante_id>', methods=['GET'])
@jwt_required()
@role_required(['administrador', 'direccion'])
def obtener_record_estudiante(estudiante_id):
    # Ver record de cualquier alumno (REC-ADM-001)
    notas = NotaHistorica.query.filter_by(estudiante_id=estudiante_id).all()
    ciclos = {}
    for n in notas:
        ciclos.setdefault(n.ciclo, []).append(n.to_dict())
        
    kpis = _calcular_kpis_estudiante(estudiante_id)
    
    # Registro de auditoría cada vez que admin genera/ve el record
    admin_id = int(get_jwt_identity())
    admin_user = User.query.get(admin_id)
    db.session.add(AuditLog(
        user_id=admin_id, username=admin_user.username, action='RECORD_VIEW_ADMIN',
        ip_address=request.remote_addr, details=f'Consultó el record académico del estudiante id: {estudiante_id}.'
    ))
    db.session.commit()

    return jsonify({
        'kpis': kpis,
        'ciclos': ciclos
    }), 200

@record_bp.route('/estudiante/<int:estudiante_id>/pdf', methods=['GET'])
def descargar_record_pdf(estudiante_id):
    # Descargar record en PDF con QR (REC-EST-001, REC-ADM-001)
    estudiante = User.query.get_or_404(estudiante_id)
    perfil = EstudiantePerfil.query.filter_by(user_id=estudiante_id).first()
    notas = NotaHistorica.query.filter_by(estudiante_id=estudiante_id).order_by(NotaHistorica.ciclo.asc()).all()
    kpis = _calcular_kpis_estudiante(estudiante_id)

    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []

    # Estilos de reportlab
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, leading=20, alignment=1, textColor=colors.HexColor('#002f6c'))
    subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, alignment=1)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9)
    bold_style = ParagraphStyle('Bold', parent=body_style, fontName='Helvetica-Bold')

    # Encabezado
    story.append(Paragraph("<b>UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ</b>", title_style))
    story.append(Paragraph("Facultad de Ingeniería de Sistemas — Record Académico Consolidado", subtitle_style))
    story.append(Spacer(1, 15))

    # Info Alumno
    info_data = [
        [Paragraph("<b>Código:</b>", body_style), Paragraph(estudiante.username, body_style), Paragraph("<b>Estudiante:</b>", body_style), Paragraph(estudiante.name, body_style)],
        [Paragraph("<b>Facultad:</b>", body_style), Paragraph(perfil.facultad if perfil else "Sistemas", body_style), Paragraph("<b>Especialidad:</b>", body_style), Paragraph(perfil.escuela if perfil else "Sistemas", body_style)],
        [Paragraph("<b>PPA:</b>", body_style), Paragraph(str(kpis['ppa']), body_style), Paragraph("<b>Aprobados:</b>", body_style), Paragraph(f"{kpis['creditos_aprobados']} / {kpis['total_plan']} Cr ({kpis['avance']}%)", body_style)]
    ]
    t_info = Table(info_data, colWidths=[80, 160, 80, 200])
    t_info.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dbe2e8')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f4f6f9')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#f4f6f9')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 15))

    # Historial de Cursos
    story.append(Paragraph("<b>Historial de Calificaciones</b>", ParagraphStyle('H', parent=styles['Heading2'], fontSize=11, textColor=colors.HexColor('#002f6c'))))
    story.append(Spacer(1, 5))

    table_data = [[
        Paragraph("<b>Ciclo</b>", bold_style),
        Paragraph("<b>Código</b>", bold_style),
        Paragraph("<b>Curso / Asignatura</b>", bold_style),
        Paragraph("<b>Créditos</b>", bold_style),
        Paragraph("<b>Nota</b>", bold_style),
        Paragraph("<b>Estado</b>", bold_style)
    ]]
    for n in notas:
        table_data.append([
            Paragraph(n.ciclo, body_style),
            Paragraph(n.curso_codigo, body_style),
            Paragraph(n.curso_nombre, body_style),
            Paragraph(str(n.creditos), body_style),
            Paragraph(str(n.nota_final), body_style),
            Paragraph(n.estado, body_style)
        ])

    t_hist = Table(table_data, colWidths=[60, 60, 240, 50, 50, 60])
    t_hist.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dbe2e8')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f4f6f9')),
        ('ALIGN', (3,0), (4,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_hist)
    story.append(Spacer(1, 20))

    # QR de validación
    verif_url = f"http://localhost:5000/api/record/verificar/{estudiante.username}"
    qr = qrcode.QRCode(version=1, box_size=3, border=1)
    qr.add_data(verif_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
        temp_path = temp_file.name
        qr_img.save(temp_path, format='PNG')
        
    flowable_qr = Image(temp_path, width=70, height=70)
    
    pie_data = [
        [Paragraph("Este documento es un reporte consolidado emitido electrónicamente y respaldado por el área de Dirección Académica de la UNCP.", ParagraphStyle('Pie', parent=body_style, fontSize=7, textColor=colors.HexColor('#7f8c8d'))), flowable_qr]
    ]
    t_pie = Table(pie_data, colWidths=[440, 80])
    t_pie.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(t_pie)

    doc.build(story)
    
    try:
        os.remove(temp_path)
    except Exception:
        pass
        
    pdf_buffer.seek(0)
    
    return send_file(pdf_buffer, mimetype='application/pdf', download_name=f"Record_Academico_{estudiante.username}.pdf")

@record_bp.route('/reportes', methods=['GET'])
@jwt_required()
@role_required(['administrador'])
def reportes_consolidados():
    # Reportes consolidados masivos (REC-ADM-001)
    tipo = request.args.get('tipo', 'egreso') # 'egreso' o 'riesgo'
    
    estudiantes = User.query.filter_by(role='estudiante').all()
    resultado = []
    
    for est in estudiantes:
        kpis = _calcular_kpis_estudiante(est.id)
        perfil = EstudiantePerfil.query.filter_by(user_id=est.id).first()
        
        item = {
            'id': est.id,
            'codigo': est.username,
            'nombre': est.name,
            'especialidad': perfil.escuela if perfil else 'Sistemas',
            'creditos_aprobados': kpis['creditos_aprobados'],
            'ppa': kpis['ppa'],
            'estado': perfil.estado_academico if perfil else 'activo',
            'avance': kpis['avance']
        }
        
        # Filtros de reportes
        if tipo == 'egreso':
            # Aptos para egreso: créditos aprobados altos (ej. en este mock > 10)
            if kpis['creditos_aprobados'] >= 10:
                resultado.append(item)
        elif tipo == 'riesgo':
            # Estudiantes en riesgo: PPA < 11 o que tengan cursos desaprobados
            historico = NotaHistorica.query.filter_by(estudiante_id=est.id, estado='DESAPROBADO').first()
            if kpis['ppa'] < 11 or historico:
                resultado.append(item)
                
    return jsonify(resultado), 200

@record_bp.route('/direccion/cohorte', methods=['GET'])
@jwt_required()
@role_required(['direccion'])
def analisis_cohorte():
    # Análisis de cohorte para Dirección (REC-DIR-001)
    anio = request.args.get('ingreso', '2022-I')
    
    # KPIs simulados para representar cohortes
    return jsonify({
        'ingresantes_original': 120,
        'activos_actuales': 95,
        'egresados': 15,
        'retirados_abandonos': 10,
        'tasa_retencion': 91.6,
        'tasa_egreso': 12.5,
        'ppa_promedio': 14.12,
        'distribucion_ppa': {
            '0-10': 3,
            '10-13': 28,
            '13-16': 55,
            '16-20': 34
        },
        'evolucion_matriculados': {
            '2022-I': 120,
            '2022-II': 118,
            '2023-I': 115,
            '2023-II': 110,
            '2024-I': 105,
            '2024-II': 102,
            '2025-I': 98,
            '2025-II': 95
        }
    }), 200
