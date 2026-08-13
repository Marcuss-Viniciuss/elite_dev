import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  
  const userStr = localStorage.getItem('@EliteTickets:user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('@EliteTickets:token');
    localStorage.removeItem('@EliteTickets:user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1rem 2rem', 
      backgroundColor: '#18181b', 
      borderBottom: '1px solid #27272a',
      marginBottom: '2rem'
    }}>
      <div style={{ color: '#e4e4e7', fontWeight: 'bold', fontSize: '1.2rem' }}>
        Elite Tickets 
      </div>
      
      <button 
        onClick={handleLogout}
        style={{ 
          backgroundColor: 'transparent', 
          color: '#ef4444', 
          border: '1px solid #ef4444', 
          padding: '0.4rem 1rem', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontWeight: '600',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        Sair
      </button>
    </header>
  );
}