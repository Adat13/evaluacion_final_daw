import apiClient from './apiClient'

// ==================== Auth Service ====================
export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password })
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  register: async (userData) => {
    return await apiClient.post('/auth/register', userData)
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },

  getCurrentUser: async () => {
    return await apiClient.get('/auth/me')
  },
}

// ==================== Docente Service ====================
export const docenteService = {
  getCursos: async (cicloId = null) => {
    const params = cicloId ? { ciclo_id: cicloId } : {}
    return await apiClient.get('/docente/cursos', { params })
  },

  getDetalleCurso: async (ofertaId) => {
    return await apiClient.get(`/docente/cursos/${ofertaId}`)
  },

  uploadSilabo: async (ofertaId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return await apiClient.post(`/docente/cursos/${ofertaId}/silabo`, formData, {
      headers: { 'Content-Type': undefined },
    })
  },

  getNotas: async (ofertaId) => {
    return await apiClient.get(`/docente/cursos/${ofertaId}/notas`)
  },

  updateNotas: async (ofertaId, notasData) => {
    return await apiClient.put(`/docente/cursos/${ofertaId}/notas`, notasData)
  },

  enviarActa: async (ofertaId) => {
    return await apiClient.post(`/docente/cursos/${ofertaId}/notas/enviar`)
  },
}

// ==================== Estudiante Service ====================
export const estudianteService = {
  getNotas: async (cicloId = null) => {
    const params = cicloId ? { ciclo_id: cicloId } : {}
    return await apiClient.get('/estudiante/notas', { params })
  },
}

// ==================== Admin Service ====================
export const adminService = {
  getCursos: async () => {
    return await apiClient.get('/admin/cursos')
  },

  crearCurso: async (cursoData) => {
    return await apiClient.post('/admin/cursos', cursoData)
  },

  actualizarCurso: async (cursoId, cursoData) => {
    return await apiClient.put(`/admin/cursos/${cursoId}`, cursoData)
  },

  getOfertas: async (cicloId = null) => {
    const params = cicloId ? { ciclo_id: cicloId } : {}
    return await apiClient.get('/admin/ofertas', { params })
  },

  crearOferta: async (ofertaData) => {
    return await apiClient.post('/admin/oferta', ofertaData)
  },

  asignarDocente: async (ofertaId, docenteId) => {
    return await apiClient.put(`/admin/oferta/${ofertaId}/docente`, { docente_id: docenteId })
  },

  actualizarHorario: async (ofertaId, horarioData) => {
    return await apiClient.put(`/admin/oferta/${ofertaId}/horario`, horarioData)
  },

  getActas: async (estado = null) => {
    const params = estado ? { estado } : {}
    return await apiClient.get('/admin/actas', { params })
  },

  getActaDetalle: async (actaId) => {
    return await apiClient.get(`/admin/actas/${actaId}`)
  },

  cambiarEstadoActa: async (actaId, estado, observaciones = null) => {
    return await apiClient.put(`/admin/actas/${actaId}/estado`, { estado, observaciones })
  },

  getDocentes: async () => {
    return await apiClient.get('/admin/docentes')
  },

  getAdministradores: async () => {
    return await apiClient.get('/admin/administradores')
  },

  getFacultades: async () => {
    return await apiClient.get('/admin/facultades')
  },

  getCiclos: async () => {
    return await apiClient.get('/admin/ciclos')
  },
}

// ==================== Dirección Service ====================
export const direccionService = {
  getSupervisionAcademica: async (cicloId = null, facultadId = null, especialidadId = null) => {
    const params = {}
    if (cicloId) params.ciclo_id = cicloId
    if (facultadId) params.facultad_id = facultadId
    if (especialidadId) params.especialidad_id = especialidadId
    return await apiClient.get('/direccion/cursos/supervision', { params })
  },

  getIndicadoresAcademicos: async (cicloId = null, facultadId = null, especialidadId = null) => {
    const params = {}
    if (cicloId) params.ciclo_id = cicloId
    if (facultadId) params.facultad_id = facultadId
    if (especialidadId) params.especialidad_id = especialidadId
    return await apiClient.get('/direccion/notas/indicadores', { params })
  },
}


subirSilabo: (ofertaId, formData) => {
    return api.post(
        `/docente/cursos/${ofertaId}/silabo`,
        formData,
        {
            headers:{
                "Content-Type":"multipart/form-data"
            }
        }
    )
}