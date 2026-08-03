"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { useAdminAuth, isSupabaseConfigured } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const { signIn, session } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.replace("/admin/orders");
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const err = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace("/admin/orders");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 font-poppins px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">Admin Login</h1>
          <p className="text-sm text-neutral-500 mt-1">Rad.Clo order & design management</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Supabase isn't configured yet — add your project credentials to
            <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded">.env.local</code>
            and create an admin user, then this page will work. See SETUP.md.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-neutral-200 rounded-xl p-6">
          <div>
            <label className="text-xs font-medium text-neutral-600">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-neutral-900"
              placeholder="admin@radclo.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-neutral-900"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white text-sm font-semibold py-3 rounded-full hover:bg-neutral-700 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
