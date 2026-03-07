import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Persis İK",
  description: "Personel ve İnsan Kaynakları Yönetim Sistemi",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getTheme } = await import("@/actions/settings");
  const theme = await getTheme();

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logo.png?v=2" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const colorTheme = '${theme}' || localStorage.getItem('color-theme') || 'violet';
                const themes = {
                  violet: { primary: "0.55 0.22 280", ring: "0.55 0.22 280" },
                  blue: { primary: "0.55 0.20 240", ring: "0.55 0.20 240" },
                  green: { primary: "0.55 0.18 145", ring: "0.55 0.18 145" },
                  red: { primary: "0.60 0.22 25", ring: "0.60 0.22 25" },
                  orange: { primary: "0.65 0.20 50", ring: "0.65 0.20 50" },
                  pink: { primary: "0.60 0.22 340", ring: "0.60 0.22 340" },
                  teal: { primary: "0.55 0.18 180", ring: "0.55 0.18 180" },
                  amber: { primary: "0.70 0.18 70", ring: "0.70 0.18 70" },
                  indigo: { primary: "0.50 0.20 260", ring: "0.50 0.20 260" },
                  emerald: { primary: "0.60 0.18 160", ring: "0.60 0.18 160" },
                };
                const theme = themes[colorTheme] || themes.violet;
                document.documentElement.style.setProperty('--primary', 'oklch(' + theme.primary + ')', 'important');
                document.documentElement.style.setProperty('--ring', 'oklch(' + theme.ring + ')', 'important');
                document.documentElement.setAttribute('data-theme-color', colorTheme);
                localStorage.setItem('color-theme', colorTheme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
