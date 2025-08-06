import { useState } from "react";
import Navbar from "../components/Navbar";
import SessionManager from "../components/SessionManager";
import CalendarView from "../components/CalendarView";
import NewSessionForm from "../components/NewSessionForm";
import '../App.css';

import imgProfesional from '../assets/30135.jpg';
import imgClientes from '../assets/31450.jpg';
import imgCalidad from '../assets/IMG_8213.jpg';

export default function Dashboard() {
  const [reloadFlag, setReloadFlag] = useState(0);
  const handleSessionCreated = () => {
    setReloadFlag(f => f + 1);
  };
  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "2rem 0" }}>
        {/* Portada inspiracional */}
        <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ color: '#888', fontWeight: 400, fontSize: '1.6rem', marginBottom: 8 }}>
            Bienvenido a nuestro sistema de gestión de sesiones de fotografía
          </h2>
          <h1 style={{ fontFamily: 'cursive', fontWeight: 700, fontSize: '2.8rem', margin: '0 0 1rem 0' }}>
            Captura tus momentos<br />más preciados con
          </h1>
          <p style={{ color: '#666', maxWidth: 600, margin: '0 auto 2.5rem auto', fontSize: '1.1rem' }}>
            Nuestro sistema de gestión de sesiones de fotografía te brinda una experiencia de servicio eficiente y personalizada
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {/* Tarjeta 1 */}
            <div style={{ background: '#e6f4f1', borderRadius: 16, width: 260, boxShadow: '0 2px 8px #0001', padding: 0, overflow: 'hidden' }}>
              <img src={imgProfesional} alt="Fotografía profesional" style={{ width: '100%', height: 220, objectFit: 'cover' }} />
              <div style={{ padding: '1.2rem' }}>
                <h3 style={{ fontFamily: 'cursive', fontWeight: 700, fontSize: '1.3rem', marginBottom: 6 }}>Fotografía Profesional</h3>
                <p style={{ color: '#444', fontSize: '1rem', marginBottom: 10 }}>Captura tus momentos más valiosos con calidad.</p>
                <span style={{ fontSize: 13, color: '#888' }}>Reserva tu sesión</span>
              </div>
            </div>
            {/* Tarjeta 2 */}
            <div style={{ background: '#f6f4e6', borderRadius: 16, width: 260, boxShadow: '0 2px 8px #0001', padding: 0, overflow: 'hidden' }}>
              <img src={imgClientes} alt="Clientes satisfechos" style={{ width: '100%', height: 220, objectFit: 'cover' }} />
              <div style={{ padding: '1.2rem' }}>
                <h3 style={{ fontFamily: 'cursive', fontWeight: 700, fontSize: '1.3rem', marginBottom: 6 }}>Clientes Satisfechos</h3>
                <p style={{ color: '#444', fontSize: '1rem', marginBottom: 10 }}>Nuestros clientes están encantados con los resultados.</p>
                <span style={{ fontSize: 13, color: '#888' }}>Déjanos capturar tus recuerdos</span>
              </div>
            </div>
            {/* Tarjeta 3 */}
            <div style={{ background: '#e6eaf6', borderRadius: 16, width: 260, boxShadow: '0 2px 8px #0001', padding: 0, overflow: 'hidden' }}>
              <img src={imgCalidad} alt="Experiencia de calidad" style={{ width: '100%', height: 220, objectFit: 'cover' }} />
              <div style={{ padding: '1.2rem' }}>
                <h3 style={{ fontFamily: 'cursive', fontWeight: 700, fontSize: '1.3rem', marginBottom: 6 }}>Experiencia de Calidad</h3>
                <p style={{ color: '#444', fontSize: '1rem', marginBottom: 10 }}>Nuestro compromiso con la excelencia se nota en cada sesión.</p>
                <span style={{ fontSize: 13, color: '#888' }}>Descubre por qué</span>
              </div>
            </div>
          </div>
          <button style={{ background: '#222', color: '#fff', border: 'none', borderRadius: 24, padding: '0.9rem 2.5rem', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px #0002' }}>
            Agendar Sesión
          </button>
        </section>
        {/* Componentes funcionales debajo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          <NewSessionForm onSessionCreated={handleSessionCreated} />
          <SessionManager />
          <CalendarView reloadFlag={reloadFlag} />
        </div>
      </div>
    </>
  );
}