"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseErrorMessage, supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

const stats = [
  { label: "Active traders", value: "5,040+" },
  { label: "Avg. monthly return", value: "18.2%" },
  { label: "Verified accounts", value: "99.9%" },
];

const tools = [
  { title: "Premium Economic Calendar", description: "Track high-impact events and trade with confidence." },
  { title: "Technical Views", description: "Access live setups and pattern-based analysis." },
  { title: "AI Market Buzz", description: "Get real-time market insights across major instruments." },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<null | { id: string; email?: string | null; user_metadata?: { full_name?: string | null } }>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as Profile);
      } else if (!error) {
        await supabase.from("profiles").upsert({
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || null,
          role: "user",
        }, { onConflict: "id" });
      }

      setLoading(false);
    };

    void fetchSession();
  }, [router]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const displayName = useMemo(() => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email || "Member";
  }, [profile, user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      return;
    }

    setUploading(true);
    setMessage("");

    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) {
      setMessage(getSupabaseErrorMessage(uploadError));
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const avatarUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      setMessage(getSupabaseErrorMessage(updateError));
      setUploading(false);
      return;
    }

    setProfile((current) => (current ? { ...current, avatar_url: avatarUrl } : current));
    setMessage("Profile image updated successfully.");
    setUploading(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-8 py-10 text-center text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Loading</p>
          <h1 className="mt-3 text-2xl font-semibold">Loading your dashboard…</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.2),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_100%)] px-4 py-8 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-400">TradeSync Pro</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Welcome back, {displayName}</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
                Your secure trading workspace is ready. Review market tools, manage your profile, and keep moving forward.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-sky-500">
                {uploading ? "Uploading…" : "Upload avatar"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
              <button
                onClick={handleSignOut}
                className="rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-xl font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold">Security overview</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>• Supabase Auth protects your active session.</li>
              <li>• Avatar uploads stay private and scoped to your account.</li>
              <li>• Protected routes keep anonymous visitors out.</li>
            </ul>
            {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Platform tools</p>
              <h2 className="mt-2 text-2xl font-semibold">Advanced trading tools for your next move</h2>
            </div>
            <a href="/register" className="text-sm font-medium text-sky-400 transition hover:text-sky-300">
              Explore more →
            </a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {tools.map((tool) => (
              <div key={tool.title} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <h3 className="text-lg font-semibold text-white">{tool.title}</h3>
                <p className="mt-3 text-sm text-slate-400">{tool.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
