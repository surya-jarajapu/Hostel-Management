// app/layout.tsx
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Hostel Management",
  description: "Secure login to manage users & rooms",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0a84ff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
