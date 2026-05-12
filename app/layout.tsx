import type { Metadata } from "next";

import { SiteFooter } from "@/app/_components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "JC Scents | Catálogos de Perfumes y Colognes",
  description:
    "Catálogos de fragancias para caballeros y damas con búsqueda y precios por tamaño.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
