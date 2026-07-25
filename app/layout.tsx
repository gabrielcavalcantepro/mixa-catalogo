import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Fraunces é a fonte de headline da marca (itálico incluso).
const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  style: ["italic", "normal"],
  axes: ["opsz", "SOFT", "WONK"],
});

// General Sans (Fontshare) ainda não foi fornecida — Inter é um substituto
// temporário só na variável de fonte. Trocar depois: baixar os arquivos da
// General Sans, servir via next/font/local e apontar --font-body para eles.
const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mixa — Plataforma de Catálogo",
  description: "Catálogo de peças e curadoria de looks Mixa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
