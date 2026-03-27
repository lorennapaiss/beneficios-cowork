CREATE TABLE users (
  user_id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  cargo VARCHAR(120),
  perfil VARCHAR(30) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  time VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
  supplier_id VARCHAR(36) PRIMARY KEY,
  nome_fornecedor VARCHAR(180) NOT NULL,
  tipo VARCHAR(80),
  beneficio_relacionado VARCHAR(120),
  contato TEXT,
  sla_padrao INTEGER,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brands_units (
  org_id VARCHAR(36) PRIMARY KEY,
  empresa VARCHAR(150) NOT NULL,
  marca VARCHAR(150) NOT NULL,
  unidade VARCHAR(150) NOT NULL,
  centro_custo VARCHAR(80),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_templates (
  template_id VARCHAR(36) PRIMARY KEY,
  nome_template VARCHAR(180) NOT NULL,
  descricao TEXT,
  tipo_recorrencia VARCHAR(30),
  regra_recorrencia VARCHAR(120),
  campos_padrao JSON NOT NULL,
  checklist_padrao JSON,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  task_id VARCHAR(36) PRIMARY KEY,
  titulo VARCHAR(220) NOT NULL,
  descricao TEXT,
  tipo_demanda VARCHAR(80) NOT NULL,
  categoria VARCHAR(120),
  subcategoria VARCHAR(120),
  status VARCHAR(40) NOT NULL,
  prioridade VARCHAR(20) NOT NULL,
  responsavel_id VARCHAR(36),
  solicitante_id VARCHAR(36),
  data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_inicio TIMESTAMP,
  data_vencimento TIMESTAMP,
  data_conclusao TIMESTAMP,
  competencia VARCHAR(7),
  fornecedor_id VARCHAR(36),
  beneficio VARCHAR(120),
  empresa VARCHAR(150),
  marca VARCHAR(150),
  unidade VARCHAR(150),
  colaborador_pj VARCHAR(180),
  origem VARCHAR(80),
  sla_em_horas INTEGER,
  risco VARCHAR(30),
  tags JSON,
  observacoes TEXT,
  template_id VARCHAR(36),
  parent_task_id VARCHAR(36),
  created_by VARCHAR(36) NOT NULL,
  updated_by VARCHAR(36) NOT NULL,
  archived_at TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES users(user_id),
  FOREIGN KEY (solicitante_id) REFERENCES users(user_id),
  FOREIGN KEY (fornecedor_id) REFERENCES suppliers(supplier_id),
  FOREIGN KEY (template_id) REFERENCES task_templates(template_id),
  FOREIGN KEY (parent_task_id) REFERENCES tasks(task_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_prioridade ON tasks(prioridade);
CREATE INDEX idx_tasks_responsavel ON tasks(responsavel_id);
CREATE INDEX idx_tasks_fornecedor ON tasks(fornecedor_id);
CREATE INDEX idx_tasks_competencia ON tasks(competencia);
CREATE INDEX idx_tasks_vencimento ON tasks(data_vencimento);

CREATE TABLE task_comments (
  comment_id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  autor_id VARCHAR(36) NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id),
  FOREIGN KEY (autor_id) REFERENCES users(user_id)
);

CREATE TABLE task_attachments (
  attachment_id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(80),
  file_size_bytes BIGINT,
  competence VARCHAR(7),
  supplier_id VARCHAR(36),
  uploaded_by VARCHAR(36) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);

CREATE TABLE task_checklist_items (
  checklist_item_id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  concluido BOOLEAN NOT NULL DEFAULT FALSE,
  ordem INTEGER NOT NULL DEFAULT 0,
  concluido_por VARCHAR(36),
  concluido_em TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id),
  FOREIGN KEY (concluido_por) REFERENCES users(user_id)
);

CREATE TABLE knowledge_pages (
  page_id VARCHAR(36) PRIMARY KEY,
  titulo VARCHAR(220) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  conteudo TEXT NOT NULL,
  categoria VARCHAR(120),
  parent_page_id VARCHAR(36),
  status VARCHAR(30) NOT NULL DEFAULT 'published',
  versao INTEGER NOT NULL DEFAULT 1,
  created_by VARCHAR(36) NOT NULL,
  updated_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_page_id) REFERENCES knowledge_pages(page_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id),
  FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

CREATE TABLE approvals (
  approval_id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  solicitado_por VARCHAR(36) NOT NULL,
  aprovador_id VARCHAR(36) NOT NULL,
  status_aprovacao VARCHAR(30) NOT NULL,
  motivo TEXT,
  decisao_em TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id),
  FOREIGN KEY (solicitado_por) REFERENCES users(user_id),
  FOREIGN KEY (aprovador_id) REFERENCES users(user_id)
);

CREATE TABLE audit_logs (
  audit_id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(60) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  action VARCHAR(60) NOT NULL,
  actor_id VARCHAR(36) NOT NULL,
  before_data JSON,
  after_data JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(user_id)
);
