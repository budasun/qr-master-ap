import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase/client";

const RedirectHandler = () => {
  const { id } = useParams();
  const [status, setStatus] = useState("Buscando destino...");

  useEffect(() => {
    const handleRedirect = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('qrs').select('targetUrl').eq('id', id).single();

        if (data?.targetUrl) {
          setStatus("Redirigiendo...");
          window.location.replace(data.targetUrl);
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