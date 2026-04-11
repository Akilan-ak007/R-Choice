import type { Metadata, Viewport } from "next";
import "./globals.css";

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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1E9BD7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
