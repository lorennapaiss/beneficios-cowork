import { NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/api-utils";
import { deleteMemberRecord, updateMemberRoleRecord } from "../../../../lib/server-data";

export async function PATCH(request, { params }) {
  try {
    const { user, profile } = await getAuthContext();
    const { role } = await request.json();
    const member = await updateMemberRoleRecord(decodeURIComponent(params.email), role, user, profile);
    return NextResponse.json(member);
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
    await deleteMemberRecord(decodeURIComponent(params.email), user, profile);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
