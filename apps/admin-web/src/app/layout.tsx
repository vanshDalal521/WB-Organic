"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider, useToast } from "@/components/Toast";
import { useEffect } from "react";
import { registerToastFn } from "@/lib/api";

const inter = Inter({ subsets: ["latin"] });

function ToastRegistrar() {
  const { addToast } = useToast();
  useEffect(() => {
    registerToastFn(addToast);
  }, [addToast]);
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <ToastRegistrar />
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
