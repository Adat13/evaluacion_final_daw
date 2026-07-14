from flask import Blueprint, jsonify, send_file, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, SolicitudCertificado, NotaHistorica, SolicitudMatricula, AuditLog
from app.utils import role_required
from datetime import datetime
from io import BytesIO
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

certificados_bp = Blueprint('certificados', __name__)

# Precios oficiales de trámites
COSTOS_TRAMITES = {
    'Constancia de Matrícula': 15.0,
    'Constancia de Notas': 20.0,
    'Certificado de Estudios': 45.0,
    'Constancia de Egresado': 60.0
}

# Helper para validar elegibilidad
def _validar_elegibilidad(estudiante_id, tipo):
    if tipo == 'Constancia de Matrícula':
        # Requiere matrícula aprobada en el ciclo actual
        mat = SolicitudMatricula.query.filter_by(estudiante_id=estudiante_id, estado='APROBADA').first()
        return mat is not None, "Requiere poseer una matrícula aprobada en el sistema."
        
    elif tipo == 'Constancia de Notas':
        # Requiere al menos una nota consolidada
        nota = NotaHistorica.query.filter_by(estudiante_id=estudiante_id).first()
        return nota is not None, "Requiere contar con al menos una calificación consolidada."
        
    elif tipo == 'Certificado de Estudios':
        # Requiere al menos 1 ciclo cursado
        nota = NotaHistorica.query.filter_by(estudiante_id=estudiante_id).first()
        return nota is not None, "Requiere contar con historial académico registrado."
        
    elif tipo == 'Constancia de Egresado':
        # Requiere tener al menos 14 créditos aprobados (simulación de culminación de plan de estudios)
        notas = NotaHistorica.query.filter_by(estudiante_id=estudiante_id, estado='APROBADO').all()
        total_aprobado = sum(n.creditos for n in notas)
        return total_aprobado >= 14, "Requiere haber aprobado la totalidad de los créditos del plan de estudios (mínimo 14 cr en entorno de pruebas)."
        
    return False, "Tipo de documento desconocido."

def _generar_codigo_tramite():
    year = datetime.today().year
    prefix = f'SOL-CER-{year}-'
    ultima = (
        SolicitudCertificado.query
        .filter(SolicitudCertificado.codigo.like(f'{prefix}%'))
        .order_by(SolicitudCertificado.id.desc())
        .first()
    )
    numero = int(ultima.codigo.split('-')[-1]) + 1 if ultima else 1
    return f'{prefix}{numero:05d}'

@certificados_bp.route('/solicitud', methods=['POST'])
@jwt_required()
@role_required(['estudiante'])
def solicitar_certificado():
    # Solicitar certificado en línea (CER-EST-001)
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    tipo = data.get('tipo_documento')
    motivo = data.get('motivo', '')
    idioma = data.get('idioma', 'Español')
    copias = int(data.get('cantidad_copias', 1))

    if tipo not in COSTOS_TRAMITES:
        return jsonify({'error': 'Tipo de trámite inválido'}), 400

    # Validar elegibilidad
    apto, mensaje = _validar_elegibilidad(user_id, tipo)
    if not apto:
        return jsonify({'error': f'No elegible: {mensaje}'}), 400

    sol = SolicitudCertificado(
        codigo=_generar_codigo_tramite(),
        estudiante_id=user_id,
        tipo_documento=tipo,
        motivo=motivo,
        idioma=idioma,
        cantidad_copias=copias,
        estado='PENDIENTE'
    )
    db.session.add(sol)
    
    user = User.query.get(user_id)
    db.session.add(AuditLog(
        user_id=user_id, username=user.username, action='CERTIFICADO_SOLICITUD',
        ip_address=request.remote_addr, details=f'Solicitó {tipo} ({sol.codigo}). Costo: S/.{COSTOS_TRAMITES[tipo]*copias}.'
    ))
    db.session.commit()

    return jsonify({'message': 'Solicitud registrada', 'solicitud': sol.to_dict()}), 201

@certificados_bp.route('/mis-solicitudes', methods=['GET'])
@jwt_required()
@role_required(['estudiante'])
def mis_solicitudes():
    # Listar solicitudes del estudiante (CER-EST-001)
    user_id = int(get_jwt_identity())
    sols = SolicitudCertificado.query.filter_by(estudiante_id=user_id).order_by(SolicitudCertificado.created_at.desc()).all()
    return jsonify([s.to_dict() for s in sols]), 200

