import { NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/api-utils";
import { deleteTaskRecord, updateTaskField } from "../../../../lib/server-data";

export async function PATCH(request, { params }) {
  try {
    const { user, profile } = await getAuthContext();
    const { field, value } = await request.json();
    const updated = await updateTaskField(params.id, field, value, user, profile);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, profile } = await getAuthContext();
    await deleteTaskRecord(params.id, user, profile);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
