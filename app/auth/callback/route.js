import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase-server";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Adiciona ?auth=1 para o workspace marcar a aba como autenticada via sessionStorage
  const redirectPath = next === "/" ? "/?auth=1" : next;
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
