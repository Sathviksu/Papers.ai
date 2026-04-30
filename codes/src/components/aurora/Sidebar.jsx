import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UploadCloud, Library, GitCompare, Download, Settings, User, LogOut, X } from 'lucide-react';
import { useAuth, signOut } from '@/firebase';

export function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const auth = useAuth();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Let the (app)/layout handle the redirect to login
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Paper', href: '/upload', icon: UploadCloud },
    { name: 'Library', href: '/library', icon: Library },
    { name: 'Compare Papers', href: '/compare', icon: GitCompare },
    { name: 'Export', href: '/export', icon: Download },
  ];

  const bottomItems = [
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const NavLink = ({ item }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    return (
      <Link 
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium transition-all duration-200 group ${isActive ? 'bg-aurora-blue text-white shadow-md' : 'text-aurora-text-mid hover:bg-aurora-surface-2 hover:text-aurora-text-high'}`}
      >
        <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-aurora-text-low group-hover:text-aurora-blue transition-colors'}`} />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-nav flex flex-col border-r border-[#D5D8F2] transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-[#D5D8F2]/50">
          <Link href="/" className="flex items-center gap-2 group" onClick={onClose}>
            <span className="text-2xl font-extrabold font-heading bg-gradient-to-r from-aurora-blue to-aurora-violet bg-clip-text text-transparent tracking-tight">Papers.ai</span>
          </Link>
          <button 
            onClick={onClose}
            className="md:hidden text-aurora-text-mid hover:text-aurora-text-high p-1 rounded-md hover:bg-aurora-surface-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      
      <div className="flex-1 overflow-auto px-4 py-6 space-y-1">
        {navItems.map((item) => <NavLink key={item.name} item={item} />)}
      </div>
      
      <div className="p-4 space-y-1 mt-auto border-t border-[#D5D8F2]/50">
        {bottomItems.map((item) => <NavLink key={item.name} item={item} />)}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium transition-all duration-200 group text-aurora-text-mid hover:bg-red-50 hover:text-red-600 border border-transparent"
        >
          <LogOut className="h-5 w-5 text-aurora-text-low group-hover:text-red-500 transition-colors" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
