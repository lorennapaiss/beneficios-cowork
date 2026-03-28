import { NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/api-utils";
import { inviteMemberRecord } from "../../../../lib/server-data";

export async function POST(request) {
  try {
    const { user, profile } = await getAuthContext();
    const member = await request.json();
    const origin = new URL(request.url).origin;
    const created = await inviteMemberRecord(member, user, profile, origin);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
