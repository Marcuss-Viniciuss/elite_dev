import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import api from '../services/api';
import './MeusIngressos.css';

export default function MeusIngressos() {
  const [ingressos, setIngressos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIngressos = async () => {
      try {
        const response = await api.get('/my-tickets');
        setIngressos(response.data);
      } catch (err) {
        setErro('Falha ao carregar seus ingressos.');
      } finally {
        setLoading(false);
      }
    };
    fetchIngressos();
  }, []);

  if (loading) return <div className="ingressos-container">Carregando carteira...</div>;

  return (
    <div className="ingressos-container">
      <header className="ingressos-header">
        <button onClick={() => navigate('/eventos')} className="btn-voltar" style={{ marginBottom: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <h2>Meus Ingressos</h2>
      </header>

      {erro && <p style={{ color: '#ef4444' }}>{erro}</p>}

      <div className="lista-ingressos">
        {ingressos.map(ingresso => (
          <div key={ingresso.ticket_id} className="ingresso-card">
            
            <div className="ingresso-info">
              <span className={`ingresso-status status-${ingresso.status}`}>
                {ingresso.status === 'paid' ? 'Válido para entrada' : 'Já Utilizado'}
              </span>
              
              <h3>{ingresso.event_title}</h3>
              
              <div className="ingresso-detalhes">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} />
                  {new Date(ingresso.event_date).toLocaleString('pt-BR', {
                    dateStyle: 'short', timeStyle: 'short'
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} />
                  {ingresso.location}
                </div>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: 'auto' }}>
                Comprado em: {new Date(ingresso.updated_at).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="ingresso-qr-section">
              <div className="qr-code-wrapper">
                <QRCodeSVG 
                  value={ingresso.qr_code_token} 
                  size={140}
                  level="M" 
                  includeMargin={true}
                />
              </div>
              <span className="qr-token-text">ID: {ingresso.ticket_id.split('-')[0]}...</span>
            </div>

          </div>
        ))}

        {ingressos.length === 0 && !erro && (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a' }}>
            <p style={{ color: '#a1a1aa', marginBottom: '1rem' }}>Você ainda não possui ingressos.</p>
            <button className="btn-comprar" style={{ width: 'auto' }} onClick={() => navigate('/eventos')}>
              Explorar eventos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}