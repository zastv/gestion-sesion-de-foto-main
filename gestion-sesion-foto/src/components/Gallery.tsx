import { useState } from "react";
import "./Gallery.css";

import img1 from "../assets/IMG_8771.jpg";
import img2 from "../assets/IMG_8664.jpg";
import img3 from "../assets/IMG_8649.jpg";
import img4 from "../assets/IMG_8640.jpg";
import img5 from "../assets/IMG_8632.jpg";
import img6 from "../assets/IMG_8627.jpg";
import img7 from "../assets/IMG_8625.jpg";
import img8 from "../assets/31450.jpg";
import img9 from "../assets/30135.jpg";
import img10 from "../assets/IMG_8213.jpg";
import img11 from "../assets/IMG_7638.png";
import img12 from "../assets/IMG_7569.png";
import img13 from "../assets/IMG_7555.png";
import img14 from "../assets/IMG_7554.png";
import img15 from "../assets/IMG_7547.png";
import img16 from "../assets/IMG_7462.png";
import img17 from "../assets/IMG_7459.png";
import img18 from "../assets/IMG_7441.png";

const images = [
  img1, img2, img3, img4, img5, img6, img7, img8, img9,
  img10, img11, img12, img13, img14, img15, img16, img17, img18
];

export default function Gallery() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="gallery-container">
      <h2 className="gallery-title">Galería de Fotos</h2>
      <div className="gallery-grid">
        {images.map((img, idx) => (
          <img
            src={img}
            alt={`Foto ${idx + 1}`}
            className="gallery-img"
            key={idx}
            onClick={() => setLightbox(img)}
          />
        ))}
      </div>
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Vista ampliada" className="lightbox-img" />
        </div>
      )}
    </div>
  );
} 