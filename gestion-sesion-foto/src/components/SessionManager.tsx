import "./SessionManager.css";

export default function SessionManager() {
  return (
    <div className="session-container">
      <h2 className="session-title">Gestión de Sesiones</h2>
      <button className="session-new">Nueva Sesión</button>
      <ul className="session-list">
        <li className="session-item">
          <span>Sesión de ejemplo - 2024-06-10</span>
          <div>
            <button className="session-edit">Editar</button>
            <button className="session-delete">Eliminar</button>
          </div>
        </li>
      </ul>
    </div>
  );
} 