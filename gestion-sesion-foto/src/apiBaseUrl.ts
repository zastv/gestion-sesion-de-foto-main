// Archivo para centralizar la URL del backend

declare global {
  interface Window {
    API_BASE_URL?: string;
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  window.API_BASE_URL ||
  "http://localhost:4000";

export default API_BASE_URL;
