import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { docenteService } from '../services/api'
import './Dashboard.css'

const MAX_SIZE_MB = 5
const ALLOWED_EXTENSIONS = ['pdf', 'docx']

export const CursoDetalle = () => {
  const { ofertaId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [curso, setCurso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState('')

  const fetchDetalle = async () => {
    try {
      setLoading(true)
      const response = await docenteService.getDetalleCurso(ofertaId)
      setCurso(response.data)
    } catch (err) {
      setError(
        err.response?.data?.error || 'Error al cargar el detalle del curso'
      )
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetalle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ofertaId])

  const validarArchivo = (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Formato no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `El archivo supera el tamaño máximo permitido (${MAX_SIZE_MB}MB)`
    }
    return ''
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setUploadSuccess('')
    if (!file) {
      setSelectedFile(null)
      setUploadError('')
      return
    }
    const errorMsg = validarArchivo(file)
    if (errorMsg) {
      setUploadError(errorMsg)
      setSelectedFile(null)
      e.target.value = ''
      return
    }
    setUploadError('')
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    try {
      setUploading(true)
      setUploadError('')
      await docenteService.uploadSilabo(ofertaId, selectedFile)
      setUploadSuccess('Sílabo cargado exitosamente')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchDetalle()
    } catch (err) {
      setUploadError(
        err.response?.data?.error || 'Error al subir el sílabo'
      )
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="loading-screen">Cargando datos...</div>
  if (error) return <div className="error-box">{error}</div>
  if (!curso) return null

  const silabo = curso.silabo

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/dashboard')}
          style={{ marginBottom: '10px' }}
        >
          <i className="fas fa-arrow-left"></i> Volver a mis cursos
        </button>
        <h1>{curso.curso.nombre}</h1>
        <p>
          {curso.curso.codigo} · Sección {curso.seccion} · {curso.curso.creditos} créditos
          {curso.aula && <> · Aula {curso.aula}</>}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/docente/cursos/${ofertaId}/notas`)}
          style={{ marginTop: '10px' }}
        >
          <i className="fas fa-file-alt"></i> Registrar notas
        </button>
      </div>

      {/* Información y estudiantes */}
      <Card title="Estudiantes Matriculados" icon="users">
        {curso.estudiantes.length === 0 ? (
          <div className="empty-state">
            <p>No hay estudiantes matriculados en este curso</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                </tr>
              </thead>
              <tbody>
                {curso.estudiantes.map((est, idx) => (
                  <tr key={idx}>
                    <td>{est.codigo}</td>
                    <td>{est.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Sílabo */}
      <Card title="Sílabo" icon="file-pdf">
        <div style={{ marginBottom: '15px' }}>
          <span
            className={`status-badge ${(silabo?.estado || 'pendiente').toLowerCase()}`}
          >
            {silabo ? silabo.estado : 'PENDIENTE'}
          </span>
          {silabo && (
            <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Versión {silabo.numero_version}
              {silabo.fecha_carga &&
                ` · Cargado el ${new Date(silabo.fecha_carga).toLocaleDateString()}`}
            </span>
          )}
        </div>

        {silabo?.archivo_url && (
          <div style={{ marginBottom: '15px' }}>
            <a
              href={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${silabo.archivo_url}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <i className="fas fa-download"></i> Descargar sílabo actual
            </a>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="silabo-file">
            {silabo ? 'Reemplazar sílabo (PDF o DOCX, máx. 5MB)' : 'Subir sílabo (PDF o DOCX, máx. 5MB)'}
          </label>
          <input
            ref={fileInputRef}
            id="silabo-file"
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="form-control"
          />
        </div>

        {uploadError && (
          <div className="alert alert-danger" style={{ marginBottom: '15px' }}>
            <i className="fas fa-exclamation-circle"></i> {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div
            className="alert"
            style={{
              marginBottom: '15px',
              backgroundColor: 'var(--success-light)',
              color: '#1b5e20',
              border: '1px solid #1b5e20',
              borderRadius: '6px',
              padding: '10px 15px',
            }}
          >
            <i className="fas fa-check-circle"></i> {uploadSuccess}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Subiendo...
            </>
          ) : (
            <>
              <i className="fas fa-upload"></i> Subir sílabo
            </>
          )}
        </button>
      </Card>
    </div>
  )
}
