import { getPricing } from "@/lib/server/store";
import PricingManager from "@/components/admin/PricingManager";

export default async function AdminPricing() {
  return <PricingManager pricing={await getPricing()} />;
}
