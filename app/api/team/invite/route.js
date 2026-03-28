import { NextResponse } from "next/server";
import { getWorkspaceData, inviteMemberRecord } from "../../../../lib/server-data";
import { hasSupabaseEnv } from "../../../../lib/supabase";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";

export async function POST(request) {
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
    const member = await request.json();
    const origin = new URL(request.url).origin;
    const created = await inviteMemberRecord(member, user, workspace.profile, origin);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao criar acesso.", details: error.message },
      { status: 500 }
    );
  }
}
