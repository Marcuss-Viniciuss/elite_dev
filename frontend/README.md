# Elite Tickets - Plataforma de Eventos MVP

MVP de uma plataforma de gestão e venda de ingressos desenvolvida com Node.js (Express), PostgreSQL e React (Vite). 
Esta aplicação cobre o fluxo completo de ponta a ponta: configuração de eventos via API externa, compra atômica com concorrência segura, carteira de ingressos com geração de QR Code, e aplicativo de portaria com leitura de câmera.

## 🏗️ Decisões de Arquitetura & Segurança

- **Concorrência Segura (O problema do "Double Booking"):** Na rota de compra de ingressos (`POST /tickets/purchase`), utilizamos transações SQL com `FOR UPDATE SKIP LOCKED`. Isso garante travamento atômico em nível de linha no banco de dados. Se múltiplos clientes tentarem comprar o mesmo ingresso no mesmo milissegundo, o banco resolve a concorrência sem falsos positivos de "esgotado" e sem vender o mesmo assento duas vezes.
- **Segurança (JWT e Bcrypt):** Senhas não são armazenadas em texto puro (utilizamos `bcrypt` com salt de 10 rounds). A sessão é gerida via JWT stateless.
- **Design System:** Substituição de emojis genéricos por bibliotecas de ícones SVG (`lucide-react`) e paleta de cores neutra (Zinc) para garantir aspecto de produto real.
- **Portaria Inteligente:** Implementação de `html5-qrcode` para leitura nativa de câmera no navegador, validando 4 estados distintos (`Válido`, `Já utilizado`, `Evento errado`, `Inválido`).

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL rodando (local ou Docker)

### 1. Configurando o Back-End

O diretório raiz do projeto contém o servidor Node.js.

1. Instale as dependências:
   ```bash
   npm install