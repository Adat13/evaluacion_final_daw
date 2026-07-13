import React, { useState, useEffect } from 'react';
import { getPreCheck, getMiDatos, getValidaciones, getCursosDisponibles, crearSolicitud } from '../../services/matriculaApi';
import Paso1DatosEstudiante from './Paso1DatosEstudiante';
import Paso2Validaciones from './Paso2Validaciones';
import Paso3SeleccionCursos from './Paso3SeleccionCursos';
import Paso4Resumen from './Paso4Resumen';

const PASOS = [
  { num: 1, titulo: 'Datos del Estudiante' },
  { num: 2, titulo: 'Requisitos Académicos' },
  { num: 3, titulo: 'Selección de Cursos' },
  { num: 4, titulo: 'Enviar Solicitud' },
];

export default function ProcesoMatricula({ token, alTerminar }) {
  // Estados para el flujo de matrícula
  const [paso, setPaso] = useState(1);
  const [preCheckData, setPreCheckData] = useState(null);
  const [estudianteDatos, setEstudianteDatos] = useState(null);
  const [reqs, setReqs] = useState([]);
  const [reqsAprobados, setReqsAprobados] = useState(false);
  const [cursos, setCursos] = useState([]);
  const [cursosSeleccionados, setCursosSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resultadoSolicitud, setResultadoSolicitud] = useState(null);

  // Carga inicial de verificación
  useEffect(() => {
    cargarVerificaciones();
  }, [token]);

  const cargarVerificaciones = async () => {
    setCargando(true);
    setError('');
    try {
      // 1. Validar pre-check
      const pre = await getPreCheck(token);
      setPreCheckData(pre);

      if (pre.puede_matricularse) {
        // 2. Si puede, cargar datos personales y validaciones
        const datos = await getMiDatos(token);
        setEstudianteDatos(datos);

        const val = await getValidaciones(token);
        setReqs(val.validaciones);
        setReqsAprobados(val.todas_aprobadas);

        // 3. Cargar asignaturas ofertadas
        const cur = await getCursosDisponibles(token);
        setCursos(cur);
      }
    } catch (err) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setCargando(false);
    }
  };

  // Enviar formulario final (Paso 4)
  const enviarMatricula = async () => {
    setCargando(true);
    setError('');
    try {
      const ids = cursosSeleccionados.map((c) => c.id);
      const res = await crearSolicitud(token, { curso_ids: ids, acepto_terminos: true });
      setResultadoSolicitud(res.solicitud);
      setPaso(5); // Paso de éxito
    } catch (err) {
      setError(err.message || 'Error al procesar matrícula.');
    } finally {
      setCargando(false);
    }
  };

  if (cargando && paso === 1) {
    return <div className="card" style={{ textAlign: 'center', padding: '30px' }}><i className="fa-solid fa-spinner fa-spin fa-2x"></i><p>Verificando estado del periodo de matrícula...</p></div>;
  }

  // Si no cumple el pre-check (ej. periodo cerrado o solicitud duplicada)
  if (preCheckData && !preCheckData.puede_matricularse) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--danger)', padding: '20px' }}>
        <h3><i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--danger)' }}></i> Matrícula No Disponible</h3>
        <p style={{ marginTop: '10px', fontSize: '1rem' }}>
          {preCheckData.solicitud_duplicada 
            ? 'Ya posees una solicitud de matrícula activa (Pendiente o Aprobada) para el presente ciclo.' 
            : 'El período de matrícula no está activo o tu cuenta no cuenta con estado "activo" en el sistema.'}
        </p>
        <button className="btn" onClick={alTerminar} style={{ marginTop: '15px', backgroundColor: 'var(--primary)', color: '#fff' }}>
          Ver Mis Matrículas
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Barra de progreso visual (Pasos) */}
      {paso <= 4 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff', padding: '15px 25px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {PASOS.map((p) => {
            const activo = paso === p.num;
            const hecho = paso > p.num;
            return (
              <div key={p.num} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: activo || hecho ? 1 : 0.4 }}>
                <span style={{
                  display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                  backgroundColor: hecho ? 'var(--success)' : activo ? 'var(--primary)' : 'var(--border-color)',
                  color: hecho || activo ? '#fff' : 'var(--text-main)'
                }}>
                  {hecho ? <i className="fa-solid fa-check"></i> : p.num}
                </span>
                <span style={{ fontWeight: activo ? 700 : 400, fontSize: '0.85rem' }}>{p.titulo}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Alertas de Error */}
      {error && (
        <div style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)', padding: '12px', borderRadius: '6px', fontWeight: 600 }}>
          <i className="fa-solid fa-circle-exclamation"></i> {error}
        </div>
      )}

      {/* Renderizado condicional de los componentes de cada paso */}
      {paso === 1 && <Paso1DatosEstudiante datos={estudianteDatos} />}
      {paso === 2 && <Paso2Validaciones reqs={reqs} />}
      {paso === 3 && (
        <Paso3SeleccionCursos 
          cursos={cursos} 
          seleccionados={cursosSeleccionados} 
          setSeleccionados={setCursosSeleccionados} 
        />
      )}
      {paso === 4 && (
        <Paso4Resumen 
          seleccionados={cursosSeleccionados} 
          costoCredito={preCheckData?.periodo?.costo_por_credito || 45.0} 
          onEnviar={enviarMatricula} 
          enviando={cargando} 
        />
      )}

      {/* Pantalla Final de Éxito */}
      {paso === 5 && resultadoSolicitud && (
        <div className="card" style={{ textAlign: 'center', padding: '35px', borderTop: '5px solid var(--success)' }}>
          <span style={{ fontSize: '3.5rem', color: 'var(--success)' }}><i className="fa-solid fa-circle-check"></i></span>
          <h2 style={{ margin: '15px 0' }}>¡Solicitud de Matrícula Enviada!</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 20px auto' }}>
            Tu matrícula ha sido registrada con estado <strong>PENDIENTE</strong> bajo el código de trámite oficial:
          </p>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, padding: '10px 20px', background: 'var(--bg-body)', borderRadius: '6px', display: 'inline-block', letterSpacing: '1px', marginBottom: '20px' }}>
            {resultadoSolicitud.codigo}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Fecha de envío: {new Date(resultadoSolicitud.created_at).toLocaleString('es-PE')}
          </p>
          <button className="btn" onClick={alTerminar} style={{ marginTop: '25px', backgroundColor: 'var(--success)', color: '#fff', border: 'none' }}>
            Ir a Mis Matrículas
          </button>
        </div>
      )}

      {/* Navegación Simple */}
      {paso <= 4 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <button 
            className="btn" 
            disabled={paso === 1} 
            onClick={() => setPaso(paso - 1)}
            style={{ backgroundColor: '#fff', border: '1px solid var(--border-color)' }}
          >
            <i className="fa-solid fa-arrow-left"></i> Atrás
          </button>
          
          {paso < 4 ? (
            <button 
              className="btn" 
              disabled={paso === 2 && !reqsAprobados} 
              onClick={() => setPaso(paso + 1)}
              style={{ backgroundColor: 'var(--primary)', color: '#fff', border: 'none' }}
            >
              Continuar <i className="fa-solid fa-arrow-right"></i>
            </button>
          ) : (
            <button 
              className="btn" 
              onClick={enviarMatricula} 
              disabled={cargando}
              style={{ backgroundColor: 'var(--success)', color: '#fff', border: 'none' }}
            >
              {cargando ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-paper-plane"></i> Enviar Matrícula</>}
            </button>
          )}
        </div>
      )}

    </div>
  );
}
