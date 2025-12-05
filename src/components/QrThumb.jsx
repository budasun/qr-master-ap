import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

const QrThumb = ({ design, link }) => {
  const ref = useRef(null);

  useEffect(() => {
    // 1. Configuramos el QR con los datos guardados
    const qrCode = new QRCodeStyling({
      width: 150, // Tamaño pequeño para miniatura
      height: 150,
      data: link, // El link al que apunta (/r/id)
      image: design?.logo || "",
      dotsOptions: { 
        color: design?.color || "#000000", 
        type: "rounded" 
      },
      backgroundOptions: { color: "transparent" },
      imageOptions: { crossOrigin: "anonymous", margin: 5 }
    });

    // 2. Lo dibujamos en el contenedor
    if (ref.current) {
      ref.current.innerHTML = "";
      qrCode.append(ref.current);
    }
  }, [design, link]);

  // Renderizamos un div que contendrá el dibujo
  return (
    <div 
      ref={ref} 
      className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-white/5"
    />
  );
};

export default QrThumb;