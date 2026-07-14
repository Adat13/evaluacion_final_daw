# Manual de Usuario - Sistema Académico Intranet (ERP)
## Universidad Nacional del Centro del Perú (UNCP)
### Facultad de Ingeniería de Sistemas (FIS)

Este manual describe los roles, módulos y flujos de trabajo del **Sistema Académico Intranet**, un software tipo ERP modular diseñado para gestionar de manera segura y eficiente la matrícula, calificaciones, récord académico, emisión de certificados y auditoría de la facultad.

---

## 👥 1. Perfiles de Acceso (Roles) y Credenciales de Prueba

El sistema cuenta con un set de datos ricos y realistas sembrados directamente en la base de datos de producción (PostgreSQL) para probar los diferentes roles y flujos.

| Rol | Usuario | Contraseña | Nombre Real / Representación | Propósito en el Flujo |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | `admin123` | Ing. Angel Administrador | Gestión de cuentas, auditorías de seguridad, aprobación de pagos de matrícula y actas. |
| **Administrador 2**| `admin2` | `admin123` | Lic. María Administradora | Auxiliar de registro y administración. |
| **Docente (Titular)**| `jsuasnabar` | `docente123` | Dr. Jaime Suasnábar Terrel | Carga de sílabos, registro de notas (PC1, PC2, EC, EF) y envío de actas. |
| **Docente 2** | `docente` | `docente123` | Dr. Carlos Rojas | Docente de Base de Datos. |
| **Docente 3** | `psanchez` | `docente123` | Dr. Pedro Sánchez | Docente auxiliar. |
| **Dirección (Decano)**| `director` | `director123` | Dr. Decano FIS UNCP | Autorización directiva de actas oficiales y emisión de certificados, visualización de KPIs. |
| **Estudiante 1** | `student` | `student123` | Juan Pérez | Alumno regular con historial de notas y matrícula activa en curso. |
| **Estudiante 2** | `camila` | `student123` | Camila Rosario Quispe Goetendia | Alumna regular (perteneciente al Lote 09-mar.2DO). |
| **Estudiante 3** | `jhomer` | `student123` | Jhomer Saith Núñez Huincho | Alumno matriculado con solicitud de matrícula aprobada en Postgres. |
| **Estudiante 4** | `irma` | `student123` | Irma Ithzel Porras Rivera | Alumna con pago/voucher de matrícula pendiente de validación. |
| **Estudiante 5** | `nicole` | `student123` | Nicole Anghela Quilca Alfonso | Alumna con historial académico listo para matricularse. |

---

## ⚙️ 2. Módulos y Funcionalidades por Rol

### 👤 A. Administrador (Gestión y Control Operativo)
1. **Control de Usuarios**: CRUD completo para registrar, editar y dar de baja a estudiantes, docentes y directivos.
2. **Validar Actas**: Vista para revisar el estado de las actas de notas emitidas por los docentes, validando su consistencia antes de la aprobación.
3. **Gestión de Matrículas**: Visualiza los comprobantes de pago (vouchers) subidos por los alumnos, ingresa el monto pagado, valida las deudas y aprueba la matrícula oficial.
4. **Gestión de Certificados**: Emisión física y digital de constancias autorizadas. Genera un archivo PDF con sello institucional, firma digital del secretario académico y un código QR de validación en tiempo real.
5. **Bitácora de Auditoría**: Tabla detallada de seguridad que registra cada inicio de sesión, cambios de contraseña y modificaciones de base de datos (`USER_CREATE`, `MATRICULA_APPROVE`, etc.) indicando usuario, acción, IP de origen y fecha.

### 🎓 B. Estudiante (Autoservicio Académico)
1. **Matrícula en Línea (ERP)**: Flujo asistido en 4 pasos:
   * *Paso 1 (Requisitos)*: Validación del estado académico (deudas, ciclo y cursos aprobados).
   * *Paso 2 (Selección)*: Selección de asignaturas disponibles en el ciclo, controlando cupos máximos y prerrequisitos.
   * *Paso 3 (Pago)*: Cálculo automático de costos por créditos y base. Carga digital del voucher de pago.
   * *Paso 4 (Confirmación)*: Envío de solicitud y descarga de la ficha de matrícula.
