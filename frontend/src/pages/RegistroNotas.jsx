import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { docenteService } from '../services/api'
import './Dashboard.css'

const NOTA_MIN = 0
const NOTA_MAX = 20
const NOTA_APROBACION = 10.5

export const RegistroNotas = () => {
  const { ofertaId } = useParams()
  const navigate = useNavigate()

  const [curso, setCurso] = useState(null)
  const [filas, setFilas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [showConfirmEnvio, setShowConfirmEnvio] = useState(false)

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [detalleRes, notasRes] = await Promise.all([
        docenteService.getDetalleCurso(ofertaId),
        docenteService.getNotas(ofertaId),
      ])
      setCurso(detalleRes.data)

      const notasPorMatricula = {}
      notasRes.data.forEach((n) => {
        notasPorMatricula[n.matricula_id] = n
      })

      // Necesitamos matricula_id por estudiante; el detalle no lo trae directamente,
      // así que lo derivamos de /notas (que sí incluye matricula_id) combinando con estudiantes.
      const filasIniciales = notasRes.data.length > 0
        ? notasRes.data.map((n) => ({
            matricula_id: n.matricula_id,
            codigo: n.codigo_estudiante,
            nombre: n.nombre,
            pc1: n.nota?.pc1 ?? '',
            pc2: n.nota?.pc2 ?? '',
            pc3: n.nota?.pc3 ?? '',
            ef: n.nota?.ef ?? '',
            promedio: n.nota?.promedio ?? null,
            estado: n.nota?.estado ?? null,
          }))
        : []

      setFilas(filasIniciales)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar las notas del curso')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ofertaId])

  const calcularPromedio = (pc1, pc2, pc3, ef) => {
    if ([pc1, pc2, pc3, ef].some((v) => v === '' || v === null || v === undefined)) {
      return null
    }
    return (Number(pc1) * 0.15 + Number(pc2) * 0.15 + Number(pc3) * 0.2 + Number(ef) * 0.5)
  }

  const handleCambioNota = (matriculaId, campo, valor) => {
    if (valor !== '' && (isNaN(valor) || Number(valor) < NOTA_MIN || Number(valor) > NOTA_MAX)) {
      return
    }
    setFilas((prev) =>
      prev.map((fila) => {
        if (fila.matricula_id !== matriculaId) return fila
        const actualizada = { ...fila, [campo]: valor }
        const promedio = calcularPromedio(actualizada.pc1, actualizada.pc2, actualizada.pc3, actualizada.ef)
        return {
          ...actualizada,
          promedio,
          estado: promedio === null ? null : promedio >= NOTA_APROBACION ? 'APROBADO' : 'DESAPROBADO',
        }
      })
    )
  }

  const handleGuardarBorrador = async () => {
    try {
      setGuardando(true)
      setMensaje('')
      for (const fila of filas) {
        await docenteService.updateNotas(ofertaId, {
          matricula_id: fila.matricula_id,
          pc1: fila.pc1 === '' ? null : Number(fila.pc1),
          pc2: fila.pc2 === '' ? null : Number(fila.pc2),
          pc3: fila.pc3 === '' ? null : Number(fila.pc3),
          ef: fila.ef === '' ? null : Number(fila.ef),
        })
      }
      setMensaje('Notas guardadas como borrador')
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar las notas')
    } finally {
      setGuardando(false)
    }
  }

  const handleEnviarActa = async () => {
    try {
      setEnviando(true)
      setError('')
      await docenteService.enviarActa(ofertaId)
      setMensaje('Acta enviada exitosamente. Ahora requiere aprobación administrativa.')
      setShowConfirmEnvio(false)
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar el acta')
      setShowConfirmEnvio(false)
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return <div className="loading-screen">Cargando datos...</div>
  if (!curso) return <div className="error-box">{error || 'Curso no encontrado'}</div>

  const todasCompletas = filas.length > 0 && filas.every((f) => f.promedio !== null)

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/docente/cursos/${ofertaId}`)}
          style={{ marginBottom: '10px' }}
        >
          <i className="fas fa-arrow-left"></i> Volver al curso
        </button>
        <h1>Registro de Notas</h1>
        <p>
          {curso.curso.nombre} ({curso.curso.codigo}) · Sección {curso.seccion}
        </p>
      </div>

      {error && <div className="error-box">{error}</div>}
      {mensaje && (
        <div
          className="alert"
          style={{
            backgroundColor: 'var(--success-light)',
            color: '#1b5e20',
            border: '1px solid #1b5e20',
            borderRadius: '6px',
            padding: '10px 15px',
          }}
        >
          <i className="fas fa-check-circle"></i> {mensaje}
        </div>
      )}

      <Card title="Notas del Curso" icon="file-alt">
        {filas.length === 0 ? (
          <div className="empty-state">
            <p>No hay estudiantes matriculados en este curso</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>PC1</th>
                    <th>PC2</th>
                    <th>PC3</th>
                    <th>EF</th>
                    <th>Promedio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, idx) => (
                    <tr
                      key={fila.matricula_id}
                      style={
                        fila.estado === 'DESAPROBADO'
                          ? { backgroundColor: 'var(--danger-light)' }
                          : {}
                      }
                    >
                      <td>{idx + 1}</td>
                      <td>{fila.codigo}</td>
                      <td>{fila.nombre}</td>
                      {['pc1', 'pc2', 'pc3', 'ef'].map((campo) => (
                        <td key={campo}>
                          <input
                            type="number"
                            min={NOTA_MIN}
                            max={NOTA_MAX}
                            step="0.01"
                            value={fila[campo]}
                            onChange={(e) => handleCambioNota(fila.matricula_id, campo, e.target.value)}
                            className="form-control"
                            style={{ width: '75px', padding: '4px 8px' }}
                          />
                        </td>
                      ))}
                      <td className="promedio-cell">
                        <strong>{fila.promedio !== null ? fila.promedio.toFixed(2) : '-'}</strong>
                      </td>
                      <td>
                        {fila.estado && (
                          <span className={`status-badge ${fila.estado.toLowerCase()}`}>
                            {fila.estado}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="button-group" style={{ marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={handleGuardarBorrador} disabled={guardando}>
                <i className="fas fa-save"></i> {guardando ? 'Guardando...' : 'Guardar borrador'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowConfirmEnvio(true)}
                disabled={!todasCompletas || enviando}
                title={!todasCompletas ? 'Completa todas las notas antes de enviar el acta' : ''}
              >
                <i className="fas fa-paper-plane"></i> Enviar acta
              </button>
            </div>
          </>
        )}
      </Card>

      {showConfirmEnvio && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirmar envío de acta</h3>
            <p>Una vez enviada, el acta requerirá aprobación administrativa y ya no podrás editarla.</p>
            <div className="button-group" style={{ marginTop: '15px' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirmEnvio(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleEnviarActa} disabled={enviando}>
                {enviando ? 'Enviando...' : 'Confirmar envío'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
