import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../components/AuthContext";
import QrThumb from "../components/QrThumb";
import QRCodeStyling from "qr-code-styling";
import { Trash, PencilSimple, Plus, SignOut, ChartBar, DownloadSimple, Envelope, WhatsappLogo, Link as LinkIcon, CheckCircle, CloudArrowUp } from "phosphor-react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchQrs = async () => {
    try {
      const { data, error } = await supabase.from('qrs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      
      const cached = localStorage.getItem(`cached_qrs_${user.id}`);
      let localOnlyQrs = [];
      if (cached) {
        localOnlyQrs = JSON.parse(cached).filter(q => q.id.startsWith('local_'));
      }

      if (data) {
        const merged = [...localOnlyQrs, ...data];
        setQrs(merged);
        localStorage.setItem(`cached_qrs_${user.id}`, JSON.stringify(merged));
      }
    } catch (error) {
      console.error("Error:", error);
      const cached = localStorage.getItem(`cached_qrs_${user.id}`);
      if (cached) setQrs(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) {
      const cached = localStorage.getItem(`cached_qrs_${user.id}`);
      if (cached) setQrs(JSON.parse(cached));
      fetchQrs();
    } 
  }, [user]);

  const handleDelete = async (qrId) => {
    if (confirm("¿Borrar este QR permanentemente?")) {
      if (typeof qrId === 'string' && qrId.startsWith('local_')) {
        const cached = localStorage.getItem(`cached_qrs_${user.id}`);
        if (cached) {
          const list = JSON.parse(cached).filter(q => q.id !== qrId);
          localStorage.setItem(`cached_qrs_${user.id}`, JSON.stringify(list));
          setQrs(list);
        }
      } else {
        await supabase.from('qrs').delete().eq('id', qrId);
        fetchQrs();
      }
    }
  };

  // --- FUNCIONES DE COMPARTIR ---
  const getShareLink = (qrId) => `${window.location.origin}/r/${qrId}`;

  const handleCopyLink = (qrId) => {
    const link = getShareLink(qrId);
    navigator.clipboard.writeText(link);
    setCopiedId(qrId);
    setTimeout(() => setCopiedId(null), 2000); // Quitar el check a los 2 seg
  };

  const handleGmail = (qr) => {
    const link = getShareLink(qr.id);
    const subject = `Mira mi nuevo QR: ${qr.name}`;
    const body = `Hola, te comparto este enlace dinámico: ${link}`;
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handleWhatsapp = (qrId) => {
    const link = getShareLink(qrId);
    window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, '_blank');
  };

  // --- FUNCIÓN DE DESCARGA ---
  const handleDownload = async (qr) => {
    setDownloadingId(qr.id);
    try {
      const link = getShareLink(qr.id);
      const qrInstance = new QRCodeStyling({
        type: "canvas",
        width: 800,
        height: 800,
        data: link,
        image: qr.design?.logo || "",
        dotsOptions: { color: qr.design?.color || "#000000", type: "rounded" },
        backgroundOptions: { color: "#ffffff" },
        imageOptions: { crossOrigin: "anonymous", margin: 5, imageSize: qr.design?.logoSize || 0.4 }
      });

      const blob = await qrInstance.getRawData("png");
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${qr.name || "qr-code"}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error al descargar:", err);
      alert("Error al generar la imagen");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-white p-6 md:p-12 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-slate-800 pb-8 animate-fade-in-up">
        <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyber-primary to-cyber-secondary bg-clip-text text-transparent mb-2 font-cyber">
              Panel de Control
            </h1>
            <p className="text-slate-400 font-medium">Tus Proyectos Activos</p>
        </div>
        
        <div className="flex gap-4 mt-6 md:mt-0">
            <Link to="/editor" className="flex items-center gap-2 px-6 py-3 bg-cyber-primary hover:bg-indigo-500 rounded-xl font-bold transition shadow-neon hover:scale-105">
                <Plus size={20} weight="bold" /> Nuevo QR
            </Link>
            <button onClick={logout} className="flex items-center gap-2 px-5 py-3 border border-slate-700 hover:bg-slate-800 rounded-xl text-slate-300 transition">
                <SignOut size={20} />
            </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center mt-20"><div className="animate-spin w-8 h-8 border-4 border-cyber-accent rounded-full border-t-transparent"></div></div>
      ) : qrs.length === 0 ? (
        <div className="text-center mt-20 p-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50 animate-fade-in-up">
            <p className="text-xl text-slate-400 mb-6 font-light">Tu biblioteca está vacía</p>
            <Link to="/editor" className="text-cyber-accent font-bold hover:underline">Crear el primero →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
          {qrs.map((qr) => (
            <div key={qr.id} className="bg-[#0f172a] rounded-3xl border border-slate-800 hover:border-cyber-primary/50 transition-all hover:shadow-2xl overflow-hidden group flex flex-col">
                
                {/* --- SECCIÓN SUPERIOR: MINIATURA --- */}
                <div className="relative h-48 bg-slate-900/50 p-6 flex items-center justify-center border-b border-slate-800">
                    <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-lg transform group-hover:scale-110 transition duration-500">
                        {/* AQUÍ USAMOS EL COMPONENTE NUEVO */}
                        <QrThumb design={qr.design} link={`${window.location.origin}/r/${qr.id}`} />
                    </div>
                    
                    {/* Badge de visitas o Sync */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono border border-slate-700">
                        {qr.id.toString().startsWith('local_') ? (
                          <div className="flex items-center gap-1.5 text-amber-500 animate-pulse font-bold">
                            <CloudArrowUp size={14} weight="bold" />
                            <span>LOCAL</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-cyber-accent">
                            <ChartBar size={14} weight="bold" />
                            {qr.visitCount || 0}
                          </div>
                        )}
                    </div>
                </div>

                {/* --- SECCIÓN INFERIOR: INFO Y ACCIONES --- */}
                <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-xl mb-1 truncate text-white font-cyber tracking-wide">
                        {qr.name || "Sin Nombre"}
                    </h3>
                    <p className="text-xs text-slate-500 mb-6 truncate font-mono bg-slate-900 p-2 rounded border border-slate-800">
                       🔗 {qr.targetUrl}
                    </p>

                    {/* Botones de Acción */}
                    <div className="mt-auto space-y-3">
                        
                        {/* Fila de Edición y Descarga */}
                        <div className="flex gap-2">
                            <Link to={`/editor/${qr.id}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-lg text-sm font-bold transition text-slate-300 active:scale-95">
                                <PencilSimple size={16} /> Editar
                            </Link>
                            <button 
                                onClick={() => handleDownload(qr)}
                                disabled={downloadingId === qr.id}
                                className={`px-3 rounded-lg transition border active:scale-95 ${
                                  downloadingId === qr.id 
                                    ? 'bg-cyber-primary/20 text-cyber-primary border-cyber-primary/30' 
                                    : 'bg-cyber-primary/10 text-cyber-accent hover:bg-cyber-primary/20 border-cyber-primary/10'
                                }`}
                                title="Descargar QR"
                            >
                                {downloadingId === qr.id 
                                  ? <span className="animate-spin block w-4 h-4 border-2 border-cyber-accent rounded-full border-t-transparent"></span>
                                  : <DownloadSimple size={16} weight="bold" />
                                }
                            </button>
                            <button 
                                onClick={() => handleDelete(qr.id)}
                                className="px-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition border border-red-500/10 active:scale-95"
                                title="Eliminar"
                            >
                                <Trash size={16} />
                            </button>
                        </div>

                        {/* Fila de Compartir */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
                            
                            {/* Gmail */}
                            <button onClick={() => handleGmail(qr)} className="flex justify-center items-center py-2 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 rounded-lg transition text-slate-400" title="Enviar por Correo">
                                <Envelope size={20} />
                            </button>

                            {/* WhatsApp */}
                            <button onClick={() => handleWhatsapp(qr.id)} className="flex justify-center items-center py-2 bg-slate-800 hover:bg-green-600/20 hover:text-green-400 rounded-lg transition text-slate-400" title="Enviar por WhatsApp">
                                <WhatsappLogo size={20} />
                            </button>

                            {/* Copiar Link */}
                            <button 
                                onClick={() => handleCopyLink(qr.id)} 
                                className={`flex justify-center items-center py-2 rounded-lg transition ${copiedId === qr.id ? 'bg-green-500 text-white' : 'bg-slate-800 hover:bg-cyber-primary/20 hover:text-cyber-primary text-slate-400'}`} 
                                title="Copiar Link"
                            >
                                {copiedId === qr.id ? <CheckCircle size={20} weight="fill" /> : <LinkIcon size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;