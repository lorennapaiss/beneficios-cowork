import { seedActivity, seedDocuments, seedMembers, seedTasks } from "./seed";
import { createSupabaseAdminClient, hasSupabaseEnv } from "./supabase";

function toTaskRow(task) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    owner: task.owner,
    owner_email: task.ownerEmail || null,
    supplier: task.supplier,
    competence: task.competence,
    due_date: task.dueDate,
    category: task.category,
    type: task.type,
    unit: task.unit,
    brand: task.brand,
    notes: task.notes,
    created_by_email: task.createdByEmail || null,
  };
}

function fromTaskRow(row) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    owner: row.owner,
    ownerEmail: row.owner_email,
    supplier: row.supplier,
    competence: row.competence,
    dueDate: row.due_date,
    category: row.category,
    type: row.type,
    unit: row.unit,
    brand: row.brand,
    notes: row.notes,
    createdByEmail: row.created_by_email,
  };
}

function fromDocumentRow(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    createdByEmail: row.created_by_email,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}

function fromFileRow(row) {
  return {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    filePath: row.file_path,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    createdByEmail: row.created_by_email,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}

function fromRoutineRow(row) {
  return {
    id: row.id,
    name: row.name,
    rule: row.recurrence_rule,
    sla: row.sla,
  };
}

async function ensureDocumentBucket(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  const exists = (buckets || []).some((bucket) => bucket.name === "beneficios-docs");
  if (exists) return;

  const { error: createError } = await supabase.storage.createBucket("beneficios-docs", {
    public: true,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ["application/pdf"],
  });

  if (createError) throw createError;
}

// Flag de módulo: evita o COUNT query após o primeiro carregamento bem-sucedido
let _seeded = false;

async function seedIfNeeded(supabase) {
  if (_seeded) return;

  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  if ((count || 0) > 0) {
    _seeded = true;
    return;
  }

  const taskRows = seedTasks.map(toTaskRow);
  const activityRows = seedActivity.map((message) => ({ message }));
  const memberRows = seedMembers.map((member) => ({
    email: member.email,
    full_name: member.full_name,
    role: member.role,
  }));
  const documentRows = seedDocuments.map((document) => ({
    title: document.title,
    category: document.category,
    content: document.content,
    created_by_email: "renata@beneficioscowork.com",
    created_by_name: "Renata",
  }));
  const routineRows = [
    { name: "Fechamento mensal - plano de saúde", recurrence_rule: "Todo início de competência", sla: "24 horas", created_by_email: "renata@beneficioscowork.com", created_by_name: "Renata" },
    { name: "Conferência de boleto - benefício flexível", recurrence_rule: "Semanal", sla: "8 horas", created_by_email: "renata@beneficioscowork.com", created_by_name: "Renata" },
    { name: "Revisão de elegibilidade por competência", recurrence_rule: "Mensal", sla: "16 horas", created_by_email: "renata@beneficioscowork.com", created_by_name: "Renata" },
  ];

  await ensureDocumentBucket(supabase);

  const { error: taskError } = await supabase.from("tasks").insert(taskRows);
  if (taskError) throw taskError;

  const { error: activityError } = await supabase.from("activity_logs").insert(activityRows);
  if (activityError) throw activityError;

  const { error: memberError } = await supabase.from("profiles").upsert(memberRows, { onConflict: "email" });
  if (memberError) throw memberError;

  const { error: documentError } = await supabase.from("knowledge_documents").insert(documentRows);
  if (documentError) throw documentError;

  const { error: routineError } = await supabase.from("routine_templates").insert(routineRows);
  if (routineError) throw routineError;

  _seeded = true;
}

export async function getProfile(user) {
  const supabase = createSupabaseAdminClient();

  // Fast path: apenas leitura (sem write lock) para usuários já cadastrados
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  // Primeiro login: cria o perfil
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

function buildTaskQuery(supabase, profile, user) {
  let query = supabase.from("tasks").select("*");

  if (!["supervisor", "admin"].includes(profile.role)) {
    query = query.or(
      `owner_email.eq.${user.email},created_by_email.eq.${user.email}`
    );
  }

  return query.order("due_date", { ascending: true });
}

export async function getWorkspaceData(user) {
  if (!hasSupabaseEnv()) {
    return {
      mode: "demo",
      tasks: seedTasks,
      activity: seedActivity,
      profile: {
        full_name: "Modo demo",
        email: "demo@local",
        role: "supervisor",
      },
      members: seedMembers,
      documents: seedDocuments.map((document, index) => ({ id: index + 1, ...document })),
      files: [],
      routines: [
        { id: 1, name: "Fechamento mensal - plano de saúde", rule: "Todo início de competência", sla: "24 horas" },
        { id: 2, name: "Conferência de boleto - benefício flexível", rule: "Semanal", sla: "8 horas" },
        { id: 3, name: "Revisão de elegibilidade por competência", rule: "Mensal", sla: "16 horas" },
      ],
    };
  }

  const supabase = createSupabaseAdminClient();
  const [profile] = await Promise.all([getProfile(user), seedIfNeeded(supabase)]);

  const [{ data: tasks, error: tasksError }, { data: activity, error: activityError }, { data: members, error: membersError }, { data: documents, error: documentsError }, { data: files, error: filesError }, { data: routines, error: routinesError }] =
    await Promise.all([
      buildTaskQuery(supabase, profile, user),
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("email, full_name, role").order("full_name", { ascending: true }),
      supabase.from("knowledge_documents").select("*").order("updated_at", { ascending: false }),
      supabase.from("document_files").select("*").order("updated_at", { ascending: false }),
      supabase.from("routine_templates").select("*").order("created_at", { ascending: true }),
    ]);

  if (tasksError) throw tasksError;
  if (activityError) throw activityError;
  if (membersError) throw membersError;
  if (documentsError) throw documentsError;
  if (filesError) throw filesError;
  if (routinesError) throw routinesError;

  return {
    mode: "supabase",
    tasks: (tasks || []).map(fromTaskRow),
    activity: (activity || []).map((entry) => entry.message),
    profile,
    members: members || [],
    documents: (documents || []).map(fromDocumentRow),
    files: (files || []).map(fromFileRow),
    routines: (routines || []).map(fromRoutineRow),
  };
}

export async function createTaskRecord(task, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();

  const payload = {
    ...task,
    ownerEmail: task.ownerEmail || currentUser.email,
    createdByEmail: currentUser.email,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(toTaskRow(payload))
    .select("*")
    .single();

  if (error) throw error;

  // Fire-and-forget: log de atividade não bloqueia a resposta
  supabase.from("activity_logs").insert({
    message: `Nova tarefa criada: ${payload.id} - ${payload.title}`,
  });

  return fromTaskRow(data);
}

export async function updateTaskField(id, field, value, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();
  const column = field === "dueDate" ? "due_date" : field;

  const { data: previous, error: previousError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (previousError) throw previousError;

  if (
    !["supervisor", "admin"].includes(currentProfile.role) &&
    previous.owner_email !== currentUser.email &&
    previous.created_by_email !== currentUser.email
  ) {
    throw new Error("Você não tem permissão para alterar esta tarefa.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ [column]: value })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  supabase.from("activity_logs").insert({
    message: `${id} teve ${field} alterado de ${previous[column]} para ${value}`,
  });

  return fromTaskRow(data);
}

export async function createDocumentRecord(document, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();

  if (!["supervisor", "admin"].includes(currentProfile.role)) {
    throw new Error("Apenas supervisão pode criar documentos.");
  }

  const payload = {
    title: document.title,
    category: document.category,
    content: document.content,
    created_by_email: currentUser.email,
    created_by_name: currentProfile.full_name,
  };

  const { data, error } = await supabase
    .from("knowledge_documents")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  supabase.from("activity_logs").insert({
    message: `Novo documento criado: ${document.title}`,
  });

  return fromDocumentRow(data);
}

export async function uploadDocumentFile(file, title, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();

  if (!["supervisor", "admin"].includes(currentProfile.role)) {
    throw new Error("Apenas supervisão pode enviar PDFs.");
  }

  await ensureDocumentBucket(supabase);

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-")}`;
  const filePath = `documents/${safeName}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("beneficios-docs")
    .upload(filePath, arrayBuffer, {
      contentType: file.type || "application/pdf",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from("beneficios-docs")
    .getPublicUrl(filePath);

  const payload = {
    title: title || file.name,
    file_name: file.name,
    file_path: filePath,
    file_url: publicUrlData.publicUrl,
    mime_type: file.type || "application/pdf",
    created_by_email: currentUser.email,
    created_by_name: currentProfile.full_name,
  };

  const { data, error } = await supabase
    .from("document_files")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  supabase.from("activity_logs").insert({
    message: `Novo PDF enviado: ${payload.title}`,
  });

  return fromFileRow(data);
}

function assertSupervisor(currentProfile) {
  if (!["supervisor", "admin"].includes(currentProfile.role)) {
    throw new Error("Apenas supervisão pode executar esta ação.");
  }
}

export async function createRoutineRecord(routine, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();
  assertSupervisor(currentProfile);

  const { data, error } = await supabase
    .from("routine_templates")
    .insert({
      name: routine.name,
      recurrence_rule: routine.rule,
      sla: routine.sla,
      created_by_email: currentUser.email,
      created_by_name: currentProfile.full_name,
    })
    .select("*")
    .single();

  if (error) throw error;

  supabase.from("activity_logs").insert({
    message: `Nova rotina criada: ${routine.name}`,
  });

  return fromRoutineRow(data);
}

export async function deleteTaskRecord(id, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();
  assertSupervisor(currentProfile);
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteDocumentRecord(id, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();
  assertSupervisor(currentProfile);
  const { error } = await supabase.from("knowledge_documents").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteRoutineRecord(id, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();
  assertSupervisor(currentProfile);
  const { error } = await supabase.from("routine_templates").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteFileRecord(id, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();
  assertSupervisor(currentProfile);

  const { data, error: fetchError } = await supabase
    .from("document_files")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const { error: storageError } = await supabase.storage
    .from("beneficios-docs")
    .remove([data.file_path]);

  if (storageError) throw storageError;

  const { error } = await supabase.from("document_files").delete().eq("id", id);
  if (error) throw error;
}

export async function inviteMemberRecord(member, currentUser, currentProfile, redirectOrigin) {
  const supabase = createSupabaseAdminClient();
  assertSupervisor(currentProfile);

  const payload = {
    email: member.email,
    full_name: member.full_name,
    role: member.role || "analyst",
  };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "email" })
    .select("email, full_name, role")
    .single();

  if (profileError) throw profileError;

  // Tenta enviar o email de convite, mas não bloqueia se falhar
  // (usuários com Google OAuth conseguem entrar sem o email)
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(member.email, {
    redirectTo: `${redirectOrigin}/login`,
    data: {
      full_name: member.full_name,
      role: member.role || "analyst",
    },
  });

  supabase.from("activity_logs").insert({
    message: `Novo acesso criado para ${member.full_name}${inviteError ? " (email não enviado)" : ""}`,
  });

  return { ...profile, emailSent: !inviteError };
}

export async function updateMemberRoleRecord(email, role, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();
  assertSupervisor(currentProfile);

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("email", email)
    .select("email, full_name, role")
    .single();

  if (error) throw error;

  supabase.from("activity_logs").insert({
    message: `Permissão atualizada para ${email}`,
  });

  return data;
}

export async function deleteMemberRecord(email, currentUser, currentProfile) {
  const supabase = createSupabaseAdminClient();
  assertSupervisor(currentProfile);

  if (email === currentUser.email) {
    throw new Error("Você não pode excluir a própria conta.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .single();

  if (profileError) throw profileError;

  if (profile.id) {
    const { error: authError } = await supabase.auth.admin.deleteUser(profile.id);
    if (authError) throw authError;
  }

  const { error } = await supabase.from("profiles").delete().eq("email", email);
  if (error) throw error;

  supabase.from("activity_logs").insert({
    message: `Acesso removido para ${email}`,
  });
}
