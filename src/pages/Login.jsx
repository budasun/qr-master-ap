import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Login = () => {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Si el usuario ya está logueado, lo mandamos directo al dashboard
  useEffect(() => {
    if (user) {
        navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      
      {/* Fondo Decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl text-center max-w-md w-full">
        <div className="mb-8">
            <span className="text-5xl">⚡</span>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-2">QR Master</h1>
        <p className="text-slate-400 mb-8">Gestiona tus enlaces dinámicos como un profesional.</p>

        <button 
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 py-3 rounded-xl font-bold transition transform hover:scale-105"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="G" />
          Continuar con Google
        </button>

        <p className="mt-8 text-xs text-slate-500">
            Sistema seguro impulsado por Firebase & React
        </p>
      </div>
    </div>
  );
};

export default Login;