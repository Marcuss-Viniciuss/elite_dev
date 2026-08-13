import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      const response = await api.post('/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('@EliteTickets:token', token);
      localStorage.setItem('@EliteTickets:user', JSON.stringify(user));

      if (user.role === 'organizer') navigate('/organizador');
      else if (user.role === 'concierge') navigate('/portaria');
      else navigate('/eventos'); 

    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha ao conectar no servidor.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Elite Tickets</h2>
        
        {erro && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{erro}</div>}

        {}
        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="email" 
            placeholder="Seu e-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Sua senha" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-login">Entrar</button>
        </form>

        <div className="test-accounts">
          <strong>Contas de teste (senha: senha123):</strong>
          <ul>
            <li>cliente1@teste.com</li>  
            <li>cliente2@teste.com</li>
            <li>organizador@teste.com</li>
            <li>portaria@teste.com</li>
          
          </ul>
        </div>
      </div>
    </div>
  );
}