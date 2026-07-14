from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import (
    db, User, AuditLog, PeriodoMatricula, EstudiantePerfil,
    Curso, SolicitudMatricula, DetalleSolicitud
)
from app.utils import role_required

matricula_bp = Blueprint('matricula', __name__)

ESTADOS_BLOQUEANTES = ('PENDIENTE', 'APROBADA')


def _get_estudiante(user_id):
    user = User.query.get(user_id)
    if not user or user.role != 'estudiante':
        return None, None
    perfil = EstudiantePerfil.query.filter_by(user_id=user_id).first()
    return user, perfil


def _get_periodo_activo():
    return PeriodoMatricula.query.filter_by(activo=True).first()


def _horarios_se_solapan(curso_a, curso_b):
    dias_a = set(curso_a.dia_semana.split(','))
    dias_b = set(curso_b.dia_semana.split(','))
    if not dias_a.intersection(dias_b):
        return False
    return curso_a.hora_inicio < curso_b.hora_fin and curso_b.hora_inicio < curso_a.hora_fin


def _generar_codigo_solicitud():
    year = date.today().year
    prefix = f'MAT-{year}-'
    ultima = (
        SolicitudMatricula.query
        .filter(SolicitudMatricula.codigo.like(f'{prefix}%'))
        .order_by(SolicitudMatricula.id.desc())
        .first()
    )
    if ultima:
        try:
            numero = int(ultima.codigo.split('-')[-1]) + 1
        except ValueError:
            numero = 1
    else:
        numero = 1
    return f'{prefix}{numero:05d}'


def _tiene_solicitud_activa(estudiante_id, periodo_id):
    return SolicitudMatricula.query.filter(
        SolicitudMatricula.estudiante_id == estudiante_id,
        SolicitudMatricula.periodo_id == periodo_id,
        SolicitudMatricula.estado.in_(ESTADOS_BLOQUEANTES),
    ).first()


def _evaluar_pre_check(user_id, perfil, periodo):
    hoy = date.today()
    periodo_abierto = bool(
        periodo and periodo.activo and periodo.fecha_inicio <= hoy <= periodo.fecha_fin
    )
    cuenta_activa = bool(perfil and perfil.estado_academico == 'activo')
    solicitud_duplicada = bool(
        periodo and _tiene_solicitud_activa(user_id, periodo.id)
    )
    puede_matricularse = periodo_abierto and cuenta_activa and not solicitud_duplicada
    return {
        'puede_matricularse': puede_matricularse,
        'periodo_abierto': periodo_abierto,
        'cuenta_activa': cuenta_activa,
        'solicitud_duplicada': solicitud_duplicada,
    }


def _evaluar_validaciones(perfil, periodo):
    items = [
        {
            'id': 'deudas',
            'nombre': 'Sin deudas pendientes',
            'descripcion': 'No debes tener pagos pendientes con la universidad.',
            'aprobado': not perfil.tiene_deudas,
        },
        {
            'id': 'estado',
            'nombre': 'Estado académico activo',
            'descripcion': 'Tu condición de estudiante debe estar activa.',
            'aprobado': perfil.estado_academico == 'activo',
        },
        {
            'id': 'periodo',
            'nombre': 'Periodo de matrícula vigente',
            'descripcion': 'La ventana de matrícula debe estar abierta.',
            'aprobado': periodo is not None,
        },
    ]
    return items, all(item['aprobado'] for item in items)


@matricula_bp.route('/pre-check', methods=['GET'])
@jwt_required()
@role_required(['estudiante'])
def pre_check():
    user_id = int(get_jwt_identity())
    user, perfil = _get_estudiante(user_id)
    periodo = _get_periodo_activo()
    resultado = _evaluar_pre_check(user_id, perfil, periodo)

    return jsonify({
        **resultado,
        'periodo': periodo.to_dict() if periodo else None,
        'mensaje': (
            'Puedes iniciar tu matrícula.'
            if resultado['puede_matricularse']
            else 'No cumples las condiciones para matricularte en este momento.'
        ),
    }), 200


