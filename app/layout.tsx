import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DealerOps", template: "%s · DealerOps" },
  description: "Dealership operating system: stock, listings, leads, and reporting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
