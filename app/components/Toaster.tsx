"use client";

import "./globals.css";
import { Toaster as HotToaster } from "react-hot-toast";

export default function Toaster({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* 🔥 Toaster must be mounted here once */}
        <HotToaster
          position="top-left"
          reverseOrder={false}
          toastOptions={{
            style: {
              background: "#333",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
