import React, { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar correo");
      setMessage("Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit} style={{ maxWidth: 350, margin: "auto" }}>
      <h2 className="form-title">¿Olvidaste tu contraseña?</h2>
      <input
        className="form-input"
        type="email"
        placeholder="Correo registrado"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      {error && <div style={{ color: "#dc2626", textAlign: "center" }}>{error}</div>}
      {message && <div style={{ color: "#16a34a", textAlign: "center" }}>{message}</div>}
      <button className="form-button" type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar instrucciones"}
      </button>
    </form>
  );
}
