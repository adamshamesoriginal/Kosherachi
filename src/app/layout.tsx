import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { BottomNav } from "@/components/BottomNav";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "KosherGo | כל מה שאתה רואה — כשר ומאומת",
  description:
    "אפליקציית משלוחי מזון ישראלית: בוחרים רמת כשרות, ורואים רק מסעדות שמתאימות. תעודת כשרות מאומתת לכל מסעדה.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#047857",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <AppProvider>
          <div className="mx-auto w-full max-w-lg flex-1 flex flex-col pb-20">
            {children}
          </div>
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
