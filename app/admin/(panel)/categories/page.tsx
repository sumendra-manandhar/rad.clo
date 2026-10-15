import { store } from "@/lib/server/store";
import CategoriesManager from "@/components/admin/CategoriesManager";

export default async function AdminCategories() {
  const [categories, designs] = await Promise.all([store.listCategories(), store.listDesigns()]);
  const counts = Object.fromEntries(categories.map((c) => [c.slug, designs.filter((d) => d.category === c.slug).length]));
  return <CategoriesManager categories={categories} counts={counts} />;
}
