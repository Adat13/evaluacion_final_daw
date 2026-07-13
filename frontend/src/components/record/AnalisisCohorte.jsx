import React, { useState, useEffect, useRef } from 'react';

export default function AnalisisCohorte({ token }) {
  const [ingreso, setIngreso] = useState('2022-I');
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Referencias para gráficos
  const lineCanvasRef = useRef(null);
  const barCanvasRef = useRef(null);
  const lineChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    cargarDatosCohorte();
  }, [ingreso]);

  const cargarDatosCohorte = async () => {
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:5000/api/record/direccion/cohorte?ingreso=${ingreso}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setData(data);
        setTimeout(() => renderGraficos(data), 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const renderGraficos = (cohorteData) => {
    if (!window.Chart) return;

    // Destruir gráficos previos
    if (lineChartInstance.current) lineChartInstance.current.destroy();
    if (barChartInstance.current) barChartInstance.current.destroy();

    // 1. Gráfico de Línea: Evolución de Matriculados
    const lineLabels = Object.keys(cohorteData.evolucion_matriculados || {});
    const lineValues = Object.values(cohorteData.evolucion_matriculados || {});
    if (lineCanvasRef.current) {
      lineChartInstance.current = new window.Chart(lineCanvasRef.current, {
        type: 'line',
        data: {
          labels: lineLabels,
          datasets: [{
            label: 'Alumnos Activos',
            data: lineValues,
            borderColor: '#3b71ca',
            backgroundColor: 'rgba(59, 113, 202, 0.1)',
            fill: true,
            tension: 0.2
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: false } } }
      });
    }

    // 2. Gráfico de Barras: Distribución de PPA por Rangos
    const barLabels = Object.keys(cohorteData.distribucion_ppa || {});
    const barValues = Object.values(cohorteData.distribucion_ppa || {});
    if (barCanvasRef.current) {
      barChartInstance.current = new window.Chart(barCanvasRef.current, {
        type: 'bar',
        data: {
          labels: barLabels,
          datasets: [{
            label: 'Cantidad de Estudiantes',
            data: barValues,
            backgroundColor: ['#dc4c64', '#e4a11b', '#3b71ca', '#14a44d']
          }]
        },
        options: { responsive: true }
      });
    }
  };

  const exportarReporte = () => {
    alert("Reporte Ejecutivo de Cohortes exportado correctamente.");
  };

  return (
    <div>
      {/* Filtros */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="card-title"><i className="fa-solid fa-chart-line"></i> Análisis de Rendimiento por Cohorte</h3>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '10px' }}>Cohorte de Ingreso:</label>
          <select 
            value={ingreso} 
            onChange={(e) => setIngreso(e.target.value)}
            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
          >
            <option value="2022-I">Ingreso 2022-I</option>
            <option value="2022-II">Ingreso 2022-II</option>
            <option value="2023-I">Ingreso 2023-I</option>
          </select>
        </div>
      </div>

      {cargando || !data ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}><i className="fa-solid fa-spinner fa-spin fa-2x"></i></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tarjetas KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>INGRESANTES</span>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{data.ingresantes_original}</h2>
            </div>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVOS ACTUALES</span>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-light)' }}>{data.activos_actuales}</h2>
            </div>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>EGRESADOS</span>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--success)' }}>{data.egresados}</h2>
            </div>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>RETENCIÓN %</span>
              <h2 style={{ fontSize: '1.8rem' }}>{data.tasa_retencion}%</h2>
            </div>
            <div className="card" style={{ padding: '15px', textAlign: 'center', marginBottom: 0 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PPA PROMEDIO</span>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--success)' }}>{data.ppa_promedio}</h2>
            </div>
          </div>

          {/* Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div className="card">
              <h4 style={{ fontSize: '0.95rem', marginBottom: '15px', textAlign: 'center' }}>Evolución de Permanencia y Retención</h4>
              <canvas ref={lineCanvasRef} style={{ maxHeight: '200px' }}></canvas>
            </div>
            <div className="card">
              <h4 style={{ fontSize: '0.95rem', marginBottom: '15px', textAlign: 'center' }}>Distribución de PPA en la Cohorte</h4>
              <canvas ref={barCanvasRef} style={{ maxHeight: '200px' }}></canvas>
            </div>
          </div>

          {/* Comparativa y Reporte Ejecutivo */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
              <h4 style={{ fontSize: '1rem' }}>Tabla Comparativa de Desempeño</h4>
              <button onClick={exportarReporte} className="btn" style={{ padding: '4px 12px', backgroundColor: 'var(--danger)', color: '#fff', border: 'none', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-file-pdf"></i> Descargar Reporte Ejecutivo
              </button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', textAlign: 'center' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Cohorte</th>
                  <th style={{ padding: '10px' }}>Ingresantes</th>
                  <th style={{ padding: '10px' }}>Activos</th>
                  <th style={{ padding: '10px' }}>Egresados</th>
                  <th style={{ padding: '10px' }}>Retención %</th>
                  <th style={{ padding: '10px' }}>PPA Promedio</th>
                </tr>
              </thead>
              <tbody style={{ textAlign: 'center' }}>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Ingreso 2022-I</td>
                  <td style={{ padding: '10px' }}>120</td>
                  <td style={{ padding: '10px' }}>95</td>
                  <td style={{ padding: '10px' }}>15</td>
                  <td style={{ padding: '10px' }}>91.6%</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>14.12</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Ingreso 2022-II</td>
                  <td style={{ padding: '10px' }}>100</td>
                  <td style={{ padding: '10px' }}>78</td>
                  <td style={{ padding: '10px' }}>10</td>
                  <td style={{ padding: '10px' }}>88.0%</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>13.85</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}
