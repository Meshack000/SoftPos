import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
});

export const metadata = {
  title: "SoftPOS",
  description: "Take mobile money payments with a tap.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={body.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
