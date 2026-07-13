const API_BASE_URL = 'http://localhost:5000/api';

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }
  return data;
}

export async function getPreCheck(token) {
  const response = await fetch(`${API_BASE_URL}/matricula/pre-check`, {
    headers: authHeaders(token),
  });
  return handleResponse(response);
}

export async function getMiDatos(token) {
  const response = await fetch(`${API_BASE_URL}/matricula/mi-datos`, {
    headers: authHeaders(token),
  });
  return handleResponse(response);
}

export async function getValidaciones(token) {
  const response = await fetch(`${API_BASE_URL}/matricula/validaciones`, {
    headers: authHeaders(token),
  });
  return handleResponse(response);
}

export async function getCursosDisponibles(token) {
  const response = await fetch(`${API_BASE_URL}/matricula/cursos-disponibles`, {
    headers: authHeaders(token),
  });
  return handleResponse(response);
}

export async function crearSolicitud(token, payload) {
  const response = await fetch(`${API_BASE_URL}/matricula/solicitud`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}
