import "./globals.css";

export const metadata = { title: "AzSt" };

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <body>{children}</body>
    </html>
  );
}
