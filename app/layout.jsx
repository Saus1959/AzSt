import './globals.css';

export const metadata = { title: 'Team Dashboard' };

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <body>{children}</body>
    </html>
  );
}
