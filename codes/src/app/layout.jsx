import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import AuthHandler from './auth-handler';

export const metadata = {
  title: 'Papers.ai',
  description: 'Intelligent Research Paper Understanding Engine',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="light bg-white">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link 
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700&f[]=satoshi@500,400&display=swap" 
          rel="stylesheet" 
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <AuthHandler>
            {children}
          </AuthHandler>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
