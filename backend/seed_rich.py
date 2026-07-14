import os
from datetime import datetime, date, timedelta
from app import create_app, db
from app.models import (
    User, AuditLog, Facultad, Especialidad, PlanEstudios,
    Curso, PeriodoAcad, Estudiante, Docente, Seccion,
    Matricula, DetalleMatricula, Nota, SolicitudDocumento, Acta,
    PeriodoMatricula, EstudiantePerfil, SolicitudMatricula, DetalleSolicitud,
    NotaHistorica, SolicitudCertificado
)

app = create_app()

def clear_data():
    print("🗑️ Recreando esquema de base de datos completo (drop_all & create_all)...")
    db.drop_all()
    db.create_all()
    print("✅ Esquema de base de datos recreado con éxito.")

def seed_rich_data():
    print("🌱 Sembrando datos institucionales ricos de producción...")
    
    # 1. Base Users (Roles Diferenciados)
    # Administradores
    admin = User(username="admin", email="admin@uncp.edu.pe", name="Ing. Angel Administrador", role="administrador", phone="987654321", address="Av. Universitaria 123, El Tambo", document_type="DNI", document_number="77777777")
    admin.set_password("admin123")
    db.session.add(admin)

    admin2 = User(username="admin2", email="admin2@uncp.edu.pe", name="Lic. María Administradora", role="administrador", phone="987654322", address="Pje. La Merced 321, Huancayo", document_type="DNI", document_number="77777778")
    admin2.set_password("admin123")
    db.session.add(admin2)

    # Dirección (Decanato)
    director = User(username="director", email="decanato_fis@uncp.edu.pe", name="Dr. Decano FIS UNCP", role="direccion", phone="955555555", address="Av. Giraldez 999, Huancayo", document_type="DNI", document_number="11111111")
    director.set_password("director123")
    db.session.add(director)

    # Docentes (incluyendo al Dr. Jaime Suasnábar Terrel)
    docente_jaime = User(username="jsuasnabar", email="jsuasnabar@uncp.edu.pe", name="Dr. Jaime Suasnábar Terrel", role="docente", phone="998877665", address="Jr. Lima 789, El Tambo", document_type="DNI", document_number="80123456")
    docente_jaime.set_password("docente123")
    db.session.add(docente_jaime)

    docente_rojas = User(username="docente", email="crojas@uncp.edu.pe", name="Dr. Carlos Rojas", role="docente", phone="912345678", address="Jr. Huancavelica 456, Huancayo", document_type="DNI", document_number="88888888")
    docente_rojas.set_password("docente123")
    db.session.add(docente_rojas)

    docente_sanchez = User(username="psanchez", email="psanchez@uncp.edu.pe", name="Dr. Pedro Sánchez", role="docente", phone="912345679", address="Jr. Loreto 123, Huancayo", document_type="DNI", document_number="88888889")
    docente_sanchez.set_password("docente123")
    db.session.add(docente_sanchez)

    # Estudiantes (incluyendo alumnos del Lote)
    student_juan = User(username="student", email="jperez@uncp.edu.pe", name="Juan Pérez", role="estudiante", phone="999888777", address="Urb. San Antonio Mz C Lt 5, Huancayo", document_type="DNI", document_number="99999999")
    student_juan.set_password("student123")
    db.session.add(student_juan)

    est_camila = User(username="camila", email="camila.quispe@uncp.edu.pe", name="QUISPE GOETENDIA CAMILA ROSARIO", role="estudiante", phone="999111222", address="Av. Huancavelica 1050, Huancayo", document_type="DNI", document_number="81121977")
    est_camila.set_password("student123")
    db.session.add(est_camila)

    est_jhomer = User(username="jhomer", email="jhomer.nunez@uncp.edu.pe", name="NUÑEZ HUINCHO, JHOMER SAITH", role="estudiante", phone="999222333", address="Jr. Junín 450, Chilca", document_type="DNI", document_number="62290751")
    est_jhomer.set_password("student123")
    db.session.add(est_jhomer)

    est_irma = User(username="irma", email="irma.porras@uncp.edu.pe", name="PORRAS RIVERA, IRMA ITHZEL", role="estudiante", phone="999333444", address="Jr. Tarapacá 890, El Tambo", document_type="DNI", document_number="63002344")
    est_irma.set_password("student123")
    db.session.add(est_irma)

    est_nicole = User(username="nicole", email="nicole.quilca@uncp.edu.pe", name="QUILCA ALFONSO NICOLE ANGHELA", role="estudiante", phone="999444555", address="Jr. Puno 1120, Huancayo", document_type="DNI", document_number="60279864")
    est_nicole.set_password("student123")
    db.session.add(est_nicole)

    est_sully = User(username="sully", email="sully.davila@uncp.edu.pe", name="DAVILA CARLOS, SULLY LEONELA", role="estudiante", phone="999555666", address="Av. Coronel Santibáñez 405, Huancayo", document_type="DNI", document_number="80989564")
    est_sully.set_password("student123")
    db.session.add(est_sully)

    est_cristopher = User(username="cristopher", email="cristopher.chambergo@uncp.edu.pe", name="CHAMBERGO ATENCIO CRISTOPHER JHAIR", role="estudiante", phone="999666777", address="Jr. Arequipa 550, El Tambo", document_type="DNI", document_number="78773022")
    est_cristopher.set_password("student123")
    db.session.add(est_cristopher)

    db.session.commit()

    # 2. Facultades, Especialidades y Planes
    facultad = Facultad(nombre="Facultad de Ingeniería de Sistemas", siglas="FIS")
    db.session.add(facultad)
    db.session.commit()

    especialidad = Especialidad(nombre="Ingeniería de Sistemas", codigo="IS", facultad_id=facultad.id)
    db.session.add(especialidad)
    db.session.commit()

    plan = PlanEstudios(codigo_plan="P2020", anio_aprobacion=2020, especialidad_id=especialidad.id, activo=True)
    db.session.add(plan)
    db.session.commit()

    # 3. Periodos Académicos
    p_2025_2 = PeriodoAcad(codigo_periodo="2025-II", anio=2025, activo=False)
    p_2026_1 = PeriodoAcad(codigo_periodo="2026-I", anio=2026, activo=True)
    db.session.add_all([p_2025_2, p_2026_1])
    db.session.commit()

    # 4. Periodo Matrícula (Módulo de Matrícula Benjamin)
    hoy = date.today()
    periodo_mat = PeriodoMatricula(
        ciclo="2026-I",
        fecha_inicio=hoy - timedelta(days=15),
        fecha_fin=hoy + timedelta(days=30),
        activo=True,
        costo_por_credito=12.50
    )
    db.session.add(periodo_mat)
    db.session.commit()

    # 5. Cursos (Unificados con campos de Angel y Benjamin)
    curso_daw = Curso(
        nombre="Desarrollo de Aplicaciones Web",
        codigo_curso="IS901",
        codigo="IS901",
        creditos=4,
        plan_id=plan.id,
        periodo_id=periodo_mat.id,
        horario="Lunes 07:45 - 11:30",
        cupos_max=30,
        cupos_ocupados=5
    )
    curso_bda = Curso(
        nombre="Base de Datos Avanzadas",
        codigo_curso="IS902",
        codigo="IS902",
        creditos=3,
        plan_id=plan.id,
        periodo_id=periodo_mat.id,
        horario="Martes 07:45 - 10:45",
        cupos_max=30,
        cupos_ocupados=5
    )
    curso_redes = Curso(
        nombre="Redes de Computadoras II",
        codigo_curso="IS801",
        codigo="IS801",
        creditos=4,
        plan_id=plan.id,
        periodo_id=periodo_mat.id,
        horario="Miércoles 11:30 - 15:15",
        cupos_max=30,
        cupos_ocupados=3
    )
    db.session.add_all([curso_daw, curso_bda, curso_redes])
    db.session.commit()

    # 6. Perfiles Académicos
    est_perfiles = []
    est_angel_list = []
    estudiantes_list = [student_juan, est_camila, est_jhomer, est_irma, est_nicole, est_sully, est_cristopher]
    codigos_mapeo = {
        "student": "2022100451",
        "camila": "2022100811",
        "jhomer": "2022200234",
        "irma": "2022200456",
        "nicole": "2022100344",
        "sully": "2022100789",
        "cristopher": "2022100912"
    }

    for e in estudiantes_list:
        p = EstudiantePerfil(
            user_id=e.id,
            facultad="Facultad de Ingeniería de Sistemas",
            escuela="Ingeniería de Sistemas",
            ciclo_ingreso="2022-I",
            estado_academico="activo",
            tiene_deudas=False,
            cursos_aprobados='["IS101", "IS200", "IS210", "IS220"]'
        )
        db.session.add(p)
        est_perfiles.append(p)
        
        # Guardar en modelo Estudiante de Angel
        est_angel = Estudiante(
            user_id=e.id,
            especialidad_id=especialidad.id,
            codigo_estudiante=codigos_mapeo.get(e.username, e.username)
        )
        db.session.add(est_angel)
        est_angel_list.append(est_angel)
        
    # Docentes en modelo de Angel
    doc_jaime_profile = Docente(user_id=docente_jaime.id, codigo_docente="D-JAIME-01", facultad_id=facultad.id)
    doc_rojas_profile = Docente(user_id=docente_rojas.id, codigo_docente="D-ROJAS-02", facultad_id=facultad.id)
    doc_sanchez_profile = Docente(user_id=docente_sanchez.id, codigo_docente="D-SANCHEZ-03", facultad_id=facultad.id)
    db.session.add_all([doc_jaime_profile, doc_rojas_profile, doc_sanchez_profile])
    db.session.commit()

    # 7. Secciones
    seccion_daw = Seccion(curso_id=curso_daw.id, periodo_id=p_2026_1.id, docente_id=doc_jaime_profile.id, codigo_seccion="A", capacidad=30, horario="Lunes 07:45 - 11:30")
    seccion_bda = Seccion(curso_id=curso_bda.id, periodo_id=p_2026_1.id, docente_id=doc_rojas_profile.id, codigo_seccion="A", capacidad=30, horario="Martes 07:45 - 10:45")
    seccion_redes = Seccion(curso_id=curso_redes.id, periodo_id=p_2026_1.id, docente_id=doc_sanchez_profile.id, codigo_seccion="B", capacidad=30, horario="Miércoles 11:30 - 15:15")
    db.session.add_all([seccion_daw, seccion_bda, seccion_redes])
    db.session.commit()

    # 8. Matrículas y Notas de Curso (Angel)
    # Matriculamos a los 7 estudiantes en las dos secciones activas (DAW y BDA)
    notas_predefinidas = [
        (15.00, 16.00, 14.50, 0.00), # Juan
        (18.00, 17.50, 19.00, 0.00), # Camila
        (14.00, 13.00, 15.00, 0.00), # Jhomer
        (12.00, 14.00, 13.00, 0.00), # Irma
        (16.00, 15.00, 16.50, 0.00), # Nicole
        (15.00, 16.00, 15.50, 0.00), # Sully
        (11.00, 12.00, 13.00, 0.00)  # Cristopher
    ]
    
    for idx, est_angel in enumerate(est_angel_list):
        mat = Matricula(
            estudiante_id=est_angel.id,
            periodo_id=p_2026_1.id,
            costo_total=250.00,
            estado_pago="pagado",
            fecha_matricula=datetime.now(),
            estado_matricula="aprobada"
        )
        db.session.add(mat)
        db.session.commit()
        
        # Enrolar en DAW y BDA
        det_daw = DetalleMatricula(matricula_id=mat.id, seccion_id=seccion_daw.id, estado_curso="cursando")
        det_bda = DetalleMatricula(matricula_id=mat.id, seccion_id=seccion_bda.id, estado_curso="cursando")
        db.session.add_all([det_daw, det_bda])
        db.session.commit()
        
        p1, p2, ec, ef = notas_predefinidas[idx]
        prom_daw = round((p1 + p2 + ec + ef) / 4, 2)
        
        b1, b2, bec, bef = p1 - 1 if p1 > 5 else p1, p2, ec + 0.5 if ec < 19 else ec, 0.0
        prom_bda = round((b1 + b2 + bec + bef) / 4, 2)
        
        nota_daw = Nota(detalle_matricula_id=det_daw.id, nota_parcial1=p1, nota_parcial2=p2, evaluacion_continua=ec, examen_final=ef, promedio_final=prom_daw, consolidada=False)
        nota_bda = Nota(detalle_matricula_id=det_bda.id, nota_parcial1=b1, nota_parcial2=b2, evaluacion_continua=bec, examen_final=bef, promedio_final=prom_bda, consolidada=False)
        db.session.add_all([nota_daw, nota_bda])

    # 9. Solicitudes de Matrícula (Modulo Benjamin)
    # Jhomer Saith (Solicitud Aprobada)
    sol_jhomer = SolicitudMatricula(
        codigo="MAT-EST-2026-00001",
        estudiante_id=est_jhomer.id,
        periodo_id=periodo_mat.id,
        creditos_total=7,
        monto_total=237.50,
        estado="APROBADA",
        pago_registrado=True,
        pago_monto=237.50,
        pago_voucher="voucher_jhomer_2026.jpg",
        pago_fecha=datetime.now().strftime("%d/%m/%Y"),
        pago_metodo="Depósito Banco de la Nación"
    )
    db.session.add(sol_jhomer)
    db.session.commit()
    
    det_sol_jhomer_daw = DetalleSolicitud(solicitud_id=sol_jhomer.id, curso_id=curso_daw.id)
    det_sol_jhomer_bda = DetalleSolicitud(solicitud_id=sol_jhomer.id, curso_id=curso_bda.id)
    db.session.add_all([det_sol_jhomer_daw, det_sol_jhomer_bda])

    # Irma Porras (Solicitud Pendiente de Validación de Voucher)
    sol_irma = SolicitudMatricula(
        codigo="MAT-EST-2026-00002",
        estudiante_id=est_irma.id,
        periodo_id=periodo_mat.id,
        creditos_total=4,
        monto_total=200.00,
        estado="PENDIENTE_PAGO",
        pago_registrado=False,
        pago_monto=0.00,
        pago_voucher="voucher_irma_pago_banco.png"
    )
    db.session.add(sol_irma)
    db.session.commit()
    
    det_sol_irma_daw = DetalleSolicitud(solicitud_id=sol_irma.id, curso_id=curso_daw.id)
    db.session.add(det_sol_irma_daw)

    # 10. Notas Históricas (Para Record Académico)
    notas_historicas = [
        # Juan Pérez
        NotaHistorica(estudiante_id=student_juan.id, curso_codigo="IS200", curso_nombre="Algoritmos y Estructuras (Prerreq. DAW)", creditos=4, ciclo="2024-I", nota_final=16, estado="APROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=student_juan.id, curso_codigo="IS210", curso_nombre="Base de Datos I (Prerreq. BDA)", creditos=3, ciclo="2024-I", nota_final=14, estado="APROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=student_juan.id, curso_codigo="IS220", curso_nombre="Introducción a Redes (Prerreq. Redes)", creditos=3, ciclo="2024-II", nota_final=15, estado="APROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=student_juan.id, curso_codigo="IS101", curso_nombre="Introducción a Sistemas", creditos=4, ciclo="2024-I", nota_final=9, estado="DESAPROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=student_juan.id, curso_codigo="IS101", curso_nombre="Introducción a Sistemas", creditos=4, ciclo="2024-II", nota_final=13, estado="APROBADO", veces_matriculado=2),
        
        # Camila Quispe
        NotaHistorica(estudiante_id=est_camila.id, curso_codigo="IS200", curso_nombre="Algoritmos y Estructuras (Prerreq. DAW)", creditos=4, ciclo="2024-I", nota_final=19, estado="APROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=est_camila.id, curso_codigo="IS210", curso_nombre="Base de Datos I (Prerreq. BDA)", creditos=3, ciclo="2024-I", nota_final=18, estado="APROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=est_camila.id, curso_codigo="IS101", curso_nombre="Introducción a Sistemas", creditos=4, ciclo="2024-I", nota_final=17, estado="APROBADO", veces_matriculado=1),

        # Jhomer Saith
        NotaHistorica(estudiante_id=est_jhomer.id, curso_codigo="IS200", curso_nombre="Algoritmos y Estructuras (Prerreq. DAW)", creditos=4, ciclo="2024-II", nota_final=15, estado="APROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=est_jhomer.id, curso_codigo="IS210", curso_nombre="Base de Datos I (Prerreq. BDA)", creditos=3, ciclo="2024-II", nota_final=14, estado="APROBADO", veces_matriculado=1),

        # Irma Porras
        NotaHistorica(estudiante_id=est_irma.id, curso_codigo="IS200", curso_nombre="Algoritmos y Estructuras (Prerreq. DAW)", creditos=4, ciclo="2024-II", nota_final=16, estado="APROBADO", veces_matriculado=1),
    ]
    db.session.add_all(notas_historicas)
    db.session.commit()

    # 11. Solicitudes de Certificados
    # Juan Pérez (Solicitud aprobada y emitida con QR/Firma digital)
    sol_cert_juan = SolicitudCertificado(
        codigo="SOL-CER-2026-00001",
        estudiante_id=student_juan.id,
        tipo_documento="Constancia de Matrícula",
        motivo="Prácticas Pre-Profesionales en Caja Huancayo",
        idioma="Español",
        cantidad_copias=1,
        estado="EMITIDO",
        autorizado_por="Dr. Decano FIS UNCP",
        fecha_autorizacion=datetime.today().strftime('%d/%m/%Y'),
        motivo_rechazo=None
    )
    db.session.add(sol_cert_juan)
    db.session.commit()
    
    # Agregar en modelo de documentos de Angel
    doc_juan = SolicitudDocumento(
        estudiante_id=est_angel_list[0].id,
        tipo_documento="constancia_matricula",
        estado="emitido",
        fecha_emision=datetime.now(),
        qr_code_hash="qr-2026-matricula-jperez-0001",
        firma_digital_hash="sha256-signature-98a7c6f5e4d3c2b1a0",
        pdf_url="http://example.com/constancia_jperez.pdf",
        observaciones="Firma autorizada por decanato."
    )
    db.session.add(doc_juan)

    # Camila Quispe (Solicitud pendiente de Autorización de Dirección)
    sol_cert_camila = SolicitudCertificado(
        codigo="SOL-CER-2026-00002",
        estudiante_id=est_camila.id,
        tipo_documento="Certificado de Estudios",
        motivo="Beca de postgrado en el extranjero",
        idioma="Inglés",
        cantidad_copias=2,
        estado="PENDIENTE_AUTORIZACION",
        autorizado_por=None,
        fecha_autorizacion=None,
        motivo_rechazo=None
    )
    db.session.add(sol_cert_camila)
    db.session.commit()

    # 11.5. Actas de Calificaciones
    acta_bda = Acta(
        seccion_id=seccion_bda.id,
        usuario_id_creacion=docente_rojas.id,
        estado="ENVIADA",
        fecha_envio=datetime.now(),
        observaciones="Acta de base de datos avanzada enviada para consolidación."
    )
    acta_daw = Acta(
        seccion_id=seccion_daw.id,
        usuario_id_creacion=docente_jaime.id,
        estado="BORRADOR",
        observaciones="Borrador de desarrollo de aplicaciones web."
    )
    db.session.add_all([acta_bda, acta_daw])
    db.session.commit()

    # 12. Logs de Auditoría
    logs = [
        AuditLog(user_id=admin.id, username=admin.username, action="USER_LOGIN", ip_address="127.0.0.1", details="Inicio de sesión exitoso del administrador."),
        AuditLog(user_id=docente_jaime.id, username=docente_jaime.username, action="SILABO_UPLOAD", ip_address="127.0.0.1", details="El docente subió el sílabo oficial de Desarrollo de Aplicaciones Web."),
        AuditLog(user_id=student_juan.id, username=student_juan.username, action="MATRICULA_REQUEST", ip_address="127.0.0.1", details="El estudiante registró su solicitud de matrícula para el periodo 2026-I."),
        AuditLog(user_id=admin.id, username=admin.username, action="MATRICULA_APPROVE", ip_address="127.0.0.1", details="El administrador aprobó la matrícula de Juan Pérez y validó su comprobante de pago.")
    ]
    db.session.add_all(logs)
    db.session.commit()

    print("✅ Sembrado completado con éxito. ¡Base de datos de producción lista!")

if __name__ == "__main__":
    with app.app_context():
        clear_data()
        seed_rich_data()
