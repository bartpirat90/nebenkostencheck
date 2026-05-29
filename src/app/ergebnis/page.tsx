"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResultView from "@/components/ResultView";
import { AnalysisResult } from "@/types";

function ErgebnisInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("Keine Ergebnis-ID gefunden.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    // Webhook kann minimal verzögert sein → bis zu 5x mit kurzer Pause versuchen
    (async () => {
      for (let i = 0; i < 5; i++) {
        const res = await fetch(`/api/result?id=${id}`);
        if (res.ok) {
          if (!cancelled) {
            setResult(await res.json());
            setLoading(false);
          }
          return;
        }
        if (res.status !== 402) {
          if (!cancelled) {
            setError("Ergebnis nicht gefunden oder abgelaufen.");
            setLoading(false);
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) {
        setError("Freischaltung wird noch verarbeitet. Bitte Seite in einem Moment neu laden.");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-center text-[#94A3B8] py-20">Dein Bericht wird geladen…</p>;
  if (error || !result) return <p className="text-center text-[#FCA5A5] py-20">{error}</p>;
  return <ResultView result={result} onReset={() => (window.location.href = "/")} />;
}

export default function ErgebnisPage() {
  return (
    <main className="min-h-screen bg-[#0F172A]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Suspense fallback={<p className="text-center text-[#94A3B8] py-20">Laden…</p>}>
          <ErgebnisInner />
        </Suspense>
      </div>
    </main>
  );
}
