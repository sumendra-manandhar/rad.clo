import { store } from "@/lib/server/store";
import DesignsManager from "@/components/admin/DesignsManager";

export default async function AdminDesigns() {
  const [designs, categories] = await Promise.all([store.listDesigns(), store.listCategories()]);
  return <DesignsManager designs={designs} categories={categories} />;
}
