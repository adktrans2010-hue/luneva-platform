import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luneva Platform",
  description: "Платформа нового поколения для управления сайтами",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <Header />

        <Container>
          <main className="py-10">{children}</main>
        </Container>

        <Footer />
      </body>
    </html>
  );
}