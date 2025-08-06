import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginForm.css";
import API_BASE_URL from '../apiBaseUrl';

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotName, setForgotName] = useState("");
  const [forgotStep, setForgotStep] = useState(1);
  const [newPassword, setNewPassword] = useState("");
  const [changeSuccess, setChangeSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error de login");
      // Guardar token en localStorage (opcional)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí deberías validar con el backend si el usuario existe
    // Por ahora, simulamos que siempre es correcto
    setForgotStep(2);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeSuccess("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, name: forgotName, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar la contraseña");
      setChangeSuccess("Contraseña cambiada exitosamente. Ahora puedes iniciar sesión.");
      setTimeout(() => {
        setShowForgot(false);
        setForgotStep(1);
        setForgotEmail("");
        setForgotName("");
        setNewPassword("");
        setChangeSuccess("");
      }, 2500);
    } catch (err: any) {
      setChangeSuccess(err.message);
    }
  };

  if (showForgot) {
    if (forgotStep === 1) {
      return (
        <form className="form-container" onSubmit={handleForgotSubmit}>
          <h2 className="form-title">Recuperar contraseña</h2>
          <input
            className="form-input"
            type="email"
            placeholder="Correo electrónico"
            value={forgotEmail}
            onChange={e => setForgotEmail(e.target.value)}
            required
          />
          <input
            className="form-input"
            type="text"
            placeholder="Nombre"
            value={forgotName}
            onChange={e => setForgotName(e.target.value)}
            required
          />
          <button className="form-button" type="submit">Siguiente</button>
          <button type="button" className="form-button" style={{ background: '#e5e7eb', color: '#111' }} onClick={() => { setShowForgot(false); setForgotStep(1); }}>Cancelar</button>
        </form>
      );
    } else if (forgotStep === 2) {
      return (
        <form className="form-container" onSubmit={handleChangePassword}>
          <h2 className="form-title">Nueva contraseña</h2>
          <input
            className="form-input"
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          {changeSuccess && <div style={{ color: '#16a34a', textAlign: 'center' }}>{changeSuccess}</div>}
          <button className="form-button" type="submit">Cambiar contraseña</button>
          <button type="button" className="form-button" style={{ background: '#e5e7eb', color: '#111' }} onClick={() => { setShowForgot(false); setForgotStep(1); }}>Cancelar</button>
        </form>
      );
    }
  }

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <h2 className="form-title">Iniciar Sesión</h2>
      <input
        className="form-input"
        type="email"
        placeholder="Correo"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        className="form-input"
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {error && <div style={{ color: "#dc2626", textAlign: "center" }}>{error}</div>}
      <button className="form-button" type="submit" disabled={loading}>
        {loading ? "Ingresando..." : "Iniciar Sesión"}
      </button>
      <button
        type="button"
        className="form-button"
        style={{ background: 'none', color: '#2563eb', textDecoration: 'underline', marginTop: 8 }}
        onClick={() => setShowForgot(true)}
      >
        ¿Se te olvidó la contraseña?
      </button>
    </form>
  );
}