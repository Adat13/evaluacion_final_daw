import React, { useState, useEffect } from 'react';

export default function AutorizacionCertificados({ token }) {
  const [pendientes, setPendientes] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(false);

  const [motivoDenegacion, setMotivoDenegacion] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    cargarPendientes();
  }, [token]);

  const cargarPendientes = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:5000/api/certificados/direccion/pendientes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendientes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const procesarAutorizacion = async (id, accion, motivo = '') => {
    setErrorMsg('');
    if (accion === 'DENEGAR' && !motivo) {
      setErrorMsg('El motivo de denegación es obligatorio.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/certificados/direccion/${id}/autorizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accion, motivo })
      });
      if (res.ok) {
        setSeleccionada(null);
        setMotivoDenegacion('');
        cargarPendientes();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Error al procesar autorización.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: seleccionada ? '1.2fr 1fr' : '1fr', gap: '20px' }}>
      
      {/* Tabla de Autorizaciones Pendientes */}
      <div className="card">
        <h3 className="card-title"><i className="fa-solid fa-user-shield"></i> Autorizaciones Pendientes (Dirección)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '15px' }}>Documentos de alta relevancia que requieren la validación formal del Decanato/Dirección.</p>

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Código</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Estudiante</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Tipo Documento</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Fecha Solicitud</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No existen solicitudes de certificados pendientes de autorización en este momento.
                    </td>
                  </tr>
                ) : (
                  pendientes.map((p) => (
                    <tr 
                      key={p.id} 
                      onClick={() => setSeleccionada(p)}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: seleccionada?.id === p.id ? 'var(--warning-light)' : 'transparent' }}
                    >
                      <td style={{ padding: '10px', fontWeight: 600 }}>{p.codigo}</td>
                      <td style={{ padding: '10px' }}>{p.estudiante_nombre}</td>
                      <td style={{ padding: '10px' }}>{p.tipo_documento}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('es-PE') : 'N/A'}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button className="btn" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>Evaluar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detalle Lateral para Autorizar/Denegar */}
      {seleccionada && (
        <div className="card" style={{ borderLeft: '3px solid var(--accent)', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
            <h4 style={{ fontSize: '1rem' }}>Evaluar Autorización: {seleccionada.codigo}</h4>
            <button onClick={() => setSeleccionada(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
          </div>

          {errorMsg && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{errorMsg}</div>}

          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
            <p><strong>Estudiante:</strong> {seleccionada.estudiante_nombre} ({seleccionada.estudiante_username})</p>
            <p><strong>Documento Solicitado:</strong> {seleccionada.tipo_documento}</p>
            <p><strong>Idioma / Copias:</strong> {seleccionada.idioma} | {seleccionada.cantidad_copias} copia(s)</p>
            <p><strong>Fines Declarados:</strong> "{seleccionada.motivo}"</p>
          </div>

          {/* Acciones */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <button 
              onClick={() => procesarAutorizacion(seleccionada.id, 'AUTORIZAR')}
              className="btn" 
              style={{ width: '100%', backgroundColor: 'var(--success)', color: '#fff', border: 'none', fontWeight: 600 }}
            >
              <i className="fa-solid fa-stamp"></i> Otorgar Autorización
            </button>

            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Denegar Autorización</label>
              <textarea 
                placeholder="Escriba la justificación institucional para denegar..." 
                value={motivoDenegacion} 
                onChange={(e) => setMotivoDenegacion(e.target.value)}
                style={{ width: '100%', padding: '6px', height: '60px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
              />
              <button 
                onClick={() => procesarAutorizacion(seleccionada.id, 'DENEGAR', motivoDenegacion)}
                disabled={!motivoDenegacion}
                className="btn" 
                style={{ width: '100%', marginTop: '5px', backgroundColor: 'var(--danger)', color: '#fff', border: 'none', fontSize: '0.8rem', opacity: motivoDenegacion ? 1 : 0.5 }}
              >
                Denegar Trámite
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
