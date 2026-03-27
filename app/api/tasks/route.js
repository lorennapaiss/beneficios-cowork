import { NextResponse } from "next/server";
import { createTaskRecord, getWorkspaceData } from "../../../lib/server-data";
import { hasSupabaseEnv } from "../../../lib/supabase";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export async function POST(request) {
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
    const task = await request.json();
    const created = await createTaskRecord(task, user, workspace.profile);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao criar tarefa.", details: error.message },
      { status: 500 }
    );
  }
}
