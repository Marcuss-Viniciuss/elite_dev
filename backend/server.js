require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'elite_dev_tickets',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

const SECRET_KEY = process.env.SECRET_KEY || 'chave_super_secreta_jwt';

// --- AUTENTICAÇÃO ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ erro: 'Token inválido ou expirado.' });
        req.user = user;
        next();
    });
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ erro: 'Acesso negado para este perfil.' });
        }
        next();
    };
};

// --- ROTA DE LOGIN ---
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ erro: 'Senha incorreta.' });

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '4h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});

// --- ROTA DA API TMDB ---
app.get('/external-movies', authenticateToken, requireRole('organizer'), async (req, res) => {
    try {
        const apiKey = process.env.TMDB_API_KEY; 
        if (!apiKey) return res.status(500).json({ erro: "Chave da API do TMDb não configurada no .env" });

        const url = `https://api.themoviedb.org/3/movie/popular?language=pt-BR&page=1&api_key=${apiKey}`;
        const response = await axios.get(url);
        
        const filmes = response.data.results.slice(0, 12);
        const formattedMovies = filmes.map(filme => ({
            id: filme.id.toString(),
            title: filme.title,
            release_date: filme.release_date,
            overview: filme.overview || 'Sem descrição.',
            poster_url: filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null
        }));
        
        res.json({ origem: "tmdb_api", catalogo: formattedMovies });
    } catch (erro) {
        console.error("Erro na chamada da API:", erro.message);
        res.status(500).json({ erro: "Falha ao buscar filmes." });
    }
});

// --- ROTAS DE EVENTOS ---
app.get('/events', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY event_date ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar eventos.' });
    }
});

app.get('/events/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ erro: 'Evento não encontrado.' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar evento.' });
    }
});

app.post('/events', authenticateToken, requireRole('organizer'), async (req, res) => {
    const { title, event_date, location, price, capacity, external_source, external_id, poster_url } = req.body;
    
    try {
        await pool.query('BEGIN');
        
        const eventId = uuidv4();
        await pool.query(
            `INSERT INTO events (id, title, event_date, location, price, organizer_id, external_source, external_id, poster_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [eventId, title, event_date, location, price, req.user.id, external_source, external_id, poster_url]
        );

        // Gera os ingressos disponíveis
        await pool.query(
            `INSERT INTO tickets (event_id)
             SELECT $1 FROM generate_series(1, $2)`,
            [eventId, capacity]
        );

        await pool.query('COMMIT');
        res.status(201).json({ mensagem: 'Evento e ingressos criados com sucesso!' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ erro: 'Erro ao criar evento.' });
    }
});

// --- COMPRA DE INGRESSO ---
app.post('/tickets/purchase', authenticateToken, requireRole('client'), async (req, res) => {
    const { event_id, simulate_failure } = req.body;
    
    if (simulate_failure) {
        return res.status(400).json({ erro: 'Falha na operadora de cartão de crédito. Pagamento recusado.' });
    }

    try {
        await pool.query('BEGIN');

        const result = await pool.query(
            `SELECT id FROM tickets 
             WHERE event_id = $1 AND status = 'available' 
             LIMIT 1 FOR UPDATE SKIP LOCKED`,
            [event_id]
        );

        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ erro: 'Ingressos esgotados para este evento.' });
        }

        const ticketId = result.rows[0].id;
        const qrCodeToken = uuidv4();

        await pool.query(
            `UPDATE tickets 
             SET status = 'paid', owner_id = $1, qr_code_token = $2, updated_at = NOW() 
             WHERE id = $3`,
            [req.user.id, qrCodeToken, ticketId]
        );

        await pool.query('COMMIT');
        res.json({ mensagem: 'Compra aprovada!', ticket_id: ticketId, qr_code_token: qrCodeToken });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ erro: 'Erro ao processar compra.' });
    }
});

// --- CARTEIRA DO CLIENTE ---
app.get('/my-tickets', authenticateToken, requireRole('client'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.id as ticket_id, t.status, t.qr_code_token, t.updated_at, 
                    e.title as event_title, e.event_date, e.location 
             FROM tickets t 
             JOIN events e ON t.event_id = e.id 
             WHERE t.owner_id = $1
             ORDER BY e.event_date ASC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar ingressos.' });
    }
});

// --- PORTARIA: VALIDAÇÃO DE QR CODE ---
app.post('/tickets/validate', authenticateToken, requireRole('concierge'), async (req, res) => {
    const { qr_code_token, event_id } = req.body;

    try {
        const result = await pool.query('SELECT * FROM tickets WHERE qr_code_token = $1', [qr_code_token]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'invalido', erro: 'Ingresso não encontrado ou inválido.' });
        }

        const ticket = result.rows[0];

        if (ticket.event_id !== event_id) {
            return res.status(400).json({ status: 'evento_errado', erro: 'Este ingresso pertence a outro evento.' });
        }

        if (ticket.status === 'used') {
            return res.status(400).json({ status: 'ja_utilizado', erro: 'Este ingresso já foi validado anteriormente.' });
        }

        await pool.query(`UPDATE tickets SET status = 'used', updated_at = NOW() WHERE id = $1`, [ticket.id]);
        res.json({ status: 'valido', mensagem: 'Entrada autorizada!' });

    } catch (err) {
        res.status(500).json({ erro: 'Erro interno na validação.' });
    }
});

// --- ROTA SEED ---
app.post('/seed', async (req, res) => {
    try {
        const passwordHash = await bcrypt.hash('senha123', 10);
        
        const orgId = uuidv4();
        const clientId1 = uuidv4();
        const clientId2 = uuidv4();
        const concId = uuidv4();

        await pool.query(
            `INSERT INTO users (id, name, email, password_hash, role) VALUES 
            ($1, 'Organizador', 'organizador@teste.com', $5, 'organizer'),
            ($2, 'Cliente 1', 'cliente1@teste.com', $5, 'client'),
            ($3, 'Cliente 2', 'cliente2@teste.com', $5, 'client'),
            ($4, 'Portaria', 'portaria@teste.com', $5, 'concierge')
            ON CONFLICT (email) DO NOTHING`,
            [orgId, clientId1, clientId2, concId, passwordHash]
        );

        res.json({ mensagem: 'Banco de dados populado com usuários de teste.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao rodar seed.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});