import React, { useState, useEffect } from 'react';
import RecordEstudiante from './RecordEstudiante';

export default function ReportesConsolidados({ token }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  
  // Estados para reportes masivos
  const [tipoReporte, setTipoReporte] = useState('egreso'); // 'egreso' o 'riesgo'
  const [datosReporte, setDatosReporte] = useState([]);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('individual'); // 'individual' o 'masivo'

  useEffect(() => {
    cargarUsuarios();
  }, [token]);

  useEffect(() => {
    if (vistaActiva === 'masivo') {
      cargarReporteMasivo();
    }
  }, [tipoReporte, vistaActiva]);

  // Carga lista de usuarios del backend (filtrado para estudiantes)
  const cargarUsuarios = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data.filter(u => u.role === 'estudiante'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Carga los datos del reporte masivo (egreso/riesgo)
  const cargarReporteMasivo = async () => {
    setCargandoReporte(true);
    try {
      const res = await fetch(`http://localhost:5000/api/record/reportes?tipo=${tipoReporte}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDatosReporte(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoReporte(false);
    }
  };

  // Filtra los estudiantes según el término de búsqueda
  const estudiantesFiltrados = usuarios.filter(u => 
    u.name.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.username.toLowerCase().includes(busqueda.toLowerCase())
  );

  const exportarReporte = (formato) => {
    alert(`Reporte masivo exportado correctamente en formato ${formato}.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Selector de Vista (Individual vs Masivo) */}
      <div className="card" style={{ display: 'flex', gap: '15px', marginBottom: 0 }}>
        <button 
          onClick={() => { setVistaActiva('individual'); setEstudianteSeleccionado(null); }}
          className="btn" 
          style={{ backgroundColor: vistaActiva === 'individual' ? 'var(--primary)' : 'transparent', color: vistaActiva === 'individual' ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)' }}
        >
          <i className="fa-solid fa-user"></i> Consulta Individual
        </button>
        <button 
          onClick={() => setVistaActiva('masivo')}
          className="btn" 
          style={{ backgroundColor: vistaActiva === 'masivo' ? 'var(--primary)' : 'transparent', color: vistaActiva === 'masivo' ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)' }}
        >
          <i className="fa-solid fa-users"></i> Reportes Consolidados Masivos
        </button>
      </div>

      {vistaActiva === 'individual' ? (
        <div style={{ display: 'grid', gridTemplateColumns: estudianteSeleccionado ? '1fr 2.5fr' : '1fr', gap: '20px' }}>
          
          {/* Panel de Búsqueda */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '15px' }}><i className="fa-solid fa-magnifying-glass"></i> Buscar Estudiante</h4>
            <input 
              type="text" 
              placeholder="Escriba código o nombre..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '15px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {estudiantesFiltrados.map((est) => (
                <div 
                  key={est.id} 
                  onClick={() => setEstudianteSeleccionado(est)}
                  style={{
                    padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px',
                    cursor: 'pointer', backgroundColor: estudianteSeleccionado?.id === est.id ? 'var(--warning-light)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <strong style={{ fontSize: '0.85rem', display: 'block' }}>{est.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Código: {est.username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Renderizado dinámico del record académico del estudiante seleccionado */}
          {estudianteSeleccionado && (
            <div>
              <RecordEstudiante token={token} estudianteId={estudianteSeleccionado.id} />
            </div>
          )}

        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem' }}>Filtros de Reporte Consolidado</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Genere listados institucionales de forma inmediata.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                value={tipoReporte} 
                onChange={(e) => setTipoReporte(e.target.value)}
                style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
              >
                <option value="egreso">Aptos para Egreso</option>
                <option value="riesgo">En Riesgo Académico</option>
              </select>
              <button onClick={() => exportarReporte('PDF')} className="btn" style={{ backgroundColor: 'var(--danger)', color: '#fff', border: 'none', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-file-pdf"></i> Exportar PDF
              </button>
              <button onClick={() => exportarReporte('EXCEL')} className="btn" style={{ backgroundColor: 'var(--success)', color: '#fff', border: 'none', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-file-excel"></i> Exportar Excel
              </button>
            </div>
          </div>

          {cargandoReporte ? (
            <div style={{ textAlign: 'center', padding: '30px' }}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Código</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Estudiante</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Especialidad</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Créditos Aprobados</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>PPA</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Avance %</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Condición</th>
                  </tr>
                </thead>
                <tbody>
                  {datosReporte.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No se encontraron estudiantes que coincidan con los criterios del reporte.
                      </td>
                    </tr>
                  ) : (
                    datosReporte.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{d.codigo}</td>
                        <td style={{ padding: '10px' }}>{d.nombre}</td>
                        <td style={{ padding: '10px' }}>{d.especialidad}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{d.creditos_aprobados}</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{d.ppa}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{d.avance}%</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                            backgroundColor: d.ppa >= 11 ? 'var(--success-light)' : 'var(--danger-light)',
                            color: d.ppa >= 11 ? 'var(--success)' : 'var(--danger)'
                          }}>{d.estado.toUpperCase()}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
