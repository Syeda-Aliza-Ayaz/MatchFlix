import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, DM_Serif_Display } from "next/font/google";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import CustomCursor from "@/components/ui/CustomCursor";
import FilmGrain from "@/components/ui/FilmGrain";
import AuthGuard from "@/components/layout/AuthGuard";
import { MovieDetailProvider } from "@/context/MovieDetailContext";
import GlobalModalManager from "@/components/layout/GlobalModalManager";
import "./globals.css";

const bebasNeue = Bebas_Neue({ weight: "400", variable: "--font-bebas-neue", subsets: ["latin"] });
const dmSans    = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const dmSerif   = DM_Serif_Display({ weight: "400", style: ["normal","italic"], variable: "--font-dm-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Matchflix — Psychological Cinema Engine",
  description: "Eight dimensions. One truth. Matchflix maps your cinematic psyche.",
  icons: {
    icon: "/matchflix_logo_light.png",
  },
};

import FooterWrapper from "@/components/layout/FooterWrapper";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable} ${dmSerif.variable}`}>
      <body className="antialiased font-sans text-white bg-[#070709] overflow-x-hidden selection:bg-[#E8392A] selection:text-white">
        {/* Global ambience layers */}
        <FilmGrain />
        <CustomCursor />
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <MovieDetailProvider>
            <NavbarWrapper />
            <main className="flex-1 flex flex-col">
              <AuthGuard>
                {children}
              </AuthGuard>
            </main>
            <FooterWrapper />
            <GlobalModalManager />
          </MovieDetailProvider>
        </div>
      </body>
    </html>
  );
}
