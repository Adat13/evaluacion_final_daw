# Sistema Académico Integral - Intranet Académico
## Universidad Nacional del Centro del Perú (UNCP)
### Facultad de Ingeniería de Sistemas

**Curso**: Desarrollo de Aplicaciones Web (Semestre IX)  
**Proyecto**: Sistema Académico Integral para la Gestión de Matrículas, Cursos, Notas y Supervisión Académica  
**Estudiante Coordinador**: David Toribio  
**Integrantes**: 
* David Toribio
* Yauri Torres Benjamin
* Rojas Quispe Raul

---

## 1. Descripción del Proyecto

Este sistema es un ERP académico integral diseñado para automatizar y asegurar la gestión de los procesos académicos de facultades y especialidades universitarias. El sistema cubre desde la matrícula en línea y el registro de calificaciones hasta la supervisión directiva de sílabos, cargas horarias, indicadores de aprobación y la consolidación de actas oficiales con firmas digitales.

La solución está desarrollada bajo una arquitectura desacoplada utilizando:
* **Frontend**: React + Vite + CSS Vanilla (con soporte de roles y sesión mediante JWT).
* **Backend**: Python Flask + Flask-SQLAlchemy.
* **Base de Datos**: PostgreSQL para el entorno de producción (servidor en la nube) y soporte nativo para SQLite en desarrollo local.

---

## 2. Estructura del Proyecto

El código fuente está estructurado de manera organizada y modular para facilitar la escalabilidad y el mantenimiento:

```text
evaluacion_final_daw/
│
├── backend/                        # Servidor Flask (Backend)
│   ├── app/
│   │   ├── models.py               # Modelos de SQLAlchemy (BD unificada)
│   │   ├── config.py               # Configuración de variables de entorno y base de datos
│   │   ├── utils.py                # Decoradores de control de acceso por roles
│   │   ├── routes/                 # Controladores y rutas segmentadas
│   │   │   ├── auth.py             # Autenticación de usuarios (JWT)
│   │   │   ├── admin.py            # Gestión CRUD de usuarios
│   │   │   ├── docente.py          # Gestión de sílabos, notas y actas (Docente)
│   │   │   ├── estudiante.py       # Matrícula, notas e historial (Estudiante)
│   │   │   └── direccion.py        # Supervisión directiva, indicadores y actas (Dirección)
│   │   └── uploads/                # Directorio de carga de sílabos y archivos
│   ├── run.py                      # Punto de entrada para levantar Flask
│   ├── requirements.txt            # Dependencias de Python
│   └── .env                        # Configuración de credenciales de desarrollo
│
├── frontend/                       # Aplicación React (Frontend)
│   ├── src/
│   │   ├── App.jsx                 # Componente principal con el Dashboard e integración de APIs
│   │   ├── index.css               # Diseño visual con variables CSS y estilos interactivos
│   │   └── main.jsx                # Punto de entrada de React
│   ├── package.json                # Dependencias de Node.js
│   └── vite.config.js              # Configuración de empaquetado Vite
│
└── README.md                       # Documentación del proyecto (este archivo)
```

---

## 3. Principios SOLID Aplicados

El desarrollo del backend y el frontend se ha guiado por las mejores prácticas del diseño de software mediante los principios SOLID:

1. **Principio de Responsabilidad Única (SRP)**:
   * Cada módulo de rutas en `backend/app/routes/` tiene una sola responsabilidad. Por ejemplo, `estudiante.py` sólo expone endpoints referentes a la interacción del alumno, mientras que `auth.py` maneja exclusivamente el login y la sesión.
   * El modelo `Nota` en `models.py` contiene exclusivamente la lógica matemática de cálculo de promedio final (`calcular_promedio()`), delegando la lógica de vista o guardado al controlador.
2. **Principio de Abierto/Cerrado (OCP)**:
   * El sistema de rutas de Flask se estructuró a través de *Blueprints*. Esto permite extender el backend añadiendo nuevos archivos de rutas en `routes/` y registrándolos en `app/__init__.py` sin tener que modificar la lógica existente de los otros controladores.
3. **Principio de Sustitución de Liskov (LSP)**:
   * Todas las respuestas de error y éxito de la API siguen una estructura JSON unificada (`{"error": "mensaje"}` o `{"mensaje": "detalle"}`). Cualquier módulo o endpoint del backend puede ser consumido por el frontend de manera genérica bajo el mismo estándar de promesas.
4. **Principio de Segregación de Interfaces (ISP)**:
   * La interfaz del Dashboard en `App.jsx` segmenta las funcionalidades de forma dinámica. En lugar de mostrar un menú general sobrecargado, el componente lateral de navegación (`Sidebar`) renderiza únicamente los enlaces y vistas asociados al rol activo (`estudiante`, `docente`, `direccion`, `administrador`).
5. **Principio de Inversión de Dependencias (DIP)**:
   * La aplicación no depende de conexiones de base de datos o claves secretas quemadas en el código (hardcoded). El archivo `config.py` inyecta las credenciales dinámicamente desde el archivo de configuración `.env`. Esto permite alternar entre bases de datos de prueba (SQLite) y producción (PostgreSQL) simplemente cambiando una variable de entorno.

---

## 4. Guía de Instalación y Ejecución

Sigue estos pasos en tu máquina local para instalar y poner en marcha el proyecto de forma exitosa.

### Requisitos Previos:
* Instalar **Python 3.10** o superior.
* Instalar **Node.js** (versión LTS recomendada).

### Paso 1: Configurar el Backend (Flask)
1. Abre una terminal y colócate en el directorio `backend/`:
   ```bash
   cd backend
   ```
2. Crea el entorno virtual de Python:
   ```bash
   python -m venv venv
   ```
3. Activa el entorno virtual:
   * En Windows (PowerShell):
     ```bash
     .\venv\Scripts\Activate.ps1
     ```
   * En Windows (CMD):
     ```bash
     .\venv\Scripts\activate.bat
     ```
   * En macOS / Linux:
     ```bash
     source venv/bin/activate
     ```
4. Instalar las dependencias requeridas:
   ```bash
   pip install -r requirements.txt
   ```
5. Configura el archivo `.env`. Copia las variables correspondientes a tu entorno (para usar SQLite local o PostgreSQL en la nube).
6. Ejecuta el servidor del backend:
   ```bash
   python run.py
   ```
   El backend iniciará automáticamente en `http://localhost:5000`.

### Paso 2: Configurar el Frontend (React)
1. Abre otra pestaña o ventana de la terminal y navega al directorio `frontend/`:
   ```bash
   cd frontend
   ```
2. Instala los paquetes de Node.js:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   El frontend estará accesible en `http://localhost:5173`. Abre esta URL en tu navegador de preferencia.

---

## 5. Cuentas de Acceso de Prueba

El sistema cuenta con un seeder que registra perfiles académicos con los siguientes roles y accesos predeterminados:

| Rol | Nombre | Usuario | Contraseña | Funciones Clave |
| :--- | :--- | :--- | :--- | :--- |
| **Estudiante** | David Toribio | `student` | `student123` | Matrícula en línea, visualización de promedio y solicitud de certificados. |
| **Docente** | Dr. Jaime Suasnábar | `docente` | `docente123` | Carga de sílabos (PDF), registro de calificaciones y envío de actas. |
| **Dirección** | Director Académico | `director` | `director123` | Supervisión de sílabos y horas de docentes, revisión de indicadores y consolidación de actas. |
| **Administrador**| Administrador General | `admin` | `admin123` | Control de usuarios, bitácora de auditoría detallada y gestión de actas. |