@matricula_bp.route('/mi-datos', methods=['GET'])
@jwt_required()
@role_required(['estudiante'])
def mi_datos():
    user_id = int(get_jwt_identity())
    user, perfil = _get_estudiante(user_id)
    periodo = _get_periodo_activo()

    if not perfil:
        return jsonify({'error': 'Perfil académico no encontrado'}), 404

    return jsonify({
        'codigo': user.username,
        'nombre_completo': user.name,
        'email': user.email,
        'documento': f"{user.document_type} - {user.document_number}",
        'telefono': user.phone,
        'facultad': perfil.facultad,
        'escuela': perfil.escuela,
        'ciclo_ingreso': perfil.ciclo_ingreso,
        'ciclo_matricula': periodo.ciclo if periodo else 'N/A',
    }), 200


@matricula_bp.route('/validaciones', methods=['GET'])
@jwt_required()
@role_required(['estudiante'])
def validaciones():
    user_id = int(get_jwt_identity())
    _, perfil = _get_estudiante(user_id)

    if not perfil:
        return jsonify({'error': 'Perfil académico no encontrado'}), 404

    periodo = _get_periodo_activo()
    items, todas_aprobadas = _evaluar_validaciones(perfil, periodo)

    return jsonify({
        'validaciones': items,
        'todas_aprobadas': todas_aprobadas,
    }), 200


@matricula_bp.route('/cursos-disponibles', methods=['GET'])
@jwt_required()
@role_required(['estudiante'])
def cursos_disponibles():
    user_id = int(get_jwt_identity())
    _, perfil = _get_estudiante(user_id)
    periodo = _get_periodo_activo()

    if not periodo:
        return jsonify({'error': 'No hay periodo de matrícula activo'}), 400

    aprobados = perfil.get_cursos_aprobados() if perfil else []
    cursos = Curso.query.filter_by(periodo_id=periodo.id).all()

    resultado = []
    for curso in cursos:
        cumple_prerrequisito = True
        if curso.prerrequisito_codigo:
            cumple_prerrequisito = curso.prerrequisito_codigo in aprobados

        resultado.append({
            **curso.to_dict(),
            'tiene_cupo': curso.cupos_disponibles > 0,
            'cumple_prerrequisito': cumple_prerrequisito,
            'puede_seleccionar': curso.cupos_disponibles > 0 and cumple_prerrequisito,
        })

    return jsonify(resultado), 200


from flask import send_file
from io import BytesIO
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

@matricula_bp.route('/solicitud', methods=['POST'])
@jwt_required()
@role_required(['estudiante'])
def crear_solicitud():
    # Registrar nueva solicitud de matrícula (MAT-EST-001)
    user_id = int(get_jwt_identity())
    user, perfil = _get_estudiante(user_id)
    periodo = _get_periodo_activo()
    data = request.get_json() or {}

    curso_ids = data.get('curso_ids', [])
    acepto_terminos = data.get('acepto_terminos', False)

    if not perfil or not periodo:
        return jsonify({'error': 'Perfil o periodo no activo'}), 400

    pre = _evaluar_pre_check(user_id, perfil, periodo)
    if not pre['puede_matricularse']:
        return jsonify({'error': 'No puedes matricularte en este momento'}), 403

    _, todas_aprobadas = _evaluar_validaciones(perfil, periodo)
    if not todas_aprobadas or not curso_ids or not acepto_terminos:
        return jsonify({'error': 'No cumple las validaciones u omitió términos'}), 400

    cursos = Curso.query.filter(Curso.id.in_(curso_ids), Curso.periodo_id == periodo.id).all()
    if len(cursos) != len(curso_ids):
        return jsonify({'error': 'Uno o más cursos inválidos'}), 400

    # Validar cruce de horarios y prerrequisitos
    aprobados = perfil.get_cursos_aprobados()
    for curso in cursos:
        if curso.cupos_disponibles <= 0:
            return jsonify({'error': f'Sin vacantes en {curso.nombre}'}), 400
        if curso.prerrequisito_codigo and curso.prerrequisito_codigo not in aprobados:
            return jsonify({'error': f'No cumple prerrequisito {curso.prerrequisito_codigo}'}), 400

    for i, curso_a in enumerate(cursos):
        for curso_b in cursos[i + 1:]:
            if _horarios_se_solapan(curso_a, curso_b):
                return jsonify({'error': f'Cruce entre {curso_a.nombre} y {curso_b.nombre}'}), 400

    creditos_total = sum(c.creditos for c in cursos)
    monto_total = creditos_total * periodo.costo_por_credito

    solicitud = SolicitudMatricula(
        codigo=_generar_codigo_solicitud(),
        estudiante_id=user_id,
        periodo_id=periodo.id,
        estado='PENDIENTE',
        creditos_total=creditos_total,
        monto_total=monto_total,
        acepto_terminos=True
    )
    db.session.add(solicitud)
    db.session.flush()

    for curso in cursos:
        db.session.add(DetalleSolicitud(solicitud_id=solicitud.id, curso_id=curso.id))

    db.session.add(AuditLog(
        user_id=user_id, username=user.username, action='MATRICULA_SOLICITUD',
        ip_address=request.remote_addr, details=f'Solicitud {solicitud.codigo} creada.'
    ))
    db.session.commit()

    return jsonify({'message': 'Solicitud registrada', 'solicitud': solicitud.to_dict(include_cursos=True)}), 201

