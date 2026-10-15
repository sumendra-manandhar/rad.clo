"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      setError((await res.json()).error || "Login failed.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-ink">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-paper p-8">
        <div className="w-12 h-12 rounded-2xl bg-lime flex items-center justify-center">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="font-display text-3xl font-bold mt-6">Rad.Clo Admin</h1>
        <p className="text-sm text-muted mt-1">Sign in to manage designs and orders.</p>
        <input
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="w-full mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm focus:outline-none focus:border-ink"
        />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <button
          disabled={busy}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-ink text-paper font-semibold py-3.5 rounded-full hover:bg-flame transition-colors disabled:opacity-60"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Sign in
        </button>
      </form>
    </div>
  );
}
