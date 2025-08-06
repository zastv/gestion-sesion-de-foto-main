import React, { useState } from "react";
import "./NewSessionForm.css";

export default function NewSessionForm({ onSessionCreated }: { onSessionCreated?: () => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [packageType, setPackageType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Debes iniciar sesión para agendar una sesión.");
      setLoading(false);
      return;
    }
    try {
      const dateTime = date && time ? `${date}T${time}:00` : "";
      const res = await fetch("http://localhost:4000/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          date: dateTime,
          duration_minutes: 60,
          location,
          packageType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al agendar sesión");
      setSuccess("Sesión agendada correctamente");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2500);
      setDate(""); setTime(""); setTitle(""); setPackageType(""); setDescription(""); setLocation("");
      if (onSessionCreated) onSessionCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="new-session-form" onSubmit={handleSubmit}>
      <h3 className="form-title">Agendar Nueva Sesión</h3>
      <label>
        Fecha:
        <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
      </label>
      <label>
        Hora:
        <input type="time" className="form-input" value={time} onChange={e => setTime(e.target.value)} required />
      </label>
      <label>
        Tipo de sesión:
        <input type="text" className="form-input" placeholder="Ej: Retrato, Familiar..." value={title} onChange={e => setTitle(e.target.value)} required />
      </label>
      <label>
        Paquete/Promoción:
        <select className="form-input" value={packageType} onChange={e => setPackageType(e.target.value)} required>
          <option value="">Selecciona un paquete</option>
          <option value="Básico">Básico</option>
          <option value="Premium">Premium</option>
          <option value="Promoción Verano">Promoción Verano</option>
        </select>
      </label>
      <label>
        Notas:
        <textarea className="form-input" placeholder="Notas adicionales" value={description} onChange={e => setDescription(e.target.value)}></textarea>
      </label>
      <label>
        Lugar:
        <input className="form-input" placeholder="Ubicación" value={location} onChange={e => setLocation(e.target.value)} />
      </label>
      {error && <div style={{ color: "#dc2626", textAlign: "center" }}>{error}</div>}
      {success && <div style={{ color: "#16a34a", textAlign: "center" }}>{success}</div>}
      {showNotification && (
        <div style={{
          position: "fixed",
          top: 20,
          right: 20,
          background: "#16a34a",
          color: "#fff",
          padding: "1rem 2rem",
          borderRadius: 8,
          boxShadow: "0 2px 8px #0003",
          zIndex: 1000
        }}>
          ¡Sesión agendada correctamente!
        </div>
      )}
      <button className="form-button" type="submit" disabled={loading}>{loading ? "Agendando..." : "Agendar Sesión"}</button>
    </form>
  );
}