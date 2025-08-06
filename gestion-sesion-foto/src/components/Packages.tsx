import { useState } from "react";
import "./Packages.css";

const packages = [
  {
    name: "Pesonal",
    price: "$50",
    description: "Sesión de 30 minutos, 10 fotos editadas, 1 locación."
  },
  {
    name: "Premium",
    price: "$45",
    description: "Sesión de 1 hora, 30 fotos editadas, 2 locaciones, 1 álbum digital."
  },
  {
    name: "Personalizado",
    price: "De 50$ en adelante",
    description: "Usted elige el tipo de sesión, el tiempo, el número de fotos y el número de locaciones."
  },
  {
    name: "Promoción Verano",
    price: "$78",
    description: "Sesion especial"
  }
];

export default function Packages() {
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ tipo: "", tiempo: "", fotos: "", locaciones: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Debes iniciar sesión para solicitar un paquete personalizado.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("http://localhost:4000/api/custom-package", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(custom)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar solicitud personalizada");
      setSuccess("¡Solicitud personalizada enviada y guardada!");
      setCustom({ tipo: "", tiempo: "", fotos: "", locaciones: "" });
      setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="packages-container">
      <h2 className="packages-title">Paquetes y Promociones</h2>
      <div className="packages-list">
        {packages.map((pkg) => (
          <div className="package-card" key={pkg.name}>
            <h3>{pkg.name}</h3>
            <div className="package-price">{pkg.price}</div>
            <div className="package-desc">{pkg.description}</div>
            {pkg.name === "Personalizado" ? (
              <button className="package-select" onClick={() => setShowCustom(v => !v)}>
                Personalizar
              </button>
            ) : (
              <button className="package-select">Seleccionar</button>
            )}
          </div>
        ))}
      </div>
      {showCustom && (
        <form className="custom-form" onSubmit={handleCustomSubmit} style={{ marginTop: 24, background: "#f9fafb", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px #0001", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          <h4>Personaliza tu sesión</h4>
          <input className="form-input" placeholder="Tipo de sesión" value={custom.tipo} onChange={e => setCustom({ ...custom, tipo: e.target.value })} required />
          <input className="form-input" placeholder="Tiempo (minutos)" value={custom.tiempo} onChange={e => setCustom({ ...custom, tiempo: e.target.value })} required />
          <input className="form-input" placeholder="Número de fotos" value={custom.fotos} onChange={e => setCustom({ ...custom, fotos: e.target.value })} required />
          <input className="form-input" placeholder="Número de locaciones" value={custom.locaciones} onChange={e => setCustom({ ...custom, locaciones: e.target.value })} required />
          <button className="form-button" type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar solicitud"}</button>
          {success && <div style={{ color: "#16a34a", marginTop: 12 }}>{success}</div>}
          {error && <div style={{ color: "#dc2626", marginTop: 12 }}>{error}</div>}
        </form>
      )}
    </div>
  );
}