import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, StatCard } from "../components/Card";
import { docenteService } from "../services/api";
import "./Dashboard.css";


export const DocenteDashboard = () => {
  const { user } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [archivoSilabo, setArchivoSilabo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total_cursos: 0,
    sylabos_aprobados: 0,
    total_estudiantes: 0,
    actas_enviadas: 0
  });
  const cargarCursos = async () => {
    try {
      setLoading(true);
      const { data } = await docenteService.getCursos();
      setCursos(data);
      setStats({
        total_cursos: data.length,
        sylabos_aprobados:
          data.filter(
            curso => curso.estado_silabo === "APROBADO"
          ).length,
        total_estudiantes:
          data.reduce(
            (total, curso) =>
              total + curso.cantidad_estudiantes,
            0
          ),
        actas_enviadas:
          data.filter(
            curso => curso.estado_silabo !== "PENDIENTE"
          ).length
      });
    } catch (err) {
      console.error(err);
      setError("Error al cargar los cursos");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    cargarCursos();
  }, []);
  const seleccionarArchivo = (event) => {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const formatosPermitidos = [
      "pdf",
      "doc",
      "docx"
    ];
    const extension =
      archivo.name
      .split(".")
      .pop()
      .toLowerCase();
    if (!formatosPermitidos.includes(extension)) {
      alert(
        "Solo se permiten archivos PDF, DOC o DOCX"
      );
      event.target.value = "";
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      alert(
        "El archivo no puede superar los 5MB"
      );

      event.target.value = "";

      return;
    }
    setArchivoSilabo(archivo);
  };
  const subirSilabo = async (ofertaId) => {
    if (!archivoSilabo) {
      alert(
        "Seleccione primero un archivo"
      );
      return;
    }
    try {
      setSubiendo(true);
      const formData = new FormData();
      formData.append(
        "file",
        archivoSilabo
      );
      await docenteService.subirSilabo(
        ofertaId,
        formData
      );
      alert(
        "Sílabo cargado correctamente"
      );
      setArchivoSilabo(null);
      cargarCursos();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error ||
        "Error al subir el sílabo"
      );
    } finally {
      setSubiendo(false);
    }
  };
  if (loading) {

    return (
      <div className="loading-screen">
        Cargando datos...
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-box">
        {error}
      </div>
    );
  }
  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>
          Hola, {user?.nombres}
        </h1>
        <p>
          Panel de Control Docente - UNCP FIS
        </p>
      </header>
      <section className="stats-grid">
        <StatCard
          title="Cursos Asignados"
          value={stats.total_cursos}
          icon="book"
          iconColor="primary"
          subtext="Este ciclo académico"
        />
        <StatCard
          title="Sílabos Aprobados"
          value={stats.sylabos_aprobados}
          icon="file-check"
          iconColor="success"
          subtext="Completados"
        />
        <StatCard
          title="Estudiantes"
          value={stats.total_estudiantes}
          icon="users"
          iconColor="primary"
          subtext="Total matriculados"
        />
        <StatCard
          title="Actas Enviadas"
          value={stats.actas_enviadas}
          icon="check-circle"
          iconColor="warning"
          subtext="En revisión"
        />
      </section>
      <Card
        title="Mis Cursos"
        icon="graduation-cap"
      >
      {
        cursos.length === 0 ? (
          <div className="empty-state">
            <p>
              No tienes cursos asignados
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Curso</th>
                  <th>Sección</th>
                  <th>Créditos</th>
                  <th>Estudiantes</th>
                  <th>Sílabo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
              {
                cursos.map(curso => (
                  <tr key={curso.oferta_id}>
                    <td>
                      {curso.curso.codigo}
                    </td>
                    <td className="curso-name">
                      {curso.curso.nombre}
                    </td>
                    <td>
                      {curso.seccion}
                    </td>
                    <td>
                      {curso.curso.creditos}
                    </td>
                    <td>
                      {curso.cantidad_estudiantes}
                    </td>
                    <td>
                      <span
                        className={
                          `status-badge ${
                            (
                              curso.estado_silabo ||
                              "PENDIENTE"
                            )
                            .toLowerCase()
                          }`
                        }
                      >
                        {curso.estado_silabo || "PENDIENTE"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={seleccionarArchivo}
                      />
                      <button
                        className="btn btn-success"
                        disabled={subiendo}
                        onClick={() =>
                          subirSilabo(
                            curso.oferta_id
                          )
                        }
                      >
                        {
                          subiendo
                          ? "Subiendo..."
                          : "Subir Sílabo"
                        }
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-icon"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>

                  </tr>
                ))
              }
              </tbody>
            </table>
          </div>
        )
      }
      </Card>
      <Card
        title="Recordatorios Importantes"
        icon="bell"
      >
        <div className="reminders">
          <p>
            ⏰ <strong>Carga de Sílabos:</strong>
            Plazo límite 30 de julio
          </p>
          <p>
            ⏰ <strong>Registro de Notas:</strong>
            Completar antes de consolidación
          </p>
          <p>
            ⏰ <strong>Actas:</strong>
            Enviar para revisión administrativa
          </p>
        </div>
      </Card>
    </main>
  );

};