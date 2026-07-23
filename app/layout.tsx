import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";

const archivo = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Fade House — Barber Booking",
  description: "Book your next cut. Barbers manage requests, schedule, and rewards.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body className="font-body bg-bg text-primary antialiased">{children}</body>
    </html>
  );
}
