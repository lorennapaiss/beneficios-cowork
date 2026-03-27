import { NextResponse } from "next/server";
import { getWorkspaceData } from "../../../lib/server-data";
import { createSupabaseServerClient } from "../../../lib/supabase-server";
import { hasSupabaseEnv } from "../../../lib/supabase";

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      const payload = await getWorkspaceData();
      return NextResponse.json(payload);
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const payload = await getWorkspaceData(user);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao carregar dados do workspace.", details: error.message },
      { status: 500 }
    );
  }
}
