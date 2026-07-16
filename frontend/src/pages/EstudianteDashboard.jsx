import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, StatCard } from '../components/Card'
import { estudianteService } from '../services/api'
import './Dashboard.css'

export const EstudianteDashboard = () => {
  const { user } = useAuth()
  const [notas, setNotas] = useState([])
  const [resumen, setResumen] = useState({ total_creditos: 0, creditos_aprobados: 0, promedio_ponderado: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        setLoading(true)
        const response = await estudianteService.getNotas()
        setNotas(response.data.notas)
        setResumen(response.data.resumen)
      } catch (err) {
        setError('Error al cargar las notas')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotas()
  }, [])

  if (loading) return <div className="loading-screen">Cargando datos...</div>
  if (error) return <div className="error-box">{error}</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Bienvenido, {user?.nombres}</h1>
        <p>Sistema de Gestión Académica - UNCP</p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="stats-grid">
        <StatCard
          title="Créditos Totales"
          value={resumen.total_creditos}
          icon="book"
          iconColor="primary"
          subtext="En tu plan de estudio"
        />
        <StatCard
          title="Créditos Aprobados"
          value={resumen.creditos_aprobados}
          icon="check-circle"
          iconColor="success"
          subtext={`${resumen.total_creditos > 0 ? Math.round((resumen.creditos_aprobados / resumen.total_creditos) * 100) : 0}% completado`}
        />
        <StatCard
          title="Promedio"
          value={resumen.promedio_ponderado.toFixed(2)}
          icon="star"
          iconColor="warning"
          subtext="Promedio ponderado"
        />
        <StatCard
          title="Cursos Activos"
          value={notas.length}
          icon="graduation-cap"
          iconColor="purple"
          subtext="Este ciclo académico"
        />
      </div>

      {/* Tabla de Notas */}
      <Card title="Mis Notas" icon="list">
        {notas.length === 0 ? (
          <div className="empty-state">
            <p>No hay notas registradas aún</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Curso</th>
                  <th>Créditos</th>
                  <th>PC1</th>
                  <th>PC2</th>
                  <th>PC3</th>
                  <th>EF</th>
                  <th>Promedio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {notas.map((nota, index) => (
                  <tr key={index}>
                    <td>{nota.codigo_curso}</td>
                    <td className="curso-name">{nota.nombre_curso}</td>
                    <td>{nota.creditos}</td>
                    <td>{nota.nota.pc1 || '-'}</td>
                    <td>{nota.nota.pc2 || '-'}</td>
                    <td>{nota.nota.pc3 || '-'}</td>
                    <td>{nota.nota.ef || '-'}</td>
                    <td className="promedio-cell">
                      <strong>{nota.nota.promedio || '-'}</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${(nota.nota.estado || 'pendiente').toLowerCase()}`}>
                        {nota.nota.estado || 'Pendiente'}
                      </span>
                    </td>
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
