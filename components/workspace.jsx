"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";
import {
  seedActivity,
  seedChecklist,
  seedDocuments,
  seedMembers,
  seedTasks,
  seedTemplates,
} from "../lib/seed";

const STORAGE_KEY = "beneficios-cowork-state-v1";
const views = ["Início", "Tarefas", "Kanban", "Rotinas", "Documentos", "Indicadores", "Configurações"];
const statuses = ["Não iniciada", "Em andamento", "Aguardando retorno", "Aguardando aprovação", "Bloqueada", "Concluída"];
const priorities = ["Baixa", "Média", "Alta", "Crítica"];

function makeEmptyTask() {
  const now = new Date();
  const competence = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  return {
    title: "",
    status: "Não iniciada",
    priority: "Média",
    owner: "",
    ownerEmail: "",
    supplier: "",
    competence,
    dueDate: "",
    category: "",
    type: "Avulsa",
    unit: "",
    brand: "",
    notes: "",
  };
}

const emptyDocument = { title: "", category: "POP", content: "" };
const emptyRoutine = { name: "", rule: "", sla: "" };
const emptyMember = { full_name: "", email: "", role: "analyst" };

function normalize(text) {
  return (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
}

function searchNormalize(text) {
  return (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatDate(date) {
  if (!date) return "Sem data";
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

function isOverdue(task) {
  return task.status !== "Concluída" && task.dueDate && new Date(`${task.dueDate}T12:00:00`) < new Date();
}

function nextId(tasks) {
  const current = tasks
    .map((task) => Number(task.id.split("-")[1]))
    .filter((value) => Number.isFinite(value));
  const highest = current.length ? Math.max(...current) : 1040;
  return `BEN-${highest + 1}`;
}

export function Workspace() {
  const [currentView, setCurrentView] = useState("Kanban");
  const [tasks, setTasks] = useState(seedTasks);
  const [activity, setActivity] = useState(seedActivity);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(makeEmptyTask);
  const [dataMode, setDataMode] = useState("loading");
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [gmailMessages, setGmailMessages] = useState([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailSelected, setGmailSelected] = useState(new Set());
  const [gmailImporting, setGmailImporting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [profile, setProfile] = useState(null);
  const [members, setMembers] = useState(seedMembers);
  const [documents, setDocuments] = useState(seedDocuments.map((document, index) => ({ id: index + 1, ...document })));
  const [files, setFiles] = useState([]);
  const [documentDraft, setDocumentDraft] = useState(emptyDocument);
  const [selectedFile, setSelectedFile] = useState(null);
  const [routines, setRoutines] = useState(seedTemplates);
  const [routineDraft, setRoutineDraft] = useState(emptyRoutine);
  const [memberDraft, setMemberDraft] = useState(emptyMember);

  function toast(message, type = "success") {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  function askConfirm(message) {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  }

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      // Verificação por aba: sessionStorage é exclusivo por aba e some ao fechar
      const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
      if (hasSupabase) {
        const params = new URLSearchParams(window.location.search);
        if (params.get("auth") === "1") {
          sessionStorage.setItem("bc-tab", "1");
          window.history.replaceState({}, "", "/");
        } else if (!sessionStorage.getItem("bc-tab")) {
          const supabase = createSupabaseBrowserClient();
          await supabase.auth.signOut();
          window.location.href = "/login";
          return;
        }
      }

      try {
        const response = await fetch("/api/workspace", { cache: "no-store" });
        if (!response.ok) throw new Error("Falha ao buscar workspace");
        const payload = await response.json();
        if (!active) return;

        setTasks(payload.tasks || seedTasks);
        setActivity(payload.activity || seedActivity);
        setDataMode(payload.mode || "demo");
        setProfile(payload.profile || null);
        setMembers(payload.members || seedMembers);
        setDocuments(payload.documents || seedDocuments.map((document, index) => ({ id: index + 1, ...document })));
        setFiles(payload.files || []);
        setRoutines(payload.routines || seedTemplates);

        if ((payload.mode || "demo") === "demo") {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw);
            setTasks(parsed.tasks || seedTasks);
            setActivity(parsed.activity || seedActivity);
          } catch {}
        }
      } catch {
        if (!active) return;
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setTasks(parsed.tasks || seedTasks);
            setActivity(parsed.activity || seedActivity);
          } catch {}
        }
        setDataMode("demo");
        setProfile({ full_name: "Modo demo", email: "demo@local", role: "supervisor" });
        setMembers(seedMembers);
        setDocuments(seedDocuments.map((document, index) => ({ id: index + 1, ...document })));
        setFiles([]);
        setRoutines(seedTemplates);
      }
    }

    loadWorkspace();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (dataMode !== "demo") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, activity }));
  }, [tasks, activity, dataMode]);

  useEffect(() => {
    if (!profile) return;
    setDraft((current) => ({
      ...current,
      owner: current.owner || profile.full_name || "",
      ownerEmail: current.ownerEmail || profile.email || "",
    }));
  }, [profile]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const haystack = searchNormalize(Object.values(task).join(" "));
      return !query || haystack.includes(searchNormalize(query));
    });
  }, [query, tasks]);

  const metrics = useMemo(() => {
    const open = tasks.filter((task) => task.status !== "Concluída").length;
    const overdue = tasks.filter(isOverdue).length;
    const completed = tasks.filter((task) => task.status === "Concluída").length;
    const onTimeRate = tasks.length ? Math.round(((tasks.length - overdue) / tasks.length) * 100) : 0;
    return { open, overdue, completed, onTimeRate };
  }, [tasks]);

  function pushActivity(entry) {
    setActivity((current) => [entry, ...current].slice(0, 10));
  }

  async function createTask(event) {
    event.preventDefault();
    if (!draft.title || !draft.owner || !draft.dueDate) return;
    setIsSaving(true);

    const task = {
      ...draft,
      id: nextId(tasks),
      ownerEmail: draft.ownerEmail || profile?.email || "",
    };

    try {
      if (dataMode === "supabase") {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task),
        });

        if (!response.ok) {
          toast("Falha ao gravar tarefa.", "error");
          return;
        }

        const created = await response.json();
        setTasks((current) => [created, ...current]);
        pushActivity(`Nova tarefa criada: ${created.id} - ${created.title}`);
        toast("Tarefa salva com sucesso.");
      } else {
        setTasks((current) => [task, ...current]);
        pushActivity(`Nova tarefa criada: ${task.id} - ${task.title}`);
        toast("Tarefa salva localmente.", "info");
      }

      setDraft(makeEmptyTask());
      setShowComposer(false);
      setCurrentView("Kanban");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateTask(id, field, value) {
    const previous = tasks.find((task) => task.id === id);

    if (dataMode === "supabase") {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });

      if (!response.ok) {
        toast("Falha ao atualizar tarefa.", "error");
        return;
      }

      const updated = await response.json();
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
      if (previous && previous[field] !== value) {
        pushActivity(`${id} teve ${field} alterado de ${previous[field]} para ${value}`);
      }
      toast("Alteração sincronizada.");
      return;
    }

    setTasks((current) => current.map((task) => (task.id === id ? { ...task, [field]: value } : task)));
    if (previous && previous[field] !== value) {
      pushActivity(`${id} teve ${field} alterado de ${previous[field]} para ${value}`);
    }
  }

  async function refreshData() {
    if (dataMode === "supabase") {
      try {
        const response = await fetch("/api/workspace", { cache: "no-store" });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        setTasks(payload.tasks || seedTasks);
        setActivity(payload.activity || seedActivity);
        setProfile(payload.profile || null);
        setMembers(payload.members || seedMembers);
        setDocuments(payload.documents || seedDocuments.map((document, index) => ({ id: index + 1, ...document })));
        setFiles(payload.files || []);
        setRoutines(payload.routines || seedTemplates);
        toast("Dados recarregados.", "info");
      } catch {
        toast("Falha ao recarregar dados.", "error");
      }
      return;
    }

    setTasks(seedTasks);
    setActivity(seedActivity);
    window.localStorage.removeItem(STORAGE_KEY);
    setProfile({ full_name: "Modo demo", email: "demo@local", role: "supervisor" });
    setMembers(seedMembers);
    setDocuments(seedDocuments.map((document, index) => ({ id: index + 1, ...document })));
    setFiles([]);
    setRoutines(seedTemplates);
    toast("Estado local resetado.", "info");
  }

  async function signOut() {
    if (dataMode !== "supabase") return;
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function openGmailImport() {
    setGmailLoading(true);
    setGmailMessages([]);
    setGmailSelected(new Set());
    setShowGmailModal(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.provider_token;

      if (!accessToken) {
        toast("Token do Gmail não encontrado. Faça logout e login novamente.", "error");
        setShowGmailModal(false);
        return;
      }

      const response = await fetch("/api/gmail/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast(data.error || "Falha ao buscar emails.", "error");
        setShowGmailModal(false);
        return;
      }

      setGmailMessages(data.messages || []);
    } finally {
      setGmailLoading(false);
    }
  }

  async function importGmailSelected() {
    if (!gmailSelected.size) return;
    setGmailImporting(true);

    try {
      const selected = gmailMessages.filter((m) => gmailSelected.has(m.id));
      const response = await fetch("/api/gmail/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: selected }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast(data.error || "Falha ao importar emails.", "error");
        return;
      }

      setTasks((current) => [...data.tasks, ...current]);
      setShowGmailModal(false);
      setCurrentView("Kanban");
      toast(`${data.count} tarefa${data.count !== 1 ? "s" : ""} importada${data.count !== 1 ? "s" : ""} do Gmail.`);
    } finally {
      setGmailImporting(false);
    }
  }

  function toggleGmailMessage(id) {
    setGmailSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllGmailMessages() {
    if (gmailSelected.size === gmailMessages.length) {
      setGmailSelected(new Set());
    } else {
      setGmailSelected(new Set(gmailMessages.map((m) => m.id)));
    }
  }

  const ownerOptions = members.length ? members : seedMembers;
  const canSeeAll = profile && ["supervisor", "admin"].includes(profile.role);

  async function createDocument(event) {
    event.preventDefault();
    if (!documentDraft.title) return;
    if (!documentDraft.content && !selectedFile) {
      toast("Preencha o conteúdo ou selecione um PDF.", "error");
      return;
    }

    if (documentDraft.content) {
      if (dataMode === "supabase") {
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(documentDraft),
        });

        if (!response.ok) {
          toast("Falha ao criar documento.", "error");
          return;
        }

        const created = await response.json();
        setDocuments((current) => [created, ...current]);
      } else {
        setDocuments((current) => [{ id: current.length + 1, ...documentDraft }, ...current]);
      }
    }

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", documentDraft.title);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast("Falha ao enviar PDF.", "error");
        return;
      }

      const createdFile = await response.json();
      setFiles((current) => [createdFile, ...current]);
    }

    setDocumentDraft(emptyDocument);
    setSelectedFile(null);
    toast("Documento salvo.");
  }

  async function inviteMember(event) {
    event.preventDefault();
    if (!memberDraft.full_name || !memberDraft.email) return;

    const response = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberDraft),
    });

    if (!response.ok) {
      toast("Falha ao convidar membro.", "error");
      return;
    }

    const created = await response.json();
    setMembers((current) => {
      const exists = current.some((member) => member.email === created.email);
      return exists
        ? current.map((member) => member.email === created.email ? created : member)
        : [...current, created];
    });
    setMemberDraft(emptyMember);
    if (created.emailSent === false) {
      toast("Acesso criado. Email não enviado — peça ao usuário para entrar com Google.", "info");
    } else {
      toast("Acesso criado e convite enviado por email.");
    }
  }

  async function updateMemberRole(email, role) {
    const response = await fetch(`/api/team/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      toast("Falha ao atualizar permissão.", "error");
      return;
    }

    setMembers((current) => current.map((member) => member.email === email ? { ...member, role } : member));
    toast("Permissão atualizada.");
  }

  async function removeMember(email) {
    const ok = await askConfirm("Excluir este acesso permanentemente?");
    if (!ok) return;

    const response = await fetch(`/api/team/${encodeURIComponent(email)}`, { method: "DELETE" });

    if (!response.ok) {
      toast("Falha ao excluir usuário.", "error");
      return;
    }

    setMembers((current) => current.filter((member) => member.email !== email));
    toast("Usuário excluído.");
  }

  async function createRoutine(event) {
    event.preventDefault();
    if (!routineDraft.name || !routineDraft.rule) return;

    if (dataMode === "supabase") {
      const response = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routineDraft),
      });

      if (!response.ok) {
        toast("Falha ao criar rotina.", "error");
        return;
      }

      const created = await response.json();
      setRoutines((current) => [...current, created]);
    } else {
      setRoutines((current) => [...current, { id: current.length + 1, ...routineDraft }]);
    }

    setRoutineDraft(emptyRoutine);
    toast("Rotina criada.");
  }

  async function removeTask(id) {
    const ok = await askConfirm("Excluir esta tarefa permanentemente?");
    if (!ok) return;
    const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!response.ok && dataMode === "supabase") {
      toast("Falha ao excluir tarefa.", "error");
      return;
    }
    setTasks((current) => current.filter((task) => task.id !== id));
    toast("Tarefa excluída.");
  }

  async function removeDocument(id) {
    const ok = await askConfirm("Excluir este documento permanentemente?");
    if (!ok) return;
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!response.ok && dataMode === "supabase") {
      toast("Falha ao excluir documento.", "error");
      return;
    }
    setDocuments((current) => current.filter((document) => document.id !== id));
    toast("Documento excluído.");
  }

  async function removeFile(id) {
    const ok = await askConfirm("Excluir este PDF permanentemente?");
    if (!ok) return;
    const response = await fetch(`/api/files/${id}`, { method: "DELETE" });
    if (!response.ok && dataMode === "supabase") {
      toast("Falha ao excluir PDF.", "error");
      return;
    }
    setFiles((current) => current.filter((file) => file.id !== id));
    toast("PDF excluído.");
  }

  async function removeRoutine(id) {
    const ok = await askConfirm("Excluir esta rotina permanentemente?");
    if (!ok) return;
    const response = await fetch(`/api/routines/${id}`, { method: "DELETE" });
    if (!response.ok && dataMode === "supabase") {
      toast("Falha ao excluir rotina.", "error");
      return;
    }
    setRoutines((current) => current.filter((routine) => routine.id !== id));
    toast("Rotina excluída.");
  }

  return (
    <>
      <div className="page-shell">
        <aside className="sidebar">
          <div className="brand-card">
            <div className="brand-mark">BO</div>
            <div className="brand-copy">
              <strong>Benefícios Cowork</strong>
              <span>{canSeeAll ? "Visão da supervisão" : "Minhas tarefas"}</span>
            </div>
          </div>

          <nav className="nav-list">
            {views.map((view) => (
              <button
                key={view}
                className={view === currentView ? "nav-item active" : "nav-item"}
                onClick={() => setCurrentView(view)}
              >
                {view}
              </button>
            ))}
          </nav>

          <div className="sidebar-panel">
            <p className="eyebrow">Sessão</p>
            <strong>{profile?.full_name || "Equipe"}</strong>
            <span>{canSeeAll ? "Supervisão" : "Colaborador"}</span>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <p className="eyebrow">Workspace do time</p>
              <h1>Central de Operações de Benefícios</h1>
            </div>
            <div className="toolbar">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar tarefa, fornecedor, POP, anexo..."
              />
              <button className="primary" onClick={() => setShowComposer((current) => !current)}>
                Nova tarefa
              </button>
              {dataMode === "supabase" ? (
                <button className="secondary" onClick={openGmailImport}>Gmail</button>
              ) : null}
              {dataMode === "supabase" ? (
                <button className="ghost" onClick={signOut}>Sair</button>
              ) : null}
            </div>
          </header>

          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Resumo do dia</p>
              <h2>Operação controlada, rastreável e visível</h2>
              <div className="hero-meta">
                <span className={`mode-dot ${dataMode === "supabase" ? "live" : "demo"}`}></span>
                <small>{dataMode === "supabase" ? "Modo colaborativo ativo" : "Modo demo local"}</small>
              </div>
            </div>

            <div className="hero-stats">
              <MetricCard label="Backlog" value={metrics.open} />
              <MetricCard label="Vencidas" value={metrics.overdue} />
              <MetricCard label="SLA no prazo" value={`${metrics.onTimeRate}%`} />
            </div>
          </section>

          {showComposer ? (
            <section className="composer-panel">
              <div className="composer-head">
                <h3>Nova tarefa</h3>
                <button className="ghost" onClick={() => setShowComposer(false)}>Fechar</button>
              </div>
              <form className="task-form" onSubmit={createTask}>
                <label>
                  Título
                  <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label>
                  Fornecedor
                  <input value={draft.supplier} onChange={(event) => setDraft((current) => ({ ...current, supplier: event.target.value }))} />
                </label>
                <div className="form-row">
                  <label>
                    Responsável
                    <select
                      value={draft.ownerEmail}
                      onChange={(event) => {
                        const selected = ownerOptions.find((member) => member.email === event.target.value);
                        setDraft((current) => ({
                          ...current,
                          ownerEmail: event.target.value,
                          owner: selected?.full_name || "",
                        }));
                      }}
                    >
                      <option value="">Selecione</option>
                      {ownerOptions.map((owner) => (
                        <option key={owner.email} value={owner.email}>{owner.full_name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Prioridade
                    <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}>
                      {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                  </label>
                  <label>
                    Status
                    <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Competência
                    <input value={draft.competence} onChange={(event) => setDraft((current) => ({ ...current, competence: event.target.value }))} />
                  </label>
                  <label>
                    Vencimento
                    <input type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} />
                  </label>
                  <label>
                    Categoria
                    <input value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} />
                  </label>
                </div>
                <label>
                  Observações
                  <textarea rows={4} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
                </label>
                <div className="composer-actions">
                  <button type="button" className="secondary" onClick={refreshData}>Recarregar dados</button>
                  <button type="submit" className="primary" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar tarefa"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {currentView === "Kanban" || currentView === "Início" ? (
            <section className="kanban-grid">
              {statuses
                .filter((status) => filteredTasks.some((task) => task.status === status))
                .map((status) => {
                  const columnTasks = filteredTasks.filter((task) => task.status === status);
                  return (
                    <section key={status} className="kanban-column">
                      <div className="column-head">
                        <h3>{status}</h3>
                        <span className="column-count">{columnTasks.length}</span>
                      </div>

                      <div className="column-body">
                        {columnTasks.map((task) => (
                          <article key={task.id} className="task-card">
                            <div className="item-head">
                              <strong>{task.title}</strong>
                              {canSeeAll ? <button className="mini-danger" onClick={() => removeTask(task.id)}>Excluir</button> : null}
                            </div>
                            <small>{task.id}</small>
                            <div className="pill-row">
                              <span className={`pill ${normalize(task.priority)}`}>{task.priority}</span>
                              <span className="pill neutral">{task.owner}</span>
                              <span className="pill neutral">{task.supplier}</span>
                              <span className={`pill ${isOverdue(task) ? "vencida" : "neutral"}`}>{formatDate(task.dueDate)}</span>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
            </section>
          ) : null}

          {currentView === "Tarefas" ? (
            <section className="table-panel">
              <div className="table-head">
                <h3>Base principal de tarefas</h3>
                <button className="secondary" onClick={refreshData}>Recarregar dados</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Título</th>
                      <th>Status</th>
                      <th>Prioridade</th>
                      <th>Responsável</th>
                      <th>Fornecedor</th>
                      <th>Competência</th>
                      <th>Vencimento</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className={isOverdue(task) ? "overdue-row" : ""}>
                        <td>{task.id}</td>
                        <td>{task.title}</td>
                        <td>
                          <select value={task.status} onChange={(event) => updateTask(task.id, "status", event.target.value)}>
                            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </td>
                        <td>
                          <select value={task.priority} onChange={(event) => updateTask(task.id, "priority", event.target.value)}>
                            {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                          </select>
                        </td>
                        <td>{task.owner}</td>
                        <td>{task.supplier}</td>
                        <td>{task.competence}</td>
                        <td>{formatDate(task.dueDate)}</td>
                        <td>{canSeeAll ? <button className="mini-danger" onClick={() => removeTask(task.id)}>Excluir</button> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {currentView === "Rotinas" ? (
            <section className="simple-grid two">
              <section className="simple-panel">
                <div className="table-head">
                  <h3>Templates recorrentes</h3>
                </div>
                {canSeeAll ? (
                  <form className="task-form routine-form" onSubmit={createRoutine}>
                    <input placeholder="Nome da rotina" value={routineDraft.name} onChange={(event) => setRoutineDraft((current) => ({ ...current, name: event.target.value }))} />
                    <input placeholder="Recorrência" value={routineDraft.rule} onChange={(event) => setRoutineDraft((current) => ({ ...current, rule: event.target.value }))} />
                    <input placeholder="SLA" value={routineDraft.sla} onChange={(event) => setRoutineDraft((current) => ({ ...current, sla: event.target.value }))} />
                    <button type="submit" className="primary">Nova rotina</button>
                  </form>
                ) : null}
                <div className="simple-list">
                  {routines.map((item) => (
                    <div key={item.id || item.name} className="simple-item">
                      <div className="item-head">
                        <strong>{item.name} • {item.rule}</strong>
                        {canSeeAll ? <button className="mini-danger" onClick={() => removeRoutine(item.id)}>Excluir</button> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <SimplePanel title="Checklist padrão" items={seedChecklist} />
            </section>
          ) : null}

          {currentView === "Documentos" ? (
            <section className="documents-layout">
              <section className="simple-panel document-composer">
                <div className="table-head">
                  <h3>Novo documento</h3>
                </div>
                {canSeeAll ? (
                  <form className="task-form" onSubmit={createDocument}>
                    <label>
                      Título
                      <input value={documentDraft.title} onChange={(event) => setDocumentDraft((current) => ({ ...current, title: event.target.value }))} />
                    </label>
                    <label>
                      Categoria
                      <select value={documentDraft.category} onChange={(event) => setDocumentDraft((current) => ({ ...current, category: event.target.value }))}>
                        <option value="POP">POP</option>
                        <option value="Exceções">Exceções</option>
                        <option value="Fornecedor">Fornecedor</option>
                        <option value="FAQ">FAQ</option>
                      </select>
                    </label>
                    <label>
                      Conteúdo
                      <textarea rows={8} value={documentDraft.content} onChange={(event) => setDocumentDraft((current) => ({ ...current, content: event.target.value }))} />
                    </label>
                    <label>
                      PDF opcional
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                      />
                    </label>
                    <button type="submit" className="primary">Salvar documento</button>
                  </form>
                ) : (
                  <div className="simple-item">
                    <strong>Somente supervisão pode criar documentos.</strong>
                  </div>
                )}
              </section>

              <section className="simple-grid two">
                <section className="simple-panel">
                  <div className="table-head">
                    <h3>Wiki do time</h3>
                  </div>
                  <div className="simple-list">
                    {documents.map((document) => (
                      <div key={document.id} className="simple-item">
                        <div className="item-head">
                          <strong>{document.title}</strong>
                          {canSeeAll ? <button className="mini-danger" onClick={() => removeDocument(document.id)}>Excluir</button> : null}
                        </div>
                        <small>{document.category}</small>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="simple-panel">
                  <div className="table-head">
                    <h3>Arquivos</h3>
                  </div>
                  <div className="simple-list">
                    {files.length ? files.map((file) => (
                      <a key={file.id} className="simple-item file-item" href={file.fileUrl} target="_blank" rel="noreferrer">
                        <div className="item-head">
                          <strong>{file.title}</strong>
                          {canSeeAll ? <button className="mini-danger" onClick={(event) => { event.preventDefault(); removeFile(file.id); }}>Excluir</button> : null}
                        </div>
                        <small>{file.fileName}</small>
                      </a>
                    )) : (
                      <div className="simple-item">
                        <strong>Nenhum PDF enviado ainda.</strong>
                      </div>
                    )}
                  </div>
                </section>
              </section>
            </section>
          ) : null}

          {currentView === "Indicadores" ? (
            <section className="indicator-row">
              <MetricCard label="Backlog" value={metrics.open} />
              <MetricCard label="Vencidas" value={metrics.overdue} />
              <MetricCard label="Concluídas" value={metrics.completed} />
              <MetricCard label="SLA no prazo" value={`${metrics.onTimeRate}%`} />
            </section>
          ) : null}

          {currentView === "Configurações" ? (
            <section className="simple-grid two">
              <section className="simple-panel">
                <div className="table-head">
                  <h3>Convidar membro</h3>
                </div>
                {canSeeAll ? (
                  <form className="task-form" onSubmit={inviteMember}>
                    <label>
                      Nome
                      <input value={memberDraft.full_name} onChange={(event) => setMemberDraft((current) => ({ ...current, full_name: event.target.value }))} />
                    </label>
                    <label>
                      Email
                      <input type="email" value={memberDraft.email} onChange={(event) => setMemberDraft((current) => ({ ...current, email: event.target.value }))} />
                    </label>
                    <label>
                      Permissão
                      <select value={memberDraft.role} onChange={(event) => setMemberDraft((current) => ({ ...current, role: event.target.value }))}>
                        <option value="analyst">Colaborador</option>
                        <option value="supervisor">Supervisão</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <button type="submit" className="primary">Criar login e enviar email</button>
                  </form>
                ) : (
                  <div className="simple-item">
                    <strong>Somente supervisão pode gerenciar acessos.</strong>
                  </div>
                )}
              </section>

              <section className="simple-panel">
                <div className="table-head">
                  <h3>Permissões do time</h3>
                </div>
                <div className="simple-list">
                  {members.map((member) => (
                    <div key={member.email} className="simple-item">
                      <div className="item-head">
                        <div>
                          <strong>{member.full_name}</strong>
                          <small>{member.email}</small>
                        </div>
                        {canSeeAll ? (
                          <div className="member-actions">
                            <select
                              className="role-select"
                              value={member.role}
                              onChange={(event) => updateMemberRole(member.email, event.target.value)}
                            >
                              <option value="analyst">Colaborador</option>
                              <option value="supervisor">Supervisão</option>
                              <option value="admin">Admin</option>
                            </select>
                            {member.email !== profile?.email ? (
                              <button className="mini-danger" onClick={() => removeMember(member.email)}>Excluir</button>
                            ) : null}
                          </div>
                        ) : (
                          <span className="pill neutral">{member.role}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          ) : null}
        </main>
      </div>

      {showGmailModal && (
        <div className="confirm-overlay" onClick={() => setShowGmailModal(false)}>
          <div className="gmail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gmail-modal-head">
              <div>
                <h3>Importar do Gmail</h3>
                <small>Emails não lidos — selecione os que virarão tarefas</small>
              </div>
              <button className="ghost" onClick={() => setShowGmailModal(false)}>Fechar</button>
            </div>

            {gmailLoading ? (
              <div className="gmail-loading">Buscando emails...</div>
            ) : gmailMessages.length === 0 ? (
              <div className="gmail-empty">Nenhum email não lido encontrado.</div>
            ) : (
              <>
                <div className="gmail-select-all">
                  <label>
                    <input
                      type="checkbox"
                      checked={gmailSelected.size === gmailMessages.length}
                      onChange={toggleAllGmailMessages}
                    />
                    Selecionar todos ({gmailMessages.length})
                  </label>
                </div>
                <div className="gmail-list">
                  {gmailMessages.map((msg) => (
                    <label key={msg.id} className={`gmail-item ${gmailSelected.has(msg.id) ? "selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={gmailSelected.has(msg.id)}
                        onChange={() => toggleGmailMessage(msg.id)}
                      />
                      <div className="gmail-item-body">
                        <strong>{msg.subject}</strong>
                        <span className="gmail-from">{msg.fromName || msg.fromEmail}</span>
                        <span className="gmail-snippet">{msg.snippet}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="gmail-actions">
                  <span className="gmail-count">{gmailSelected.size} selecionado{gmailSelected.size !== 1 ? "s" : ""}</span>
                  <button
                    className="primary"
                    onClick={importGmailSelected}
                    disabled={!gmailSelected.size || gmailImporting}
                  >
                    {gmailImporting ? "Importando..." : "Importar selecionadas"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} />

      {confirmState && (
        <div
          className="confirm-overlay"
          onClick={() => { confirmState.resolve(false); setConfirmState(null); }}
        >
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">{confirmState.message}</p>
            <div className="confirm-actions">
              <button
                className="ghost"
                onClick={() => { confirmState.resolve(false); setConfirmState(null); }}
              >
                Cancelar
              </button>
              <button
                className="danger-btn"
                onClick={() => { confirmState.resolve(true); setConfirmState(null); }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MetricCard({ label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function SimplePanel({ title, items }) {
  return (
    <section className="simple-panel">
      <h3>{title}</h3>
      <div className="simple-list">
        {items.map((item) => (
          <div key={item} className="simple-item">
            <strong>{item}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}
