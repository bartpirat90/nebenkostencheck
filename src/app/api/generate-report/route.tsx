import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAnalysis } from "@/lib/kv";
import { ReportDoc } from "@/lib/pdf/ReportDoc";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Fehlende ID." }, { status: 400 });

  const record = await getAnalysis(id);
  if (!record) return NextResponse.json({ error: "Ergebnis abgelaufen." }, { status: 404 });
  if (!record.paid) return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });

  const pdf = await renderToBuffer(<ReportDoc result={record.full} />);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Pruefbericht.pdf"`,
    },
  });
}
