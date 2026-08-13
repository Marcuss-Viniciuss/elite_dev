import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanLine, CheckCircle, AlertTriangle, XCircle, Ban } from 'lucide-react';
import api from '../services/api';
import './Portaria.css';

export default function Portaria() {
  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await api.get('/events');
        setEventos(response.data);
        if (response.data.length > 0) setEventoSelecionado(response.data[0].id);
      } catch (err) {
        console.error("Erro ao buscar eventos", err);
      }
    };
    fetchEventos();
  }, []);

  
  useEffect(() => {
    if (!eventoSelecionado) return;
    
    const scanner = new Html5QrcodeScanner("reader", { 
      qrbox: { width: 250, height: 250 }, 
      fps: 5 
    });

    scanner.render((decodedText) => {
      setQrToken(decodedText);
      scanner.clear(); 
    }, (err) => {
      
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [eventoSelecionado]);

  const handleValidar = async (e) => {
    if (e) e.preventDefault();
    if (!qrToken || !eventoSelecionado) return;

    setValidando(true);
    setResultado(null);

    try {
      const response = await api.post('/tickets/validate', {
        qr_code_token: qrToken,
        event_id: eventoSelecionado
      });
      setResultado({ status: response.data.status, mensagem: response.data.mensagem });
    } catch (err) {
      if (err.response?.data?.status) {
        setResultado({ status: err.response.data.status, mensagem: err.response.data.erro });
      } else {
        setResultado({ status: 'erro', mensagem: 'Falha no servidor.' });
      }
    } finally {
      setValidando(false);
      setQrToken('');
    }
  };

  
  useEffect(() => {
    if (qrToken && !validando && !resultado) {
      handleValidar();
    }
  }, [qrToken]);

  const getFeedbackVisual = () => {
    if (!resultado) return null;
    const visuais = {
      valido: { icon: <CheckCircle size={48} />, titulo: 'ACESSO LIBERADO' },
      ja_utilizado: { icon: <AlertTriangle size={48} />, titulo: 'JÁ UTILIZADO' },
      evento_errado: { icon: <Ban size={48} />, titulo: 'EVENTO INCORRETO' },
      invalido: { icon: <XCircle size={48} />, titulo: 'INVÁLIDO' },
      erro: { icon: <XCircle size={48} />, titulo: 'ERRO DE SISTEMA' }
    };
    const visual = visuais[resultado.status] || visuais.erro;

    return (
      <div className={`resultado-box estado-${resultado.status}`}>
        <div className="res-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          {visual.icon}
        </div>
        <h3>{visual.titulo}</h3>
        <p>{resultado.mensagem}</p>
        <button onClick={() => setResultado(null)} className="btn-validar" style={{ marginTop: '1rem' }}>
          Ler próximo ingressso
        </button>
      </div>
    );
  };

  return (
    <div className="portaria-container">
      <header className="portaria-header">
        <ScanLine size={48} color="#a1a1aa" style={{ marginBottom: '1rem' }} />
        <h2>Portaria</h2>
      </header>

      {!resultado ? (
        <>
          <div className="form-group">
            <label>Catraca (Evento):</label>
            <select value={eventoSelecionado} onChange={(e) => setEventoSelecionado(e.target.value)}>
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>

          <div id="reader" style={{ width: '100%', marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden' }}></div>

          <form onSubmit={handleValidar}>
            <div className="form-group">
              <label>Ou digite o token manualmente:</label>
              <input 
                type="text" 
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="Cole o token aqui..."
              />
            </div>
            <button type="submit" className="btn-validar" disabled={validando || !qrToken}>
              {validando ? 'Validando...' : 'Validar Manualmente'}
            </button>
          </form>
        </>
      ) : (
        getFeedbackVisual()
      )}
    </div>
  );
}