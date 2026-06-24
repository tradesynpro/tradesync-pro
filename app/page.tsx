"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToApp = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      router.replace(session ? "/dashboard" : "/login");
    };

    void redirectToApp();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-8 py-10 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-400">TradeSync Pro</p>
        <h1 className="mt-3 text-3xl font-semibold">Preparing your workspace…</h1>
        <p className="mt-3 text-sm text-slate-400">You will be redirected to the right place shortly.</p>
      </div>
    </main>
  );
}