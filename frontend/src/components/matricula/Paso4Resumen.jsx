import React, { useState } from 'react';

// Componente para revisar la matrícula y aceptar los términos
export default function Paso4Resumen({ seleccionados, costoCredito, onEnviar, enviando }) {
  const [declaracion, setDeclaracion] = useState(false);

  const totalCreditos = seleccionados.reduce((acc, c) => acc + c.creditos, 0);
  const costoTotal = totalCreditos * costoCredito;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className="fa-solid fa-list-check"></i> Paso 4 — Resumen y declaración jurada
        </h3>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.85rem' }}>
        Verifica detenidamente tus cursos antes de finalizar y proceder con la solicitud.
      </p>

      {/* Tabla resumen de cursos */}
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-body)' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Código</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Asignatura</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Créditos</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Horario</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Docente</th>
            </tr>
          </thead>
          <tbody>
            {seleccionados.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No has seleccionado asignaturas. Regresa al paso anterior.
                </td>
              </tr>
            ) : (
              seleccionados.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{c.codigo}</td>
                  <td style={{ padding: '10px' }}>{c.nombre}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{c.creditos}</td>
                  <td style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--primary-light)' }}>{c.horario}</td>
                  <td style={{ padding: '10px' }}>{c.docente_nombre || 'Por asignar'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen de Costos y Créditos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: 'var(--bg-body)', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
        <div>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Créditos:</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{totalCreditos} Créditos</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Costo Total Proyectado:</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--success)' }}>S/. {costoTotal.toFixed(2)}</strong>
        </div>
      </div>

      {/* Checkbox Obligatorio */}
      <div style={{ padding: '15px', border: '1px dashed var(--border-color)', borderRadius: '6px', backgroundColor: '#fafafa', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <input 
          type="checkbox" 
          id="declaro" 
          checked={declaracion} 
          onChange={(e) => setDeclaracion(e.target.checked)} 
          style={{ marginTop: '4px', cursor: 'pointer' }}
        />
        <label htmlFor="declaro" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}>
          Declaro bajo juramento que los datos seleccionados son verdaderos y acepto las disposiciones del reglamento de matrícula de la Facultad de Ingeniería de Sistemas de la UNCP.
        </label>
      </div>
    </div>
  );
}
