import React, { useState, useEffect } from 'react';
import './App.css';
import ProcesoMatricula from './components/matricula/ProcesoMatricula';
import MisMatriculas from './components/matricula/MisMatriculas';
import GestionSolicitudes from './components/matricula/GestionSolicitudes';
import EstadisticasMatricula from './components/matricula/EstadisticasMatricula';
import RecordEstudiante from './components/record/RecordEstudiante';
import ReportesConsolidados from './components/record/ReportesConsolidados';
import AnalisisCohorte from './components/record/AnalisisCohorte';
import SolicitudCertificados from './components/certificados/SolicitudCertificados';
import GestionCertificados from './components/certificados/GestionCertificados';
import AutorizacionCertificados from './components/certificados/AutorizacionCertificados';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Password Recovery State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState('inicio');

  // Profile Form State
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  // User Management State (CRUD for Admin)
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [crudError, setCrudError] = useState('');
  const [crudSuccess, setCrudSuccess] = useState('');
  
  // User Form State
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('estudiante');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDocType, setFormDocType] = useState('DNI');
  const [formDocNumber, setFormDocNumber] = useState('');

  // Audit Logs State (Admin / Direction)
  const [logsList, setLogsList] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFilter, setLogsFilter] = useState('');

  // Academic Modules State (Estudiante)
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [seccionSeleccionadas, setSeccionSeleccionadas] = useState([]);
  const [codigoPago, setCodigoPago] = useState('');
  const [matriculaActual, setMatriculaActual] = useState(null);
  const [notasEstudiante, setNotasEstudiante] = useState(null);
  const [documentosList, setDocumentosList] = useState([]);
  const [tipoDocSelect, setTipoDocSelect] = useState('constancia_matricula');
  
  // Academic Modules State (Docente)
  const [seccionesDocente, setSeccionesDocente] = useState([]);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState(null);
  const [notasSeccion, setNotasSeccion] = useState([]);
  const [notasEditState, setNotasEditState] = useState({});

  // Academic Modules State (Dirección / Admin)
  const [supervisionData, setSupervisionData] = useState(null);
  const [indicadoresData, setIndicadoresData] = useState(null);
  const [actasList, setActasList] = useState([]);
  const [actaSeleccionada, setActaSeleccionada] = useState(null);
  const [obsActa, setObsActa] = useState('');

  // Notifications State (Simulated)
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Tu contraseña ha sido actualizada.', time: 'Hace 5 minutos', unread: true },
    { id: 2, text: 'Bienvenido al nuevo Intranet Académico.', time: 'Hace 1 hora', unread: false }
  ]);

  // Sync profile inputs with current user info
  useEffect(() => {
    if (user) {
      setProfilePhone(user.phone || '');
      setProfileAddress(user.address || '');
    }
  }, [user]);

  // Fetch initial data based on active view and role
  useEffect(() => {
    if (token) {
      if (activeTab === 'users_crud' && user?.role === 'administrador') {
        fetchUsers();
      } else if (activeTab === 'audit_logs' && (user?.role === 'administrador' || user?.role === 'direccion')) {
        fetchAuditLogs();
      } else if (activeTab === 'matricula_estudiante' && user?.role === 'estudiante') {
        fetchCursosDisponibles();
        fetchMatriculaActual();
      } else if (activeTab === 'notas_estudiante' && user?.role === 'estudiante') {
        fetchNotasEstudiante();
      } else if (activeTab === 'certificados_estudiante' && user?.role === 'estudiante') {
        fetchDocumentosEstudiante();
      } else if ((activeTab === 'cursos_docente' || activeTab === 'inicio') && user?.role === 'docente') {
        fetchSeccionesDocente();
      } else if (activeTab === 'supervision_direccion' && (user?.role === 'direccion' || user?.role === 'administrador')) {
        fetchSupervisionDireccion();
      } else if (activeTab === 'indicadores_direccion' && (user?.role === 'direccion' || user?.role === 'administrador')) {
        fetchIndicadoresDireccion();
      } else if (activeTab === 'actas_direccion' && (user?.role === 'direccion' || user?.role === 'administrador')) {
        fetchActas();
      }
    }
  }, [activeTab, token, user]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginError('Por favor completa todos los campos.');
      return;
    }
    setLoginError('');
    setLoginLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      setActiveTab('inicio');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Helper Login for Quick Access
  const handleQuickLogin = (uname, pwd) => {
    setLoginUsername(uname);
    setLoginPassword(pwd);
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Logout backend notification error:", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken('');
      setUser(null);
      setActiveTab('inicio');
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Por favor ingresa tu correo electrónico.');
      return;
    }
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar recuperación');
      }
      setForgotSuccess('¡Listo! Revisa la consola del backend para ver la simulación del correo.');
      setForgotEmail('');
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone: profilePhone, address: profileAddress })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar perfil');
      }
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setProfileSuccess('Perfil actualizado con éxito.');
    } catch (err) {
      setProfileError(err.message);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('Las contraseñas no coinciden.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar contraseña');
      }
      setPwSuccess('Contraseña cambiada exitosamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message);
    }
  };

  // User CRUD: Fetch Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    setCrudError('');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar usuarios');
      }
      setUsersList(data);
    } catch (err) {
      setCrudError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  // User CRUD: Save User (Create/Update)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setCrudError('');
    setCrudSuccess('');
    const userPayload = {
      username: formUsername,
      email: formEmail,
      name: formName,
      role: formRole,
      phone: formPhone,
      address: formAddress,
      document_type: formDocType,
      document_number: formDocNumber
    };

    if (!isEditingUser) {
      userPayload.password = formPassword;
    } else if (formPassword) {
      userPayload.password = formPassword; // optionally change pwd
    }

    try {
      let url = `${API_BASE_URL}/admin/users`;
      let method = 'POST';
      if (isEditingUser && selectedUser) {
        url = `${API_BASE_URL}/admin/users/${selectedUser.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userPayload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar usuario');
      }

      setCrudSuccess(isEditingUser ? 'Usuario actualizado.' : 'Usuario creado con éxito.');
      resetUserForm();
      fetchUsers();
    } catch (err) {
      setCrudError(err.message);
    }
  };

  // User CRUD: Edit Action Setup
  const startEditUser = (u) => {
    setSelectedUser(u);
    setIsEditingUser(true);
    setFormUsername(u.username);
    setFormEmail(u.email);
    setFormName(u.name);
    setFormRole(u.role);
    setFormPhone(u.phone || '');
    setFormAddress(u.address || '');
    setFormDocType(u.document_type || 'DNI');
    setFormDocNumber(u.document_number || '');
    setFormPassword(''); // leave blank if no change
  };

  // User CRUD: Delete Action
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
    setCrudError('');
    setCrudSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar usuario');
      }
      setCrudSuccess('Usuario eliminado correctamente.');
      fetchUsers();
    } catch (err) {
      setCrudError(err.message);
    }
  };

  // Reset CRUD Form
  const resetUserForm = () => {
    setSelectedUser(null);
    setIsEditingUser(false);
    setFormUsername('');
    setFormEmail('');
    setFormPassword('');
    setFormName('');
    setFormRole('estudiante');
    setFormPhone('');
    setFormAddress('');
    setFormDocType('DNI');
    setFormDocNumber('');
  };

  // Audit Logs: Fetch Logs
  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar bitácora');
      }
      setLogsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const filteredLogs = logsList.filter(log => {
    const term = logsFilter.toLowerCase();
    return (
      (log.username && log.username.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  // Mark all notifications as read
  const markNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  // --- Estudiante APIs ---
  const fetchCursosDisponibles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estudiante/cursos-disponibles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setCursosDisponibles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMatriculaActual = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estudiante/matricula-actual`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setMatriculaActual(data);
      else setMatriculaActual(null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotasEstudiante = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estudiante/notas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setNotasEstudiante(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDocumentosEstudiante = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estudiante/documentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setDocumentosList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSolicitarMatricula = async (e) => {
    e.preventDefault();
    if (seccionSeleccionadas.length === 0) {
      alert('Seleccione al menos un curso.');
      return;
    }
    if (!codigoPago) {
      alert('Ingrese su comprobante de pago.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/estudiante/matricula`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seccion_ids: seccionSeleccionadas,
          comprobante_pago: codigoPago,
          costo_total: 120.00
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al procesar la matrícula');
      alert('¡Matrícula solicitada con éxito!');
      setSeccionSeleccionadas([]);
      setCodigoPago('');
      fetchMatriculaActual();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSolicitarDocumento = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/estudiante/documentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tipo_documento: tipoDocSelect })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert('Documento solicitado correctamente.');
      fetchDocumentosEstudiante();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Docente APIs ---
  const fetchSeccionesDocente = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/docente/cursos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setSeccionesDocente(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDetalleSeccion = async (sid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/docente/cursos/${sid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSeccionSeleccionada(data);
        fetchNotasSeccion(sid);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotasSeccion = async (sid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/docente/cursos/${sid}/notas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setNotasSeccion(data);
        const initialEdit = {};
        data.forEach(n => {
          initialEdit[n.detalle_matricula_id] = {
            nota_parcial1: n.nota.nota_parcial1,
            nota_parcial2: n.nota.nota_parcial2,
            evaluacion_continua: n.nota.evaluacion_continua,
            examen_final: n.nota.examen_final
          };
        });
        setNotasEditState(initialEdit);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateNota = async (sid, dmid) => {
    const grades = notasEditState[dmid];
    const p1 = parseFloat(grades?.nota_parcial1 || 0);
    const p2 = parseFloat(grades?.nota_parcial2 || 0);
    const ec = parseFloat(grades?.evaluacion_continua || 0);
    const ef = parseFloat(grades?.examen_final || 0);

    if (p1 < 0 || p1 > 20 || p2 < 0 || p2 > 20 || ec < 0 || ec > 20 || ef < 0 || ef > 20) {
      alert('Todas las calificaciones deben estar comprendidas en el rango de 0 a 20.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/docente/cursos/${sid}/notas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          detalle_matricula_id: dmid,
          nota_parcial1: p1,
          nota_parcial2: p2,
          evaluacion_continua: ec,
          examen_final: ef
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert('Calificación guardada.');
      fetchNotasSeccion(sid);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEnviarActa = async (sid) => {
    if (!window.confirm('¿Está seguro de enviar el acta? Ya no podrá realizar cambios hasta que sea revisada.')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/docente/cursos/${sid}/notas/enviar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert('Acta enviada con éxito.');
      fetchDetalleSeccion(sid);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUploadSilabo = async (sid, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_BASE_URL}/docente/cursos/${sid}/silabo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert('Sílabo cargado con éxito.');
      fetchDetalleSeccion(sid);
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Dirección / Admin APIs ---
  const fetchSupervisionDireccion = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/direccion/cursos/supervision`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setSupervisionData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIndicadoresDireccion = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/direccion/notas/indicadores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setIndicadoresData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/direccion/actas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setActasList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCambiarEstadoActa = async (aid, nuevoEstado) => {
    try {
      const response = await fetch(`${API_BASE_URL}/direccion/actas/${aid}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          observaciones: nuevoEstado === 'OBSERVADA' ? obsActa : ''
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert(`Acta cambiada a ${nuevoEstado} con éxito.`);
      setActaSeleccionada(null);
      setObsActa('');
      fetchActas();
    } catch (err) {
      alert(err.message);
    }
  };

  // If NOT logged in, show login page
  if (!token) {
    return (
      <div className="login-wrapper">
        <div className="login-left">
          <div className="login-left-logo">
            <span style={{ fontSize: '3rem', color: 'var(--primary)' }}>
              <i className="fa-solid fa-graduation-cap"></i>
            </span>
          </div>
          <h2>UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ</h2>
          <p style={{ marginTop: '10px', fontSize: '1.2rem', fontFamily: 'Lora, serif' }}>
            Facultad de Ingeniería de Sistemas (FIS)
          </p>
          <p style={{ marginTop: '20px', fontSize: '0.9rem', opacity: 0.85 }}>
            Plataforma ERP de Gestión Académica Integrada. Sigue los lineamientos de diseño institucional del UI Kit.
          </p>
        </div>

        <div className="login-right">
          <div className="login-right-header">
            <div>
              <h3>Intranet Académica</h3>
              <p className="subtitle">Acceso seguro al sistema de gestión</p>
            </div>
          </div>

          {!showForgotModal ? (
            <form onSubmit={handleLogin}>
              {loginError && (
                <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 600 }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> {loginError}
                </div>
              )}
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Usuario / Código</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="Ej: admin, docente, student"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontWeight: 600 }}>Contraseña</label>
                  <a href="#forgot" onClick={() => { setShowForgotModal(true); setLoginError(''); }} style={{ color: 'var(--primary-light)', textDecoration: 'none', fontSize: '0.85rem' }}>
                    ¿Olvidó su contraseña?
                  </a>
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="btn"
                style={{ width: '100%', backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '1rem', display: 'flex', justifyContent: 'center' }}
              >
                {loginLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Iniciar Sesión'}
              </button>
            </form>
          ) : (
            <div>
              <h4 style={{ marginBottom: '10px', fontFamily: 'Lora, serif', fontSize: '1.2rem' }}>Restablecer Contraseña</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '15px' }}>
                Ingresa tu correo institucional registrado para simular el envío de las instrucciones.
              </p>

              {forgotError && (
                <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                  {forgotError}
                </div>
              )}
              {forgotSuccess && (
                <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 600 }}>
                  <i className="fa-solid fa-circle-check"></i> {forgotSuccess}
                </div>
              )}

              <form onSubmit={handleForgotPassword}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Correo Electrónico</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    placeholder="ejemplo@uncp.edu.pe"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn"
                    style={{ flex: 1, backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '10px', borderRadius: '4px' }}
                  >
                    {forgotLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Solicitar Enlace'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(false); setForgotSuccess(''); setForgotError(''); }}
                    className="btn"
                    style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-main)', border: 'none', padding: '10px', borderRadius: '4px' }}
                  >
                    Volver
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Access Helper (Credenciales Rápidas) */}
          <div className="login-assistant-card">
            <h4>Acceso de Prueba Rápido (Seeding Académico)</h4>
            <div className="login-assistant-grid">
              <button onClick={() => handleQuickLogin('admin', 'admin123')} style={{ padding: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'left', fontSize: '0.8rem', background: '#fff' }}>
                <strong>Admin:</strong> admin / admin123
              </button>
              <button onClick={() => handleQuickLogin('docente', 'docente123')} style={{ padding: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'left', fontSize: '0.8rem', background: '#fff' }}>
                <strong>Docente:</strong> docente / docente123
              </button>
              <button onClick={() => handleQuickLogin('student', 'student123')} style={{ padding: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'left', fontSize: '0.8rem', background: '#fff' }}>
                <strong>Estudiante:</strong> student / student123
              </button>
              <button onClick={() => handleQuickLogin('director', 'director123')} style={{ padding: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'left', fontSize: '0.8rem', background: '#fff' }}>
                <strong>Dirección:</strong> director / director123
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGGED IN USER INTERFACE ---
  const activeUnreadCount = notifications.filter(n => n.unread).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Simulator Bar */}
      <div className="simulator-bar">
        <div className="simulator-title">
          <i className="fa-solid fa-screwdriver-wrench"></i>
          <span>Entorno de Pruebas FIS UNCP</span>
        </div>
        <div className="simulator-controls">
          <span>Usuario Activo: <strong>{user?.name}</strong> ({user?.role?.toUpperCase()})</span>
        </div>
      </div>

      {/* Header */}
      <header>
        <div className="brand-section">
          <div className="brand-logos">
            <span style={{ fontSize: '2rem', color: 'var(--primary)' }}>
              <i className="fa-solid fa-graduation-cap"></i>
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Lora, serif', marginLeft: '5px' }}>
              FIS UNCP INTRANET
            </span>
          </div>
        </div>

        <div className="user-actions">
          {/* Notifications bell */}
          <div className="notification-bell" onClick={() => { setShowNotifications(!showNotifications); markNotificationsRead(); }} style={{ position: 'relative' }}>
            <i className="fa-solid fa-bell"></i>
            {activeUnreadCount > 0 && <span className="notification-badge">{activeUnreadCount}</span>}

            {/* Dropdown menu */}
            {showNotifications && (
              <div className="notifications-dropdown" style={{ display: 'block', top: '35px' }}>
                <div className="notifications-header">
                  <span>Notificaciones</span>
                  <span onClick={() => setNotifications([])}>Limpiar</span>
                </div>
                <div className="notifications-list">
                  {notifications.length === 0 ? (
                    <div style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                      No tienes notificaciones
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notification-item ${n.unread ? 'unread' : ''}`}>
                        <div>{n.text}</div>
                        <div className="notification-item-time">{n.time}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile dropdown info */}
          <div className="user-profile-header" onClick={() => setActiveTab('profile')}>
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info-text">
              <span className="name">{user?.name}</span>
              <span className="role">{user?.role?.toUpperCase()}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--danger)' }}>
            <i className="fa-solid fa-right-from-bracket"></i> Salir
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-menu-wrapper">
            <ul className="sidebar-menu">
              <li className={`sidebar-item ${activeTab === 'inicio' ? 'active' : ''}`}>
                <a href="#inicio" onClick={() => setActiveTab('inicio')}>
                  <i className="fa-solid fa-chart-line"></i> Inicio
                </a>
              </li>

              {/* Conditionally rendered tabs based on user role */}
              {user?.role === 'administrador' && (
                <>
                  <li className={`sidebar-item ${activeTab === 'users_crud' ? 'active' : ''}`}>
                    <a href="#users" onClick={() => setActiveTab('users_crud')}>
                      <i className="fa-solid fa-users-gear"></i> Control de Usuarios
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'actas_direccion' ? 'active' : ''}`}>
                    <a href="#actas" onClick={() => setActiveTab('actas_direccion')}>
                      <i className="fa-solid fa-file-signature"></i> Validar Actas
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'gestion_matriculas' ? 'active' : ''}`}>
                    <a href="#gestion_matriculas" onClick={() => setActiveTab('gestion_matriculas')}>
                      <i className="fa-solid fa-folder-open"></i> Gestión de Matrículas
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'reportes_consolidados' ? 'active' : ''}`}>
                    <a href="#reportes_consolidados" onClick={() => setActiveTab('reportes_consolidados')}>
                      <i className="fa-solid fa-graduation-cap"></i> Reportes Académicos
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'gestion_certificados' ? 'active' : ''}`}>
                    <a href="#gestion_certificados" onClick={() => setActiveTab('gestion_certificados')}>
                      <i className="fa-solid fa-file-invoice"></i> Gestión de Certificados
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'estadisticas_matricula' ? 'active' : ''}`}>
                    <a href="#estadisticas" onClick={() => setActiveTab('estadisticas_matricula')}>
                      <i className="fa-solid fa-chart-pie"></i> Estadísticas Matrícula
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'audit_logs' ? 'active' : ''}`}>
                    <a href="#logs" onClick={() => setActiveTab('audit_logs')}>
                      <i className="fa-solid fa-shield-halved"></i> Bitácora de Auditoría
                    </a>
                  </li>
                </>
              )}

              {user?.role === 'direccion' && (
                <>
                  <li className={`sidebar-item ${activeTab === 'supervision_direccion' ? 'active' : ''}`}>
                    <a href="#supervision" onClick={() => setActiveTab('supervision_direccion')}>
                      <i className="fa-solid fa-chart-pie"></i> Supervisión de Cursos
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'indicadores_direccion' ? 'active' : ''}`}>
                    <a href="#indicadores" onClick={() => setActiveTab('indicadores_direccion')}>
                      <i className="fa-solid fa-chart-line"></i> Indicadores de Notas
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'actas_direccion' ? 'active' : ''}`}>
                    <a href="#actas" onClick={() => setActiveTab('actas_direccion')}>
                      <i className="fa-solid fa-file-signature"></i> Validar Actas
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'rendimiento_cohorte' ? 'active' : ''}`}>
                    <a href="#rendimiento_cohorte" onClick={() => setActiveTab('rendimiento_cohorte')}>
                      <i className="fa-solid fa-chart-line"></i> Rendimiento por Cohorte
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'autorizar_certificados' ? 'active' : ''}`}>
                    <a href="#autorizar_certificados" onClick={() => setActiveTab('autorizar_certificados')}>
                      <i className="fa-solid fa-user-shield"></i> Autorizar Certificados
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'estadisticas_matricula' ? 'active' : ''}`}>
                    <a href="#estadisticas" onClick={() => setActiveTab('estadisticas_matricula')}>
                      <i className="fa-solid fa-chart-pie"></i> Estadísticas Matrícula
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'audit_logs' ? 'active' : ''}`}>
                    <a href="#logs" onClick={() => setActiveTab('audit_logs')}>
                      <i className="fa-solid fa-shield-halved"></i> Bitácora de Auditoría
                    </a>
                  </li>
                </>
              )}

              {user?.role === 'estudiante' && (
                <>
                  <li className={`sidebar-item ${activeTab === 'proceso_matricula' ? 'active' : ''}`}>
                    <a href="#proceso_matricula" onClick={() => setActiveTab('proceso_matricula')}>
                      <i className="fa-solid fa-file-signature"></i> Matrícula en Línea
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'mis_matriculas' ? 'active' : ''}`}>
                    <a href="#mis_matriculas" onClick={() => setActiveTab('mis_matriculas')}>
                      <i className="fa-solid fa-folder-open"></i> Mis Matrículas
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'matricula_estudiante' ? 'active' : ''}`}>
                    <a href="#matricula" onClick={() => setActiveTab('matricula_estudiante')}>
                      <i className="fa-solid fa-list-check"></i> Matrícula (Secciones)
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'notas_estudiante' ? 'active' : ''}`}>
                    <a href="#notas" onClick={() => setActiveTab('notas_estudiante')}>
                      <i className="fa-solid fa-file-invoice"></i> Consultar Notas
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'record_estudiante' ? 'active' : ''}`}>
                    <a href="#record" onClick={() => setActiveTab('record_estudiante')}>
                      <i className="fa-solid fa-graduation-cap"></i> Mi Récord Académico
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'certificados_estudiante' ? 'active' : ''}`}>
                    <a href="#certificados" onClick={() => setActiveTab('certificados_estudiante')}>
                      <i className="fa-solid fa-file-contract"></i> Certificados (ERP)
                    </a>
                  </li>
                  <li className={`sidebar-item ${activeTab === 'certificados_tradicional' ? 'active' : ''}`}>
                    <a href="#certificados_firma" onClick={() => setActiveTab('certificados_tradicional')}>
                      <i className="fa-solid fa-file-pdf"></i> Trámites y Firmas
                    </a>
                  </li>
                </>
              )}

              {user?.role === 'docente' && (
                <>
                  <li className={`sidebar-item ${activeTab === 'cursos_docente' ? 'active' : ''}`}>
                    <a href="#cursos" onClick={() => setActiveTab('cursos_docente')}>
                      <i className="fa-solid fa-book-open"></i> Mis Cursos
                    </a>
                  </li>
                </>
              )}

              <li className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}>
                <a href="#profile" onClick={() => setActiveTab('profile')}>
                  <i className="fa-solid fa-user-circle"></i> Mi Perfil
                </a>
              </li>
            </ul>
          </div>

          <div className="sidebar-footer">
            <span>FIS UNCP &copy; 2026</span>
          </div>
        </aside>

        {/* Content Area */}
        <main className="content-area">
          {/* VISTAS DE MATRICULA */}
          {activeTab === 'proceso_matricula' && user?.role === 'estudiante' && (
            <ProcesoMatricula token={token} alTerminar={() => setActiveTab('mis_matriculas')} />
          )}
          {activeTab === 'mis_matriculas' && user?.role === 'estudiante' && (
            <MisMatriculas token={token} alSolicitarNueva={() => setActiveTab('proceso_matricula')} />
          )}
          {activeTab === 'gestion_matriculas' && user?.role === 'administrador' && (
            <GestionSolicitudes token={token} />
          )}
          {activeTab === 'estadisticas_matricula' && (user?.role === 'direccion' || user?.role === 'administrador') && (
            <EstadisticasMatricula token={token} />
          )}

          {/* VISTAS DE RECORD ACADEMICO */}
          {activeTab === 'record_estudiante' && user?.role === 'estudiante' && (
            <RecordEstudiante token={token} />
          )}
          {activeTab === 'reportes_consolidados' && user?.role === 'administrador' && (
            <ReportesConsolidados token={token} />
          )}
          {activeTab === 'rendimiento_cohorte' && user?.role === 'direccion' && (
            <AnalisisCohorte token={token} />
          )}

          {/* VISTAS DE CERTIFICADOS */}
          {activeTab === 'certificados_estudiante' && user?.role === 'estudiante' && (
            <SolicitudCertificados token={token} />
          )}
          {activeTab === 'gestion_certificados' && user?.role === 'administrador' && (
            <GestionCertificados token={token} />
          )}
          {activeTab === 'autorizar_certificados' && user?.role === 'direccion' && (
            <AutorizacionCertificados token={token} />
          )}

          {/* 1. INICIO VIEW */}
          {activeTab === 'inicio' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.8rem' }}>Bienvenido de nuevo, {user?.name}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Panel institucional de control y seguimiento académico.</p>
              </div>

              {/* Dynamic widgets based on Role */}
              {user?.role === 'administrador' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', marginBottom: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>MÓDULO SEGURIDAD</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Control de Accesos</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}><i className="fa-solid fa-circle-check"></i> Roles de Usuario Activos</span>
                  </div>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', marginBottom: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>BASE DE DATOS</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>PostgreSQL</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}><i className="fa-solid fa-database"></i> Conexión de Producción</span>
                  </div>
                </div>
              )}

              {user?.role === 'direccion' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', marginBottom: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>TASA MATRÍCULA</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>87%</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}><i className="fa-solid fa-arrow-trend-up"></i> +2.3% este ciclo</span>
                  </div>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', marginBottom: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>AUDITORÍA DE ACCIONES</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Bitácora</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}><i className="fa-solid fa-shield-halved"></i> Registrando logs en BD</span>
                  </div>
                </div>
              )}

              {user?.role === 'estudiante' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', marginBottom: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>PROMEDIO PONDERADO</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>15.42</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}><i className="fa-solid fa-award"></i> Tercio Superior</span>
                  </div>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', marginBottom: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>CRÉDITOS APROBADOS</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>124 / 220</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>Ciclo 2026-I</span>
                  </div>
                </div>
              )}

              {user?.role === 'docente' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', marginBottom: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>SECCIONES ASIGNADAS</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{seccionesDocente.length} {seccionesDocente.length === 1 ? 'Curso' : 'Cursos'}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>Ciclo Académico 2026-I</span>
                  </div>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', marginBottom: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>ESTUDIANTES REGISTRADOS</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{seccionesDocente.reduce((acc, s) => acc + (s.cantidad_estudiantes || 0), 0)} Alumnos</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}><i className="fa-solid fa-user-graduate"></i> En Aula Virtual</span>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><i className="fa-solid fa-circle-info"></i> Resumen del Sistema Académico (ERP)</h3>
                </div>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <p>Te encuentras en el panel de control institucional de la <strong>Facultad de Ingeniería de Sistemas (UNCP)</strong>. Como administrador de la plataforma, puedes supervisar y gestionar:</p>
                  <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                    <li><strong>Control de Matrícula y Secciones</strong>: Validación de requisitos, costos académicos y estados de pago.</li>
                    <li><strong>Registro de Notas y Actas</strong>: Seguimiento a calificaciones parciales, consolidados académicos y actas firmadas.</li>
                    <li><strong>Trámites y Certificados</strong>: Emisión de constancias de matrícula y notas certificadas con validación digital.</li>
                    <li><strong>Bitácora de Auditoría en Tiempo Real</strong>: Control detallado de accesos, seguridad y acciones del personal.</li>
                  </ul>
                  <p style={{ marginTop: '15px' }}>Usa el menú de navegación lateral para acceder a cada uno de los submódulos integrados del ERP.</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. PROFILE VIEW (AUTH-005, AUTH-004) */}
          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Profile details */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><i className="fa-solid fa-user-gear"></i> Datos Generales de la Cuenta</h3>
                </div>

                {profileSuccess && <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 600 }}>{profileSuccess}</div>}
                {profileError && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{profileError}</div>}

                <form onSubmit={handleProfileUpdate}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Nombre Completo</label>
                    <input type="text" value={user?.name || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f1f5f9' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Correo Institucional</label>
                    <input type="email" value={user?.email || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f1f5f9' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Rol del Usuario</label>
                    <input type="text" value={user?.role?.toUpperCase() || ''} readOnly style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f1f5f9' }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Teléfono</label>
                    <input type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="Teléfono celular/fijo" />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Dirección de Domicilio</label>
                    <input type="text" value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="Dirección completa" />
                  </div>
                  <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none' }}>
                    Guardar Cambios
                  </button>
                </form>
              </div>

              {/* Password update form */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><i className="fa-solid fa-lock"></i> Seguridad y Cambio de Clave</h3>
                </div>

                {pwSuccess && <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 600 }}>{pwSuccess}</div>}
                {pwError && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{pwError}</div>}

                <form onSubmit={handleChangePassword}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Contraseña Actual</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="••••••••" required />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Nueva Contraseña</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="••••••••" required />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Confirmar Nueva Contraseña</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="••••••••" required />
                  </div>
                  <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none' }}>
                    Actualizar Contraseña
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 3. USER MANAGEMENT (CRUD for Admin only - ADM-ADM-001) */}
          {activeTab === 'users_crud' && user?.role === 'administrador' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              {/* Form card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="fa-solid fa-user-plus"></i> {isEditingUser ? `Editar Usuario: ${selectedUser?.username}` : 'Registrar Nuevo Usuario'}
                  </h3>
                  {isEditingUser && (
                    <button onClick={resetUserForm} className="btn" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-main)', border: 'none' }}>
                      Cancelar Edición
                    </button>
                  )}
                </div>

                {crudSuccess && <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 600 }}>{crudSuccess}</div>}
                {crudError && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{crudError}</div>}

                <form onSubmit={handleSaveUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Código / Usuario *</label>
                    <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} required placeholder="Ej: admin, jperez" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Nombre Completo *</label>
                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} required placeholder="Nombre completo" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Correo Institucional *</label>
                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} required placeholder="usuario@uncp.edu.pe" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Rol Académico *</label>
                    <select value={formRole} onChange={(e) => setFormRole(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} required>
                      <option value="estudiante">Estudiante</option>
                      <option value="docente">Docente</option>
                      <option value="administrador">Administrador</option>
                      <option value="direccion">Dirección / Decanato</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Tipo Documento</label>
                    <select value={formDocType} onChange={(e) => setFormDocType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                      <option value="DNI">DNI</option>
                      <option value="CE">Carnet de Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Número Documento</label>
                    <input type="text" value={formDocNumber} onChange={(e) => setFormDocNumber(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} placeholder="DNI o CE" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Teléfono de Contacto</label>
                    <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Dirección Domicilio</label>
                    <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Contraseña {isEditingUser ? '(en blanco para mantener)' : '*'}
                    </label>
                    <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} required={!isEditingUser} placeholder="Mínimo 6 caracteres" />
                  </div>

                  <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                    <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none' }}>
                      <i className="fa-solid fa-save"></i> Guardar Usuario
                    </button>
                  </div>
                </form>
              </div>

              {/* Table list card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><i className="fa-solid fa-users"></i> Listado de Usuarios ERP</h3>
                  <button onClick={fetchUsers} className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--primary)' }}>
                    <i className="fa-solid fa-rotate"></i> Recargar
                  </button>
                </div>

                {usersLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                          <th style={{ padding: '10px' }}>Código</th>
                          <th style={{ padding: '10px' }}>Nombre</th>
                          <th style={{ padding: '10px' }}>Email</th>
                          <th style={{ padding: '10px' }}>Rol</th>
                          <th style={{ padding: '10px' }}>Documento</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No hay usuarios registrados
                            </td>
                          </tr>
                        ) : (
                          usersList.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={{ padding: '10px', fontWeight: 600 }}>{u.username}</td>
                              <td style={{ padding: '10px' }}>{u.name}</td>
                              <td style={{ padding: '10px' }}>{u.email}</td>
                              <td style={{ padding: '10px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: u.role === 'administrador' ? 'var(--danger-light)' : u.role === 'direccion' ? 'var(--warning-light)' : u.role === 'docente' ? 'var(--primary-light)' : 'var(--success-light)',
                                  color: u.role === 'administrador' ? 'var(--danger)' : u.role === 'direccion' ? 'var(--warning)' : u.role === 'docente' ? 'var(--primary-dark)' : 'var(--success)'
                                }}>
                                  {u.role.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '10px' }}>{u.document_type} - {u.document_number || 'N/A'}</td>
                              <td style={{ padding: '10px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <button onClick={() => startEditUser(u)} className="btn" style={{ padding: '4px 8px', backgroundColor: 'var(--primary-light)', color: 'white', border: 'none', fontSize: '0.75rem' }}>
                                  <i className="fa-solid fa-edit"></i>
                                </button>
                                <button onClick={() => handleDeleteUser(u.id)} className="btn" style={{ padding: '4px 8px', backgroundColor: 'var(--danger)', color: 'white', border: 'none', fontSize: '0.75rem' }} disabled={u.id === user.id}>
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. AUDIT LOGS VIEW (Admin/Direction - ADM-DIR-001) */}
          {activeTab === 'audit_logs' && (user?.role === 'administrador' || user?.role === 'direccion') && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><i className="fa-solid fa-shield-halved"></i> Bitácora de Auditoría del Sistema</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Filtrar por acción o usuario..."
                    value={logsFilter}
                    onChange={(e) => setLogsFilter(e.target.value)}
                    style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem', width: '220px' }}
                  />
                  <button onClick={fetchAuditLogs} className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--primary)' }}>
                    <i className="fa-solid fa-rotate"></i> Actualizar
                  </button>
                </div>
              </div>

              {logsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                        <th style={{ padding: '10px' }}>Fecha y Hora</th>
                        <th style={{ padding: '10px' }}>Usuario</th>
                        <th style={{ padding: '10px' }}>Acción</th>
                        <th style={{ padding: '10px' }}>Dirección IP</th>
                        <th style={{ padding: '10px' }}>Detalles de la Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No se encontraron registros de auditoría
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                            <td style={{ padding: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {new Date(log.timestamp).toLocaleString('es-PE')}
                            </td>
                            <td style={{ padding: '10px', fontWeight: 600 }}>{log.username || 'Sistema/Anónimo'}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                backgroundColor: log.action.includes('FAILED') ? 'var(--danger-light)' : log.action.includes('SUCCESS') || log.action.includes('CREATE') ? 'var(--success-light)' : 'var(--warning-light)',
                                color: log.action.includes('FAILED') ? 'var(--danger)' : log.action.includes('SUCCESS') || log.action.includes('CREATE') ? 'var(--success)' : 'var(--warning)'
                              }}>
                                {log.action}
                              </span>
                            </td>
                            <td style={{ padding: '10px', fontFamily: 'monospace' }}>{log.ip_address || '127.0.0.1'}</td>
                            <td style={{ padding: '10px' }}>{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. MATRICULA ESTUDIANTE VIEW */}
          {activeTab === 'matricula_estudiante' && user?.role === 'estudiante' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.8rem' }}>Matrícula en Línea</h2>
                <p style={{ color: 'var(--text-muted)' }}>Selecciona tus cursos y registra tu matrícula para el periodo actual.</p>
              </div>

              {matriculaActual ? (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title"><i className="fa-solid fa-file-invoice"></i> Estado de Matrícula Actual</h3>
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <p>Periodo Académico: <strong>{matriculaActual.periodo}</strong></p>
                    <p>Fecha de Registro: <strong>{new Date(matriculaActual.fecha_matricula).toLocaleString('es-PE')}</strong></p>
                    <p>Comprobante de Pago: <strong>{matriculaActual.comprobante_pago}</strong></p>
                    <p>Estado de Matrícula: <strong style={{ color: 'var(--success)' }}>{matriculaActual.estado_matricula.toUpperCase()}</strong></p>
                    <p>Estado de Pago: <strong style={{ color: 'var(--success)' }}>{matriculaActual.estado_pago.toUpperCase()}</strong></p>
                    <p style={{ marginTop: '15px' }}><strong>Cursos Registrados:</strong></p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                          <th style={{ padding: '8px' }}>Código</th>
                          <th style={{ padding: '8px' }}>Curso</th>
                          <th style={{ padding: '8px' }}>Créditos</th>
                          <th style={{ padding: '8px' }}>Sección</th>
                          <th style={{ padding: '8px' }}>Docente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matriculaActual.cursos.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px' }}>{c.codigo_curso}</td>
                            <td style={{ padding: '8px' }}>{c.nombre_curso}</td>
                            <td style={{ padding: '8px' }}>{c.creditos}</td>
                            <td style={{ padding: '8px' }}>{c.seccion}</td>
                            <td style={{ padding: '8px' }}>{c.docente}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSolicitarMatricula} className="card">
                  <div className="card-header">
                    <h3 className="card-title"><i className="fa-solid fa-list-check"></i> Cursos Disponibles para Matrícula</h3>
                  </div>
                  
                  <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                          <th style={{ padding: '10px' }}>Seleccionar</th>
                          <th style={{ padding: '10px' }}>Código</th>
                          <th style={{ padding: '10px' }}>Curso</th>
                          <th style={{ padding: '10px' }}>Créditos</th>
                          <th style={{ padding: '10px' }}>Sección</th>
                          <th style={{ padding: '10px' }}>Horario</th>
                          <th style={{ padding: '10px' }}>Docente</th>
                          <th style={{ padding: '10px' }}>Cupos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cursosDisponibles.map((c) => (
                          <tr key={c.seccion_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px' }}>
                              <input
                                type="checkbox"
                                value={c.seccion_id}
                                disabled={c.cupos_disponibles === 0}
                                checked={seccionSeleccionadas.includes(c.seccion_id)}
                                onChange={(e) => {
                                  const id = parseInt(e.target.value);
                                  if (e.target.checked) setSeccionSeleccionadas([...seccionSeleccionadas, id]);
                                  else setSeccionSeleccionadas(seccionSeleccionadas.filter(x => x !== id));
                                }}
                              />
                            </td>
                            <td style={{ padding: '10px', fontWeight: 600 }}>{c.curso.codigo_curso}</td>
                            <td style={{ padding: '10px' }}>{c.curso.nombre}</td>
                            <td style={{ padding: '10px' }}>{c.curso.creditos}</td>
                            <td style={{ padding: '10px' }}>{c.codigo_seccion}</td>
                            <td style={{ padding: '10px' }}>{c.horario}</td>
                            <td style={{ padding: '10px' }}>{c.docente}</td>
                            <td style={{ padding: '10px' }}>{c.cupos_disponibles} / {c.capacidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Código de Operación / Comprobante *</label>
                      <input
                        type="text"
                        value={codigoPago}
                        onChange={(e) => setCodigoPago(e.target.value)}
                        placeholder="Ej: OP-987482"
                        required
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Costo Total Matricula</label>
                      <input type="text" readOnly value="S/. 120.00" style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f1f5f9' }} />
                    </div>
                  </div>

                  <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', marginTop: '20px', borderRadius: '4px' }}>
                    Enviar Solicitud de Matrícula
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 6. NOTAS ESTUDIANTE VIEW */}
          {activeTab === 'notas_estudiante' && user?.role === 'estudiante' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.8rem' }}>Mis Notas del Periodo</h2>
                <p style={{ color: 'var(--text-muted)' }}>Consulta de calificaciones del semestre académico actual.</p>
              </div>

              {notasEstudiante && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div className="card" style={{ marginBottom: 0, padding: '15px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>CRÉDITOS MATRICULADOS</span>
                      <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{notasEstudiante.resumen.total_creditos}</h3>
                    </div>
                    <div className="card" style={{ marginBottom: 0, padding: '15px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>CRÉDITOS APROBADOS</span>
                      <h3 style={{ fontSize: '1.8rem', color: 'var(--success)' }}>{notasEstudiante.resumen.creditos_aprobados}</h3>
                    </div>
                    <div className="card" style={{ marginBottom: 0, padding: '15px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PROMEDIO PONDERADO</span>
                      <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{notasEstudiante.resumen.promedio_ponderado}</h3>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title"><i className="fa-solid fa-file-invoice"></i> Hoja de Calificaciones ({notasEstudiante.periodo_codigo})</h3>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                            <th style={{ padding: '10px' }}>Código</th>
                            <th style={{ padding: '10px' }}>Curso</th>
                            <th style={{ padding: '10px' }}>Créditos</th>
                            <th style={{ padding: '10px' }}>Sección</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>PC1</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>PC2</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>EC</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>EF</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Promedio</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notasEstudiante.notas.length === 0 ? (
                            <tr>
                              <td colSpan="10" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No se encontraron notas registradas para este periodo
                              </td>
                            </tr>
                          ) : (
                            notasEstudiante.notas.map((n, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '10px', fontWeight: 600 }}>{n.codigo_curso}</td>
                                <td style={{ padding: '10px' }}>{n.nombre_curso}</td>
                                <td style={{ padding: '10px' }}>{n.creditos}</td>
                                <td style={{ padding: '10px' }}>{n.seccion}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{n.nota.nota_parcial1 !== null ? n.nota.nota_parcial1 : '-'}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{n.nota.nota_parcial2 !== null ? n.nota.nota_parcial2 : '-'}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{n.nota.evaluacion_continua !== null ? n.nota.evaluacion_continua : '-'}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{n.nota.examen_final !== null ? n.nota.examen_final : '-'}</td>
                                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{n.nota.promedio_final !== null ? n.nota.promedio_final : '-'}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    backgroundColor: n.nota.estado === 'APROBADO' ? 'var(--success-light)' : n.nota.estado === 'DESAPROBADO' ? 'var(--danger-light)' : 'var(--warning-light)',
                                    color: n.nota.estado === 'APROBADO' ? 'var(--success)' : n.nota.estado === 'DESAPROBADO' ? 'var(--danger)' : 'var(--warning)'
                                  }}>
                                    {n.nota.estado}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. CERTIFICADOS ESTUDIANTE VIEW */}
          {activeTab === 'certificados_tradicional' && user?.role === 'estudiante' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><i className="fa-solid fa-file-signature"></i> Solicitar Trámite / Certificado</h3>
                </div>
                <form onSubmit={handleSolicitarDocumento}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Tipo de Trámite</label>
                    <select
                      value={tipoDocSelect}
                      onChange={(e) => setTipoDocSelect(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                    >
                      <option value="constancia_matricula">Constancia de Matrícula</option>
                      <option value="certificado_estudios">Certificado Oficial de Estudios</option>
                    </select>
                  </div>
                  
                  <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px' }}>
                    Enviar Solicitud
                  </button>
                </form>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><i className="fa-solid fa-file-pdf"></i> Mis Solicitudes y Constancias</h3>
                </div>
                <div style={{ overflowY: 'auto', maxHeight: '350px' }}>
                  {documentosList.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>No has realizado solicitudes.</p>
                  ) : (
                    documentosList.map(doc => (
                      <div key={doc.id} style={{ borderBottom: '1px solid var(--border-color)', padding: '10px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                          <span>{doc.tipo_documento.replace('_', ' ').toUpperCase()}</span>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            backgroundColor: doc.estado === 'emitido' ? 'var(--success-light)' : 'var(--warning-light)',
                            color: doc.estado === 'emitido' ? 'var(--success)' : 'var(--warning)'
                          }}>{doc.estado.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <span>Fecha: {new Date(doc.fecha_solicitud).toLocaleDateString()}</span>
                        </div>
                        {doc.estado === 'emitido' && (
                          <div style={{ marginTop: '8px', padding: '8px', border: '1px dashed var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: 'var(--bg-body)' }}>
                            <p style={{ fontFamily: 'monospace' }}>Verificación Firma: {doc.firma_digital_hash ? doc.firma_digital_hash.substring(0, 16) : 'N/A'}...</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Código QR Hash: {doc.qr_code_hash}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 8. CURSOS DOCENTE VIEW */}
          {activeTab === 'cursos_docente' && user?.role === 'docente' && (
            <div>
              {!seccionSeleccionada ? (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title"><i className="fa-solid fa-chalkboard-user"></i> Cursos Asignados en el Ciclo</h3>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                          <th style={{ padding: '10px' }}>Código</th>
                          <th style={{ padding: '10px' }}>Curso</th>
                          <th style={{ padding: '10px' }}>Créditos</th>
                          <th style={{ padding: '10px' }}>Sección</th>
                          <th style={{ padding: '10px' }}>Horario</th>
                          <th style={{ padding: '10px' }}>Estudiantes</th>
                          <th style={{ padding: '10px' }}>Estado Acta</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seccionesDocente.map((s) => (
                          <tr key={s.seccion_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '10px', fontWeight: 600 }}>{s.curso.codigo_curso}</td>
                            <td style={{ padding: '10px' }}>{s.curso.nombre}</td>
                            <td style={{ padding: '10px' }}>{s.curso.creditos}</td>
                            <td style={{ padding: '10px' }}>{s.codigo_seccion}</td>
                            <td style={{ padding: '10px' }}>{s.horario}</td>
                            <td style={{ padding: '10px' }}>{s.cantidad_estudiantes} / {s.capacidad}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: s.estado_acta === 'CONSOLIDADA' ? 'var(--success-light)' : s.estado_acta === 'ENVIADA' ? 'var(--warning-light)' : 'var(--danger-light)',
                                color: s.estado_acta === 'CONSOLIDADA' ? 'var(--success)' : s.estado_acta === 'ENVIADA' ? 'var(--warning)' : 'var(--danger)'
                              }}>
                                {s.estado_acta}
                              </span>
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <button onClick={() => fetchDetalleSeccion(s.seccion_id)} className="btn" style={{ padding: '4px 10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontSize: '0.8rem' }}>
                                <i className="fa-solid fa-gear"></i> Gestionar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={() => setSeccionSeleccionada(null)} className="btn" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-main)', border: 'none', marginBottom: '15px' }}>
                    <i className="fa-solid fa-arrow-left"></i> Volver a Cursos
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div className="card" style={{ marginBottom: 0 }}>
                      <div className="card-header">
                        <h3 className="card-title"><i className="fa-solid fa-circle-info"></i> Detalle de la Sección</h3>
                      </div>
                      <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                        <p>Curso: <strong>{seccionSeleccionada.curso.nombre} ({seccionSeleccionada.curso.codigo_curso})</strong></p>
                        <p>Sección: <strong>{seccionSeleccionada.codigo_seccion}</strong></p>
                        <p>Horario: <strong>{seccionSeleccionada.horario}</strong></p>
                        <p>Capacidad: <strong>{seccionSeleccionada.capacidad} estudiantes</strong></p>
                        
                        <div style={{ marginTop: '15px', padding: '10px', border: '1px dashed var(--border-color)', borderRadius: '4px' }}>
                          <p><strong>Sílabo Oficial del Curso:</strong></p>
                          {seccionSeleccionada.silabo_url ? (
                            <p style={{ marginTop: '4px' }}><a href={seccionSeleccionada.silabo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'none' }}><i className="fa-solid fa-file-pdf"></i> Ver Sílabo Cargado</a></p>
                          ) : (
                            <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>Sílabo no registrado.</p>
                          )}
                          <div style={{ marginTop: '8px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Cargar/Actualizar Sílabo (PDF/Word):</label>
                            <input
                              type="file"
                              accept=".pdf,.docx,.doc"
                              onChange={(e) => handleUploadSilabo(seccionSeleccionada.seccion_id, e.target.files[0])}
                              style={{ marginTop: '5px', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card" style={{ marginBottom: 0 }}>
                      <div className="card-header">
                        <h3 className="card-title"><i className="fa-solid fa-signature"></i> Control de Acta Académica</h3>
                      </div>
                      <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                        <p>Estado del Acta: <strong>{seccionSeleccionada.estado_acta}</strong></p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                          Para enviar el acta oficial, debe guardar las calificaciones de todos los alumnos matriculados. Una vez enviada, el acta quedará bloqueada para revisión del Director y el Administrador.
                        </p>
                        <button
                          onClick={() => handleEnviarActa(seccionSeleccionada.seccion_id)}
                          disabled={seccionSeleccionada.estado_acta === 'ENVIADA' || seccionSeleccionada.estado_acta === 'CONSOLIDADA'}
                          className="btn"
                          style={{ width: '100%', backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '10px', marginTop: '20px', borderRadius: '4px' }}
                        >
                          <i className="fa-solid fa-paper-plane"></i> Enviar Acta de Calificaciones
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title"><i className="fa-solid fa-table"></i> Registro de Notas en el Sistema</h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                            <th style={{ padding: '10px' }}>Código</th>
                            <th style={{ padding: '10px' }}>Estudiante</th>
                            <th style={{ padding: '10px', textAlign: 'center', width: '100px' }}>PC 1</th>
                            <th style={{ padding: '10px', textAlign: 'center', width: '100px' }}>PC 2</th>
                            <th style={{ padding: '10px', textAlign: 'center', width: '100px' }}>EC</th>
                            <th style={{ padding: '10px', textAlign: 'center', width: '100px' }}>EF</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Promedio</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Consolidada</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notasSeccion.map((row) => (
                            <tr key={row.detalle_matricula_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '10px', fontWeight: 600 }}>{row.codigo_estudiante}</td>
                              <td style={{ padding: '10px' }}>{row.nombre}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  value={notasEditState[row.detalle_matricula_id]?.nota_parcial1 || 0}
                                  disabled={seccionSeleccionada.estado_acta === 'ENVIADA' || seccionSeleccionada.estado_acta === 'CONSOLIDADA'}
                                  onChange={(e) => {
                                    setNotasEditState({
                                      ...notasEditState,
                                      [row.detalle_matricula_id]: {
                                        ...notasEditState[row.detalle_matricula_id],
                                        nota_parcial1: e.target.value
                                      }
                                    });
                                  }}
                                  style={{ width: '70px', padding: '5px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  value={notasEditState[row.detalle_matricula_id]?.nota_parcial2 || 0}
                                  disabled={seccionSeleccionada.estado_acta === 'ENVIADA' || seccionSeleccionada.estado_acta === 'CONSOLIDADA'}
                                  onChange={(e) => {
                                    setNotasEditState({
                                      ...notasEditState,
                                      [row.detalle_matricula_id]: {
                                        ...notasEditState[row.detalle_matricula_id],
                                        nota_parcial2: e.target.value
                                      }
                                    });
                                  }}
                                  style={{ width: '70px', padding: '5px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  value={notasEditState[row.detalle_matricula_id]?.evaluacion_continua || 0}
                                  disabled={seccionSeleccionada.estado_acta === 'ENVIADA' || seccionSeleccionada.estado_acta === 'CONSOLIDADA'}
                                  onChange={(e) => {
                                    setNotasEditState({
                                      ...notasEditState,
                                      [row.detalle_matricula_id]: {
                                        ...notasEditState[row.detalle_matricula_id],
                                        evaluacion_continua: e.target.value
                                      }
                                    });
                                  }}
                                  style={{ width: '70px', padding: '5px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  value={notasEditState[row.detalle_matricula_id]?.examen_final || 0}
                                  disabled={seccionSeleccionada.estado_acta === 'ENVIADA' || seccionSeleccionada.estado_acta === 'CONSOLIDADA'}
                                  onChange={(e) => {
                                    setNotasEditState({
                                      ...notasEditState,
                                      [row.detalle_matricula_id]: {
                                        ...notasEditState[row.detalle_matricula_id],
                                        examen_final: e.target.value
                                      }
                                    });
                                  }}
                                  style={{ width: '70px', padding: '5px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>
                                {row.nota.promedio_final}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <span style={{ color: row.nota.consolidada ? 'var(--success)' : 'var(--danger)' }}>
                                  {row.nota.consolidada ? 'SI' : 'NO'}
                                </span>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleUpdateNota(seccionSeleccionada.seccion_id, row.detalle_matricula_id)}
                                  disabled={seccionSeleccionada.estado_acta === 'ENVIADA' || seccionSeleccionada.estado_acta === 'CONSOLIDADA'}
                                  className="btn"
                                  style={{ padding: '5px 10px', fontSize: '0.75rem', backgroundColor: 'var(--success)', color: 'white', border: 'none' }}
                                >
                                  <i className="fa-solid fa-save"></i> Guardar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 9. SUPERVISIÓN DIRECCIÓN VIEW */}
          {activeTab === 'supervision_direccion' && (user?.role === 'direccion' || user?.role === 'administrador') && supervisionData && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.8rem' }}>Supervisión de Cursos</h2>
                <p style={{ color: 'var(--text-muted)' }}>Métricas del plan de estudios y cumplimiento docente del periodo.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SECCIONES CON DOCENTE</span>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{supervisionData.indicadores.porcentaje_secciones_con_docente}%</h3>
                  <span style={{ fontSize: '0.75rem' }}>{supervisionData.indicadores.secciones_con_docente} / {supervisionData.indicadores.total_secciones} secciones</span>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SÍLABOS CARGADOS</span>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--success)' }}>{supervisionData.indicadores.porcentaje_silabos_cargados}%</h3>
                  <span style={{ fontSize: '0.75rem' }}>{supervisionData.indicadores.silabos_cargados} / {supervisionData.indicadores.total_secciones} sílabos</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title"><i className="fa-solid fa-user-clock"></i> Reporte de Carga Horaria Docente</h3>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                        <th style={{ padding: '8px' }}>Docente</th>
                        <th style={{ padding: '8px' }}>Secciones</th>
                        <th style={{ padding: '8px' }}>Créditos</th>
                        <th style={{ padding: '8px' }}>Horas Semanales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisionData.carga_docentes.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{d.nombre}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{d.total_secciones}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{d.total_creditos}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{d.total_horas} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title"><i className="fa-solid fa-triangle-exclamation"></i> Secciones sin Docente Asignado</h3>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                        <th style={{ padding: '8px' }}>Curso</th>
                        <th style={{ padding: '8px' }}>Código</th>
                        <th style={{ padding: '8px' }}>Sección</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisionData.secciones_sin_docente.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>Todo en orden. Todas las secciones tienen docente.</td>
                        </tr>
                      ) : (
                        supervisionData.secciones_sin_docente.map((s, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px' }}>{s.nombre_curso}</td>
                            <td style={{ padding: '8px' }}>{s.codigo_curso}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{s.seccion}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 10. INDICADORES DIRECCIÓN VIEW */}
          {activeTab === 'indicadores_direccion' && (user?.role === 'direccion' || user?.role === 'administrador') && indicadoresData && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.8rem' }}>Indicadores Académicos</h2>
                <p style={{ color: 'var(--text-muted)' }}>Reportes estadísticos de rendimiento del alumnado y actas consolidadas.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PROMEDIO INSTITUCIONAL</span>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{indicadoresData.indicadores.promedio_institucional}</h3>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>TASA DE APROBACIÓN</span>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--success)' }}>{indicadoresData.indicadores.tasa_aprobacion}%</h3>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>TASA DE DESAPROBACIÓN</span>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--danger)' }}>{indicadoresData.indicadores.tasa_desaprobacion}%</h3>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header">
                    <h3 className="card-title"><i className="fa-solid fa-circle-check"></i> Actas de Notas del Periodo</h3>
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
                    <p>Actas Consolidadas Oficiales: <strong style={{ color: 'var(--success)' }}>{indicadoresData.indicadores.actas_consolidadas} actas</strong></p>
                    <p>Actas Pendientes de Aprobación: <strong style={{ color: 'var(--warning)' }}>{indicadoresData.indicadores.actas_pendientes} actas</strong></p>
                    <p>Total Calificaciones Registradas: <strong>{indicadoresData.indicadores.total_notas_evaluadas} registros</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 11. VALIDAR ACTAS VIEW */}
          {activeTab === 'actas_direccion' && (user?.role === 'direccion' || user?.role === 'administrador') && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.8rem' }}>Validación y Consolidación de Actas</h2>
                <p style={{ color: 'var(--text-muted)' }}>Revisión de actas oficiales de notas enviadas por los docentes para su publicación.</p>
              </div>

              {!actaSeleccionada ? (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title"><i className="fa-solid fa-clipboard-list"></i> Actas de Notas Recibidas</h3>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                          <th style={{ padding: '10px' }}>ID Acta</th>
                          <th style={{ padding: '10px' }}>Curso</th>
                          <th style={{ padding: '10px' }}>Sección</th>
                          <th style={{ padding: '10px' }}>Docente</th>
                          <th style={{ padding: '10px' }}>Estudiantes</th>
                          <th style={{ padding: '10px' }}>Fecha Envío</th>
                          <th style={{ padding: '10px' }}>Estado</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actasList.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No hay actas enviadas pendientes en este momento
                            </td>
                          </tr>
                        ) : (
                          actasList.map((a) => (
                            <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '10px', fontWeight: 600 }}>{a.id}</td>
                              <td style={{ padding: '10px' }}>{a.seccion.curso} ({a.seccion.codigo_curso})</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>{a.seccion.codigo_seccion}</td>
                              <td style={{ padding: '10px' }}>{a.seccion.docente}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>{a.cantidad_estudiantes}</td>
                              <td style={{ padding: '10px' }}>{a.fecha_envio ? new Date(a.fecha_envio).toLocaleString('es-PE') : 'No registrada'}</td>
                              <td style={{ padding: '10px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: a.estado === 'CONSOLIDADA' ? 'var(--success-light)' : a.estado === 'ENVIADA' ? 'var(--warning-light)' : 'var(--danger-light)',
                                  color: a.estado === 'CONSOLIDADA' ? 'var(--success)' : a.estado === 'ENVIADA' ? 'var(--warning)' : 'var(--danger)'
                                }}>
                                  {a.estado}
                                </span>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${API_BASE_URL}/direccion/actas/${a.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                                      const data = await res.json();
                                      if (res.ok) setActaSeleccionada(data);
                                    } catch (err) { alert('Error al cargar detalle'); }
                                  }}
                                  className="btn"
                                  style={{ padding: '4px 10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', fontSize: '0.8rem' }}
                                >
                                  <i className="fa-solid fa-eye"></i> Revisar
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={() => setActaSeleccionada(null)} className="btn" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-main)', border: 'none', marginBottom: '15px' }}>
                    <i className="fa-solid fa-arrow-left"></i> Volver a Actas
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div className="card" style={{ marginBottom: 0 }}>
                      <div className="card-header">
                        <h3 className="card-title"><i className="fa-solid fa-circle-check"></i> Detalle del Acta</h3>
                      </div>
                      <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                        <p>ID Acta: <strong>{actaSeleccionada.id}</strong></p>
                        <p>Curso: <strong>{actaSeleccionada.seccion.curso} ({actaSeleccionada.seccion.codigo_curso})</strong></p>
                        <p>Sección: <strong>{actaSeleccionada.seccion.codigo_seccion}</strong></p>
                        <p>Docente: <strong>{actaSeleccionada.seccion.docente}</strong></p>
                        <p>Estado Actual: <strong style={{ color: 'var(--warning)' }}>{actaSeleccionada.estado}</strong></p>
                      </div>
                    </div>

                    <div className="card" style={{ marginBottom: 0 }}>
                      <div className="card-header">
                        <h3 className="card-title"><i className="fa-solid fa-gavel"></i> Acciones de Decisión</h3>
                      </div>
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Observaciones (Obligatorio si se observa)</label>
                          <textarea
                            value={obsActa}
                            onChange={(e) => setObsActa(e.target.value)}
                            placeholder="Escriba aquí las observaciones si encuentra inconsistencias..."
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', height: '80px', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => {
                              if (!obsActa) { alert('Ingrese observaciones para observar el acta.'); return; }
                              handleCambiarEstadoActa(actaSeleccionada.id, 'OBSERVADA');
                            }}
                            className="btn"
                            style={{ flex: 1, backgroundColor: 'var(--danger)', color: 'white', border: 'none' }}
                          >
                            Observar Acta
                          </button>
                          <button
                            onClick={() => handleCambiarEstadoActa(actaSeleccionada.id, 'CONSOLIDADA')}
                            className="btn"
                            style={{ flex: 1, backgroundColor: 'var(--success)', color: 'white', border: 'none' }}
                          >
                            Consolidar Acta
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title"><i className="fa-solid fa-table"></i> Calificaciones Cargadas</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                          <th style={{ padding: '8px' }}>Código Estudiante</th>
                          <th style={{ padding: '8px' }}>Nombre</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>PC 1</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>PC 2</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>EC</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>EF</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Promedio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actaSeleccionada.notas.map((n, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{n.codigo_estudiante}</td>
                            <td style={{ padding: '8px' }}>{n.nombre}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{n.nota ? n.nota.nota_parcial1 : '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{n.nota ? n.nota.nota_parcial2 : '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{n.nota ? n.nota.evaluacion_continua : '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{n.nota ? n.nota.examen_final : '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{n.nota ? n.nota.promedio_final : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