@matricula_bp.route('', methods=['GET'])
@jwt_required()
def listar_solicitudes():
    # Listar solicitudes con filtros (MAT-ADM-001)
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    query = SolicitudMatricula.query
    if user.role == 'estudiante':
        query = query.filter_by(estudiante_id=user_id)
    else:
        # Filtros de administrador o dirección
        estado = request.args.get('estado')
        ciclo = request.args.get('ciclo')
        search = request.args.get('search')
        if estado:
            query = query.filter_by(estado=estado)
        if ciclo:
            query = query.join(PeriodoMatricula).filter(PeriodoMatricula.ciclo == ciclo)
        if search:
            query = query.join(User, SolicitudMatricula.estudiante_id == User.id).filter(
                (User.name.ilike(f'%{search}%')) | (User.username.ilike(f'%{search}%'))
            )

    solicitudes = query.order_by(SolicitudMatricula.created_at.desc()).all()
    return jsonify([s.to_dict(include_cursos=True) for s in solicitudes]), 200

@matricula_bp.route('/<int:solicitud_id>', methods=['GET'])
@jwt_required()
def obtener_detalle(solicitud_id):
    # Detalle de solicitud específica (MAT-ADM-001)
    solicitud = SolicitudMatricula.query.get_or_404(solicitud_id)
    return jsonify(solicitud.to_dict(include_cursos=True)), 200

@matricula_bp.route('/<int:solicitud_id>/estado', methods=['PUT'])
@jwt_required()
def actualizar_estado(solicitud_id):
    # Cambiar estado y auditoría (MAT-ADM-001)
    solicitud = SolicitudMatricula.query.get_or_404(solicitud_id)
    data = request.get_json() or {}
    nuevo_estado = data.get('estado')
    motivo = data.get('motivo', '')
    
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if nuevo_estado == 'APROBADA':
        if solicitud.estado == 'APROBADA':
            return jsonify({'error': 'Ya aprobada'}), 400
        if not solicitud.pago_registrado:
            return jsonify({'error': 'Requiere registrar pago previo'}), 400
        # Validar y restar cupos
        for det in solicitud.detalles:
            if det.curso.cupos_disponibles <= 0:
                return jsonify({'error': f'Sin cupos en {det.curso.nombre}'}), 400
            det.curso.cupos_ocupados += 1
            
    elif nuevo_estado == 'RECHAZADA':
        if len(motivo) < 20:
            return jsonify({'error': 'El motivo de rechazo debe tener al menos 20 caracteres'}), 400
        solicitud.observaciones = motivo

    solicitud.estado = nuevo_estado
    db.session.add(AuditLog(
        user_id=user_id, username=user.username, action=f'MATRICULA_{nuevo_estado}',
        ip_address=request.remote_addr, details=f'Solicitud {solicitud.codigo} cambiada a {nuevo_estado}.'
    ))
    db.session.commit()
    return jsonify(solicitud.to_dict(include_cursos=True)), 200

@matricula_bp.route('/<int:solicitud_id>/registrar-pago', methods=['POST'])
@jwt_required()
@role_required(['administrador'])
def registrar_pago(solicitud_id):
    # Registrar el pago (MAT-ADM-001)
    solicitud = SolicitudMatricula.query.get_or_404(solicitud_id)
    data = request.get_json() or {}
    
    monto = float(data.get('monto', 0))
    voucher = data.get('voucher', '')
    metodo = data.get('metodo', '')
    fecha = data.get('fecha', '')
    justificacion = data.get('justificacion', '')

    if not voucher or not metodo or not fecha:
        return jsonify({'error': 'Todos los datos de pago son obligatorios'}), 400

    # Validar monto con tarifa configurada
    if monto != solicitud.monto_total and not justificacion:
        return jsonify({'error': 'El monto no coincide con la tarifa. Requiere justificación.'}), 400

    solicitud.pago_registrado = True
    solicitud.pago_monto = monto
    solicitud.pago_voucher = voucher
    solicitud.pago_metodo = metodo
    solicitud.pago_fecha = fecha
    solicitud.justificacion_pago = justificacion

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    db.session.add(AuditLog(
        user_id=user_id, username=user.username, action='MATRICULA_PAGO_REGISTRADO',
        ip_address=request.remote_addr, details=f'Pago registrado para {solicitud.codigo} por S/.{monto}.'
    ))
    db.session.commit()
    return jsonify(solicitud.to_dict(include_cursos=True)), 200

