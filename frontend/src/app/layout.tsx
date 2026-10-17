import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SegmentIQ | Customer Segmentation & RFM Analytics",
  description: "Upload your customers. Discover who they really are. Production-grade RFM and unsupervised ML clustering for e-commerce, marketing, and data teams.",
  keywords: ["Customer Segmentation", "RFM Analysis", "K-Means", "Clustering", "Machine Learning", "Customer Lifetime Value"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