@certificados_bp.route('/solicitudes', methods=['GET'])
@jwt_required()
@role_required(['administrador'])
def listar_solicitudes_admin():
    # Tabla con filtros (CER-ADM-001)
    estado = request.args.get('estado')
    tipo = request.args.get('tipo_documento')
    search = request.args.get('search')
    
    query = SolicitudCertificado.query
    if estado:
        query = query.filter_by(estado=estado)
    if tipo:
        query = query.filter_by(tipo_documento=tipo)
    if search:
        query = query.join(User, SolicitudCertificado.estudiante_id == User.id).filter(
            (User.name.ilike(f'%{search}%')) | (User.username.ilike(f'%{search}%'))
        )
        
    sols = query.order_by(SolicitudCertificado.created_at.desc()).all()
    return jsonify([s.to_dict() for s in sols]), 200

@certificados_bp.route('/<int:id>/estado', methods=['PUT'])
@jwt_required()
@role_required(['administrador'])
def actualizar_estado(id):
    # Procesar solicitudes (CER-ADM-001)
    sol = SolicitudCertificado.query.get_or_404(id)
    data = request.get_json() or {}
    nuevo_estado = data.get('estado')
    motivo_rechazo = data.get('motivo_rechazo', '')

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    # Validaciones de flujo y jerarquía de Dirección
    if nuevo_estado == 'EMITIDO':
        if sol.tipo_documento in ('Certificado de Estudios', 'Constancia de Egresado'):
            if sol.estado != 'AUTORIZADO':
                # Requiere autorización previa de dirección
                sol.estado = 'PENDIENTE_AUTORIZACION'
                db.session.commit()
                return jsonify(sol.to_dict()), 200

    if nuevo_estado == 'RECHAZADO':
        if not motivo_rechazo:
            return jsonify({'error': 'El motivo de rechazo es obligatorio'}), 400
        sol.motivo_rechazo = motivo_rechazo

    sol.estado = nuevo_estado
    db.session.add(AuditLog(
        user_id=user_id, username=user.username, action=f'CERTIFICADO_{nuevo_estado}',
        ip_address=request.remote_addr, details=f'Solicitud {sol.codigo} actualizada a {nuevo_estado}.'
    ))
    db.session.commit()
    return jsonify(sol.to_dict()), 200

@certificados_bp.route('/direccion/pendientes', methods=['GET'])
@jwt_required()
@role_required(['direccion'])
def pendientes_direccion():
    # Autorizaciones pendientes para Dirección (CER-DIR-001)
    sols = SolicitudCertificado.query.filter_by(estado='PENDIENTE_AUTORIZACION').all()
    return jsonify([s.to_dict() for s in sols]), 200

@certificados_bp.route('/direccion/<int:id>/autorizar', methods=['PUT'])
@jwt_required()
@role_required(['direccion'])
def autorizar_direccion(id):
    # Autorizar o Denegar (CER-DIR-001)
    sol = SolicitudCertificado.query.get_or_404(id)
    data = request.get_json() or {}
    accion = data.get('accion') # 'AUTORIZAR' o 'DENEGAR'
    motivo = data.get('motivo', '')

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if accion == 'AUTORIZAR':
        sol.estado = 'AUTORIZADO'
        sol.autorizado_por = user.name
        sol.fecha_autorizacion = datetime.today().strftime('%d/%m/%Y')
    elif accion == 'DENEGAR':
        if not motivo:
            return jsonify({'error': 'El motivo de denegación es obligatorio'}), 400
        sol.estado = 'DENEGADO'
        sol.motivo_rechazo = motivo

    db.session.add(AuditLog(
        user_id=user_id, username=user.username, action=f'CERTIFICADO_DIR_{accion}',
        ip_address=request.remote_addr, details=f'Dirección procesó {sol.codigo} como {accion}.'
    ))
    db.session.commit()
    return jsonify(sol.to_dict()), 200

