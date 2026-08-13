import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import api from '../services/api';
import './Eventos.css';

export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await api.get('/events');
        setEventos(response.data);
      } catch (err) {
        setErro('Falha ao carregar os eventos. Verifique se a API está rodando.');
        console.error(err);
      }
    };
    fetchEventos();
  }, []);

  
  const handleImageError = (e) => {
    e.target.style.display = 'none'; 
  };

  return (
    <div className="eventos-container">
      <header className="eventos-header">
        <h2>Eventos Disponíveis</h2>
        <button onClick={() => navigate('/meus-ingressos')} className="btn-meus-ingressos">
          <Ticket size={18} />
          Meus Ingressos
        </button>
      </header>

      {erro && <p style={{ color: '#ef4444' }}>{erro}</p>}

      <div className="eventos-grid">
        {eventos.map(evento => (
          <div key={evento.id} className="evento-card">
            
            <div className="evento-poster-container">
              {}
              <div className="evento-poster-placeholder">
                Imagem indisponivel
              </div>
              
              {evento.poster_url && (
                <img 
                  src={evento.poster_url} 
                  alt={evento.title} 
                  className="evento-poster" 
                  onError={handleImageError}
                />
              )}
            </div>
            
            <div className="evento-info">
              <h3>{evento.title}</h3>
              
              <div className="evento-detalhes">
                <div className="detalhe-item">
                  <Calendar size={16} />
                  <span>
                    {new Date(evento.event_date).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="detalhe-item">
                  <MapPin size={16} />
                  <span>{evento.location}</span>
                </div>
              </div>

              <div className="evento-preco">
                R$ {Number(evento.price).toFixed(2)}
              </div>
              
              <button 
                className="btn-comprar"
                onClick={() => navigate(`/eventos/${evento.id}`)}
              >
                Comprar ingresso
              </button>
            </div>
          </div>
        ))}
        
        {eventos.length === 0 && !erro && (
          <p style={{ color: '#a1a1aa' }}>Nenhum evento publicado no momento.</p>
        )}
      </div>
    </div>
  );
}