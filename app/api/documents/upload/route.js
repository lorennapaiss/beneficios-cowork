import { NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/api-utils";
import { uploadDocumentFile } from "../../../../lib/server-data";

export async function POST(request) {
  try {
    const { user, profile } = await getAuthContext();
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Envie apenas arquivos PDF." }, { status: 400 });
    }

    const created = await uploadDocumentFile(file, String(title || ""), user, profile);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
