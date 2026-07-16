import React from 'react'
import './Sidebar.css'

export const Sidebar = ({ isOpen, onClose, currentRole, menuItems, onMenuClick }) => {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-menu-wrapper">
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.id} className="sidebar-item">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onMenuClick(item.id)
                  }}
                  className={item.active ? 'active' : ''}
                >
                  <i className={`fas fa-${item.icon}`}></i>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="sidebar-separator">...</div>
          <div className="sidebar-scroll-indicator">
            <i className="fas fa-chevron-down"></i>
          </div>
        </div>

        <div className="sidebar-footer">
          <p>
            <strong>Sistema Académico FIS</strong>
          </p>
          <p style={{ fontSize: '0.65rem', marginTop: '4px' }}>v1.0.0</p>
          <p style={{ fontSize: '0.65rem', marginTop: '4px', color: 'var(--accent)' }}>
            © 2025 UNCP
          </p>
        </div>
      </aside>
    </>
  )
}
