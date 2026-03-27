# API MVP

## Direção

API orientada a recursos, com autenticação obrigatória e trilha de auditoria em ações críticas.

## Recursos principais

### `POST /auth/login`

Autentica usuário e retorna sessão/token.

### `GET /me`

Retorna perfil, permissões e contexto do usuário logado.

### `GET /tasks`

Lista tarefas com filtros:

- `status`
- `priority`
- `owner_id`
- `supplier_id`
- `competence`
- `brand`
- `unit`
- `company`
- `origin`
- `due_from`
- `due_to`
- `is_recurring`
- `search`

### `POST /tasks`

Cria tarefa manual ou derivada de template.

```json
{
  "title": "Validar fatura mensal da Unimed",
  "description": "Conferir vidas, custo, divergências e anexar evidências.",
  "demand_type": "Rotina",
  "category": "Fatura",
  "subcategory": "Plano de saúde",
  "priority": "Crítica",
  "owner_id": "usr_12",
  "requester_id": "usr_03",
  "due_date": "2026-03-27",
  "competence": "2026-03",
  "supplier_id": "sup_01",
  "benefit": "Saúde",
  "company": "Holding",
  "brand": "Marca A",
  "unit": "Campinas",
  "origin": "Rotina",
  "sla_hours": 24,
  "risk": "Alto",
  "tags": ["fechamento", "fatura"],
  "template_id": "tpl_001"
}
```

### `GET /tasks/:taskId`

Retorna detalhe completo da tarefa, comentários, anexos, checklist e histórico.

### `PATCH /tasks/:taskId`

Atualiza campos editáveis e grava evento de auditoria.

### `POST /tasks/:taskId/comments`

Adiciona comentário interno com suporte a menções.

### `POST /tasks/:taskId/attachments`

Faz upload de arquivo e vincula metadados ao contexto da tarefa.

### `POST /tasks/:taskId/checklist-items`

Adiciona item ao checklist.

### `PATCH /tasks/:taskId/checklist-items/:itemId`

Marca item como concluído ou reabre.

### `POST /tasks/:taskId/approve`

Solicita aprovação para aprovador definido.

### `POST /tasks/:taskId/complete`

Conclui tarefa. Deve validar regras mínimas do template quando houver checklist obrigatório.

### `POST /tasks/:taskId/reopen`

Reabre tarefa concluída, preservando histórico.

### `GET /task-templates`

Lista templates operacionais e suas regras de recorrência.

### `POST /task-templates`

Cria template com campos padrão, checklist e regra de recorrência.

### `POST /recurrences/run`

Endpoint interno ou job para gerar tarefas futuras por competência.

### `GET /knowledge-pages`

Lista páginas da wiki por categoria, busca ou hierarquia.

### `POST /knowledge-pages`

Cria página da base de conhecimento.

### `PATCH /knowledge-pages/:pageId`

Atualiza conteúdo e incrementa versão.

### `GET /dashboard/summary`

Retorna métricas agregadas para visão gerencial.

### `GET /search`

Busca unificada entre tarefas, comentários, páginas e anexos.

## Eventos de auditoria mínimos

- tarefa criada
- campo alterado
- status alterado
- responsável alterado
- prazo alterado
- comentário inserido
- anexo adicionado/removido
- aprovação solicitada/aprovada/reprovada
- tarefa concluída/reaberta

## Regras de permissão do MVP

- `Admin`: acesso total.
- `Liderança`: leitura total do time, redistribuição e aprovações.
- `Analista`: cria e edita tarefas permitidas.
- `Leitura`: consulta tarefas, documentos e dashboards sem edição.
