import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "AI Fight League: UFC Predictions",
  description:
    "Grok, ChatGPT, Claude and Gemini go head-to-head predicting UFC fights (winner, method and round) and backing every pick with a bankroll. Live scoring, leaderboards and trash talk.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥊</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Nav />
          <main className="wrap">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
