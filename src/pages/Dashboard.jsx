import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../components/AuthContext";
// Componente nuevo
import QrThumb from "../components/QrThumb"; 
// Iconos
import { Trash, PencilSimple, Plus, SignOut, ChartBar, ShareNetwork, Envelope, WhatsappLogo, Link as LinkIcon, CheckCircle } from "phosphor-react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null); // Para mostrar el check de "Copiado"

  const fetchQrs = async () => {
    try {
      const q = query(collection(db, "qrs"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const loadedQrs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQrs(loadedQrs);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchQrs(); }, [user]);

  const handleDelete = async (qrId) => {
    if (confirm("¿Borrar este QR permanentemente?")) {
      await deleteDoc(doc(db, "qrs", qrId));
      fetchQrs();
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
                    
                    {/* Badge de visitas */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-full text-xs text-cyber-accent font-mono border border-slate-700">
                        <ChartBar size={14} weight="bold" />
                        {qr.visitCount || 0}
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
                        
                        {/* Fila de Edición */}
                        <div className="flex gap-2">
                            <Link to={`/editor/${qr.id}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm font-bold transition text-slate-300">
                                <PencilSimple size={16} /> Editar
                            </Link>
                            <button 
                                onClick={() => handleDelete(qr.id)}
                                className="px-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition border border-red-500/10"
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