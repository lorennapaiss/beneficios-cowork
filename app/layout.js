import { Manrope, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const headingFont = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata = {
  title: "Benefícios Cowork",
  description: "Workspace operacional do time de Benefícios.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>{children}</body>
    </html>
  );
}