@matricula_bp.route('/<int:solicitud_id>/ficha', methods=['GET'])
def descargar_ficha(solicitud_id):
    # Descargar ficha de matrícula aprobada en PDF (MAT-EST-002)
    solicitud = SolicitudMatricula.query.get_or_404(solicitud_id)
    if solicitud.estado != 'APROBADA':
        return jsonify({'error': 'La matrícula no está APROBADA.'}), 403

    estudiante = User.query.get(solicitud.estudiante_id)
    perfil = EstudiantePerfil.query.filter_by(user_id=solicitud.estudiante_id).first()

    # Buffer en memoria para el PDF
    pdf_buffer = BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []

    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, leading=20, alignment=1, textColor=colors.HexColor('#002f6c'))
    subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=10, leading=14, alignment=1)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14)
    bold_style = ParagraphStyle('Bold', parent=body_style, fontName='Helvetica-Bold')

    # Encabezado
    story.append(Paragraph("<b>UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ</b>", title_style))
    story.append(Paragraph("Facultad de Ingeniería de Sistemas — Intranet Académica", subtitle_style))
    story.append(Spacer(1, 15))

    # Título Ficha
    story.append(Paragraph(f"<b>FICHA DE MATRÍCULA OFICIAL: {solicitud.codigo}</b>", ParagraphStyle('Ficha', parent=title_style, fontSize=12, alignment=0)))
    story.append(Spacer(1, 10))

    # Datos Estudiante
    datos_est = [
        [Paragraph("<b>Código:</b>", body_style), Paragraph(estudiante.username, body_style), Paragraph("<b>Estudiante:</b>", body_style), Paragraph(estudiante.name, body_style)],
        [Paragraph("<b>DNI/Doc:</b>", body_style), Paragraph(estudiante.document_number or "N/A", body_style), Paragraph("<b>Facultad:</b>", body_style), Paragraph(perfil.facultad if perfil else "N/A", body_style)],
        [Paragraph("<b>Especialidad:</b>", body_style), Paragraph(perfil.escuela if perfil else "N/A", body_style), Paragraph("<b>Ciclo Académico:</b>", body_style), Paragraph(solicitud.periodo.ciclo, body_style)],
    ]
    t_est = Table(datos_est, colWidths=[80, 150, 80, 200])
    t_est.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dbe2e8')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f4f6f9')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#f4f6f9')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_est)
    story.append(Spacer(1, 15))

    # Cursos Matriculados
    story.append(Paragraph("<b>Asignaturas Matriculadas</b>", ParagraphStyle('CursosT', parent=styles['Heading2'], fontSize=11, textColor=colors.HexColor('#002f6c'))))
    story.append(Spacer(1, 5))

    cursos_headers = [Paragraph("<b>Código</b>", bold_style), Paragraph("<b>Asignatura</b>", bold_style), Paragraph("<b>Créditos</b>", bold_style), Paragraph("<b>Horario</b>", bold_style), Paragraph("<b>Docente</b>", bold_style)]
    cursos_data = [cursos_headers]
    for det in solicitud.detalles:
        curso = det.curso
        cursos_data.append([
            Paragraph(curso.codigo, body_style),
            Paragraph(curso.nombre, body_style),
            Paragraph(str(curso.creditos), body_style),
            Paragraph(curso.horario, body_style),
            Paragraph(curso.docente_nombre or "N/A", body_style),
        ])
    
    t_cur = Table(cursos_data, colWidths=[65, 175, 55, 115, 100])
    t_cur.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dbe2e8')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f4f6f9')),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_cur)
    story.append(Spacer(1, 15))

    # Resumen Pago
    datos_pago = [
        [Paragraph("<b>Total Créditos:</b>", body_style), Paragraph(str(solicitud.creditos_total), body_style), Paragraph("<b>Monto Total:</b>", body_style), Paragraph(f"S/. {solicitud.monto_total:.2f}", body_style)],
        [Paragraph("<b>Nº Voucher:</b>", body_style), Paragraph(solicitud.pago_voucher or "N/A", body_style), Paragraph("<b>Fecha de Pago:</b>", body_style), Paragraph(solicitud.pago_fecha or "N/A", body_style)],
    ]
    t_pag = Table(datos_pago, colWidths=[100, 150, 100, 160])
    t_pag.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dbe2e8')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_pag)
    story.append(Spacer(1, 20))

    # QR de Verificación
    verif_url = f"{request.host_url.rstrip('/')}/api/matricula/verificar/{solicitud.codigo}"
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
    
    # Tabla con firma / QR
    pie_data = [
        [Paragraph("Documento generado electrónicamente por el Sistema Académico de la UNCP. Válido para trámites oficiales internos.", ParagraphStyle('Pie', parent=body_style, fontSize=8, textColor=colors.HexColor('#7f8c8d'))), flowable_qr]
    ]
    t_pie = Table(pie_data, colWidths=[430, 80])
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
    return send_file(pdf_buffer, mimetype='application/pdf', download_name=f"Ficha_Matricula_{estudiante.username}_{solicitud.periodo.ciclo}.pdf")

