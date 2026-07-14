import React, { useState, useEffect } from 'react';

export default function RecordEstudiante({ token, estudianteId }) {
  const [record, setRecord] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarRecord();
  }, [token, estudianteId]);

  const cargarRecord = async () => {
    setCargando(true);
    try {
      // Si recibimos un estudianteId (admin), cargamos ese. Si no, cargamos el "mi-record" (estudiante)
      const url = estudianteId 
        ? `http://localhost:5000/api/record/estudiante/${estudianteId}`
        : 'http://localhost:5000/api/record/mi-record';
        
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecord(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const descargarPDF = () => {
    // Si somos admin pasamos estudianteId, si somos estudiante usamos el id del usuario logueado
    const id = estudianteId || JSON.parse(localStorage.getItem('user'))?.id;
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:5000' 
      : window.location.origin;
    window.open(`${baseUrl}/api/record/estudiante/${id}/pdf`, '_blank');
  };

  if (cargando) {
    return <div className="card" style={{ textAlign: 'center', padding: '30px' }}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>;
  }

  if (!record) return null;

  const { kpis, ciclos, cursos_pendientes } = record;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Cabecera y botón de descargar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h3 className="card-title"><i className="fa-solid fa-graduation-cap"></i> Record Académico Consolidado</h3>
        <button onClick={descargarPDF} className="btn" style={{ backgroundColor: 'var(--danger)', color: '#fff', border: 'none' }}>
          <i className="fa-solid fa-file-pdf"></i> Descargar Record PDF
        </button>
      </div>

      {/* Tarjetas de KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
        <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CRÉDITOS PLAN</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{kpis.total_plan}</h2>
        </div>
        <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>APROBADOS</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--success)' }}>{kpis.creditos_approved || kpis.creditos_aprobados}</h2>
        </div>
        <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PENDIENTES</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--warning)' }}>{kpis.creditos_pendientes}</h2>
        </div>
        <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PPA (PROMEDIO)</span>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{kpis.ppa}</h2>
        </div>
      </div>

      {/* Barra de progreso de avance */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
          <span>Avance Curricular Proyectado</span>
          <span>{kpis.avance}%</span>
        </div>
        <div style={{ width: '100%', height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${kpis.avance}%`, height: '100%', background: 'var(--success)', borderRadius: '6px' }}></div>
        </div>
      </div>

      {/* Historial colapsable por ciclos */}
      <div className="card" style={{ marginBottom: 0 }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '15px' }}><i className="fa-solid fa-clock-rotate-left"></i> Historial por Periodo</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.keys(ciclos).sort().map((ciclo) => (
            <details key={ciclo} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }} open>
              <summary style={{ padding: '10px 15px', background: 'var(--bg-body)', fontWeight: 'bold', cursor: 'pointer', outline: 'none', display: 'flex', justifyContent: 'space-between' }}>
                <span>Ciclo Académico {ciclo}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>Ver asignaturas</span>
              </summary>
              <div style={{ padding: '10px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Código</th>
                      <th style={{ padding: '8px' }}>Asignatura</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Créditos</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Nota Final</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ciclos[ciclo].map((n) => (
                      <tr key={n.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{n.curso_codigo}</td>
                        <td style={{ padding: '8px' }}>{n.curso_nombre}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>{n.creditos}</td>
                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: n.nota_final >= 11 ? 'var(--primary)' : 'var(--danger)' }}>{n.nota_final}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                            backgroundColor: n.estado === 'APROBADO' ? 'var(--success-light)' : 'var(--danger-light)',
                            color: n.estado === 'APROBADO' ? 'var(--success)' : 'var(--danger)'
                          }}>{n.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Cursos pendientes */}
      {cursos_pendientes && cursos_pendientes.length > 0 && (
        <div className="card">
          <h4 style={{ fontSize: '1.1rem', marginBottom: '15px' }}><i className="fa-solid fa-list-ul"></i> Cursos Pendientes para Egreso</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {cursos_pendientes.map((c) => (
              <div key={c.codigo} style={{ padding: '10px 15px', border: '1px solid var(--border-color)', borderRadius: '6px', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', display: 'block' }}>{c.nombre}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Código: {c.codigo}</span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', background: 'var(--warning-light)', color: 'var(--warning)', padding: '2px 6px', borderRadius: '4px' }}>
                  {c.creditos} Cr
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
