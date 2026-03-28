import { NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/api-utils";
import { createTaskRecord } from "../../../../lib/server-data";

export async function POST(request) {
  try {
    const { user, profile } = await getAuthContext();
    const { messages } = await request.json();

    if (!messages?.length) {
      return NextResponse.json({ error: "Nenhuma mensagem selecionada." }, { status: 400 });
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const created = await Promise.all(
      messages.map((msg) => {
        const task = {
          id: null, // gerado pelo nextId no frontend, mas aqui o backend cria direto
          title: msg.subject,
          status: "Não iniciada",
          priority: "Média",
          owner: profile.full_name,
          ownerEmail: profile.email,
          supplier: msg.fromName || msg.fromEmail,
          competence: `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`,
          dueDate: today,
          category: "Email",
          type: "Avulsa",
          unit: "",
          brand: "",
          notes: `De: ${msg.fromEmail}\n\n${msg.snippet}`,
        };
        return createTaskRecord(task, user, profile);
      })
    );

    return NextResponse.json({ tasks: created, count: created.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
