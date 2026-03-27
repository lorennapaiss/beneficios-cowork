import { NextResponse } from "next/server";
import { getWorkspaceData, uploadDocumentFile } from "../../../../lib/server-data";
import { hasSupabaseEnv } from "../../../../lib/supabase";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";

export async function POST(request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase não configurado para upload de PDFs." },
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
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Envie apenas arquivos PDF." }, { status: 400 });
    }

    const created = await uploadDocumentFile(file, String(title || ""), user, workspace.profile);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao enviar PDF.", details: error.message },
      { status: 500 }
    );
  }
}
