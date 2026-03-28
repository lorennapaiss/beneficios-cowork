import { NextResponse } from "next/server";
import { getWorkspaceData, updateMemberRoleRecord } from "../../../../lib/server-data";
import { hasSupabaseEnv } from "../../../../lib/supabase";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";

export async function PATCH(request, { params }) {
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
    const { role } = await request.json();
    const member = await updateMemberRoleRecord(decodeURIComponent(params.email), role, user, workspace.profile);
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao atualizar permissão.", details: error.message },
      { status: 500 }
    );
  }
}
