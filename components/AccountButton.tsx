"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { authClient } from "@/lib/supabase/browser";

type Who = { name: string; avatarUrl?: string } | null;

/** Signed-in customer state in the browser (null = signed out, undefined = still checking). */
export function useAccount() {
  const [who, setWho] = useState<Who | undefined>(undefined);
  useEffect(() => {
    const sb = authClient();
    if (!sb) return;
    const read = (u: { email?: string; user_metadata?: Record<string, unknown> } | null | undefined) =>
      setWho(
        u
          ? {
              name: String(u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email ?? ""),
              avatarUrl: (u.user_metadata?.avatar_url ?? u.user_metadata?.picture) as string | undefined,
            }
          : null
      );
    sb.auth.getSession().then(({ data }) => read(data.session?.user));
    const { data } = sb.auth.onAuthStateChange((_e, session) => read(session?.user));
    return () => data.subscription.unsubscribe();
  }, []);
  return who;
}

/** Header button: the customer's photo (→ My orders) or "Sign in". */
export default function AccountButton({ compact }: { compact?: boolean }) {
  const who = useAccount();
  if (!authClient()) return null;
  if (who) {
    return (
      <Link href="/account" aria-label="My orders" title="My orders" className="p-1.5 rounded-full hover:bg-ink/5">
        {who.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={who.avatarUrl} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-bold">
            {who.name[0]?.toUpperCase()}
          </span>
        )}
      </Link>
    );
  }
  return compact ? (
    <Link href="/login" aria-label="Sign in" className="p-2.5 rounded-full hover:bg-ink/5">
      <UserRound className="w-5 h-5" />
    </Link>
  ) : (
    <Link href="/login" className="hidden md:inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-ink/70 hover:text-ink hover:bg-ink/5">
      <UserRound className="w-4 h-4" /> Sign in
    </Link>
  );
}
