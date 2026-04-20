import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import QrEditor from "./pages/QrEditor";
import RedirectHandler from "./components/RedirectHandler";
import ProtectedRoute from "./components/ProtectedRoute";
import { CloudSlash } from "phosphor-react";

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-900 text-cyan-50 font-sans">
          {isOffline && (
            <div className="bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 animate-pulse sticky top-0 z-50">
              <CloudSlash size={18} weight="bold" />
              Modo sin conexión - Usando datos locales
            </div>
          )}
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/r/:id" element={<RedirectHandler />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/editor/:id?" element={<ProtectedRoute><QrEditor /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;