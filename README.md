# Benefícios Cowork

Workspace operacional para o time de Benefícios, agora estruturado como app `Next.js` pronta para deploy na Vercel.

## O que está incluído

- identidade visual atualizada para `Benefícios Cowork` com cores primárias azul e laranja;
- navegação por início, tarefas, kanban, rotinas, documentos e indicadores;
- login com Google via Supabase Auth;
- perfis simples com visibilidade por papel (`supervisor` vê tudo, `analyst` vê apenas as próprias tarefas);
- criação de tarefas no próprio app;
- edição inline de status, prioridade e responsável;
- persistência compartilhada via Supabase quando as variáveis de ambiente estiverem configuradas;
- fallback para `localStorage` em modo demo quando o Supabase não estiver configurado;
- documentação funcional e esquema relacional inicial em `docs/`.

## Como rodar localmente

```bash
npm install
npm run dev
```

Depois abra `http://localhost:3000`.

## Como ativar modo colaborativo

1. Crie um projeto no Supabase.
2. Rode o SQL de [docs/supabase-setup.sql](C:/Users/loren/OneDrive/Documentos/Benefícios%20COWORK/docs/supabase-setup.sql).
3. Copie `.env.example` para `.env.local`.
4. Preencha as chaves do Supabase.
5. Reinicie `npm run dev`.

Guia detalhado em [docs/supabase-setup.md](C:/Users/loren/OneDrive/Documentos/Benefícios%20COWORK/docs/supabase-setup.md).

## Como gerar build

```bash
npm run build
npm start
```

## Estrutura principal

- `app/`: rotas e estilos globais do Next.js
- `components/workspace.jsx`: tela principal do produto
- `app/api/`: rotas de leitura e escrita do workspace
- `lib/seed.js`: dados iniciais do MVP
- `lib/server-data.js`: camada server-side ligada ao Supabase
- `docs/api-mvp.md`: contrato inicial da API
- `docs/schema.sql`: modelo relacional base

## Limitação atual

Sem Supabase configurado, o app cai para modo demo local. Com Supabase, o time já consegue compartilhar o mesmo backlog. Autenticação e permissões ainda são o próximo passo.
