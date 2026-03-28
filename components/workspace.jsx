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

/* ── SVG Icons ────────────────────────────────────────── */
const icons = {
  "Início": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  "Tarefas": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  "Kanban": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="12" rx="1"/></svg>,
  "Rotinas": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  "Documentos": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  "Indicadores": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  "Configurações": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

const iconSearch = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const iconPlus = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const iconMail = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const iconLogout = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const iconClose = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const iconClock = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const iconAlert = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const iconCheck = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const iconRefresh = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const iconChevron = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const iconUser = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const iconFilter = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;

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

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function timeAgo(str) {
  if (!str) return "";
  if (str.includes("criada") || str.includes("alterado")) return str;
  return str;
}

export function Workspace() {
  const [currentView, setCurrentView] = useState("Início");
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
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      if (query && !haystack.includes(searchNormalize(query))) return false;
      if (filterStatus && task.status !== filterStatus) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterOwner && task.owner !== filterOwner) return false;
      return true;
    });
  }, [query, tasks, filterStatus, filterPriority, filterOwner]);

  const metrics = useMemo(() => {
    const open = tasks.filter((task) => task.status !== "Concluída").length;
    const overdue = tasks.filter(isOverdue).length;
    const completed = tasks.filter((task) => task.status === "Concluída").length;
    const onTimeRate = tasks.length ? Math.round(((tasks.length - overdue) / tasks.length) * 100) : 0;
    const byStatus = {};
    statuses.forEach(s => { byStatus[s] = tasks.filter(t => t.status === s).length; });
    const byPriority = {};
    priorities.forEach(p => { byPriority[p] = tasks.filter(t => t.priority === p).length; });
    return { open, overdue, completed, onTimeRate, byStatus, byPriority, total: tasks.length };
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
      if (selectedTask?.id === id) setSelectedTask(updated);
      if (previous && previous[field] !== value) {
        pushActivity(`${id} teve ${field} alterado de ${previous[field]} para ${value}`);
      }
      toast("Alteração sincronizada.");
      return;
    }

    const updatedTask = { ...previous, [field]: value };
    setTasks((current) => current.map((task) => (task.id === id ? updatedTask : task)));
    if (selectedTask?.id === id) setSelectedTask(updatedTask);
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
  const uniqueOwners = [...new Set(tasks.map(t => t.owner).filter(Boolean))];

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
    if (selectedTask?.id === id) setSelectedTask(null);
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

  const overdueTasks = useMemo(() => tasks.filter(isOverdue).slice(0, 5), [tasks]);
  const hasActiveFilters = filterStatus || filterPriority || filterOwner;

  return (
    <>
      <div className={`page-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* ── Sidebar ──────────────────────────────────────── */}
        <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="brand-card">
            <div className="brand-mark">BC</div>
            {!sidebarCollapsed && (
              <div className="brand-copy">
                <strong>Benefícios Cowork</strong>
                <span>Gestão de Benefícios</span>
              </div>
            )}
          </div>

          <nav className="nav-list">
            {views.map((view) => (
              <button
                key={view}
                className={view === currentView ? "nav-item active" : "nav-item"}
                onClick={() => setCurrentView(view)}
                title={view}
              >
                <span className="nav-icon">{icons[view]}</span>
                {!sidebarCollapsed && <span className="nav-label">{view}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="sidebar-panel">
              <div className="sidebar-user">
                <div className="avatar-sm">{getInitials(profile?.full_name)}</div>
                <div>
                  <strong>{profile?.full_name || "Equipe"}</strong>
                  <span>{canSeeAll ? "Supervisão" : "Colaborador"}</span>
                </div>
              </div>
              <div className="sidebar-mode">
                <span className={`mode-dot ${dataMode === "supabase" ? "live" : "demo"}`}></span>
                <small>{dataMode === "supabase" ? "Colaborativo" : "Demo local"}</small>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main Content ─────────────────────────────────── */}
        <main className="main-content">
          <header className="topbar">
            <div className="topbar-left">
              <h1>{currentView}</h1>
              <span className="topbar-breadcrumb">Workspace {canSeeAll ? "da supervisão" : "pessoal"}</span>
            </div>
            <div className="toolbar">
              <div className="search-wrap">
                {iconSearch}
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar tarefa, fornecedor, POP..."
                />
              </div>
              <button className="primary btn-icon" onClick={() => setShowComposer((current) => !current)}>
                {iconPlus}
                <span>Nova tarefa</span>
              </button>
              {dataMode === "supabase" ? (
                <button className="secondary btn-icon" onClick={openGmailImport}>
                  {iconMail}
                  <span>Gmail</span>
                </button>
              ) : null}
              {dataMode === "supabase" ? (
                <button className="ghost btn-icon" onClick={signOut}>
                  {iconLogout}
                  <span>Sair</span>
                </button>
              ) : null}
            </div>
          </header>

          {/* ── Composer ────────────────────────────────────── */}
          {showComposer ? (
            <section className="composer-panel">
              <div className="composer-head">
                <h3>Nova tarefa</h3>
                <button className="ghost btn-icon" onClick={() => setShowComposer(false)}>{iconClose}</button>
              </div>
              <form className="task-form" onSubmit={createTask}>
                <label>
                  Título
                  <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Ex: Conferir fatura VR do mês" />
                </label>
                <label>
                  Fornecedor
                  <input value={draft.supplier} onChange={(event) => setDraft((current) => ({ ...current, supplier: event.target.value }))} placeholder="Ex: Alelo, Sodexo..." />
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
                  <textarea rows={3} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Notas internas sobre esta tarefa..." />
                </label>
                <div className="composer-actions">
                  <button type="button" className="secondary btn-icon" onClick={refreshData}>
                    {iconRefresh}
                    <span>Recarregar</span>
                  </button>
                  <button type="submit" className="primary" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar tarefa"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {/* ── Início / Dashboard ─────────────────────────── */}
          {currentView === "Início" ? (
            <>
              <section className="dashboard-metrics">
                <MetricCard label="Backlog" value={metrics.open} color="teal" icon={iconClock} />
                <MetricCard label="Vencidas" value={metrics.overdue} color="red" icon={iconAlert} />
                <MetricCard label="Concluídas" value={metrics.completed} color="green" icon={iconCheck} />
                <MetricCard label="SLA no prazo" value={`${metrics.onTimeRate}%`} color="orange" icon={iconChevron} />
              </section>

              <section className="dashboard-grid">
                {/* Status breakdown */}
                <div className="dash-card">
                  <h3>Distribuição por status</h3>
                  <div className="status-bars">
                    {statuses.map(s => {
                      const count = metrics.byStatus[s] || 0;
                      const pct = metrics.total ? Math.round((count / metrics.total) * 100) : 0;
                      return (
                        <div key={s} className="status-bar-row">
                          <span className="status-bar-label">{s}</span>
                          <div className="status-bar-track">
                            <div className={`status-bar-fill ${normalize(s)}`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="status-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Overdue / Urgent */}
                <div className="dash-card">
                  <h3>Tarefas urgentes</h3>
                  {overdueTasks.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">{iconCheck}</span>
                      <p>Nenhuma tarefa vencida</p>
                    </div>
                  ) : (
                    <div className="urgent-list">
                      {overdueTasks.map(task => (
                        <button key={task.id} className="urgent-item" onClick={() => setSelectedTask(task)}>
                          <div className="urgent-item-main">
                            <strong>{task.title}</strong>
                            <small>{task.id} &middot; {task.owner}</small>
                          </div>
                          <span className="pill vencida">{formatDate(task.dueDate)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Activity Feed */}
                <div className="dash-card dash-card-wide">
                  <h3>Atividade recente</h3>
                  {activity.length === 0 ? (
                    <div className="empty-state">
                      <p>Nenhuma atividade registrada</p>
                    </div>
                  ) : (
                    <div className="activity-feed">
                      {activity.map((entry, i) => (
                        <div key={i} className="activity-item">
                          <div className="activity-dot"></div>
                          <span>{timeAgo(entry)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : null}

          {/* ── Kanban ─────────────────────────────────────── */}
          {currentView === "Kanban" ? (
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
                          <article key={task.id} className="task-card" onClick={() => setSelectedTask(task)}>
                            <div className="item-head">
                              <strong>{task.title}</strong>
                              {canSeeAll ? (
                                <button className="mini-danger" onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}>Excluir</button>
                              ) : null}
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

          {/* ── Tarefas (Table) ──────────────────────────────── */}
          {currentView === "Tarefas" ? (
            <section className="table-panel">
              <div className="table-head">
                <h3>Base principal de tarefas</h3>
                <div className="table-head-actions">
                  <button className="secondary btn-icon" onClick={refreshData}>
                    {iconRefresh}
                    <span>Recarregar</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="filter-bar">
                <span className="filter-label">{iconFilter} Filtros</span>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">Todos os status</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="">Todas as prioridades</option>
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}>
                  <option value="">Todos os responsáveis</option>
                  {uniqueOwners.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {hasActiveFilters ? (
                  <button className="ghost filter-clear" onClick={() => { setFilterStatus(""); setFilterPriority(""); setFilterOwner(""); }}>
                    Limpar filtros
                  </button>
                ) : null}
                <span className="filter-count">{filteredTasks.length} tarefa{filteredTasks.length !== 1 ? "s" : ""}</span>
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
                      <tr key={task.id} className={isOverdue(task) ? "overdue-row" : ""} onClick={() => setSelectedTask(task)} style={{ cursor: "pointer" }}>
                        <td><span className="task-id-pill">{task.id}</span></td>
                        <td className="td-title">{task.title}</td>
                        <td>
                          <select value={task.status} onClick={(e) => e.stopPropagation()} onChange={(event) => updateTask(task.id, "status", event.target.value)}>
                            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </td>
                        <td>
                          <select value={task.priority} onClick={(e) => e.stopPropagation()} onChange={(event) => updateTask(task.id, "priority", event.target.value)}>
                            {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                          </select>
                        </td>
                        <td>
                          <span className="owner-cell">
                            <span className="avatar-xs">{getInitials(task.owner)}</span>
                            {task.owner}
                          </span>
                        </td>
                        <td>{task.supplier}</td>
                        <td>{task.competence}</td>
                        <td className={isOverdue(task) ? "td-overdue" : ""}>{formatDate(task.dueDate)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {canSeeAll ? <button className="mini-danger" onClick={() => removeTask(task.id)}>Excluir</button> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {/* ── Rotinas ────────────────────────────────────── */}
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
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.rule}{item.sla ? ` • SLA: ${item.sla}` : ""}</small>
                        </div>
                        {canSeeAll ? <button className="mini-danger" onClick={() => removeRoutine(item.id)}>Excluir</button> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <SimplePanel title="Checklist padrão" items={seedChecklist} />
            </section>
          ) : null}

          {/* ── Documentos ─────────────────────────────────── */}
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
                          <div>
                            <strong>{document.title}</strong>
                            <small>{document.category}</small>
                          </div>
                          {canSeeAll ? <button className="mini-danger" onClick={() => removeDocument(document.id)}>Excluir</button> : null}
                        </div>
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

          {/* ── Indicadores ────────────────────────────────── */}
          {currentView === "Indicadores" ? (
            <>
              <section className="dashboard-metrics">
                <MetricCard label="Total de tarefas" value={metrics.total} color="teal" icon={iconClock} />
                <MetricCard label="Em aberto" value={metrics.open} color="orange" icon={iconAlert} />
                <MetricCard label="Concluídas" value={metrics.completed} color="green" icon={iconCheck} />
                <MetricCard label="SLA no prazo" value={`${metrics.onTimeRate}%`} color={metrics.onTimeRate >= 80 ? "green" : "red"} icon={iconChevron} />
              </section>

              <section className="dashboard-grid">
                <div className="dash-card">
                  <h3>Por status</h3>
                  <div className="status-bars">
                    {statuses.map(s => {
                      const count = metrics.byStatus[s] || 0;
                      const pct = metrics.total ? Math.round((count / metrics.total) * 100) : 0;
                      return (
                        <div key={s} className="status-bar-row">
                          <span className="status-bar-label">{s}</span>
                          <div className="status-bar-track">
                            <div className={`status-bar-fill ${normalize(s)}`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="status-bar-count">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="dash-card">
                  <h3>Por prioridade</h3>
                  <div className="status-bars">
                    {priorities.map(p => {
                      const count = metrics.byPriority[p] || 0;
                      const pct = metrics.total ? Math.round((count / metrics.total) * 100) : 0;
                      return (
                        <div key={p} className="status-bar-row">
                          <span className="status-bar-label">{p}</span>
                          <div className="status-bar-track">
                            <div className={`status-bar-fill ${normalize(p)}`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="status-bar-count">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="dash-card">
                  <h3>Vencidas</h3>
                  <div className="indicator-big-number">
                    <strong className={metrics.overdue > 0 ? "text-red" : "text-green"}>{metrics.overdue}</strong>
                    <span>tarefa{metrics.overdue !== 1 ? "s" : ""} vencida{metrics.overdue !== 1 ? "s" : ""}</span>
                  </div>
                  {overdueTasks.length > 0 && (
                    <div className="urgent-list" style={{ marginTop: 12 }}>
                      {overdueTasks.map(task => (
                        <button key={task.id} className="urgent-item" onClick={() => setSelectedTask(task)}>
                          <div className="urgent-item-main">
                            <strong>{task.title}</strong>
                            <small>{task.id} &middot; {task.owner}</small>
                          </div>
                          <span className="pill vencida">{formatDate(task.dueDate)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="dash-card">
                  <h3>Por responsável</h3>
                  <div className="status-bars">
                    {uniqueOwners.map(owner => {
                      const count = tasks.filter(t => t.owner === owner).length;
                      const pct = metrics.total ? Math.round((count / metrics.total) * 100) : 0;
                      return (
                        <div key={owner} className="status-bar-row">
                          <span className="status-bar-label">
                            <span className="avatar-xs">{getInitials(owner)}</span>
                            {owner}
                          </span>
                          <div className="status-bar-track">
                            <div className="status-bar-fill teal-fill" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="status-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {/* ── Configurações ──────────────────────────────── */}
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
                        <div className="member-info">
                          <span className="avatar-sm">{getInitials(member.full_name)}</span>
                          <div>
                            <strong>{member.full_name}</strong>
                            <small>{member.email}</small>
                          </div>
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

      {/* ── Task Detail Drawer ──────────────────────────── */}
      {selectedTask && (
        <div className="drawer-overlay" onClick={() => setSelectedTask(null)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <span className="task-id-pill">{selectedTask.id}</span>
                <h2>{selectedTask.title}</h2>
              </div>
              <button className="ghost btn-icon" onClick={() => setSelectedTask(null)}>{iconClose}</button>
            </div>

            <div className="drawer-body">
              <div className="drawer-field">
                <label>Status</label>
                <select value={selectedTask.status} onChange={(e) => updateTask(selectedTask.id, "status", e.target.value)}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="drawer-field">
                <label>Prioridade</label>
                <select value={selectedTask.priority} onChange={(e) => updateTask(selectedTask.id, "priority", e.target.value)}>
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="drawer-field">
                <label>Responsável</label>
                <div className="owner-cell">
                  <span className="avatar-sm">{getInitials(selectedTask.owner)}</span>
                  <span>{selectedTask.owner || "Não atribuído"}</span>
                </div>
              </div>
              <div className="drawer-row">
                <div className="drawer-field">
                  <label>Fornecedor</label>
                  <span>{selectedTask.supplier || "—"}</span>
                </div>
                <div className="drawer-field">
                  <label>Competência</label>
                  <span>{selectedTask.competence || "—"}</span>
                </div>
              </div>
              <div className="drawer-row">
                <div className="drawer-field">
                  <label>Vencimento</label>
                  <span className={isOverdue(selectedTask) ? "text-red" : ""}>
                    {formatDate(selectedTask.dueDate)}
                    {isOverdue(selectedTask) && " (vencida)"}
                  </span>
                </div>
                <div className="drawer-field">
                  <label>Categoria</label>
                  <span>{selectedTask.category || "—"}</span>
                </div>
              </div>
              {selectedTask.notes && (
                <div className="drawer-field">
                  <label>Observações</label>
                  <div className="drawer-notes">{selectedTask.notes}</div>
                </div>
              )}
            </div>

            {canSeeAll && (
              <div className="drawer-footer">
                <button className="mini-danger" onClick={() => removeTask(selectedTask.id)}>Excluir tarefa</button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── Gmail Import Modal ─────────────────────────── */}
      {showGmailModal && (
        <div className="confirm-overlay" onClick={() => setShowGmailModal(false)}>
          <div className="gmail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gmail-modal-head">
              <div>
                <h3>Importar do Gmail</h3>
                <small>Emails não lidos — selecione os que virarão tarefas</small>
              </div>
              <button className="ghost btn-icon" onClick={() => setShowGmailModal(false)}>{iconClose}</button>
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

function MetricCard({ label, value, color = "teal", icon }) {
  return (
    <article className={`metric-card metric-${color}`}>
      <div className="metric-header">
        <span>{label}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
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
