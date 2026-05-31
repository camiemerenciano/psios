import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PsiOS",
  description: "Sistema de gestão para psicólogos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
