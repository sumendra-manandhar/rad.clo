import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart-context";
import ChatButtons from "@/components/ChatButtons";
import MobileTabBar from "@/components/MobileTabBar";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {/* Room for the phone tab bar */}
      <div className="min-h-screen flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatButtons />
        <MobileTabBar />
      </div>
    </CartProvider>
  );
}
