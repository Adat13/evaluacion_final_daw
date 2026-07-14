import React, { useState } from 'react';

// Valida si dos cursos se cruzan en su horario
function verificarCruce(c1, c2) {
  if (!c1.dia_semana || !c2.dia_semana) return false;
  if (!c1.hora_inicio || !c1.hora_fin || !c2.hora_inicio || !c2.hora_fin) return false;

  const dias1 = c1.dia_semana.split(',');
  const dias2 = c2.dia_semana.split(',');
  const diasComunes = dias1.filter(d => dias2.includes(d));
  if (diasComunes.length === 0) return false;
  return c1.hora_inicio < c2.hora_fin && c2.hora_inicio < c1.hora_fin;
}

export default function Paso3SeleccionCursos({ cursos, seleccionados, setSeleccionados }) {
  const [cruceAlerta, setCruceAlerta] = useState('');

  // Maneja la acción de seleccionar / deseleccionar un curso
  const handleToggle = (curso) => {
    const yaSeleccionado = seleccionados.some(c => c.id === curso.id);

    if (yaSeleccionado) {
      // Si ya está, lo removemos y limpiamos alertas
      setSeleccionados(seleccionados.filter(c => c.id !== curso.id));
      setCruceAlerta('');
    } else {
      // Si no está, validamos cruces con los ya seleccionados
      let tieneCruce = false;
      for (const sel of seleccionados) {
        if (verificarCruce(curso, sel)) {
          setCruceAlerta(`Conflicto de horario entre "${curso.nombre}" y "${sel.nombre}".`);
          tieneCruce = true;
          break;
        }
      }

      if (!tieneCruce) {
        setSeleccionados([...seleccionados, curso]);
        setCruceAlerta('');
      }
    }
  };

  const totalCreditos = seleccionados.reduce((acc, c) => acc + c.creditos, 0);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <i className="fa-solid fa-book-bookmark"></i> Paso 3 — Selección de cursos
        </h3>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.85rem' }}>
        Selecciona las asignaturas disponibles. Recuerda no exceder el límite de 22 créditos y evitar cruces de horarios.
      </p>

      {/* Alerta de cruce de horario */}
      {cruceAlerta && (
        <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 600 }}>
          <i className="fa-solid fa-triangle-exclamation"></i> {cruceAlerta}
        </div>
      )}

      {/* Grid de cursos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
        {cursos.map((c) => {
          const seleccionado = seleccionados.some(s => s.id === c.id);
          const deshabilitado = !c.puede_seleccionar && !seleccionado;
          
          return (
            <div 
              key={c.id} 
              style={{
                border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px', 
                backgroundColor: seleccionado ? 'var(--warning-light)' : deshabilitado ? '#f1f5f9' : '#fff',
                opacity: deshabilitado ? 0.6 : 1, transition: 'all 0.2s', position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ fontSize: '0.95rem' }}>{c.nombre}</strong>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>({c.codigo})</span>
              </div>
              <p style={{ fontSize: '0.8rem', margin: '6px 0', color: 'var(--text-muted)' }}>
                Docente: {c.docente_nombre || 'Por asignar'}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '10px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                <span>Créditos: <strong>{c.creditos}</strong></span>
                <span>Cupos: <strong>{c.cupos_ocupados}/{c.cupos_max}</strong></span>
              </div>
              
              <div style={{ fontSize: '0.75rem', marginTop: '5px', color: 'var(--primary-light)' }}>
                <i className="fa-solid fa-clock"></i> {c.horario}
              </div>

              {/* Badges de error (sin cupo o prerrequisito) */}
              {!c.tiene_cupo && (
                <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'var(--danger)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  Sin vacantes
                </span>
              )}
              {!c.cumple_prerrequisito && (
                <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'var(--warning)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  Falta prerrequisito
                </span>
              )}

              {/* Botón de selección */}
              <button
                type="button"
                disabled={deshabilitado}
                onClick={() => handleToggle(c)}
                style={{
                  width: '100%', marginTop: '15px', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '4px',
                  backgroundColor: seleccionado ? 'var(--accent)' : '#fff', 
                  color: seleccionado ? '#fff' : deshabilitado ? 'var(--text-muted)' : 'var(--text-main)',
                  fontWeight: 600, cursor: deshabilitado ? 'not-allowed' : 'pointer'
                }}
              >
                {seleccionado ? <><i className="fa-solid fa-check"></i> Seleccionado</> : 'Seleccionar asignatura'}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '20px', padding: '10px 15px', backgroundColor: 'var(--bg-body)', borderRadius: '6px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
        Total Créditos Seleccionados: {totalCreditos} / 22 Max.
      </div>
    </div>
  );
}
