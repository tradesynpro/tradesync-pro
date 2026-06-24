"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { getSupabaseErrorMessage, isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const redirectIfAuthenticated = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
      }
    };

    void redirectIfAuthenticated();
  }, [router]);

  const validate = () => {
    const nextErrors: { fullName?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: {
          full_name: form.fullName.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(getSupabaseErrorMessage(error));
      return;
    }

    if (data.user?.identities?.length === 0) {
      setMessage("This email is already registered. Please sign in instead.");
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: form.fullName.trim(),
        role: "user",
      }, { onConflict: "id" });
    }

    setMessage("Account created. Please check your inbox to verify your email.");
    router.replace("/verify-email");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">TradeSync Pro</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">Join the platform and start managing your work.</p>
        </div>

        {isSupabaseConfigured ? null : (
          <div className="mb-4 rounded-lg border border-amber-600/30 bg-amber-900/30 p-3 text-sm text-amber-200">
            Supabase credentials are missing. Add them to the environment file to enable sign-up.
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Jane Doe"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            />
            {errors.fullName ? <p className="mt-2 text-sm text-rose-400">{errors.fullName}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            {errors.email ? <p className="mt-2 text-sm text-rose-400">{errors.email}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
              {errors.password ? <p className="mt-2 text-sm text-rose-400">{errors.password}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              />
              {errors.confirmPassword ? <p className="mt-2 text-sm text-rose-400">{errors.confirmPassword}</p> : null}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-sky-400 hover:text-sky-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
