import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase/config"; // Ahora sí encontrará esta ruta
import { doc, getDoc } from "firebase/firestore";

const RedirectHandler = () => {
  const { id } = useParams();
  const [status, setStatus] = useState("Buscando destino...");

  useEffect(() => {
    const handleRedirect = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "qrs", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.targetUrl) {
            setStatus("Redirigiendo...");
            window.location.href = data.targetUrl; 
          } else {
            setStatus("Este QR no tiene destino.");
          }
        } else {
          setStatus("QR no encontrado.");
        }
      } catch (error) {
        console.error(error);
        setStatus("Error del sistema.");
      }
    };
    handleRedirect();
  }, [id]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black text-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <p>{status}</p>
    </div>
  );
};

export default RedirectHandler;