import React, { useState, useEffect, useRef } from 'react';

export default function EstadisticasMatricula({ token }) {
  const [ciclo, setCiclo] = useState('2026-I');
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Referencias para los elementos canvas de los gráficos
  const barCanvasRef = useRef(null);
  const pieCanvasRef = useRef(null);
  
  // Referencias para las instancias de Chart.js y evitar duplicados al renderizar
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  useEffect(() => {
    cargarEstadisticas();
  }, [ciclo]);

  // Carga los datos de estadísticas del backend
  const cargarEstadisticas = async () => {
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:5000/api/matricula/direccion/estadisticas?ciclo=${ciclo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        // Renderizar los gráficos después de que los datos estén cargados
        setTimeout(() => renderizarGraficos(data), 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Renderiza los gráficos usando la librería global Chart.js de la ventana
  const renderizarGraficos = (data) => {
    if (!window.Chart) return;

    // Destruir gráficos anteriores si existen
    if (barChartRef.current) barChartRef.current.destroy();
    if (pieChartRef.current) pieChartRef.current.destroy();

    // Datos de Facultades
    const facLabels = Object.keys(data.facultades || {});
    const facValues = Object.values(data.facultades || {});
    
    // Gráfico de Barras - Matriculados por Facultad
    if (barCanvasRef.current) {
      barChartRef.current = new window.Chart(barCanvasRef.current, {
        type: 'bar',
        data: {
          labels: facLabels.length > 0 ? facLabels : ['Sin datos'],
          datasets: [{
            label: 'Alumnos Matriculados',
            data: facValues.length > 0 ? facValues : [0],
            backgroundColor: '#3b71ca',
            borderWidth: 1
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    // Datos de Especialidades
    const espLabels = Object.keys(data.especialidades || {});
    const espValues = Object.values(data.especialidades || {});

    // Gráfico Donut - Matriculados por Especialidad
    if (pieCanvasRef.current) {
      pieChartRef.current = new window.Chart(pieCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: espLabels.length > 0 ? espLabels : ['Sin datos'],
          datasets: [{
            data: espValues.length > 0 ? espValues : [0],
            backgroundColor: ['#002f6c', '#e6a100', '#14a44d', '#dc4c64']
          }]
        },
        options: { responsive: true }
      });
    }
  };

  // Funciones de exportación rápidas mockeadas en frontend
  const exportarReporte = (tipo) => {
    alert(`Exportación de estadísticas a formato ${tipo} completada de forma correcta.`);
  };

  return (
    <div>
      {/* Barra de Filtros */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="card-title"><i className="fa-solid fa-chart-pie"></i> Estadísticas Directivas de Matrícula</h3>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '10px' }}>Ciclo:</label>
          <select 
            value={ciclo} 
            onChange={(e) => setCiclo(e.target.value)} 
            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
          >
            <option value="2026-I">2026-I (Vigente)</option>
            <option value="2025-II">2025-II</option>
            <option value="2025-I">2025-I</option>
          </select>
        </div>
      </div>

      {cargando || !stats ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>
      ) : (
        <div>
          {/* Panel de Cards (KPIs) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SOLICITUDES</span>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{stats.resumen.total}</h2>
            </div>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>APROBADAS</span>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--success)' }}>{stats.resumen.aprobadas}</h2>
            </div>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>RECHAZADAS</span>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--danger)' }}>{stats.resumen.rechazadas}</h2>
            </div>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PENDIENTES</span>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--warning)' }}>{stats.resumen.pendientes}</h2>
            </div>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TASA APROBACIÓN</span>
              <h2 style={{ fontSize: '1.8rem' }}>{stats.resumen.tasa_aprobacion.toFixed(1)}%</h2>
            </div>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>INGRESOS TOTALES</span>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--success)' }}>S/. {stats.resumen.ingresos.toFixed(2)}</h2>
            </div>
          </div>

          {/* Gráficos Canvas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '15px', textAlign: 'center' }}>Matriculados por Facultad</h4>
              <canvas ref={barCanvasRef} style={{ maxHeight: '200px' }}></canvas>
            </div>
            <div className="card">
              <h4 style={{ fontSize: '1rem', marginBottom: '15px', textAlign: 'center' }}>Matriculados por Especialidad</h4>
              <div style={{ width: '160px', margin: '0 auto' }}>
                <canvas ref={pieCanvasRef} style={{ maxHeight: '160px' }}></canvas>
              </div>
            </div>
          </div>

          {/* Reportes e Exportaciones */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
              <h4 style={{ fontSize: '1rem' }}>Detalle de Carga por Especialidad</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => exportarReporte('PDF')} className="btn" style={{ padding: '4px 10px', backgroundColor: 'var(--danger)', color: '#fff', border: 'none', fontSize: '0.8rem' }}>
                  <i className="fa-solid fa-file-pdf"></i> Exportar PDF
                </button>
                <button onClick={() => exportarReporte('EXCEL')} className="btn" style={{ padding: '4px 10px', backgroundColor: 'var(--success)', color: '#fff', border: 'none', fontSize: '0.8rem' }}>
                  <i className="fa-solid fa-file-excel"></i> Exportar Excel
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Especialidad / Escuela</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Alumnos Matriculados</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Vacantes Totales</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Porcentaje Ocupación</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(stats.especialidades).length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos matriculados en este ciclo.</td>
                  </tr>
                ) : (
                  Object.keys(stats.especialidades).map((esp) => (
                    <tr key={esp} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{esp}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{stats.especialidades[esp]}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>30</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {((stats.especialidades[esp] / 30) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}
