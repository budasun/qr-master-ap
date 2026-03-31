import { useState, useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { db } from "../firebase/config";
import { doc, setDoc, getDoc, collection } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { ArrowLeft, DownloadSimple, YoutubeLogo, TwitterLogo, InstagramLogo, X, Image, FloppyDisk } from "phosphor-react";
import { toPng } from 'html-to-image';

const qrCode = new QRCodeStyling({
  type: "canvas", // <--- ¡AÑADE ESTA LÍNEA AQUÍ!
  width: 280,
  height: 280,
  image: "",
  dotsOptions: { color: "#000000", type: "rounded" },
  backgroundOptions: { color: "transparent" },
  imageOptions: { crossOrigin: "anonymous", margin: 8 }
});

const QrEditor = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qrRef = useRef(null);
  const cardRef = useRef(null);
  
  // Estados
  const [qrName, setQrName] = useState(""); // <--- NUEVO: Nombre para identificarlo
  const [targetUrl, setTargetUrl] = useState(""); 
  const [ctaText, setCtaText] = useState("ESCANÉAME");
  const [qrColor, setQrColor] = useState("#000000"); 
  const [ctaColor, setCtaColor] = useState("#ffffff");
  const [logoUrl, setLogoUrl] = useState(""); 
  const [logoSize, setLogoSize] = useState(0.4); // <--- NUEVO: Tamaño del logo (0.1 a 0.5)
  const [frameStyle, setFrameStyle] = useState("none");
  const [loading, setLoading] = useState(false);

  const baseUrl = window.location.origin;
  const qrContent = id ? `${baseUrl}/r/${id}` : "https://tu-app-url.com";

  const frames = {
    none: "bg-white p-4 rounded-xl",
    neon: "bg-black p-4 rounded-xl border-4 border-cyber-primary shadow-[0_0_20px_rgba(99,102,241,0.5)]",
    cyber: "bg-slate-900 p-6 rounded-none border-2 border-cyber-accent relative after:content-[''] after:absolute after:-top-2 after:-left-2 after:w-4 after:h-4 after:border-t-2 after:border-l-2 after:border-cyber-accent after:content-[''] after:absolute after:-bottom-2 after:-right-2 after:w-4 after:h-4 after:border-b-2 after:border-r-2 after:border-cyber-accent",
    glass: "bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-white/30",
    minimal: "bg-slate-100 p-8 rounded-[3rem] shadow-inner"
  };

  useEffect(() => {
    if (id) {
        const loadData = async () => {
            try {
                const docSnap = await getDoc(doc(db, "qrs", id));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setQrName(data.name || ""); // Cargar nombre
                    setTargetUrl(data.targetUrl || "");
                    setCtaText(data.design?.ctaText || "ESCANÉAME");
                    setQrColor(data.design?.color || "#000000");
                    setCtaColor(data.design?.ctaColor || "#ffffff");
                    setLogoUrl(data.design?.logo || "");
                    setLogoSize(data.design?.logoSize || 0.4); // Cargar tamaño logo
                    setFrameStyle(data.design?.frame || "none");
                }
            } catch (error) { console.error(error); }
        };
        loadData();
    }
  }, [id]);

  useEffect(() => {
    qrCode.update({
      data: qrContent,
      image: logoUrl,
      dotsOptions: { color: qrColor, type: "rounded" },
      backgroundOptions: { color: "#ffffff" },
      // AQUÍ SE APLICA EL TAMAÑO DINÁMICO
      imageOptions: { crossOrigin: "anonymous", margin: 5, imageSize: logoSize } 
    });
    if (qrRef.current) {
        qrRef.current.innerHTML = "";
        qrCode.append(qrRef.current);
    }
  }, [qrContent, qrColor, logoUrl, logoSize]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 2097152) return alert("⚠️ Imagen muy pesada (Máx 2MB)"); // Subí el límite un poco
        const reader = new FileReader();
        reader.onload = (ev) => setLogoUrl(ev.target.result);
        reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!targetUrl) return alert("Falta la URL de destino");
    if (!qrName) return alert("Ponle un nombre a tu proyecto (ej: 'Menú Cena')"); // Validación nombre
    
    setLoading(true);
    try {
        const docRef = id ? doc(db, "qrs", id) : doc(collection(db, "qrs"));
        await setDoc(docRef, {
          userId: user.uid,
          name: qrName, // Guardamos el nombre
          targetUrl,
          updatedAt: new Date(),
          design: { 
              color: qrColor, 
              ctaText, 
              ctaColor, 
              logo: logoUrl, 
              logoSize, // Guardamos el tamaño
              frame: frameStyle 
            }
        }, { merge: true });
        
        if (!id) navigate(`/editor/${docRef.id}`);
        else alert("¡Diseño guardado!");
    } catch (error) { alert("Error al guardar"); } 
    finally { setLoading(false); }
  };

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    try {
        const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `${qrName || 'qr-code'}.png`; // El archivo se descarga con el nombre del proyecto
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error(err);
        alert("Error al generar la imagen");
    }
  };

  const colors = ['#000000', '#ffffff', '#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b'];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-cyber-dark text-cyber-text overflow-hidden font-sans">
      
      {/* PANEL IZQUIERDO */}
      <div className="w-full md:w-1/3 p-6 border-r border-cyber-surface overflow-y-auto custom-scrollbar bg-[#0a0a12]">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 mb-6 hover:text-cyber-primary transition font-medium text-sm">
            <ArrowLeft size={16} /> Volver
        </button>
        
        <h2 className="text-3xl font-cyber font-bold mb-6 text-white">Editar Diseño</h2>
        
        {/* --- NUEVO: NOMBRE DEL PROYECTO --- */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest text-cyber-primary mb-2 font-bold">Nombre del Proyecto (Interno)</label>
          <input value={qrName} onChange={(e) => setQrName(e.target.value)}
            className="w-full bg-cyber-surface p-3 rounded-xl text-white border border-slate-700 focus:border-cyber-primary outline-none transition font-bold" 
            placeholder="Ej: Menú Restaurante, WiFi Casa..." />
        </div>

        {/* URL */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-bold">Destino URL</label>
          <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full bg-cyber-surface p-3 rounded-xl text-white border border-slate-700 focus:border-cyber-primary outline-none transition" 
            placeholder="https://..." />
        </div>

        {/* LOGO + SLIDER DE TAMAÑO */}
        <div className="mb-6 bg-cyber-surface p-4 rounded-xl border border-slate-700">
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-3 font-bold">Logo</label>
            <div className="flex gap-2 mb-3">
                <button onClick={() => setLogoUrl("https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg")} className="p-2 bg-[#0f172a] rounded hover:scale-110 transition"><InstagramLogo size={20} color="#E1306C" weight="fill"/></button>
                <button onClick={() => setLogoUrl("https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg")} className="p-2 bg-[#0f172a] rounded hover:scale-110 transition"><YoutubeLogo size={20} color="#FF0000" weight="fill"/></button>
                {logoUrl && <button onClick={() => setLogoUrl("")} className="p-2 bg-red-900/20 text-red-400 rounded"><X size={20}/></button>}
            </div>
            
            <div className="relative group cursor-pointer border border-dashed border-slate-600 rounded-lg p-3 text-center hover:border-cyber-accent transition mb-4">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                <span className="text-xs text-slate-400 group-hover:text-white flex items-center justify-center gap-2"><Image size={16}/> Subir Logo Propio</span>
            </div>

            {/* --- SLIDER DE TAMAÑO --- */}
            {logoUrl && (
                <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Tamaño</span>
                        <span>{Math.round(logoSize * 100)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.2" 
                        max="0.6" 
                        step="0.05" 
                        value={logoSize} 
                        onChange={(e) => setLogoSize(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyber-primary"
                    />
                </div>
            )}
        </div>

        {/* MARCOS */}
        <div className="mb-6">
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-3 font-bold">Marco / Estilo</label>
            <div className="grid grid-cols-3 gap-2">
                {Object.keys(frames).map((f) => (
                    <button key={f} onClick={() => setFrameStyle(f)} className={`p-2 rounded border text-xs capitalize ${frameStyle === f ? 'border-cyber-primary bg-cyber-primary/10 text-white' : 'border-slate-700 text-slate-500'}`}>
                        {f}
                    </button>
                ))}
            </div>
        </div>

        {/* COLORES */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-3 font-bold">Color QR</label>
                <div className="flex gap-2 flex-wrap">
                    {colors.map(c => (
                    <button key={c} onClick={() => setQrColor(c)}
                        className={`w-6 h-6 rounded-full shadow-lg border ${qrColor === c ? 'border-white scale-125 ring-2 ring-cyber-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-3 font-bold">Color Texto</label>
                <div className="flex gap-2 flex-wrap">
                    {colors.map(c => (
                    <button key={c} onClick={() => setCtaColor(c)}
                        className={`w-6 h-6 rounded-full shadow-lg border ${ctaColor === c ? 'border-white scale-125 ring-2 ring-cyber-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                </div>
            </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-bold">Texto CTA</label>
          <input value={ctaText} onChange={(e) => setCtaText(e.target.value)}
            className="w-full bg-cyber-surface p-3 rounded-xl text-white border border-slate-700 focus:border-cyber-primary outline-none" />
        </div>
        
        <button onClick={handleSave} disabled={loading} 
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyber-primary to-cyber-secondary p-4 rounded-xl font-bold font-cyber shadow-neon hover:shadow-neon-hover hover:-translate-y-1 transition-all text-white tracking-widest">
          {loading ? "Guardando..." : <><FloppyDisk size={20} /> GUARDAR</>}
        </button>
      </div>

      {/* PANEL DERECHO: PREVIEW */}
      <div className="w-full md:w-2/3 flex items-center justify-center bg-cyber-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
            
            <div ref={cardRef} className="p-8 bg-cyber-dark/0 flex flex-col items-center justify-center rounded-3xl"> 
                <div className={`transition-all duration-300 flex flex-col items-center ${frames[frameStyle]}`}>
                    <div className="bg-white p-2 rounded-lg">
                         <div ref={qrRef}></div>
                    </div>
                    <div className={`mt-4 text-center font-cyber font-bold text-2xl tracking-widest uppercase drop-shadow-sm`} style={{ color: ctaColor }}>
                        {ctaText}
                    </div>
                </div>
            </div>
            
            {id && (
                <button onClick={handleDownload} className="mt-8 flex items-center gap-3 px-8 py-3 bg-white text-cyber-dark rounded-full hover:scale-105 transition shadow-xl font-bold">
                   <DownloadSimple size={24} weight="fill" /> DESCARGAR IMAGEN
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default QrEditor;