# Setup do Supabase

## 1. Criar projeto

Crie um projeto no Supabase e copie:

- `Project URL`
- `anon public key`
- `service_role key`

## 2. Criar tabelas

No SQL Editor do Supabase, execute o conteúdo de `docs/supabase-setup.sql`.

Se você já tinha rodado uma versão anterior desse arquivo, rode de novo a versão atual para criar:

- `profiles`
- `knowledge_documents`
- `document_files`
- `routine_templates`
- colunas extras em `tasks`

## Storage para PDF

No Supabase:

1. Abra `Storage`.
2. Clique em `New bucket`.
3. Nome do bucket: `beneficios-docs`
4. Marque como `Public`
5. Crie o bucket

Esse bucket será usado para os PDFs enviados pelo app.

## 3. Ativar login Google

No Supabase:

1. Abra `Authentication`.
2. Abra `Providers`.
3. Ative `Google`.
4. Em `Site URL`, use:
   - local: `http://localhost:3000`
   - produção: URL do seu projeto na Vercel
5. Em `Redirect URLs`, adicione:
   - `http://localhost:3000/auth/callback`
   - `https://SEU-PROJETO.vercel.app/auth/callback`

No console do Google Cloud você também precisa configurar as mesmas URLs autorizadas para OAuth.

## 4. Configurar variáveis locais

Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 5. Configurar na Vercel

No projeto da Vercel, adicione as mesmas variáveis em `Settings > Environment Variables`.

## 6. Rodar localmente

```bash
npm install
npm run dev
```

Quando as variáveis estiverem presentes, a aplicação sai do modo demo e passa para o modo colaborativo.

## 7. Definir quem é supervisora

Na tabela `profiles`, altere o campo `role`:

- `supervisor`: vê tudo
- `analyst`: vê apenas as próprias tarefas

Exemplo:

```sql
update profiles
set role = 'supervisor'
where email = 'seu-email@empresa.com';
```

## 8. Convites por e-mail

O sistema agora envia convite por e-mail ao criar um novo acesso na plataforma.

Para isso funcionar com confiabilidade em produção:

1. Abra `Authentication > Email Templates` no Supabase.
2. Configure um SMTP próprio em `Settings` do projeto.
3. Teste o envio de convite antes de liberar para o time.

Sem SMTP configurado, o Supabase pode limitar ou bloquear envios para alguns cenários.

## Observação de segurança

Neste momento a aplicação usa rotas de servidor com `service_role` no backend para simplificar o MVP compartilhado. Isso funciona para colocar o time para operar, mas o próximo passo recomendado é autenticação com perfis e políticas de acesso por usuário.
