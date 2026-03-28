import { NextResponse } from "next/server";
import { getAuthContext } from "../../../lib/api-utils";
import { createTaskRecord } from "../../../lib/server-data";

export async function POST(request) {
  try {
    const { user, profile } = await getAuthContext();
    const task = await request.json();
    const created = await createTaskRecord(task, user, profile);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
