import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const EMAIL_DOMAIN = '@sistema.com'

export const Login = () => {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // El usuario solo escribe el nombre (ej. "student"); aquí se arma el correo real
      const usuarioLimpio = usuario.trim()
      const email = usuarioLimpio.includes('@')
        ? usuarioLimpio
        : `${usuarioLimpio}${EMAIL_DOMAIN}`

      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Panel izquierdo - Información */}
        <div className="login-info-panel">
          <div className="login-brand">
            <h1>UNCP</h1>
            <p>Universidad Nacional del Centro del Perú</p>
          </div>

          <div className="login-content">
            <h2>Sistema de Gestión Académica</h2>
            <p className="login-subtitle">
              Facultad de Ingeniería de Sistemas
            </p>

            <div className="login-features">
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Gestión de Cursos y Docentes</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Registro y Consolidación de Notas</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Supervisión Académica</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Informes y Certificados</span>
              </div>
            </div>
          </div>

          <div className="login-footer-info">
            <p>© 2025 UNCP - Todos los derechos reservados</p>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="login-form-panel">
          <form onSubmit={handleSubmit} className="login-form">
            <h2 className="form-title">Iniciar Sesión</h2>
            <p className="form-subtitle">
              Ingresa tus credenciales para acceder al sistema
            </p>

            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="usuario">Usuario</label>
              <div className="input-wrapper">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  id="usuario"
                  className="form-control"
                  placeholder="Ingresa tu usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-wrapper">
                <i className="fas fa-lock"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-control"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <div className="form-remember">
              <label>
                <input type="checkbox" /> Recuerda mis credenciales
              </label>
              <a href="#" className="forgot-password">
                ¿Olvidaste la contraseña?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Iniciando...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
                </>
              )}
            </button>

            <div className="login-divider">
              <span>¿No tienes cuenta?</span>
            </div>

            <button type="button" className="btn btn-secondary btn-register">
              <i className="fas fa-user-plus"></i> Solicitar Acceso
            </button>

            <div className="login-roles">
              <p>Acceso por tipo de usuario:</p>
              <div className="roles-grid">
                <div className="role-badge">
                  <i className="fas fa-graduation-cap"></i>
                  <span>Estudiante</span>
                </div>
                <div className="role-badge">
                  <i className="fas fa-chalkboard-user"></i>
                  <span>Docente</span>
                </div>
                <div className="role-badge">
                  <i className="fas fa-cogs"></i>
                  <span>Administrador</span>
                </div>
                <div className="role-badge">
                  <i className="fas fa-chart-line"></i>
                  <span>Dirección</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
