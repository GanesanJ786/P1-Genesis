import { LenisProvider } from "@/components/providers/LenisProvider";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LenisProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </LenisProvider>
  );
}