@matricula_bp.route('/verificar/<string:token>', methods=['GET'])
def verificar_ficha(token):
    # Ruta pública para verificar QR (MAT-EST-002)
    solicitud = SolicitudMatricula.query.filter_by(codigo=token).first()
    if not solicitud:
        return jsonify({'valido': False, 'mensaje': 'Código de ficha inexistente.'}), 404
        
    estudiante = User.query.get(solicitud.estudiante_id)
    return jsonify({
        'valido': True,
        'codigo_ficha': solicitud.codigo,
        'estado': solicitud.estado,
        'fecha_emision': solicitud.created_at.isoformat() if solicitud.created_at else None,
        'estudiante': estudiante.name,
        'codigo_estudiante': estudiante.username,
        'creditos': solicitud.creditos_total,
        'ciclo': solicitud.periodo.ciclo
    }), 200

@matricula_bp.route('/direccion/estadisticas', methods=['GET'])
@jwt_required()
@role_required(['direccion', 'administrador'])
def estadisticas_direccion():
    # Obtener estadísticas de matrícula (MAT-DIR-001)
    ciclo = request.args.get('ciclo', '2026-I')
    
    periodo = PeriodoMatricula.query.filter_by(ciclo=ciclo).first()
    if not periodo:
        return jsonify({'error': 'Ciclo no encontrado'}), 404

    solicitudes = SolicitudMatricula.query.filter_by(periodo_id=periodo.id).all()
    
    total = len(solicitudes)
    aprobadas = sum(1 for s in solicitudes if s.estado == 'APROBADA')
    rechazadas = sum(1 for s in solicitudes if s.estado == 'RECHAZADA')
    pendientes = sum(1 for s in solicitudes if s.estado in ('PENDIENTE', 'EN REVISION'))
    tasa_aprobacion = (aprobadas / total * 100) if total > 0 else 0.0
    ingresos = sum(s.pago_monto for s in solicitudes if s.pago_registrado and s.pago_monto)

    # Agrupaciones por Facultad (simulación basada en perfiles de estudiantes)
    agrupado_fac = {}
    agrupado_esp = {}
    for s in solicitudes:
        perfil = EstudiantePerfil.query.filter_by(user_id=s.estudiante_id).first()
        fac = perfil.facultad if perfil else 'Otras Facultades'
        esp = perfil.escuela if perfil else 'Sistemas'
        
        if s.estado == 'APROBADA':
            agrupado_fac[fac] = agrupado_fac.get(fac, 0) + 1
            agrupado_esp[esp] = agrupado_esp.get(esp, 0) + 1

    return jsonify({
        'resumen': {
            'total': total,
            'aprobadas': aprobadas,
            'rechazadas': rechazadas,
            'pendientes': pendientes,
            'tasa_aprobacion': tasa_aprobacion,
            'ingresos': ingresos,
        },
        'facultades': agrupado_fac,
        'especialidades': agrupado_esp,
    }), 200
