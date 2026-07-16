import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/Card'
import { adminService } from '../services/api'
import './Dashboard.css'

const TABS = [
  { id: 'cursos', label: 'Cursos', icon: 'book' },
  { id: 'ofertas', label: 'Ofertas y Docentes', icon: 'chalkboard-user' },
  { id: 'actas', label: 'Validación de Actas', icon: 'file-text' },
  { id: 'administradores', label: 'Administradores', icon: 'user-tie' },
]

export const AdminDashboard = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState('cursos')

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <p>Bienvenido, {user?.nombres} — Gestión Académica UNCP FIS</p>
      </div>

      <div className="button-group" style={{ marginBottom: '10px' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`fas fa-${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {tab === 'cursos' && <CursosTab />}
      {tab === 'ofertas' && <OfertasTab />}
      {tab === 'actas' && <ActasTab />}
      {tab === 'administradores' && <AdministradoresTab />}
    </div>
  )
}

// ==================== Tab: Administradores ====================
function AdministradoresTab() {
  const [administradores, setAdministradores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true)
        const res = await adminService.getAdministradores()
        setAdministradores(res.data)
      } catch (err) {
        setError('Error al cargar los administradores')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  if (loading) return <div className="loading-screen">Cargando datos...</div>

  return (
    <Card title="Administradores del Sistema" icon="user-tie">
      {error && <div className="error-box">{error}</div>}
      {administradores.length === 0 ? (
        <div className="empty-state"><p>No hay administradores registrados</p></div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Nombre</th><th>Email</th><th>Cargo</th><th>Nivel de acceso</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {administradores.map((a) => (
                <tr key={a.id}>
                  <td>{a.codigo_administrador}</td>
                  <td>{a.usuario?.nombres} {a.usuario?.apellidos}</td>
                  <td>{a.usuario?.email}</td>
                  <td>{a.cargo || '-'}</td>
                  <td>{a.nivel_acceso}</td>
                  <td>
                    <span className={`status-badge ${a.activo ? 'activo' : 'inactivo'}`}>
                      {a.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ==================== Tab: Cursos ====================
function CursosTab() {
  const [cursos, setCursos] = useState([])
  const [facultades, setFacultades] = useState([])
  const [ciclos, setCiclos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    codigo: '', nombre: '', creditos: 4, tipo: 'obligatorio',
    facultad_id: '', ciclo_id: '', requisitos: '',
  })
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    try {
      setLoading(true)
      const [cursosRes, facultadesRes, ciclosRes] = await Promise.all([
        adminService.getCursos(),
        adminService.getFacultades(),
        adminService.getCiclos(),
      ])
      setCursos(cursosRes.data)
      setFacultades(facultadesRes.data)
      setCiclos(ciclosRes.data)
      setForm((f) => ({
        ...f,
        facultad_id: f.facultad_id || (facultadesRes.data[0] ? facultadesRes.data[0].id : ''),
        ciclo_id: f.ciclo_id || (ciclosRes.data[0] ? ciclosRes.data[0].id : ''),
      }))
    } catch (err) {
      setError('Error al cargar los cursos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setGuardando(true)
      setError('')
      await adminService.crearCurso({
        ...form,
        creditos: Number(form.creditos),
        facultad_id: Number(form.facultad_id),
        ciclo_id: Number(form.ciclo_id),
      })
      setMensaje('Curso creado exitosamente')
      setShowForm(false)
      setForm((f) => ({ ...f, codigo: '', nombre: '', requisitos: '' }))
      await cargar()
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.response?.data?.errors && JSON.stringify(err.response.data.errors)) ||
        'Error al crear el curso'
      )
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <div className="loading-screen">Cargando datos...</div>

  return (
    <Card title="Catálogo de Cursos" icon="book">
      {error && <div className="error-box">{error}</div>}
      {mensaje && (
        <div className="alert" style={{ backgroundColor: 'var(--success-light)', color: '#1b5e20', border: '1px solid #1b5e20', borderRadius: '6px', padding: '10px 15px' }}>
          <i className="fas fa-check-circle"></i> {mensaje}
        </div>
      )}

      <div className="button-group" style={{ marginBottom: '15px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fas fa-plus"></i> {showForm ? 'Cancelar' : 'Nuevo curso'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-body)', borderRadius: '8px' }}>
          <div className="form-group">
            <label>Código</label>
            <input className="form-control" required value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Nombre</label>
            <input className="form-control" required value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Créditos (1-6)</label>
            <input type="number" min="1" max="6" className="form-control" required value={form.creditos}
              onChange={(e) => setForm({ ...form, creditos: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select className="form-control" value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="obligatorio">Obligatorio</option>
              <option value="electivo">Electivo</option>
            </select>
          </div>
          <div className="form-group">
            <label>Facultad</label>
            <select className="form-control" required value={form.facultad_id}
              onChange={(e) => setForm({ ...form, facultad_id: e.target.value })}>
              <option value="">Selecciona...</option>
              {facultades.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Ciclo académico</label>
            <select className="form-control" required value={form.ciclo_id}
              onChange={(e) => setForm({ ...form, ciclo_id: e.target.value })}>
              <option value="">Selecciona...</option>
              {ciclos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Prerequisitos (opcional)</label>
            <input className="form-control" value={form.requisitos}
              onChange={(e) => setForm({ ...form, requisitos: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar curso'}
          </button>
        </form>
      )}

      {cursos.length === 0 ? (
        <div className="empty-state"><p>No hay cursos registrados aún</p></div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Nombre</th><th>Créditos</th><th>Tipo</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((c) => (
                <tr key={c.id}>
                  <td>{c.codigo}</td>
                  <td className="curso-name">{c.nombre}</td>
                  <td>{c.creditos}</td>
                  <td>{c.tipo}</td>
                  <td>
                    <span className={`status-badge ${c.activo ? 'activo' : 'inactivo'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ==================== Tab: Ofertas ====================
function OfertasTab() {
  const [ofertas, setOfertas] = useState([])
  const [cursos, setCursos] = useState([])
  const [docentes, setDocentes] = useState([])
  const [ciclos, setCiclos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ curso_id: '', ciclo_id: '', seccion: 'A', cupo_maximo: 30, aula: '' })
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    try {
      setLoading(true)
      const [ofertasRes, cursosRes, docentesRes, ciclosRes] = await Promise.all([
        adminService.getOfertas(),
        adminService.getCursos(),
        adminService.getDocentes(),
        adminService.getCiclos(),
      ])
      setOfertas(ofertasRes.data)
      setCursos(cursosRes.data)
      setDocentes(docentesRes.data)
      setCiclos(ciclosRes.data)
    } catch (err) {
      setError('Error al cargar las ofertas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setGuardando(true)
      setError('')
      await adminService.crearOferta({
        curso_id: Number(form.curso_id),
        ciclo_id: Number(form.ciclo_id),
        seccion: form.seccion,
        cupo_maximo: Number(form.cupo_maximo),
        aula: form.aula,
      })
      setMensaje('Oferta creada exitosamente')
      setShowForm(false)
      await cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la oferta')
    } finally {
      setGuardando(false)
    }
  }

  const handleAsignarDocente = async (ofertaId, docenteId) => {
    try {
      setError('')
      await adminService.asignarDocente(ofertaId, Number(docenteId))
      setMensaje('Docente asignado exitosamente')
      await cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al asignar el docente')
    }
  }

  if (loading) return <div className="loading-screen">Cargando datos...</div>

  return (
    <Card title="Ofertas del Ciclo" icon="chalkboard-user">
      {error && <div className="error-box">{error}</div>}
      {mensaje && (
        <div className="alert" style={{ backgroundColor: 'var(--success-light)', color: '#1b5e20', border: '1px solid #1b5e20', borderRadius: '6px', padding: '10px 15px' }}>
          <i className="fas fa-check-circle"></i> {mensaje}
        </div>
      )}

      <div className="button-group" style={{ marginBottom: '15px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fas fa-plus"></i> {showForm ? 'Cancelar' : 'Nueva oferta / sección'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-body)', borderRadius: '8px' }}>
          <div className="form-group">
            <label>Curso</label>
            <select className="form-control" required value={form.curso_id}
              onChange={(e) => setForm({ ...form, curso_id: e.target.value })}>
              <option value="">Selecciona...</option>
              {cursos.map((c) => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Ciclo académico</label>
            <select className="form-control" required value={form.ciclo_id}
              onChange={(e) => setForm({ ...form, ciclo_id: e.target.value })}>
              <option value="">Selecciona...</option>
              {ciclos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Sección</label>
            <input className="form-control" required maxLength={2} value={form.seccion}
              onChange={(e) => setForm({ ...form, seccion: e.target.value.toUpperCase() })} />
          </div>
          <div className="form-group">
            <label>Cupo máximo</label>
            <input type="number" min="1" className="form-control" value={form.cupo_maximo}
              onChange={(e) => setForm({ ...form, cupo_maximo: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Aula</label>
            <input className="form-control" value={form.aula}
              onChange={(e) => setForm({ ...form, aula: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar oferta'}
          </button>
        </form>
      )}

      {ofertas.length === 0 ? (
        <div className="empty-state"><p>No hay ofertas registradas para este ciclo</p></div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Curso</th><th>Sección</th><th>Aula</th><th>Estudiantes</th><th>Docente asignado</th>
              </tr>
            </thead>
            <tbody>
              {ofertas.map((o) => (
                <tr key={o.id}>
                  <td className="curso-name">{o.curso.codigo} - {o.curso.nombre}</td>
                  <td>{o.seccion}</td>
                  <td>{o.aula || '-'}</td>
                  <td>{o.cantidad_estudiantes} / {o.cupo_maximo}</td>
                  <td>
                    <select
                      className="form-control"
                      style={{ minWidth: '200px' }}
                      value={o.docente?.id || ''}
                      onChange={(e) => handleAsignarDocente(o.id, e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {docentes.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.usuario?.nombres} {d.usuario?.apellidos}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ==================== Tab: Actas ====================
function ActasTab() {
  const [actas, setActas] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [observacion, setObservacion] = useState('')
  const [procesando, setProcesando] = useState(false)

  const cargar = async (estado) => {
    try {
      setLoading(true)
      const res = await adminService.getActas(estado || null)
      setActas(res.data)
    } catch (err) {
      setError('Error al cargar las actas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar(filtroEstado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado])

  const verDetalle = async (actaId) => {
    try {
      setError('')
      const res = await adminService.getActaDetalle(actaId)
      setDetalle(res.data)
      setObservacion('')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el detalle del acta')
    }
  }

  const cambiarEstado = async (nuevoEstado) => {
    if (!detalle) return
    if (nuevoEstado === 'OBSERVADA' && !observacion.trim()) {
      setError('Debes indicar una observación')
      return
    }
    try {
      setProcesando(true)
      setError('')
      await adminService.cambiarEstadoActa(detalle.acta_id, nuevoEstado, observacion || null)
      setMensaje(`Acta actualizada a estado ${nuevoEstado}`)
      setDetalle(null)
      await cargar(filtroEstado)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el acta')
    } finally {
      setProcesando(false)
    }
  }

  if (loading) return <div className="loading-screen">Cargando datos...</div>

  return (
    <Card title="Validación de Actas" icon="file-text">
      {error && <div className="error-box">{error}</div>}
      {mensaje && (
        <div className="alert" style={{ backgroundColor: 'var(--success-light)', color: '#1b5e20', border: '1px solid #1b5e20', borderRadius: '6px', padding: '10px 15px' }}>
          <i className="fas fa-check-circle"></i> {mensaje}
        </div>
      )}

      <div className="form-group" style={{ maxWidth: '250px' }}>
        <label>Filtrar por estado</label>
        <select className="form-control" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos</option>
          <option value="ENVIADA">Enviada</option>
          <option value="OBSERVADA">Observada</option>
          <option value="APROBADA">Aprobada</option>
          <option value="CONSOLIDADA">Consolidada</option>
        </select>
      </div>

      {actas.length === 0 ? (
        <div className="empty-state"><p>No hay actas para mostrar</p></div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Curso</th><th>Sección</th><th>Docente</th><th>Estudiantes</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {actas.map((a) => (
                <tr key={a.id}>
                  <td className="curso-name">{a.curso}</td>
                  <td>{a.seccion}</td>
                  <td>{a.docente}</td>
                  <td>{a.cantidad_estudiantes}</td>
                  <td><span className={`status-badge ${a.estado.toLowerCase()}`}>{a.estado}</span></td>
                  <td>
                    <button className="btn btn-primary btn-icon" onClick={() => verDetalle(a.id)}>
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detalle && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '700px' }}>
            <h3>Acta - {detalle.curso}</h3>
            <p>Docente: {detalle.docente?.usuario?.nombres} {detalle.docente?.usuario?.apellidos}</p>
            <p>Estado actual: <span className={`status-badge ${detalle.estado.toLowerCase()}`}>{detalle.estado}</span></p>
            {detalle.observaciones && (
              <div className="error-box" style={{ marginTop: '10px' }}>
                Observación previa: {detalle.observaciones}
              </div>
            )}

            <div className="table-responsive" style={{ marginTop: '15px', maxHeight: '300px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr><th>Código</th><th>Nombre</th><th>Promedio</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {detalle.notas.map((n, idx) => (
                    <tr key={idx}>
                      <td>{n.codigo}</td>
                      <td>{n.nombre}</td>
                      <td>{n.nota?.promedio ?? '-'}</td>
                      <td>
                        {n.nota?.estado && (
                          <span className={`status-badge ${n.nota.estado.toLowerCase()}`}>{n.nota.estado}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-group" style={{ marginTop: '15px' }}>
              <label>Observación (requerida solo para "Observar")</label>
              <textarea
                className="form-control"
                rows={3}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />
            </div>

            <div className="button-group" style={{ marginTop: '15px' }}>
              <button className="btn btn-secondary" onClick={() => setDetalle(null)}>Cerrar</button>
              <button className="btn btn-secondary" disabled={procesando} onClick={() => cambiarEstado('OBSERVADA')}>
                Observar
              </button>
              <button className="btn btn-primary" disabled={procesando} onClick={() => cambiarEstado('APROBADA')}>
                Aprobar
              </button>
              <button className="btn btn-primary" disabled={procesando} onClick={() => cambiarEstado('CONSOLIDADA')}>
                Consolidar
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
