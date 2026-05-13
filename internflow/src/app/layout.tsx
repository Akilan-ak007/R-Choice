import type { Metadata, Viewport } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["300", "400", "500", "600", "700"] });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading", weight: ["400", "500", "600", "700", "800"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "R-Choice | Rathinam College Internship & Placement Portal",
  description:
    "R-Choice is the official internship and placement management portal for Rathinam College. Build your professional profile, apply for opportunities, and track your placement journey.",
  keywords: [
    "Rathinam College",
    "Internship Portal",
    "Placement Portal",
    "R-Choice",
    "Student Profile",
    "ATS Resume",
  ],
  authors: [{ name: "Rathinam College" }],
  openGraph: {
    title: "R-Choice | Rathinam College",
    description: "Your gateway to internships and placements at Rathinam College",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E9BD7",
};

import { Providers } from "@/components/Providers";
import { auth } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `
          }}
        />
        <Providers session={session}>
          {children}
        </Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-body)",
              borderRadius: "var(--border-radius-md)",
              boxShadow: "var(--shadow-lg)",
            },
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}

