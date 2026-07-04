import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luneva Psy",
  description:
    "Психолог Лунева Александра Александровна. Гештальт-терапия, поддержка и путь к себе.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#fff8f6] text-[#332725] antialiased">
        <Header />

        <main>{children}</main>

        <Footer />
      </body>
    </html>
  );
}