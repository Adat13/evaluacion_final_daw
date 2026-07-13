import React, { useState, useEffect } from 'react';

export default function GestionSolicitudes({ token }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(false);
  
  // Estados de formularios
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [montoPago, setMontoPago] = useState('');
  const [voucherPago, setVoucherPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('Transferencia');
  const [fechaPago, setFechaPago] = useState('');
  const [justificacionPago, setJustificacionPago] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    cargarSolicitudes();
  }, [filtroEstado, busqueda]);

  // Carga todas las solicitudes con filtros
  const cargarSolicitudes = async () => {
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:5000/api/matricula?estado=${filtroEstado}&search=${busqueda}`, {
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

  // Cambiar estado a EN REVISION
  const marcarRevision = async (id) => {
    setErrorMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/matricula/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: 'EN REVISION' })
      });
      if (res.ok) {
        const updated = await res.json();
        setSeleccionada(updated);
        cargarSolicitudes();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Error al actualizar estado.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Registrar el pago
  const registrarPago = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/matricula/${seleccionada.id}/registrar-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          monto: parseFloat(montoPago),
          voucher: voucherPago,
          metodo: metodoPago,
          fecha: fechaPago,
          justificacion: justificacionPago
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSeleccionada(data);
        cargarSolicitudes();
        setMontoPago('');
        setVoucherPago('');
        setJustificacionPago('');
      } else {
        setErrorMsg(data.error || 'Error al registrar pago.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Aprobar matrícula
  const aprobarMatricula = async (id) => {
    setErrorMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/matricula/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: 'APROBADA' })
      });
      const data = await res.json();
      if (res.ok) {
        setSeleccionada(data);
        cargarSolicitudes();
      } else {
        setErrorMsg(data.error || 'Error al aprobar.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Rechazar matrícula
  const rechazarMatricula = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (motivoRechazo.length < 20) {
      setErrorMsg('El motivo de rechazo debe tener mínimo 20 caracteres.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/matricula/${seleccionada.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: 'RECHAZADA', motivo: motivoRechazo })
      });
      const data = await res.json();
      if (res.ok) {
        setSeleccionada(data);
        cargarSolicitudes();
        setMotivoRechazo('');
      } else {
        setErrorMsg(data.error || 'Error al rechazar.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: seleccionada ? '1.2fr 1fr' : '1fr', gap: '20px' }}>
      
      {/* Listado de Solicitudes */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h3 className="card-title"><i className="fa-solid fa-users-viewfinder"></i> Gestión de Matrícula</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            >
              <option value="">Todos los Estados</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN REVISION">EN REVISION</option>
              <option value="APROBADA">APROBADA</option>
              <option value="RECHAZADA">RECHAZADA</option>
            </select>
            <input 
              type="text" 
              placeholder="Buscar código o nombre..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
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
                  <th style={{ padding: '8px', textAlign: 'center' }}>Créditos</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Pago</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Acciones</th>
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
                    <td style={{ padding: '8px' }}>
                      <strong>{s.estudiante_username}</strong> - {s.estudiante_nombre}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{s.creditos_total}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {s.pago_registrado ? <span style={{ color: 'var(--success)' }}><i className="fa-solid fa-circle-check"></i> Pagado</span> : <span style={{ color: 'var(--danger)' }}><i className="fa-solid fa-circle-xmark"></i> Pendiente</span>}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                        backgroundColor: s.estado === 'APROBADA' ? 'var(--success-light)' : s.estado === 'PENDIENTE' ? 'var(--warning-light)' : 'var(--danger-light)',
                        color: s.estado === 'APROBADA' ? 'var(--success)' : s.estado === 'PENDIENTE' ? 'var(--warning)' : 'var(--danger)'
                      }}>{s.estado}</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button className="btn" style={{ padding: '2px 6px', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>Detalle</button>
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
        <div className="card" style={{ borderLeft: '3px solid var(--primary-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
            <h4 style={{ fontSize: '1.1rem' }}>Detalle: {seleccionada.codigo}</h4>
            <button onClick={() => setSeleccionada(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
          </div>

          {errorMsg && <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{errorMsg}</div>}

          {/* Información del alumno */}
          <div style={{ marginBottom: '15px', fontSize: '0.85rem' }}>
            <p><strong>Estudiante:</strong> {seleccionada.estudiante_nombre} ({seleccionada.estudiante_username})</p>
            <p><strong>Costo Matrícula:</strong> S/. {seleccionada.monto_total.toFixed(2)} ({seleccionada.creditos_total} Créditos)</p>
            <p><strong>Estado Actual:</strong> <span style={{ fontWeight: 'bold' }}>{seleccionada.estado}</span></p>
            {seleccionada.observaciones && <p style={{ color: 'var(--danger)' }}><strong>Observación:</strong> {seleccionada.observaciones}</p>}
          </div>

          {/* Asignaturas solicitadas */}
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ fontSize: '0.85rem' }}>Cursos Solicitados:</strong>
            <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', marginTop: '5px' }}>
              {seleccionada.cursos?.map(c => (
                <li key={c.id}>{c.codigo} - {c.nombre} ({c.creditos} cr) - Horario: {c.horario}</li>
              ))}
            </ul>
          </div>

          {/* Flujo de acciones del administrador */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* 1. Marcar en revisión */}
            {seleccionada.estado === 'PENDIENTE' && (
              <button onClick={() => marcarRevision(seleccionada.id)} className="btn" style={{ width: '100%', backgroundColor: 'var(--primary-light)', color: '#fff', border: 'none' }}>
                <i className="fa-solid fa-magnifying-glass"></i> Iniciar Revisión
              </button>
            )}

            {/* 2. Formulario para registrar el pago */}
            {!seleccionada.pago_registrado ? (
              <form onSubmit={registrarPago} style={{ padding: '15px', background: 'var(--bg-body)', borderRadius: '6px' }}>
                <strong style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem' }}>Registrar Pago Voucher</strong>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <input type="number" step="0.01" placeholder="Monto S/." value={montoPago} onChange={(e) => setMontoPago(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem' }} required />
                  <input type="text" placeholder="Nº Voucher" value={voucherPago} onChange={(e) => setVoucherPago(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem' }} required />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem' }}>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                  <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem' }} required />
                </div>

                <textarea placeholder="Justificación si el monto no coincide" value={justificacionPago} onChange={(e) => setJustificacionPago(e.target.value)} style={{ width: '100%', padding: '6px', height: '50px', fontSize: '0.8rem' }} />
                
                <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', fontSize: '0.8rem' }}>
                  Registrar Pago
                </button>
              </form>
            ) : (
              <div style={{ padding: '10px', background: 'var(--success-light)', borderRadius: '6px', fontSize: '0.8rem' }}>
                <strong>Información de Pago Registrado:</strong>
                <p>Monto: S/. {seleccionada.pago_monto} | Voucher: {seleccionada.pago_voucher}</p>
                <p>Fecha: {seleccionada.pago_fecha} | Método: {seleccionada.pago_metodo}</p>
                {seleccionada.justificacion_pago && <p style={{ color: 'var(--warning)' }}><strong>Justificación:</strong> {seleccionada.justificacion_pago}</p>}
              </div>
            )}

            {/* 3. Aprobar Matrícula */}
            {seleccionada.estado !== 'APROBADA' && seleccionada.estado !== 'RECHAZADA' && (
              <button 
                onClick={() => aprobarMatricula(seleccionada.id)} 
                disabled={!seleccionada.pago_registrado}
                className="btn" 
                style={{ width: '100%', backgroundColor: 'var(--success)', color: '#fff', border: 'none', opacity: seleccionada.pago_registrado ? 1 : 0.5, cursor: seleccionada.pago_registrado ? 'pointer' : 'not-allowed' }}
              >
                <i className="fa-solid fa-circle-check"></i> Aprobar Matrícula
              </button>
            )}

            {/* 4. Rechazar Matrícula */}
            {seleccionada.estado !== 'RECHAZADA' && seleccionada.estado !== 'APROBADA' && (
              <form onSubmit={rechazarMatricula} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Rechazar Solicitud</strong>
                <textarea 
                  placeholder="Ingrese el motivo de rechazo (mínimo 20 caracteres)..." 
                  value={motivoRechazo} 
                  onChange={(e) => setMotivoRechazo(e.target.value)} 
                  style={{ width: '100%', padding: '8px', height: '60px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  required
                />
                <button type="submit" className="btn" style={{ width: '100%', marginTop: '5px', backgroundColor: 'var(--danger)', color: '#fff', border: 'none', fontSize: '0.8rem' }}>
                  <i className="fa-solid fa-ban"></i> Rechazar Solicitud
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
