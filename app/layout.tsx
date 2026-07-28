import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";

// Light is the default theme (no attribute needed — :root already renders
// light). This only has to act when a *dark* preference was saved, applying
// it before first paint so there's no light-then-dark flash on load.
const THEME_BOOTSTRAP = `
try {
  if (localStorage.getItem("fk-theme") === "dark") {
    document.documentElement.dataset.theme = "dark";
  }
} catch (e) {}
`;

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
  title: "Fade Kings Barber Shop — Lynnwood",
  description: "Book your next cut at Fade Kings Barber Shop in Lynnwood. Browse the crew, book a chair, and earn rewards on every visit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="font-body bg-bg text-primary antialiased">
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
