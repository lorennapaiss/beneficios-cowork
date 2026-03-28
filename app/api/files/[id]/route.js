import { NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/api-utils";
import { deleteFileRecord } from "../../../../lib/server-data";

export async function DELETE(request, { params }) {
  try {
    const { user, profile } = await getAuthContext();
    await deleteFileRecord(params.id, user, profile);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