2. **Mis Matrículas**: Visualización del estado de su matrícula actual (Solicitada, Pendiente de Pago, Aprobada u Observada).
3. **Hoja de Notas**: Visualiza las calificaciones vigentes del ciclo actual (parciales, continua, examen final, promedio ponderado y estado).
4. **Solicitud de Certificados**: Formulario para solicitar en línea Constancias de Matrícula, Notas, Egresado y Certificados de Estudios indicando idioma y motivo.
5. **Récord Académico**: Historial completo de todos los ciclos cursados con notas, créditos aprobados, promedio ponderado acumulado (PPA) y estado final de los cursos.

### 👨‍🏫 C. Docente (Gestión del Aula)
1. **Cursos Asignados**: Visualización de las secciones y horarios a su cargo.
2. **Carga de Sílabos**: Permite subir el archivo del sílabo oficial (PDF o Word) para cada curso asignado.
3. **Registro de Calificaciones**: Formulario para ingresar las notas parciales 1 y 2, evaluación continua y examen final de todos los estudiantes inscritos en sus secciones, calculando automáticamente el promedio ponderado.
4. **Envío de Actas**: Una vez completado el registro de notas, permite firmar y enviar el Acta Oficial a la Dirección Académica para su bloqueo y consolidación.

### 🏢 D. Dirección / Decanato (Supervisión Estratégica)
1. **Supervisión de Carga Docente**: Control del cumplimiento de sílabos cargados por los docentes y horas lectivas acumuladas.
2. **Indicadores Académicos**: Gráficos y KPIs con promedios de notas por curso, tasas de aprobación, desaprobación y deserción por cohorte.
3. **Actas Académicas**: Panel para aprobar o rechazar actas de notas enviadas por docentes. Al aprobar, el acta se bloquea y se consolida definitivamente en el sistema.
4. **Autorización de Certificados**: Evalúa y aprueba/deniega solicitudes de certificados delicados (como constancias de egresado o certificados de estudios) antes de que el administrador los emita con firma y código QR.

---

## 🔄 3. Flujos de Trabajo Clave (Paso a Paso)

### 📊 Flujo A: El Proceso Completo de Matrícula
1. **Estudiante** (`irma`) entra a **Matrícula en Línea (ERP)**, verifica sus datos y selecciona el curso *Desarrollo de Aplicaciones Web*.
2. El sistema calcula el costo total (Costo base S/.150 + S/.12.50 por crédito).
3. Sube la foto de su voucher bancario y envía la solicitud. El estado cambia a `PENDIENTE_PAGO`.
4. **Administrador** (`admin`) ingresa a **Gestión de Matrículas**, ve la solicitud de `irma`, revisa la imagen del voucher, digita el monto validado y hace clic en **Aprobar Matrícula**. El estado cambia a `APROBADA`.
5. **Dirección** (`director`) puede entrar a **Supervisión de Matrícula** y ver los KPIs actualizados con el nuevo alumno matriculado.

### 📝 Flujo B: Calificaciones y Consolidación de Actas
1. **Docente** (`jsuasnabar`) entra a **Cursos Asignados**, selecciona su curso y registra las notas del alumno `student` (Juan Pérez).
2. El sistema calcula su promedio. El docente hace clic en **Enviar Acta**. El estado del acta cambia a `ENVIADA`.
3. **Administrador** o **Dirección** (`director`) entran a **Validar Actas**, revisan el acta de notas y hacen clic en **Consolidar Acta**.
4. A partir de ese momento, las notas quedan bloqueadas (no se pueden editar) y se transfieren automáticamente al **Récord Histórico** del alumno.
5. El **Estudiante** (`student`) ahora puede ver su promedio oficial actualizado en su **Récord Académico**.

### 📄 Flujo C: Solicitud y Emisión de Certificado con Código QR
1. **Estudiante** (`student`) entra a **Solicitud de Certificados**, selecciona *Constancia de Matrícula* y envía el trámite.
2. **Dirección** (`director`) ingresa a **Autorización de Certificados**, ve la solicitud pendiente de Juan Pérez, valida que tiene matrícula activa y hace clic en **Autorizar**. El estado cambia a `AUTORIZADO`.
3. **Administrador** (`admin`) ingresa a **Gestión de Certificados**, ve la solicitud autorizada de Juan Pérez y hace clic en **Emitir Certificado**.
4. El sistema cambia el estado a `EMITIDO` y genera el documento PDF oficial.
5. El **Estudiante** descarga el PDF que incluye un **Código QR**. Al escanear ese QR, redirige a una web pública del sistema `/api/certificados/verificar/<codigo>` que valida la autenticidad del documento de la UNCP ante cualquier entidad externa.
