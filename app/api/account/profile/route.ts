import { store } from "@/lib/server/store";
import { currentUser } from "@/lib/server/user";

/** The signed-in customer and their saved checkout details (for prefilling). */
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ user: null });
  const profile = await store.getProfile(user.id).catch(() => null);
  return Response.json({
    user: { name: profile?.name || user.name, email: user.email, avatarUrl: user.avatarUrl },
    saved: { phone: profile?.phone ?? "", address: profile?.address ?? "" },
  });
}
