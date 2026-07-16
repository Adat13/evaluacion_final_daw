import React from 'react'
import './Header.css'
import { useAuth } from '../context/AuthContext'

export const Header = ({ onMenuToggle }) => {
  const { user, logout } = useAuth()
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const notifications = [
    { id: 1, message: 'Nueva matrícula pendiente', unread: true },
    { id: 2, message: 'Acta de notas aprobada', unread: true },
    { id: 3, message: 'Recordatorio de fechas límite', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  const handleLogout = () => {
    setShowUserMenu(false)
    logout()
  }

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <button className="hamburger-btn" onClick={onMenuToggle}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="brand-section">
            <div className="brand-logos">
              <img src="https://via.placeholder.com/42" alt="UNCP" className="logo-uncp" />
              <img src="https://via.placeholder.com/42" alt="FIS" className="logo-fis" />
            </div>
            <div className="brand-info">
              <h1>UNCP - FIS</h1>
              <p>Sistema Académico</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="notification-container">
            <div
              className="notification-bell"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </div>

            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  Notificaciones
                  <span onClick={() => setShowNotifications(false)}>✕</span>
                </div>
                <div className="notifications-list">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notification-item ${
                        notif.unread ? 'unread' : ''
                      }`}
                    >
                      {notif.message}
                      <div className="notification-item-time">Hace 5 minutos</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {user && (
            <div className="notification-container">
              <div
                className="user-profile-header"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ cursor: 'pointer' }}
              >
                <div className="user-avatar">
                  {user.nombres?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info-text">
                  <span className="name">{user.nombres}</span>
                  <span className="role">{user.rol}</span>
                </div>
                <i className="fas fa-chevron-down" style={{ fontSize: '0.7rem', marginLeft: '4px' }}></i>
              </div>

              {showUserMenu && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    Mi Cuenta
                    <span onClick={() => setShowUserMenu(false)}>✕</span>
                  </div>
                  <div className="notifications-list">
                    <div
                      className="notification-item"
                      onClick={handleLogout}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
                      Cerrar sesión
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  )
}
