import React, { useState, useEffect } from 'react';
import './App.css';

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
                  <li className={`sidebar-item ${activeTab === 'audit_logs' ? 'active' : ''}`}>
                    <a href="#logs" onClick={() => setActiveTab('audit_logs')}>
                      <i className="fa-solid fa-shield-halved"></i> Bitácora de Auditoría
                    </a>
                  </li>
                </>
              )}

              {user?.role === 'direccion' && (
                <li className={`sidebar-item ${activeTab === 'audit_logs' ? 'active' : ''}`}>
                  <a href="#logs" onClick={() => setActiveTab('audit_logs')}>
                    <i className="fa-solid fa-shield-halved"></i> Bitácora de Auditoría
                  </a>
                </li>
              )}

              {user?.role === 'estudiante' && (
                <>
                  <li className="sidebar-item">
                    <a href="#matricula" onClick={() => alert('Módulo de Matrícula - Asignado a Benjamin (en desarrollo)')}>
                      <i className="fa-solid fa-file-signature"></i> Matrícula en Línea
                    </a>
                  </li>
                  <li className="sidebar-item">
                    <a href="#notas" onClick={() => alert('Módulo de Notas - Asignado a Rojas (en desarrollo)')}>
                      <i className="fa-solid fa-file-invoice"></i> Consultar Notas
                    </a>
                  </li>
                </>
              )}

              {user?.role === 'docente' && (
                <>
                  <li className="sidebar-item">
                    <a href="#cursos" onClick={() => alert('Módulo de Cursos y Docentes - Asignado a Rojas (en desarrollo)')}>
                      <i className="fa-solid fa-book-open"></i> Mis Secciones
                    </a>
                  </li>
                  <li className="sidebar-item">
                    <a href="#calificar" onClick={() => alert('Módulo de Notas - Asignado a Rojas (en desarrollo)')}>
                      <i className="fa-solid fa-pen-to-square"></i> Registrar Notas
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
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>JWT + BCrypt</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}><i className="fa-solid fa-circle-check"></i> Activo & Protegido</span>
                  </div>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', marginBottom: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>USUARIOS REGISTRADOS</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>Base SQLite</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}><i className="fa-solid fa-database"></i> Datos Iniciales Sembrados</span>
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
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>3 Cursos</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>Ciclo Académico 2026-I</span>
                  </div>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px', marginBottom: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>ESTUDIANTES REGISTRADOS</span>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>92 Alumnos</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}><i className="fa-solid fa-user-graduate"></i> En Aula Virtual</span>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><i className="fa-solid fa-circle-info"></i> Estado del Entorno de Desarrollo</h3>
                </div>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <p>Has configurado exitosamente la arquitectura del proyecto <strong>React + Flask</strong>. Como desarrollador del backend core, seguridad y administración (Angel), has implementado:</p>
                  <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                    <li><strong>Estructura base del monorepo</strong> dividida en frontend/ y backend/.</li>
                    <li><strong>Seguridad por Roles & JWT</strong> en todas las APIs del backend con SQLite.</li>
                    <li><strong>Bitácora de Auditoría en Base de Datos</strong> que registra inicios de sesión, cambios de contraseña y CRUD de usuarios de manera persistente.</li>
                  </ul>
                  <p style={{ marginTop: '15px' }}>Tus compañeros del equipo pueden crear sus ramas e integrar sus respectivos módulos utilizando este entorno seguro como base.</p>
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
        </main>
      </div>
    </div>
  );
}

export default App;
