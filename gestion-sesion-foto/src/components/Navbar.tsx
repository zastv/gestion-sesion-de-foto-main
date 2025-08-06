import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import "./Navbar.css";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };

  // Cierra el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-logo">LunaStudios</div>
      <ul className="navbar-links">
        <li><Link to="/dashboard">Sesiones</Link></li>
        <li><Link to="/gallery">Galería</Link></li>
        <li><Link to="/packages">Paquetes</Link></li>
        <li><Link to="/login">Iniciar sesión</Link></li>
        <li><Link to="/register">Registrarse</Link></li>
       
        <li className="user-menu" ref={dropdownRef}>
          <FaUserCircle className="user-icon" onClick={toggleDropdown} />
          {showDropdown && (
            <ul className="dropdown-menu">
              <li><Link to="/profile">Perfil</Link></li>
              <li><Link to="/settings">Ajustes</Link></li>
              <li><Link to="/update-info">Actualizar datos</Link></li>
              <li><Link to="/logout">Cerrar sesión</Link></li>
            </ul>
          )}
        </li>
      </ul>
    </nav>
  );
}
