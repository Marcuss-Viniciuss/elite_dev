import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/tLogin.jsx';
import Eventos from './pages/tEventos.jsx/index.js';
import EventoDetalhe from './pages/tEventoDetalhe.jsx/index.js';
import MeusIngressos from './pages/tMeusIngressos.jsx';
import Portaria from './pages/tportaria.jsx';
import Organizador from './pages/torganizador.jsx';
import Header from './components/Header.jsx'; 

const RotaProtegida = ({ children, roleRequerida }) => {
  const token = localStorage.getItem('@EliteTickets:token');
  const userStr = localStorage.getItem('@EliteTickets:user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  if (roleRequerida && user.role !== roleRequerida) {
     if (user.role === 'organizer') return <Navigate to="/organizador" replace />;
     if (user.role === 'concierge') return <Navigate to="/portaria" replace />;
     return <Navigate to="/eventos" replace />;
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* --- ROTAS DO CLIENTE --- */}
        <Route path="/eventos" element={
          <RotaProtegida roleRequerida="client"><Eventos /></RotaProtegida>
        } />
        <Route path="/eventos/:id" element={
          <RotaProtegida roleRequerida="client"><EventoDetalhe /></RotaProtegida>
        } />
        <Route path="/meus-ingressos" element={
          <RotaProtegida roleRequerida="client"><MeusIngressos /></RotaProtegida>
        } />
        
        {/* --- ROTA DA PORTARIA --- */}
        <Route path="/portaria" element={
          <RotaProtegida roleRequerida="concierge"><Portaria /></RotaProtegida>
        } />
        
        {/* --- ROTA DO ORGANIZADOR --- */}
        <Route path="/organizador" element={
          <RotaProtegida roleRequerida="organizer"><Organizador /></RotaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  );
}