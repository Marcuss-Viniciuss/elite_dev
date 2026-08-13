import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import api from '../services/api';
import './Organizador.css';
import './Portaria.css'; 

export default function Organizador() {
  const [catalogo, setCatalogo] = useState([]);
  const [origemApi, setOrigemApi] = useState('');
  const [aviso, setAviso] = useState('');
  
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [criando, setCriando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  
  const [local, setLocal] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [preco, setPreco] = useState('');
  const [capacidade, setCapacidade] = useState('50');

  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        const response = await api.get('/external-movies');
        setCatalogo(response.data.catalogo || []);
        setOrigemApi(response.data.origem);
        if (response.data.aviso) setAviso(response.data.aviso);
      } catch (err) {
        console.error("Erro ao carregar catálogo", err);
      }
    };
    fetchCatalogo();
  }, []);

  const handleCriarEvento = async (e) => {
    e.preventDefault();
    if (!itemSelecionado) return;

    setCriando(true);
    setFeedback(null);

    const payload = {
      title: itemSelecionado.title,
      event_date: dataHora.replace('T', ' ') + ':00', 
      location: local,
      price: parseFloat(preco),
      capacity: parseInt(capacidade),
      external_source: origemApi,
      external_id: itemSelecionado.id.toString(),
      poster_url: itemSelecionado.poster_url
    };

    try {
      await api.post('/events', payload);
      setFeedback({ tipo: 'valido', mensagem: 'Evento criado com sucesso! Ingressos gerados.' });
      
      setItemSelecionado(null);
      setLocal('');
      setDataHora('');
      setPreco('');
      setCapacidade('50');
    } catch (err) {
      setFeedback({ 
        tipo: 'erro', 
        mensagem: err.response?.data?.erro || 'Erro ao criar evento.' 
      });
    } finally {
      setCriando(false);
    }
  };

  return (
    <div className="organizador-container">
      <header className="organizador-header">
        <h2>Painel do Organizador</h2>
        <p>Selecione um item do catálogo externo para montar seu evento.</p>
      </header>

      {aviso && (
        <div className="aviso-api">
          <strong>Aviso:</strong> {aviso}
        </div>
      )}

      <div className="catalogo-grid">
        {catalogo.map((item) => (
          <div 
            key={item.id} 
            className={`catalogo-card ${itemSelecionado?.id === item.id ? 'selecionado' : ''}`}
            onClick={() => setItemSelecionado(item)}
          >
            {item.poster_url ? (
              <img 
                src={item.poster_url} 
                alt={item.title} 
                className="catalogo-poster" 
                onError={(e) => e.target.style.display = 'none'} 
              />
            ) : (
              <div className="catalogo-poster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b' }}>
                Sem Pôster
              </div>
            )}
            
            <div className="catalogo-info">
              <h3>{item.title}</h3>
              <p>Lançamento: {new Date(item.release_date).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        ))}
      </div>

      {itemSelecionado && (
        <div className="criacao-evento-section">
          <h3>
            <PlusCircle size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }} />
            Configurar Evento: {itemSelecionado.title}
          </h3>

          <form onSubmit={handleCriarEvento} className="form-grid">
            <div className="form-group">
              <label>Data e Hora do Evento:</label>
              <input 
                type="datetime-local" 
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Local (Espaço/Teatro):</label>
              <input 
                type="text" 
                placeholder="Ex: Teatro Elite"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Preço do Ingresso (R$):</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                placeholder="Ex: 100.00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Capacidade (Quantidade de Ingressos):</label>
              <input 
                type="number" 
                min="1"
                value={capacidade}
                onChange={(e) => setCapacidade(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-criar" disabled={criando}>
              {criando ? 'Gerando ingressos...' : 'Publicar Evento'}
            </button>
          </form>
        </div>
      )}

      {feedback && (
        <div className={`resultado-box estado-${feedback.tipo}`} style={{ marginTop: '2rem' }}>
          <h3>{feedback.tipo === 'valido' ? 'SUCESSO' : 'ERRO'}</h3>
          <p>{feedback.mensagem}</p>
        </div>
      )}
    </div>
  );
}