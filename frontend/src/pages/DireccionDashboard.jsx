import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, StatCard } from '../components/Card'
import { direccionService } from '../services/api'
import './Dashboard.css'

export const DireccionDashboard = () => {
  const { user } = useAuth()
  const [indicadores, setIndicadores] = useState({
    tasa_aprobacion: 0,
    tasa_desaprobacion: 0,
    promedio_institucional: 0,
    actas_consolidadas: 0,
    actas_pendientes: 0,
    total_estudiantes_evaluados: 0,
  })
  const [supervision, setSupervision] = useState({
    indicadores: {
      porcentaje_cursos_con_oferta: 0,
      porcentaje_secciones_con_docente: 0,
      porcentaje_sylabos_cargados: 0,
      porcentaje_sylabos_aprobados: 0,
    },
    carga_docentes: [],
    cursos_sin_docente: [],
    total_cursos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        setLoading(true)
        const [indicadoresRes, supervisionRes] = await Promise.all([
          direccionService.getIndicadoresAcademicos(),
          direccionService.getSupervisionAcademica(),
        ])
        setIndicadores(indicadoresRes.data.indicadores)
        setSupervision(supervisionRes.data)
      } catch (err) {
        setError('Error al cargar los indicadores')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDatos()
  }, [])

  if (loading) return <div className="loading-screen">Cargando datos...</div>
  if (error) return <div className="error-box">{error}</div>

  const UMBRAL_SOBRECARGA_HORAS = 40

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Panel de Dirección</h1>
        <p>Bienvenida, {user?.nombres} — Supervisión Académica UNCP FIS</p>
      </div>

      {/* Indicadores académicos (rendimiento estudiantil) */}
      <Card title="Indicadores Académicos" icon="chart-bar">
        <div className="stats-grid">
          <StatCard
            title="Tasa de Aprobación"
            value={`${indicadores.tasa_aprobacion}%`}
            icon="check-circle"
            iconColor="success"
            subtext="Del total evaluado"
          />
          <StatCard
            title="Tasa de Desaprobación"
            value={`${indicadores.tasa_desaprobacion}%`}
            icon="times-circle"
            iconColor="warning"
            subtext="Del total evaluado"
          />
          <StatCard
            title="Promedio Institucional"
            value={indicadores.promedio_institucional?.toFixed(2)}
            icon="star"
            iconColor="primary"
            subtext="Ciclo actual"
          />
          <StatCard
            title="Actas Consolidadas"
            value={`${indicadores.actas_consolidadas} / ${indicadores.actas_consolidadas + indicadores.actas_pendientes}`}
            icon="file-check"
            iconColor="purple"
            subtext={`${indicadores.actas_pendientes} pendientes`}
          />
        </div>
      </Card>

      {/* Supervisión académica (cobertura y carga docente) */}
      <Card title="Supervisión Académica" icon="eye">
        <div className="stats-grid">
          <StatCard
            title="Cursos con Oferta"
            value={`${supervision.indicadores.porcentaje_cursos_con_oferta}%`}
            icon="book"
            iconColor="primary"
            subtext="Del plan de estudios"
          />
          <StatCard
            title="Secciones con Docente"
            value={`${supervision.indicadores.porcentaje_secciones_con_docente}%`}
            icon="chalkboard-user"
            iconColor="success"
            subtext="Asignación completa"
          />
          <StatCard
            title="Sílabos Cargados"
            value={`${supervision.indicadores.porcentaje_sylabos_cargados}%`}
            icon="file-pdf"
            iconColor="warning"
            subtext="Del total de cursos"
          />
          <StatCard
            title="Sílabos Aprobados"
            value={`${supervision.indicadores.porcentaje_sylabos_aprobados}%`}
            icon="file-check"
            iconColor="purple"
            subtext="Del total de cursos"
          />
        </div>
      </Card>

      {/* Carga docente */}
      <Card title="Carga Docente" icon="users">
        {supervision.carga_docentes.length === 0 ? (
          <div className="empty-state">
            <p>No hay datos de carga docente para este ciclo</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Cursos Asignados</th>
                  <th>Créditos</th>
                  <th>Horas Semanales</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {supervision.carga_docentes.map((docente, index) => {
                  const sobrecarga = docente.total_horas > UMBRAL_SOBRECARGA_HORAS
                  return (
                    <tr key={index}>
                      <td>{docente.nombre}</td>
                      <td>{docente.total_cursos}</td>
                      <td>{docente.total_creditos}</td>
                      <td>{docente.total_horas}</td>
                      <td>
                        <span className={`status-badge ${sobrecarga ? 'desaprobado' : 'activo'}`}>
                          {sobrecarga ? 'Sobrecarga' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cursos sin docente asignado */}
      <Card title="Cursos sin Docente Asignado" icon="exclamation-triangle">
        {supervision.cursos_sin_docente.length === 0 ? (
          <div className="empty-state">
            <p>Todos los cursos ofertados tienen docente asignado</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Curso</th>
                  <th>Sección</th>
                </tr>
              </thead>
              <tbody>
                {supervision.cursos_sin_docente.map((curso, index) => (
                  <tr key={index}>
                    <td>{curso.codigo}</td>
                    <td className="curso-name">{curso.nombre}</td>
                    <td>{curso.seccion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
