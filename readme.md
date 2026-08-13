Markdown
# 🎟️ Plataforma de Eventos e Ingressos (Desafio Elite Dev)

Sistema completo de gerenciamento de eventos, compra de ingressos com validação de QR Code e controle de acesso na portaria, desenvolvido como solução para o desafio técnico.

## 🛠️ Tecnologias Utilizadas

* **Back-End:** Node.js com Express
* **Banco de Dados:** PostgreSQL (com tipos customizados `ENUM` e chaves estrangeiras)
* **Autenticação:** JSON Web Token (JWT) com controle de papéis (`roles`: organizer, client, concierge)

---

## ⚙️ Pré-requisitos

Certifique-se de ter instalado em sua máquina:
* [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
* [PostgreSQL](https://www.postgresql.org/) rodando localmente ou em container.

---

## 🚀 Como Configurar e Executar o Projeto

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone <seu-repositorio-url>
cd backend
npm install
2. Configuração do Banco de Dados PostgreSQL
Execute os comandos abaixo no seu cliente PostgreSQL (como pgAdmin ou DBeaver) para criar o banco de dados e as tabelas estruturadas:

SQL
-- Criar o banco de dados
CREATE DATABASE elite_dev_tickets;

-- Conecte-se ao banco elite_dev_tickets e execute:

-- 1. Criação dos Tipos ENUM
CREATE TYPE user_role AS ENUM ('organizer', 'client', 'concierge');
CREATE TYPE ticket_status AS ENUM ('available', 'reserved', 'paid', 'used', 'cancelled');

-- 2. Tabela de Usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL
);

-- 3. Tabela de Eventos
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    organizer_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Ingressos
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) NOT NULL,
    owner_id UUID REFERENCES users(id), 
    status ticket_status DEFAULT 'available',
    qr_code_token UUID DEFAULT gen_random_uuid(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
3. Configuração de Conexão no Código
No arquivo server.js, verifique se credenciais do seu banco de dados PostgreSQL estão corretas na configuração do Pool:

JavaScript
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'elite_dev_tickets',
  password: 'sua_senha',
  port: 5432,
});
4. Executando o Servidor
Inicie a aplicação localmente:

Bash
node server.js
O servidor estará rodando em http://localhost:3000.

🧪 Dados Semeados (Seed) & Fluxo de Testes
Para facilitar a avaliação sem precisar cadastrar tudo do zero, a aplicação possui uma rota de Seed que limpa e popula o banco automaticamente com perfis de teste e um evento com 50 ingressos disponíveis.

Passo a Passo para Testar no Thunder Client / Postman:
1. Executar o Seed (Preparar o Banco)
GET http://localhost:3000/seed

Retorno: Confirmação e o evento_id gerado para os testes.

2. Autenticação (Login)
Utilize as credenciais pré-cadastradas para gerar o token JWT conforme o papel desejado:

Organizador: organizador@teste.com / senha123

Cliente Um: cliente1@teste.com / senha123

Portaria: portaria@teste.com / senha123

Faça um POST em http://localhost:3000/login enviando o email e password para obter o token.

3. Listar Eventos Disponíveis
GET http://localhost:3000/events

4. Comprar Ingresso (Apenas Cliente)
POST http://localhost:3000/tickets/purchase

Auth: Bearer Token (Usar o token do Cliente Um)

Body (JSON):

JSON
{
  "event_id": "COLE_O_EVENTO_ID_AQUI"
}
5. Listar Ingressos do Cliente
GET http://localhost:3000/my-tickets

Auth: Bearer Token (Usar o token do Cliente Um)

6. Validar Ingresso na Portaria 
POST http://localhost:3000/tickets/validate

Auth: Bearer Token (Usar o token da Portaria)

Body (JSON):

JSON
{
  "ticket_id": "COLE_O_TICKET_ID_RETORNADO_NA_COMPRA"
}