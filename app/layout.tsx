import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Perspective Dieline Generator",
    template: "%s · Perspective Dieline Generator",
  },
  description: "Turn a perspective package photograph into a calibrated, editable, 1:1 packaging dieline without uploading private artwork.",
  applicationName: "Perspective Dieline Generator",
  keywords: ["packaging dieline", "carton", "SVG", "computer vision", "package design"],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    title: "Perspective Dieline Generator",
    description: "Perspective image analysis, confirmed measurements, and editable 1:1 vector dielines.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Perspective package image transformed into an editable dieline" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Perspective Dieline Generator",
    description: "Perspective image analysis, confirmed measurements, and editable 1:1 vector dielines.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
