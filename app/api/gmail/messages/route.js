import { NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/api-utils";

export async function POST(request) {
  try {
    await getAuthContext();
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: "Token do Google não encontrado. Faça login novamente." }, { status: 401 });
    }

    // Busca mensagens não lidas
    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=30",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      if (listRes.status === 401) {
        return NextResponse.json({ error: "Permissão do Gmail expirada. Faça logout e login novamente." }, { status: 401 });
      }
      return NextResponse.json({ error: "Falha ao acessar Gmail." }, { status: 502 });
    }

    const listData = await listRes.json();
    const messageIds = (listData.messages || []).slice(0, 20);

    if (!messageIds.length) {
      return NextResponse.json({ messages: [] });
    }

    // Busca detalhes de cada mensagem em paralelo
    const messages = await Promise.all(
      messageIds.map(async ({ id }) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!msgRes.ok) return null;
        const msg = await msgRes.json();

        const headers = msg.payload?.headers || [];
        const get = (name) => headers.find((h) => h.name === name)?.value || "";

        const from = get("From");
        const subject = get("Subject") || "(sem assunto)";
        const date = get("Date");
        const snippet = msg.snippet || "";

        // Extrai nome e email do remetente
        const fromMatch = from.match(/^(.*?)\s*<(.+?)>$/) || [null, from, from];
        const fromName = fromMatch[1]?.replace(/"/g, "").trim() || from;
        const fromEmail = fromMatch[2]?.trim() || from;

        return {
          id,
          subject,
          fromName,
          fromEmail,
          date: date ? new Date(date).toISOString().split("T")[0] : null,
          snippet,
        };
      })
    );

    return NextResponse.json({ messages: messages.filter(Boolean) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
