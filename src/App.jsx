import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import QrEditor from "./pages/QrEditor";
import RedirectHandler from "./components/RedirectHandler";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-900 text-cyan-50 font-sans">
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