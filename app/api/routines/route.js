import { NextResponse } from "next/server";
import { createRoutineRecord, getWorkspaceData } from "../../../lib/server-data";
import { hasSupabaseEnv } from "../../../lib/supabase";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export async function POST(request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase não configurado para rotinas compartilhadas." },
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
    const routine = await request.json();
    const created = await createRoutineRecord(routine, user, workspace.profile);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao criar rotina.", details: error.message },
      { status: 500 }
    );
  }
}
