import React, { useState, useEffect } from 'react';

const TRAMITES = [
  { tipo: 'Constancia de Matrícula', costo: 15.0, desc: 'Acredita que cuentas con una matrícula académica aprobada en el ciclo vigente.' },
  { tipo: 'Constancia de Notas', costo: 20.0, desc: 'Reporta tus calificaciones consolidadas oficiales hasta la fecha.' },
  { tipo: 'Certificado de Estudios', costo: 45.0, desc: 'Certifica las calificaciones obtenidas en tus ciclos académicos. Requiere autorización directiva.' },
  { tipo: 'Constancia de Egresado', costo: 60.0, desc: 'Acredita la culminación satisfactoria de tu plan curricular. Requiere aprobación directiva.' }
];

export default function SolicitudCertificados({ token }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Formulario
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TRAMITES[0].tipo);
  const [motivo, setMotivo] = useState('');
  const [idioma, setIdioma] = useState('Español');
  const [cantidad, setCantidad] = useState(1);
  
  const [elegible, setElegible] = useState(true);
  const [elegibilidadMsg, setElegibilidadMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  useEffect(() => {
    cargarSolicitudes();
  }, [token]);

  useEffect(() => {
    verificarRequisitos();
  }, [tipoSeleccionado]);

  // Carga mis solicitudes previas
  const cargarSolicitudes = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:5000/api/certificados/mis-solicitudes', {
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

  // Verifica los requisitos de elegibilidad simulados en frontend (coherente con backend)
  const verificarRequisitos = async () => {
    setErrorMsg('');
    try {
      // Llamamos temporalmente al endpoint para verificar si cumple la regla
      const res = await fetch('http://localhost:5000/api/record/mi-record', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const record = res.ok ? await res.json() : null;
      
      const resMat = await fetch('http://localhost:5000/api/matricula', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const matriculas = resMat.ok ? await resMat.json() : [];

      if (tipoSeleccionado === 'Constancia de Matrícula') {
        const tieneMat = matriculas.some(m => m.estado === 'APROBADA');
        setElegible(tieneMat);
        setElegibilidadMsg(tieneMat ? '' : 'No posees ninguna matrícula APROBADA en el ciclo actual.');
      } else if (tipoSeleccionado === 'Constancia de Notas' || tipoSeleccionado === 'Certificado de Estudios') {
        const tieneNotas = record && Object.keys(record.ciclos).length > 0;
        setElegible(tieneNotas);
        setElegibilidadMsg(tieneNotas ? '' : 'No cuentas con historial académico o calificaciones cargadas en el sistema.');
      } else if (tipoSeleccionado === 'Constancia de Egresado') {
        const creditosAprobados = record ? record.kpis.creditos_aprobados : 0;
        const cumple = creditosAprobados >= 14; // min 14 en test
        setElegible(cumple);
        setElegibilidadMsg(cumple ? '' : 'Aún no completas el total de créditos obligatorios del plan (mínimo 14 cr en test).');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setExitoMsg('');
    if (!elegible) {
      setErrorMsg('No cumples los requisitos de elegibilidad para este documento.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/certificados/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tipo_documento: tipoSeleccionado,
          motivo,
          idioma,
          cantidad_copias: cantidad
        })
      });
      const data = await res.json();
      if (res.ok) {
        setExitoMsg(`Solicitud creada correctamente con código: ${data.solicitud.codigo}`);
        setMotivo('');
        setCantidad(1);
        cargarSolicitudes();
      } else {
        setErrorMsg(data.error || 'Error al procesar solicitud.');
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

  const currentTramite = TRAMITES.find(t => t.tipo === tipoSeleccionado);
  const costoTotal = currentTramite ? currentTramite.costo * cantidad : 0.0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px' }}>
      
      {/* Formulario de Solicitud */}
      <div className="card">
        <h3 className="card-title"><i className="fa-solid fa-file-invoice"></i> Solicitar Certificado / Constancia</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '15px' }}>Completar el formulario de trámite digital académico.</p>

        {exitoMsg && <div style={{ color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 600 }}>{exitoMsg}</div>}
        {errorMsg && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{errorMsg}</div>}

        <form onSubmit={enviarSolicitud} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Tipo de Documento</label>
            <select 
              value={tipoSeleccionado} 
              onChange={(e) => setTipoSeleccionado(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            >
              {TRAMITES.map(t => <option key={t.tipo} value={t.tipo}>{t.tipo}</option>)}
            </select>
          </div>

          {currentTramite && (
            <div style={{ padding: '10px', background: 'var(--bg-body)', borderRadius: '6px', fontSize: '0.8rem' }}>
              <strong>Descripción:</strong> {currentTramite.desc}
            </div>
          )}

          {/* Advertencia de Elegibilidad */}
          {!elegible && (
            <div style={{ padding: '10px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
              <i className="fa-solid fa-circle-xmark"></i> Requisito Faltante: {elegibilidadMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Idioma</label>
              <select value={idioma} onChange={(e) => setIdioma(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <option value="Español">Español</option>
                <option value="Inglés">Inglés</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Copias</label>
              <input type="number" min="1" max="5" value={cantidad} onChange={(e) => setCantidad(parseInt(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Destino / Motivo de la Solicitud</label>
            <textarea 
              value={motivo} 
              onChange={(e) => setMotivo(e.target.value)} 
              placeholder="Ej: Para postular a beca externa, fines laborales, etc."
              style={{ width: '100%', padding: '8px', height: '60px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '5px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Costo Total del Trámite:</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--success)', display: 'block' }}>S/. {costoTotal.toFixed(2)}</strong>
            </div>
            <button 
              type="submit" 
              disabled={!elegible}
              className="btn" 
              style={{ backgroundColor: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', opacity: elegible ? 1 : 0.5, cursor: elegible ? 'pointer' : 'not-allowed' }}
            >
              Confirmar Solicitud
            </button>
          </div>
        </form>
      </div>

      {/* Historial de Solicitudes */}
      <div className="card">
        <h3 className="card-title"><i className="fa-solid fa-clock-rotate-left"></i> Mis Solicitudes</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '15px' }}>Monitorea el estado y descarga tus documentos emitidos.</p>

        {cargando ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Código</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Documento</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>Aún no has solicitado ningún certificado.</td>
                  </tr>
                ) : (
                  solicitudes.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{s.codigo}</td>
                      <td style={{ padding: '8px' }}>
                        <strong>{s.tipo_documento}</strong>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Idioma: {s.idioma}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                          backgroundColor: s.estado === 'EMITIDO' ? 'var(--success-light)' : s.estado.includes('PENDIENTE') ? 'var(--warning-light)' : 'var(--danger-light)',
                          color: s.estado === 'EMITIDO' ? 'var(--success)' : s.estado.includes('PENDIENTE') ? 'var(--warning)' : 'var(--danger)'
                        }}>{s.estado}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {s.estado === 'EMITIDO' ? (
                          <button 
                            onClick={() => descargarPDF(s.id)}
                            className="btn" 
                            style={{ padding: '3px 6px', backgroundColor: 'var(--success)', color: '#fff', border: 'none', fontSize: '0.7rem' }}
                          >
                            <i className="fa-solid fa-file-pdf"></i> Descargar
                          </button>
                        ) : s.estado === 'RECHAZADO' || s.estado === 'DENEGADO' ? (
                          <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }} title={s.motivo_rechazo}>Rechazado</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>En Trámite</span>
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

    </div>
  );
}
