import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AccessibilityBar } from "@/components/accessibility-bar";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { BackToTop } from "@/components/back-to-top";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OptiSolver - Ferramenta de Otimização",
  description:
    "Ferramenta web para resolver problemas de otimização linear e discreta usando Dual Simplex e Branch and Bound",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme');
                if (theme === 'dark') document.documentElement.classList.add('dark');
                else if (theme === 'contrast') document.documentElement.classList.add('contrast');
                
                let color = localStorage.getItem('themeColor');
                if (color) document.documentElement.dataset.theme = color;
                
                let size = localStorage.getItem('fontSize');
                if (size) document.documentElement.style.fontSize = size + '%';
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        <AccessibilityBar />
        <Navigation />
        {children}
        <Analytics />
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
