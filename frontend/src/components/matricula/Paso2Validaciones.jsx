import React from 'react';

// Componente para validar requisitos académicos del estudiante
export default function Paso2Validaciones({ reqs }) {
  // Verificamos si alguna validación ha fallado
  const tieneErrores = reqs.some(r => !r.aprobado);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className="fa-solid fa-clipboard-check"></i> Paso 2 — Validaciones del estudiante
        </h3>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.85rem' }}>
        El sistema evalúa automáticamente de forma reglamentada tu estado financiero y académico.
      </p>

      {/* Listado de validaciones con sus estados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reqs.map((r) => (
          <div 
            key={r.id} 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              padding: '12px 20px', border: '1px solid var(--border-color)', borderRadius: '6px',
              backgroundColor: r.aprobado ? 'var(--success-light)' : 'var(--danger-light)'
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: r.aprobado ? '#1b5e20' : '#b71c1c' }}>
                {r.nombre}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.descripcion}</span>
            </div>
            
            {/* Ícono de Cumple / No Cumple */}
            <span style={{ 
              display: 'inline-flex', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
              backgroundColor: r.aprobado ? 'var(--success)' : 'var(--danger)', color: '#fff', gap: '4px', alignItems: 'center'
            }}>
              {r.aprobado ? <><i className="fa-solid fa-check"></i> Cumple</> : <><i className="fa-solid fa-xmark"></i> No cumple</>}
            </span>
          </div>
        ))}
      </div>

      {/* Advertencia si no se cumplen todos los requisitos */}
      {tieneErrores && (
        <div style={{ 
          marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', color: '#856404', 
          border: '1px solid #ffeeba', borderRadius: '6px', display: 'flex', gap: '10px', alignItems: 'center' 
        }}>
          <i className="fa-solid fa-circle-exclamation fa-lg"></i>
          <div>
            <strong>¡Bloqueo de Matrícula!</strong> No cumples todos los requisitos obligatorios. Por favor, regulariza tu situación administrativa antes de continuar.
          </div>
        </div>
      )}
    </div>
  );
}
