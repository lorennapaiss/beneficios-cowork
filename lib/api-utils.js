import { getProfile } from "./server-data";
import { hasSupabaseEnv } from "./supabase";
import { createSupabaseServerClient } from "./supabase-server";

export async function getAuthContext() {
  if (!hasSupabaseEnv()) {
    const err = new Error("Supabase não configurado.");
    err.status = 503;
    throw err;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const err = new Error("Não autenticado.");
    err.status = 401;
    throw err;
  }

  const profile = await getProfile(user);
  return { user, profile };
}
