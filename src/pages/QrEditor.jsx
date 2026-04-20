import { useState, useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import { supabase } from "../supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { ArrowLeft, DownloadSimple, YoutubeLogo, TwitterLogo, InstagramLogo, X, Image, FloppyDisk, Eye, Sliders, CheckCircle, LinkSimple } from "phosphor-react";
import { toPng } from 'html-to-image';

const qrCode = new QRCodeStyling({
  type: "canvas",
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
  const [qrName, setQrName] = useState("");
  const [targetUrl, setTargetUrl] = useState(""); 
  const [ctaText, setCtaText] = useState("ESCANÉAME");
  const [qrColor, setQrColor] = useState("#000000"); 
  const [ctaColor, setCtaColor] = useState("#ffffff");
  const [logoUrl, setLogoUrl] = useState(""); 
  const [logoSize, setLogoSize] = useState(0.4);
  const [frameStyle, setFrameStyle] = useState("none");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Mobile tab state
  const [mobileTab, setMobileTab] = useState("edit"); // "edit" | "preview"

  // Lógica de URL del QR: 
  // 1. Si es un QR online y guardado, usamos el enlace dinámico /r/id
  // 2. Si es offline (local_) o es un QR nuevo sin guardar, incrustamos el targetUrl directamente (QR estático)
  const baseUrl = window.location.origin;
  const isLocalOffline = id && id.toString().startsWith('local_');
  
  let qrContent = "https://tu-app-url.com";
  if (id && !isLocalOffline) {
      qrContent = `${baseUrl}/r/${id}`;
  } else if (targetUrl) {
      qrContent = targetUrl; 
  }

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
            // Primero intentar cargar de la lista cacheada en Dashboard para rapidez/offline
            const cachedList = localStorage.getItem(`cached_qrs_${user?.id}`);
            if (cachedList) {
                const list = JSON.parse(cachedList);
                const item = list.find(q => q.id === id);
                if (item) {
                    setQrName(item.name || "");
                    setTargetUrl(item.targetUrl || "");
                    setCtaText(item.design?.ctaText || "ESCANÉAME");
                    setQrColor(item.design?.color || "#000000");
                    setCtaColor(item.design?.ctaColor || "#ffffff");
                    setLogoUrl(item.design?.logo || "");
                    setLogoSize(item.design?.logoSize || 0.4);
                    setFrameStyle(item.design?.frame || "none");
                }
            }

            if (navigator.onLine) {
                try {
                    const { data, error } = await supabase.from('qrs').select('*').eq('id', id).single();
                    if (data) {
                        setQrName(data.name || "");
                        setTargetUrl(data.targetUrl || "");
                        setCtaText(data.design?.ctaText || "ESCANÉAME");
                        setQrColor(data.design?.color || "#000000");
                        setCtaColor(data.design?.ctaColor || "#ffffff");
                        setLogoUrl(data.design?.logo || "");
                        setLogoSize(data.design?.logoSize || 0.4);
                        setFrameStyle(data.design?.frame || "none");
                    }
                } catch (error) { console.error(error); }
            }
        };
        loadData();
    }
  }, [id, user]);

  useEffect(() => {
    qrCode.update({
      data: qrContent,
      image: logoUrl,
      dotsOptions: { color: qrColor, type: "rounded" },
      backgroundOptions: { color: "#ffffff" },
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
        if (file.size > 2097152) return alert("⚠️ Imagen muy pesada (Máx 2MB)");
        const reader = new FileReader();
        reader.onload = (ev) => setLogoUrl(ev.target.result);
        reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!targetUrl) return alert("Falta la URL de destino");
    if (!qrName) return alert("Ponle un nombre a tu proyecto (ej: 'Menú Cena')");
    
    setLoading(true);
    try {
        const qrData = {
            user_id: user.id,
            name: qrName,
            targetUrl,
            design: { 
                color: qrColor, 
                ctaText, 
                ctaColor, 
                logo: logoUrl, 
                logoSize,
                frame: frameStyle 
              }
        };

        if (navigator.onLine) {
            if (id && !id.startsWith('local_')) {
                await supabase.from('qrs').update(qrData).eq('id', id);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } else {
                const { data, error } = await supabase.from('qrs').insert(qrData).select().single();
                if (data) {
                    // Si antes era local, eliminarlo del caché local antes de navegar
                    if (id && id.startsWith('local_')) {
                        const cached = localStorage.getItem(`cached_qrs_${user?.id}`);
                        if (cached) {
                            const list = JSON.parse(cached).filter(q => q.id !== id);
                            localStorage.setItem(`cached_qrs_${user?.id}`, JSON.stringify(list));
                        }
                    }
                    navigate(`/editor/${data.id}`);
                }
            }
        } else {
            // MODO OFFLINE: Guardar localmente
            const localId = id || `local_${Date.now()}`;
            const localQr = { 
                ...qrData, 
                id: localId, 
                created_at: new Date().toISOString(),
                isLocalOnly: true 
            };

            const cached = localStorage.getItem(`cached_qrs_${user?.id}`);
            let list = cached ? JSON.parse(cached) : [];
            
            const existingIndex = list.findIndex(q => q.id === localId);
            if (existingIndex > -1) {
                list[existingIndex] = localQr;
            } else {
                list.unshift(localQr);
            }

            localStorage.setItem(`cached_qrs_${user?.id}`, JSON.stringify(list));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            
            if (!id) navigate(`/editor/${localId}`);
        }
    } catch (error) { 
        console.error(error);
        alert("Error al guardar"); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    try {
        const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `${qrName || 'qr-code'}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error(err);
        alert("Error al generar la imagen");
    }
  };

  const colors = ['#000000', '#ffffff', '#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b'];



  return (
    <div className="qr-editor-root flex flex-col md:flex-row h-[100dvh] bg-cyber-dark text-cyber-text overflow-hidden font-sans">
      
      {/* ========== MOBILE TOP BAR ========== */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0a0a12] border-b border-slate-800 shrink-0">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-cyber-primary transition font-medium text-sm p-1">
            <ArrowLeft size={18} weight="bold" />
        </button>
        <h2 className="text-base font-cyber font-bold text-white truncate px-2">
          {qrName || "Nuevo QR"}
        </h2>
        <div className="w-7"></div> {/* Spacer for centering */}
      </div>

      {/* ========== MOBILE TAB SWITCHER ========== */}
      <div className="md:hidden flex bg-[#0a0a12] px-4 pb-3 shrink-0">
        <div className="flex w-full bg-cyber-surface rounded-xl p-1 border border-slate-800">
          <button 
            onClick={() => setMobileTab("edit")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              mobileTab === "edit" 
                ? "bg-gradient-to-r from-cyber-primary to-cyber-secondary text-white shadow-lg" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders size={16} weight="bold" /> Editar
          </button>
          <button 
            onClick={() => setMobileTab("preview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              mobileTab === "preview" 
                ? "bg-gradient-to-r from-cyber-primary to-cyber-secondary text-white shadow-lg" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye size={16} weight="bold" /> Vista Previa
          </button>
        </div>
      </div>

      {/* ========== LEFT PANEL: CONTROLS (desktop always visible, mobile conditional) ========== */}
      <div className={`w-full md:w-[380px] lg:w-[420px] md:flex md:flex-col border-r border-cyber-surface bg-[#0a0a12] ${
        mobileTab === "edit" ? "flex flex-col flex-1 min-h-0" : "hidden"
      }`}>
        
        {/* Desktop-only back button and title */}
        <div className="hidden md:block px-6 pt-6">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 mb-6 hover:text-cyber-primary transition font-medium text-sm">
              <ArrowLeft size={16} /> Volver
          </button>
          <h2 className="text-2xl font-cyber font-bold mb-6 text-white">Editar Diseño</h2>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 pb-28 md:pb-6 pt-4 md:pt-0">
          
          {/* NOMBRE DEL PROYECTO */}
          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-widest text-cyber-primary mb-2 font-bold">Nombre del Proyecto</label>
            <input value={qrName} onChange={(e) => setQrName(e.target.value)}
              className="w-full bg-cyber-surface p-3.5 rounded-xl text-white border border-slate-700 focus:border-cyber-primary outline-none transition font-bold text-sm" 
              placeholder="Ej: Menú Restaurante, WiFi Casa..." />
          </div>

          {/* URL */}
          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Destino URL</label>
            <div className="relative">
              <LinkSimple size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full bg-cyber-surface p-3.5 pl-10 rounded-xl text-white border border-slate-700 focus:border-cyber-primary outline-none transition text-sm" 
                placeholder="https://..." />
            </div>
          </div>

          {/* LOGO + SLIDER */}
          <div className="mb-5 bg-cyber-surface p-4 rounded-xl border border-slate-700">
              <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-3 font-bold">Logo</label>
              <div className="flex gap-2 mb-3">
                  <button onClick={() => setLogoUrl("https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg")} className="p-2.5 bg-[#0f172a] rounded-lg hover:scale-110 active:scale-95 transition border border-slate-800"><InstagramLogo size={22} color="#E1306C" weight="fill"/></button>
                  <button onClick={() => setLogoUrl("https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg")} className="p-2.5 bg-[#0f172a] rounded-lg hover:scale-110 active:scale-95 transition border border-slate-800"><YoutubeLogo size={22} color="#FF0000" weight="fill"/></button>
                  {logoUrl && <button onClick={() => setLogoUrl("")} className="p-2.5 bg-red-900/20 text-red-400 rounded-lg border border-red-500/20 active:scale-95 transition"><X size={20}/></button>}
              </div>
              
              <div className="relative group cursor-pointer border border-dashed border-slate-600 rounded-xl p-3.5 text-center hover:border-cyber-accent active:border-cyber-primary transition mb-3">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                  <span className="text-xs text-slate-400 group-hover:text-white flex items-center justify-center gap-2"><Image size={16}/> Subir Logo Propio</span>
              </div>

              {/* SLIDER DE TAMAÑO */}
              {logoUrl && (
                  <div className="pt-2 border-t border-slate-700">
                      <div className="flex justify-between text-xs text-slate-400 mb-2 mt-2">
                          <span className="font-medium">Tamaño</span>
                          <span className="font-mono text-cyber-accent">{Math.round(logoSize * 100)}%</span>
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
          <div className="mb-5">
              <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-3 font-bold">Marco / Estilo</label>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
                  {Object.keys(frames).map((f) => (
                      <button key={f} onClick={() => setFrameStyle(f)} className={`px-4 py-2.5 rounded-xl border text-xs capitalize whitespace-nowrap snap-start font-bold transition-all active:scale-95 ${frameStyle === f ? 'border-cyber-primary bg-cyber-primary/10 text-white shadow-neon' : 'border-slate-700 text-slate-500 bg-cyber-surface'}`}>
                          {f === "none" ? "Sin Marco" : f}
                      </button>
                  ))}
              </div>
          </div>

          {/* COLORES */}
          <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                  <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-3 font-bold">Color QR</label>
                  <div className="flex gap-2.5 flex-wrap">
                      {colors.map(c => (
                      <button key={c} onClick={() => setQrColor(c)}
                          className={`w-8 h-8 rounded-full shadow-lg border-2 transition-all active:scale-90 ${qrColor === c ? 'border-white scale-110 ring-2 ring-cyber-primary ring-offset-2 ring-offset-[#0a0a12]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                  </div>
              </div>
              <div>
                  <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-3 font-bold">Color Texto</label>
                  <div className="flex gap-2.5 flex-wrap">
                      {colors.map(c => (
                      <button key={c} onClick={() => setCtaColor(c)}
                          className={`w-8 h-8 rounded-full shadow-lg border-2 transition-all active:scale-90 ${ctaColor === c ? 'border-white scale-110 ring-2 ring-cyber-primary ring-offset-2 ring-offset-[#0a0a12]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                  </div>
              </div>
          </div>

          {/* TEXTO CTA */}
          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Texto CTA</label>
            <input value={ctaText} onChange={(e) => setCtaText(e.target.value)}
              className="w-full bg-cyber-surface p-3.5 rounded-xl text-white border border-slate-700 focus:border-cyber-primary outline-none text-sm" />
          </div>
          
          {/* Desktop Save Button */}
          <button onClick={handleSave} disabled={loading} 
              className="hidden md:flex w-full items-center justify-center gap-2 bg-gradient-to-r from-cyber-primary to-cyber-secondary p-4 rounded-xl font-bold font-cyber shadow-neon hover:shadow-neon-hover hover:-translate-y-1 transition-all text-white tracking-widest text-sm">
            {loading ? "Guardando..." : saved ? <><CheckCircle size={20} weight="fill" /> ¡GUARDADO!</> : <><FloppyDisk size={20} /> GUARDAR</>}
          </button>
        </div>
      </div>

      {/* ========== RIGHT PANEL: PREVIEW (desktop always visible, mobile conditional) ========== */}
      <div className={`flex-1 bg-cyber-dark ${
        mobileTab === "preview" ? "flex flex-col min-h-0" : "hidden md:flex md:flex-col"
      }`}>
        <div className="relative flex items-center justify-center flex-1 overflow-auto">
          {/* Dot grid background */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="relative z-10 flex flex-col items-center py-8 md:py-0">
              
              <div ref={cardRef} className="p-6 md:p-8 bg-cyber-dark/0 flex flex-col items-center justify-center rounded-3xl"> 
                  <div className={`transition-all duration-300 flex flex-col items-center ${frames[frameStyle]}`}>
                      <div className="bg-white p-2 rounded-lg">
                           <div ref={qrRef}></div>
                      </div>
                      <div className={`mt-4 text-center font-cyber font-bold text-xl md:text-2xl tracking-widest uppercase drop-shadow-sm`} style={{ color: ctaColor }}>
                          {ctaText}
                      </div>
                  </div>
              </div>
              
              {id && (
                  <button onClick={handleDownload} className="mt-6 md:mt-8 flex items-center gap-3 px-6 md:px-8 py-3 bg-white text-cyber-dark rounded-full hover:scale-105 active:scale-95 transition shadow-xl font-bold text-sm md:text-base">
                     <DownloadSimple size={20} weight="fill" /> DESCARGAR IMAGEN
                  </button>
              )}
          </div>
        </div>
      </div>

      {/* ========== MOBILE FLOATING SAVE BUTTON ========== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12] to-transparent pt-8">
        <button onClick={handleSave} disabled={loading} 
            className={`w-full flex items-center justify-center gap-2.5 p-4 rounded-2xl font-bold font-cyber shadow-neon transition-all text-white tracking-widest text-sm active:scale-[0.98] ${
              saved 
                ? "bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                : "bg-gradient-to-r from-cyber-primary to-cyber-secondary hover:shadow-neon-hover"
            }`}>
          {loading ? (
            <><span className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent"></span> Guardando...</>
          ) : saved ? (
            <><CheckCircle size={20} weight="fill" /> ¡GUARDADO!</>
          ) : (
            <><FloppyDisk size={20} /> GUARDAR</>
          )}
        </button>
      </div>
    </div>
  );
};

export default QrEditor;