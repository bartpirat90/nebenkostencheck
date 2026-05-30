import { NextRequest, NextResponse } from "next/server";
import { getAnalysis } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Fehlende ID." }, { status: 400 });

  const record = await getAnalysis(id);
  if (!record) {
    return NextResponse.json({ error: "Ergebnis abgelaufen oder nicht gefunden." }, { status: 404 });
  }
  if (!record.paid) {
    return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });
  }
  return NextResponse.json({ ...record.full, _customerEmail: record.customerEmail ?? null });
}
