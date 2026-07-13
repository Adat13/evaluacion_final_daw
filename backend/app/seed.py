import json
from datetime import date, timedelta
from app.models import (
    db, User, PeriodoMatricula, EstudiantePerfil, Curso, NotaHistorica
)


def seed_users():
    if User.query.first():
        return

    print("Seeding initial users and roles...")

    admin = User(
        username="admin",
        email="admin@uncp.edu.pe",
        name="Ing. Angel Administrador",
        role="administrador",
        phone="987654321",
        address="Av. Universitaria 123, El Tambo",
        document_type="DNI",
        document_number="77777777",
    )
    admin.set_password("admin123")
    db.session.add(admin)

    docente = User(
        username="docente",
        email="crojas@uncp.edu.pe",
        name="Dr. Carlos Rojas",
        role="docente",
        phone="912345678",
        address="Jr. Huancavelica 456, Huancayo",
        document_type="DNI",
        document_number="88888888",
    )
    docente.set_password("docente123")
    db.session.add(docente)

    estudiante = User(
        username="student",
        email="jperez@uncp.edu.pe",
        name="Juan Pérez",
        role="estudiante",
        phone="999888777",
        address="Urb. San Antonio Mz C Lt 5, Huancayo",
        document_type="DNI",
        document_number="99999999",
    )
    estudiante.set_password("student123")
    db.session.add(estudiante)

    direccion = User(
        username="director",
        email="decanato_fis@uncp.edu.pe",
        name="Dr. Decano FIS UNCP",
        role="direccion",
        phone="955555555",
        address="Av. Giraldez 999, Huancayo",
        document_type="DNI",
        document_number="11111111",
    )
    direccion.set_password("director123")
    db.session.add(direccion)

    db.session.commit()
    print("Users seed complete.")


def seed_matricula():
    if PeriodoMatricula.query.first():
        return

    print("Seeding matricula data...")

    hoy = date.today()
    periodo = PeriodoMatricula(
        ciclo="2026-I",
        fecha_inicio=hoy - timedelta(days=15),
        fecha_fin=hoy + timedelta(days=30),
        activo=True,
        costo_por_credito=45.0,
    )
    db.session.add(periodo)
    db.session.flush()

    estudiante = User.query.filter_by(username="student").first()
    if estudiante:
        perfil = EstudiantePerfil(
            user_id=estudiante.id,
            facultad="Facultad de Ingeniería de Sistemas",
            escuela="Ingeniería de Sistemas",
            ciclo_ingreso="2022-I",
            estado_academico="activo",
            tiene_deudas=False,
            cursos_aprobados=json.dumps(["IS200", "IS210", "IS220"]),
        )
        db.session.add(perfil)

    cursos = [
        Curso(
            codigo="IS301",
            nombre="Desarrollo de Aplicaciones Web",
            creditos=4,
            horario="Lun-Mie 08:00-10:00",
            dia_semana="Lunes,Miércoles",
            hora_inicio="08:00",
            hora_fin="10:00",
            cupos_max=30,
            cupos_ocupados=5,
            docente_nombre="Dr. Carlos Rojas",
            prerrequisito_codigo="IS200",
            periodo_id=periodo.id,
        ),
        Curso(
            codigo="IS302",
            nombre="Base de Datos Avanzada",
            creditos=3,
            horario="Mar-Jue 10:00-12:00",
            dia_semana="Martes,Jueves",
            hora_inicio="10:00",
            hora_fin="12:00",
            cupos_max=25,
            cupos_ocupados=2,
            docente_nombre="Mg. Ana Torres",
            prerrequisito_codigo="IS210",
            periodo_id=periodo.id,
        ),
        Curso(
            codigo="IS303",
            nombre="Redes y Comunicaciones",
            creditos=3,
            horario="Lun-Mie 10:00-12:00",
            dia_semana="Lunes,Miércoles",
            hora_inicio="10:00",
            hora_fin="12:00",
            cupos_max=28,
            cupos_ocupados=0,
            docente_nombre="Ing. Luis Mendoza",
            prerrequisito_codigo="IS220",
            periodo_id=periodo.id,
        ),
        Curso(
            codigo="IS304",
            nombre="Inteligencia Artificial",
            creditos=4,
            horario="Vie 14:00-18:00",
            dia_semana="Viernes",
            hora_inicio="14:00",
            hora_fin="18:00",
            cupos_max=20,
            cupos_ocupados=20,
            docente_nombre="Dr. Pedro Sánchez",
            prerrequisito_codigo="IS200",
            periodo_id=periodo.id,
        ),
    ]
    db.session.add_all(cursos)
    db.session.commit()
    print("Matricula seed complete.")


def seed_notas_historicas():
    if NotaHistorica.query.first():
        return
    print("Seeding historical grades...")
    estudiante = User.query.filter_by(username="student").first()
    if not estudiante:
        return
        
    notas = [
        NotaHistorica(estudiante_id=estudiante.id, curso_codigo="IS200", curso_nombre="Algoritmos y Estructuras (Prerreq. DAW)", creditos=4, ciclo="2024-I", nota_final=16, estado="APROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=estudiante.id, curso_codigo="IS210", curso_nombre="Base de Datos I (Prerreq. BDA)", creditos=3, ciclo="2024-I", nota_final=14, estado="APROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=estudiante.id, curso_codigo="IS220", curso_nombre="Introducción a Redes (Prerreq. Redes)", creditos=3, ciclo="2024-II", nota_final=15, estado="APROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=estudiante.id, curso_codigo="IS101", curso_nombre="Introducción a Sistemas", creditos=4, ciclo="2024-I", nota_final=9, estado="DESAPROBADO", veces_matriculado=1),
        NotaHistorica(estudiante_id=estudiante.id, curso_codigo="IS101", curso_nombre="Introducción a Sistemas", creditos=4, ciclo="2024-II", nota_final=13, estado="APROBADO", veces_matriculado=2),
    ]
    db.session.add_all(notas)
    db.session.commit()
    print("Historical grades seed complete.")


def seed_data():
    seed_users()
    seed_matricula()
    seed_notas_historicas()
