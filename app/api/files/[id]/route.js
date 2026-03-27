import { NextResponse } from "next/server";
import { deleteFileRecord, getWorkspaceData } from "../../../../lib/server-data";
import { hasSupabaseEnv } from "../../../../lib/supabase";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";

export async function DELETE(request, { params }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
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
    await deleteFileRecord(params.id, user, workspace.profile);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao excluir arquivo.", details: error.message }, { status: 500 });
  }
}
