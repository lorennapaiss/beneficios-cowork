import { NextResponse } from "next/server";
import { deleteTaskRecord, updateTaskField } from "../../../../lib/server-data";
import { hasSupabaseEnv } from "../../../../lib/supabase";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { getWorkspaceData } from "../../../../lib/server-data";

export async function PATCH(request, { params }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase não configurado para persistência compartilhada." },
      { status: 503 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const workspace = await getWorkspaceData(user);
    const { field, value } = await request.json();
    const updated = await updateTaskField(params.id, field, value, user, workspace.profile);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao atualizar tarefa.", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase não configurado para persistência compartilhada." },
      { status: 503 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const workspace = await getWorkspaceData(user);
    await deleteTaskRecord(params.id, user, workspace.profile);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao excluir tarefa.", details: error.message },
      { status: 500 }
    );
  }
}
