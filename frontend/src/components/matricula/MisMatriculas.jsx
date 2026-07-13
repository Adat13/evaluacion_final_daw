import React, { useState, useEffect } from 'react';

// Muestra el historial de solicitudes de matrícula del estudiante
export default function MisMatriculas({ token, alSolicitarNueva }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Carga las solicitudes del estudiante
  useEffect(() => {
    cargarSolicitudes();
  }, [token]);

  const cargarSolicitudes = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:5000/api/matricula', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.ok ? await res.json() : [];
        setSolicitudes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Abre la ficha PDF oficial generada por el backend
  const descargarFicha = (id) => {
    window.open(`http://localhost:5000/api/matricula/${id}/ficha`, '_blank');
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title">
          <i className="fa-solid fa-folder-open"></i> Mis Fichas de Matrícula
        </h3>
        <button 
          className="btn" 
          onClick={alSolicitarNueva}
          style={{ backgroundColor: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 15px' }}
        >
          <i className="fa-solid fa-plus"></i> Nueva Solicitud
        </button>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Nº Solicitud</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Ciclo Académico</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Fecha Envío</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Créditos</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Estado</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Ficha Oficial</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aún no registras ninguna solicitud de matrícula en el presente ciclo.
                  </td>
                </tr>
              ) : (
                solicitudes.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{s.codigo}</td>
                    <td style={{ padding: '10px' }}>{s.ciclo || 'N/A'}</td>
                    <td style={{ padding: '10px' }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('es-PE') : 'N/A'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{s.creditos_total}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                        backgroundColor: s.estado === 'APROBADA' ? 'var(--success-light)' : s.estado === 'PENDIENTE' ? 'var(--warning-light)' : 'var(--danger-light)',
                        color: s.estado === 'APROBADA' ? 'var(--success)' : s.estado === 'PENDIENTE' ? 'var(--warning)' : 'var(--danger)'
                      }}>
                        {s.estado}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {s.estado === 'APROBADA' ? (
                        <button 
                          onClick={() => descargarFicha(s.id)} 
                          className="btn" 
                          style={{ padding: '4px 8px', backgroundColor: 'var(--success)', color: '#fff', border: 'none', fontSize: '0.75rem' }}
                        >
                          <i className="fa-solid fa-file-pdf"></i> Descargar Ficha
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solo Aprobadas</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
