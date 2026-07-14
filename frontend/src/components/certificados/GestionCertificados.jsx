import React, { useState, useEffect } from 'react';

export default function GestionCertificados({ token }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Acciones
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    cargarSolicitudes();
  }, [filtroEstado, filtroTipo, busqueda]);

  const cargarSolicitudes = async () => {
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:5000/api/certificados/solicitudes?estado=${filtroEstado}&tipo_documento=${filtroTipo}&search=${busqueda}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSolicitudes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstado = async (id, estado, rechazoMotive = '') => {
    setErrorMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/certificados/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado, motivo_rechazo: rechazoMotive })
      });
      if (res.ok) {
        const updated = await res.json();
        setSeleccionada(updated);
        cargarSolicitudes();
        setMotivoRechazo('');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Error al actualizar el trámite.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const descargarPDF = (id) => {
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:5000' 
      : window.location.origin;
    window.open(`${baseUrl}/api/certificados/${id}/descargar`, '_blank');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: seleccionada ? '1.2fr 1fr' : '1fr', gap: '20px' }}>
      
      {/* Tabla Listado de Solicitudes */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h3 className="card-title"><i className="fa-solid fa-folder-tree"></i> Control de Certificados</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <option value="">Todos los Estados</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN PROCESO">EN PROCESO</option>
              <option value="PENDIENTE_AUTORIZACION">AUTORIZACIÓN REQUERIDA</option>
              <option value="AUTORIZADO">AUTORIZADO</option>
              <option value="EMITIDO">EMITIDO</option>
              <option value="RECHAZADO">RECHAZADO</option>
              <option value="DENEGADO">DENEGADO</option>
            </select>
            <input 
              type="text" 
              placeholder="Buscar estudiante..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            />
          </div>
        </div>

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Código</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Estudiante</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Trámite</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSeleccionada(s)}
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: seleccionada?.id === s.id ? 'var(--warning-light)' : 'transparent' }}
                  >
                    <td style={{ padding: '8px', fontWeight: 600 }}>{s.codigo}</td>
                    <td style={{ padding: '8px' }}>{s.estudiante_nombre}</td>
                    <td style={{ padding: '8px' }}>{s.tipo_documento}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                        backgroundColor: s.estado === 'EMITIDO' ? 'var(--success-light)' : s.estado.includes('PENDIENTE') ? 'var(--warning-light)' : 'var(--danger-light)',
                        color: s.estado === 'EMITIDO' ? 'var(--success)' : s.estado.includes('PENDIENTE') ? 'var(--warning)' : 'var(--danger)'
                      }}>{s.estado}</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button className="btn" style={{ padding: '2px 5px', fontSize: '0.75rem' }}>Detalle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detalle Lateral de Solicitud */}
      {seleccionada && (
        <div className="card" style={{ borderLeft: '3px solid var(--primary-light)', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
            <h4 style={{ fontSize: '1rem' }}>Detalle de Trámite: {seleccionada.codigo}</h4>
            <button onClick={() => setSeleccionada(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
          </div>

          {errorMsg && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{errorMsg}</div>}

          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
            <p><strong>Estudiante:</strong> {seleccionada.estudiante_nombre} ({seleccionada.estudiante_username})</p>
            <p><strong>Trámite:</strong> {seleccionada.tipo_documento}</p>
            <p><strong>Idioma:</strong> {seleccionada.idioma} | Copias: {seleccionada.cantidad_copias}</p>
            <p><strong>Motivo/Fines:</strong> "{seleccionada.motivo}"</p>
            <p><strong>Estado Actual:</strong> <strong style={{ color: 'var(--primary)' }}>{seleccionada.estado}</strong></p>
            {seleccionada.motivo_rechazo && <p style={{ color: 'var(--danger)' }}><strong>Observaciones/Rechazo:</strong> {seleccionada.motivo_rechazo}</p>}
            {seleccionada.autorizado_por && <p style={{ color: 'var(--success)' }}><strong>Autorizado por Dirección:</strong> {seleccionada.autorizado_por} el {seleccionada.fecha_autorizacion}</p>}
          </div>

          {/* Flujo de Acciones */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* 1. Marcar en proceso */}
            {seleccionada.estado === 'PENDIENTE' && (
              <button 
                onClick={() => cambiarEstado(seleccionada.id, 'EN PROCESO')}
                className="btn" 
                style={{ width: '100%', backgroundColor: 'var(--primary-light)', color: '#fff', border: 'none' }}
              >
                <i className="fa-solid fa-spinner"></i> Iniciar Procesamiento
              </button>
            )}

            {/* 2. Emitir Documento (O enviar a autorización) */}
            {(seleccionada.estado === 'EN PROCESO' || seleccionada.estado === 'AUTORIZADO') && (
              <button 
                onClick={() => cambiarEstado(seleccionada.id, 'EMITIDO')}
                className="btn" 
                style={{ width: '100%', backgroundColor: 'var(--success)', color: '#fff', border: 'none' }}
              >
                <i className="fa-solid fa-signature"></i> Emitir Documento Oficial
              </button>
            )}

            {/* Mensaje de espera por dirección */}
            {seleccionada.estado === 'PENDIENTE_AUTORIZACION' && (
              <div style={{ padding: '10px', background: 'var(--warning-light)', color: 'var(--warning)', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold' }}>
                <i className="fa-solid fa-hourglass-half"></i> Esperando Autorización de Dirección (Decanato)
              </div>
            )}

            {/* Descargar si ya está emitido */}
            {seleccionada.estado === 'EMITIDO' && (
              <button 
                onClick={() => descargarPDF(seleccionada.id)}
                className="btn" 
                style={{ width: '100%', backgroundColor: 'var(--primary)', color: '#fff', border: 'none' }}
              >
                <i className="fa-solid fa-file-pdf"></i> Visualizar / Descargar PDF
              </button>
            )}

            {/* 3. Rechazar Solicitud */}
            {seleccionada.estado !== 'EMITIDO' && seleccionada.estado !== 'RECHAZADO' && seleccionada.estado !== 'DENEGADO' && (
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px', marginTop: '5px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Rechazar Trámite</label>
                <textarea 
                  placeholder="Escriba el motivo de rechazo..." 
                  value={motivoRechazo} 
                  onChange={(e) => setMotivoRechazo(e.target.value)} 
                  style={{ width: '100%', padding: '6px', height: '50px', fontSize: '0.8rem' }}
                />
                <button 
                  onClick={() => cambiarEstado(seleccionada.id, 'RECHAZADO', motivoRechazo)}
                  disabled={!motivoRechazo}
                  className="btn" 
                  style={{ width: '100%', marginTop: '5px', backgroundColor: 'var(--danger)', color: '#fff', border: 'none', fontSize: '0.8rem', opacity: motivoRechazo ? 1 : 0.5 }}
                >
                  Rechazar Trámite
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
