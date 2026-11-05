import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "E-Tech Bike Elétrica - Sistema de Gestão",
  description: "Sistema de gestão de vendas e serviços - E-Tech Bike Elétrica",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
