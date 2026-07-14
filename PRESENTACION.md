# Presentacion de Exposicion Final - ERP Academico
## Universidad Nacional del Centro del Peru (UNCP)
### Facultad de Ingeneria de Sistemas (FIS)

**Proyecto**: Sistema Academico Integral para la Gestion de Matriculas, Calificaciones, Documentacion Academica y Auditoria.
**Curso**: Desarrollo de Aplicaciones Web (Semestre IX)

### Integrantes del Equipo
* David Toribio (Coordinador, Seguridad e Integrador de Modulos)
* Yauri Torres Benjamin (Modulo de Matricula y Cursos)
* Rojas Quispe Raul (Modulo de Docentes y Calificaciones)

---

## Estructura de Diapositivas para la Exposicion

### Diapositiva 1: Portada y Presentacion
* **Titulo**: Sistema Academico Integral - ERP FIS UNCP
* **Subtitulo**: Modernizacion y control seguro de matriculas, actas de notas y tramites digitales.
* **Integrantes**: David Toribio, Benjamin Yauri, Raul Rojas.
* **Institucion**: Facultad de Ingenieria de Sistemas, UNCP.

---

### Diapositiva 2: Problematica y Solucion Propuesta
* **Problematica**:
  * Procesos academicos manuales o lentos.
  * Riesgo de alteracion de notas historicas.
  * Falsificacion de constancias academicas fisicas.
  * Falta de trazabilidad y auditoria de los cambios en la base de datos.
* **Solucion**: Un ERP academico desacoplado, seguro y rapido, con firma digital e inmutabilidad de actas aprobadas, auditable y con validacion de documentos por codigo QR.

---

### Diapositiva 3: Arquitectura y Pila Tecnologica
* **Frontend (Cliente)**: SPA fluida en React 19 empaquetada con Vite 8.
* **Backend (Servidor)**: API RESTful en Python Flask con arquitectura modular usando Blueprints.
* **Base de Datos**: PostgreSQL en produccion (alojada en la nube) y SQLite para pruebas en entorno local.
* **Servidor de Produccion (VPS)**:
  * Servidor web Nginx configurado como Proxy Inverso para balanceo y servir archivos estaticos.
  * PM2 supervisando procesos en segundo plano.
  * Servidor WSGI Gunicorn para levantar la API de Python.

---

### Diapositiva 4: Flujo de Matricula en Linea (Módulo Alumno y Admin)
* **Paso 1 (Datos)**: Validacion de perfil y contacto.
* **Paso 2 (Requisitos)**: Comprobacion automatica de deudas y prerrequisitos en la base de datos.
* **Paso 3 (Seleccion de Cursos)**: Registro interactivo de asignaturas con alertas en tiempo real de cruces de horarios.
* **Paso 4 (Pago y Validacion)**: Calculo dinamico de costos y carga de imagen de voucher bancario.
* **Aprobacion Administrativa**: Aprobacion por parte del Administrador despues de la validacion visual del comprobante.

---

### Diapositiva 5: Gestion de Calificaciones e Inmutabilidad de Notas
* **Registro de Notas**: Interfaz para que los docentes ingresen calificaciones parciales y evaluaciones continuas.
* **Envio de Actas**: Firma y envio digital del acta de notas al finalizar el ciclo academico.
* **Consolidacion Directiva**: Aprobacion oficial por parte del Decanato/Direccion Academica.
* **Inmutabilidad**: Al aprobarse, las calificaciones se copian a la tabla NotaHistorica y se bloquea por completo la edicion en la tabla de notas del docente.

---

### Diapositiva 6: Seguridad, Auditoria y Firma Digital (Aporte Principal)
* **Cifrado de Accesos**: Hasheo de contraseñas mediante algoritmo BCrypt en el backend.
* **Sesiones Seguras**: Control de acceso basado en roles (RBAC) validado en cada peticion mediante JSON Web Tokens (JWT).
* **Bitacora de Auditoria (Audit Log)**: Registro forense de cada cambio de datos indicando usuario, tipo de accion, direccion IP de origen y marca de tiempo.
* **Firma y QR de Verificacion**: Generacion de certificados en formato PDF con firma digital e insercion de codigo QR. Escaneo directo desde el celular para abrir la web de validacion institucional de la UNCP.

---

### Diapositiva 7: Conclusiones
* **Eficiencia**: Automatizacion de matricula y reportes en menos de 5 minutos.
* **Seguridad**: Inmutabilidad de actas aprobadas y trazabilidad de acciones mediante logs.
* **Confianza**: Mecanismo de validacion pública de certificados emitidos para evitar falsificaciones.
