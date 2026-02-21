import "./globals.css";

// TODO: Implement root layout with metadata per SRS

export const metadata = {
  title: "OAPS",
  description: "Online Assessment Proctoring System",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
