import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";

// Dark (black-and-gold) is the default theme — :root already renders dark.
// This always sets an explicit theme before first paint so there's no
// flash on load, and so the toggle always has a real value to flip from:
// "light" only when the visitor previously picked the light theme.
const THEME_BOOTSTRAP = `
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("fk-theme") === "light" ? "light" : "dark";
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
  description:
    "Book your next cut at Fade Kings Barber Shop in Lynnwood. Browse the crew, book a chair, and earn rewards on every visit.",
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
