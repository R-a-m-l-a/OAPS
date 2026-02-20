import "./globals.css";
import { ProctorProvider } from "../context/ProctorContext";

export const metadata = {
  title: "OAPS Demo",
  description: "Online Assessment Proctoring System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ProctorProvider>
          {children}
        </ProctorProvider>
      </body>
    </html>
  );
}