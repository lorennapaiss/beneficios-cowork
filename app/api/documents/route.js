import { NextResponse } from "next/server";
import { getAuthContext } from "../../../lib/api-utils";
import { createDocumentRecord } from "../../../lib/server-data";

export async function POST(request) {
  try {
    const { user, profile } = await getAuthContext();
    const document = await request.json();
    const created = await createDocumentRecord(document, user, profile);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