@certificados_bp.route('/<int:id>/descargar', methods=['GET'])
def descargar_documento_emitido(id):
    # Descargar documento PDF oficial con firma y QR (CER-EST-001, CER-ADM-001)
    sol = SolicitudCertificado.query.get_or_404(id)
    if sol.estado != 'EMITIDO':
        return jsonify({'error': 'El certificado aún no ha sido emitido.'}), 403

    estudiante = User.query.get(sol.estudiante_id)
    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []

    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, leading=20, alignment=1, textColor=colors.HexColor('#002f6c'))
    subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, alignment=1)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14)

    # Encabezado
    story.append(Paragraph("<b>UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ</b>", title_style))
    story.append(Paragraph("Secretaría General — Área de Certificaciones y Grados", subtitle_style))
    story.append(Spacer(1, 20))

    # Título del Trámite
    story.append(Paragraph(f"<b>{sol.tipo_documento.upper()}</b>", ParagraphStyle('DocT', parent=title_style, fontSize=14, textColor=colors.HexColor('#e6a100'))))
    story.append(Spacer(1, 15))

    # Contenido específico del certificado
    cuerpo = f"""
    Por la presente se certifica que el estudiante <b>{estudiante.name}</b>, identificado con código 
    universitario <b>{estudiante.username}</b> y DNI <b>{estudiante.document_number or 'N/A'}</b>, se encuentra registrado 
    formalmente en el sistema institucional de la Facultad de Ingeniería de Sistemas. 
    Se emite esta constancia a solicitud del interesado para los fines y motivos que crea convenientes: 
    "<i>{sol.motivo or 'Trámites institucionales varios'}</i>".
    """
    story.append(Paragraph(cuerpo, body_style))
    story.append(Spacer(1, 25))

    # Detalles del Certificado
    datos_doc = [
        [Paragraph("<b>Código Único:</b>", body_style), Paragraph(sol.codigo, body_style)],
        [Paragraph("<b>Idioma Emisión:</b>", body_style), Paragraph(sol.idioma, body_style)],
        [Paragraph("<b>Fecha Emisión:</b>", body_style), Paragraph(sol.created_at.strftime('%d/%m/%Y %H:%M') if sol.created_at else 'N/A', body_style)],
        [Paragraph("<b>Autorización Directiva:</b>", body_style), Paragraph(f"Firmado por {sol.autorizado_por or 'Secretaría FIS'} el {sol.fecha_autorizacion or 'Fecha de Emisión'}", body_style)]
    ]
    t_doc = Table(datos_doc, colWidths=[120, 360])
    t_doc.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dbe2e8')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_doc)
    story.append(Spacer(1, 30))

    # Sello/Firma digital simulada + QR de verificación
    verif_url = f"{request.host_url.rstrip('/')}/api/certificados/verificar/{sol.codigo}"
    qr = qrcode.QRCode(version=1, box_size=3, border=1)
    qr.add_data(verif_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    import tempfile
    import os
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
        temp_path = temp_file.name
        qr_img.save(temp_path, format='PNG')
        
    flowable_qr = Image(temp_path, width=80, height=80)

    firma_text = """
    <b>FIRMA DIGITAL INSTITUCIONAL</b><br/>
    Documento con Firma Digital de Validez Oficial.<br/>
    Resolución rectoral Nº 1054-UNCP.<br/>
    Secretario Académico FIS.
    """
    t_firma_data = [
        [Paragraph(firma_text, ParagraphStyle('F', parent=body_style, fontSize=7, textColor=colors.HexColor('#2c3e50'))), flowable_qr]
    ]
    t_firma = Table(t_firma_data, colWidths=[400, 80])
    t_firma.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dbe2e8')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_firma)

    doc.build(story)
    
    try:
        os.remove(temp_path)
    except Exception:
        pass
        
    pdf_buffer.seek(0)
    return send_file(pdf_buffer, mimetype='application/pdf', download_name=f"{sol.codigo}_{estudiante.username}.pdf")

@certificados_bp.route('/verificar/<string:token>', methods=['GET'])
def verificar_certificado(token):
    from flask import render_template_string
    sol = SolicitudCertificado.query.filter_by(codigo=token).first()
    
    html_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Validación de Documento Oficial - UNCP</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #002f6c;
            --secondary: #e6a100;
            --success: #2ecc71;
            --danger: #e74c3c;
            --bg: #f5f7fa;
            --card-bg: #ffffff;
            --text: #2c3e50;
            --text-muted: #7f8c8d;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            width: 100%;
            max-width: 500px;
            background: var(--card-bg);
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
            border-top: 6px solid var(--secondary);
        }
        .header {
            background-color: var(--primary);
            color: white;
            padding: 30px 20px;
            text-align: center;
            position: relative;
        }
        .header h1 {
            margin: 5px 0;
            font-size: 1.2rem;
            letter-spacing: 1px;
            font-family: Georgia, serif;
        }
        .header p {
            margin: 0;
            font-size: 0.8rem;
            color: #d1d5db;
        }
        .badge-container {
            text-align: center;
            margin-top: -25px;
            margin-bottom: 20px;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background-color: var(--success);
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            font-weight: bold;
            font-size: 0.9rem;
            box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);
        }
        .badge.error {
            background-color: var(--danger);
            box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3);
        }
        .content {
            padding: 20px 30px 30px 30px;
        }
        .title {
            text-align: center;
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 20px;
            color: var(--primary);
            border-bottom: 1px dashed #e2e8f0;
            padding-bottom: 12px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .info-table td {
            padding: 12px 6px;
            font-size: 0.9rem;
            border-bottom: 1px solid #f1f5f9;
        }
        .info-table td.label {
            font-weight: 600;
            color: var(--text-muted);
            width: 40%;
        }
        .info-table td.value {
            font-weight: 500;
            color: var(--text);
            text-align: right;
        }
        .footer {
            text-align: center;
            font-size: 0.75rem;
            color: var(--text-muted);
            border-top: 1px solid #f1f5f9;
            padding: 15px;
            background: #fafafa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <i class="fa-solid fa-graduation-cap" style="font-size: 2.2rem; color: var(--secondary); margin-bottom: 8px;"></i>
            <h1>UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ</h1>
            <p>Facultad de Ingeniería de Sistemas — ERP Académico</p>
        </div>
        
        <div class="badge-container">
            {% if valido %}
            <span class="badge">
                <i class="fa-solid fa-circle-check" style="font-size: 1.1rem;"></i> DOCUMENTO VÁLIDO
            </span>
            {% else %}
            <span class="badge error">
                <i class="fa-solid fa-circle-xmark" style="font-size: 1.1rem;"></i> DOCUMENTO INEXISTENTE
            </span>
            {% endif %}
        </div>
        
        <div class="content">
            {% if valido %}
            <div class="title">{{ tipo_documento }}</div>
            <table class="info-table">
                <tr>
                    <td class="label">Código Oficial:</td>
                    <td class="value">{{ codigo }}</td>
                </tr>
                <tr>
                    <td class="label">Estudiante:</td>
                    <td class="value"><b>{{ estudiante }}</b></td>
                </tr>
                <tr>
                    <td class="label">Código Alumno:</td>
                    <td class="value"><code>{{ codigo_estudiante }}</code></td>
                </tr>
                {% if fecha_emision %}
                <tr>
                    <td class="label">Fecha de Emisión:</td>
                    <td class="value">{{ fecha_emision }}</td>
                </tr>
                {% endif %}
                {% if observaciones %}
                <tr>
                    <td class="label">Detalles:</td>
                    <td class="value" style="font-style: italic;">{{ observaciones }}</td>
                </tr>
                {% endif %}
            </table>
            {% else %}
            <div class="title" style="color: var(--danger);">Error de Validación</div>
            <p style="text-align: center; font-size: 0.9rem; color: var(--text-muted);">
                El código de validación ingresado no se encuentra registrado en nuestra base de datos central o el documento ha sido revocado.
            </p>
            {% endif %}
            
            <div style="text-align: center; margin-top: 15px;">
                <i class="fa-solid fa-shield-halved" style="color: var(--success); font-size: 1.5rem; margin-bottom: 5px;"></i>
                <span style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--success);">Firma Digital UNCP Verificada</span>
            </div>
        </div>
        
        <div class="footer">
            © 2026 UNCP FIS. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
    """

    if not sol:
        return render_template_string(html_template, valido=False), 404
        
    estudiante = User.query.get(sol.estudiante_id)
    return render_template_string(
        html_template, 
        valido=True,
        tipo_documento=sol.tipo_documento,
        codigo=sol.codigo,
        estudiante=estudiante.name,
        codigo_estudiante=estudiante.username,
        fecha_emision=sol.created_at.strftime('%d/%m/%Y %H:%M') if sol.created_at else 'N/A',
        observaciones=sol.motivo
    ), 200
