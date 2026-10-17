import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/server/auth";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div className="min-h-screen lg:flex">
      <AdminNav />
      <main className="flex-1 min-w-0 px-4 sm:px-8 pt-8 pb-24 lg:pb-8">{children}</main>
    </div>
  );
}
