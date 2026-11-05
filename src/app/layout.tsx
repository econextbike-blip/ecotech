import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Eco Tech - Sistema de Gestão",
  description: "Sistema de gestão de vendas e serviços - E-Tech Bike Elétrica",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        <Sidebar />
        <main className="ml-64 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
