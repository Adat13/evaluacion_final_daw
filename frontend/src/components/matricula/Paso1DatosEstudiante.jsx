import React from 'react';

// Componente simple para mostrar los datos del estudiante de solo lectura
export default function Paso1DatosEstudiante({ datos, loading }) {
  // Si está cargando, mostramos un spinner simple
  if (loading) {
    return (
      <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
        <p><i className="fa-solid fa-spinner fa-spin"></i> Cargando datos académicos del estudiante...</p>
      </div>
    );
  }

  if (!datos) return null;

  // Lista de campos a mostrar de forma ordenada
  const campos = [
    { label: 'Código Universitario', value: datos.codigo },
    { label: 'Nombre Completo', value: datos.nombre_completo },
    { label: 'Correo Institucional', value: datos.email },
    { label: 'Documento', value: datos.documento },
    { label: 'Celular / Teléfono', value: datos.telefono || 'No registrado' },
    { label: 'Facultad', value: datos.facultad },
    { label: 'Escuela Profesional', value: datos.escuela },
    { label: 'Ciclo Ingreso', value: datos.ciclo_ingreso },
    { label: 'Ciclo Matriculación', value: datos.ciclo_matricula },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className="fa-solid fa-id-card"></i> Paso 1 — Datos del estudiante
        </h3>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.85rem' }}>
        Estos datos académicos son de sólo lectura y provienen del sistema central.
      </p>
      
      {/* Grid de campos simples */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
        {campos.map((c) => (
          <div key={c.label}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              {c.label}
            </label>
            <input 
              type="text" 
              value={c.value} 
              readOnly 
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#f1f5f9', outline: 'none' }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
