import "./globals.css";

export const metadata = { title: "AzSt", icons: { icon: "/logov1.jpg" } };

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
