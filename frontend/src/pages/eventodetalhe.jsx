import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Building, Ticket } from 'lucide-react';
import api from '../services/api';
import './EventoDetalhe.css';

export default function EventoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comprando, setComprando] = useState(false);
  const [simularFalha, setSimularFalha] = useState(false);
  
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const response = await api.get(`/events/${id}`);
        setEvento(response.data);
      } catch (err) {
        setFeedback({ tipo: 'erro', mensagem: 'Evento não encontrado.' });
      } finally {
        setLoading(false);
      }
    };
    fetchEvento();
  }, [id]);

  const handleCompra = async () => {
    setComprando(true);
    setFeedback({ tipo: '', mensagem: '' });

    try {
      const response = await api.post('/tickets/purchase', {
        event_id: evento.id,
        simulate_failure: simularFalha
      });
      
      setFeedback({ 
        tipo: 'sucesso', 
        mensagem: 'Pagamento aprovado! Seu ingresso foi gerado.' 
      });
      
      
      setTimeout(() => {
        navigate('/meus-ingressos');
      }, 2000);

    } catch (err) {
      setFeedback({ 
        tipo: 'erro', 
        mensagem: err.response?.data?.erro || 'Erro ao processar pagamento.' 
      });
    } finally {
      setComprando(false);
    }
  };

  if (loading) return <div className="detalhe-container">Carregando detalhes...</div>;
  if (!evento) return <div className="detalhe-container">{feedback.mensagem}</div>;

  return (
    <div className="detalhe-container">
      <button onClick={() => navigate('/eventos')} className="btn-voltar">
        <ArrowLeft size={18} /> Voltar para eventos
      </button>

      <div className="detalhe-content">
        <div className="detalhe-poster-container">
          {evento.poster_url ? (
            <img 
              src={evento.poster_url} 
              alt={evento.title} 
              className="detalhe-poster"
              onError={(e) => e.target.style.display = 'none'}
            />
          ) : (
            <div className="evento-poster-placeholder">Imagem indisponível</div>
          )}
        </div>

        <div className="detalhe-info">
          <h1>{evento.title}</h1>
          
          <div className="info-grid">
            <div className="info-item">
              <Calendar size={20} />
              <div>
                <span className="info-label">Data e Hora</span>
                <span className="info-valor">
                  {new Date(evento.event_date).toLocaleString('pt-BR', {
                    dateStyle: 'full', timeStyle: 'short'
                  })}
                </span>
              </div>
            </div>

            <div className="info-item">
              <MapPin size={20} />
              <div>
                <span className="info-label">Local</span>
                <span className="info-valor">{evento.location}</span>
              </div>
            </div>

            <div className="info-item">
              <Building size={20} />
              <div>
                <span className="info-label">Organização</span>
                <span className="info-valor">{evento.organizer_name}</span>
              </div>
            </div>
          </div>

          <div className="compra-card">
            <div className="compra-preco">
              <span>Valor do Ingresso (Lote Atual)</span>
              <strong>R$ {Number(evento.price).toFixed(2)}</strong>
            </div>

            <label className="simulacao-falha">
              <input 
                type="checkbox" 
                checked={simularFalha}
                onChange={(e) => setSimularFalha(e.target.checked)}
                disabled={comprando}
              />
              falha no pagamento (Testar API)
            </label>

            <button 
              className="btn-confirmar-compra"
              onClick={handleCompra}
              disabled={comprando}
            >
              {comprando ? 'Processando pagamento...' : 'Confirmar Compra'}
            </button>

            {feedback.mensagem && (
              <div className={`mensagem-feedback feedback-${feedback.tipo}`}>
                {feedback.mensagem}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}