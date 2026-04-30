'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { Sidebar } from '@/components/aurora/Sidebar';
import { Navbar } from '@/components/aurora/Navbar';

export default function AppLayout({ children }) {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);
  const [shouldRenderSplash, setShouldRenderSplash] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Give Firebase time to resolve redirect result
      const timer = setTimeout(() => {
        if (!auth?.currentUser) {
          router.push('/login');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router, auth]);

  useEffect(() => {
    // Basic auth wait
    if (user && !loading) {
      // Small pulse animation wait, then fade out
      const fadeTimer = setTimeout(() => setShowSplash(false), 1200);
      // Remove from DOM completely after fade out completes
      const unmountTimer = setTimeout(() => setShouldRenderSplash(false), 1800);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [user, loading]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return <div className="min-h-screen aurora-bg" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen aurora-bg font-body text-aurora-text-mid flex">
      {shouldRenderSplash && (
        <div
          className="fixed inset-0 z-[100] bg-aurora-bg flex items-center justify-center transition-all duration-500 ease-in-out"
          style={{ opacity: showSplash ? 1 : 0, pointerEvents: showSplash ? 'auto' : 'none' }}
        >
          <div className="flex items-center gap-3 animate-pulse">
            <div className="px-6 py-4 rounded-3xl shadow-[0_0_80px_rgba(67,97,238,0.25)] bg-white/50 backdrop-blur-md border border-white/80">
              <span className="text-4xl font-extrabold font-heading bg-gradient-to-r from-aurora-blue to-aurora-violet bg-clip-text text-transparent tracking-tight">
                Papers.ai
              </span>
            </div>
          </div>
        </div>
      )}

      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col md:pl-64 w-full max-w-full transition-all duration-300 overflow-x-hidden">
        <Navbar user={user} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 w-full p-4 sm:p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
