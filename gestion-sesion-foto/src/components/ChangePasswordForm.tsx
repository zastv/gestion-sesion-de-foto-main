import React, { useState } from "react";

export default function ChangePasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:4000/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar contraseña");
      setMessage("Contraseña cambiada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit} style={{ maxWidth: 350, margin: "auto" }}>
      <h2 className="form-title">Cambiar contraseña</h2>
      <input
        className="form-input"
        type="password"
        placeholder="Contraseña actual"
        value={currentPassword}
        onChange={e => setCurrentPassword(e.target.value)}
        required
      />
      <input
        className="form-input"
        type="password"
        placeholder="Nueva contraseña"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        required
      />
      {error && <div style={{ color: "#dc2626", textAlign: "center" }}>{error}</div>}
      {message && <div style={{ color: "#16a34a", textAlign: "center" }}>{message}</div>}
      <button className="form-button" type="submit" disabled={loading}>
        {loading ? "Cambiando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
