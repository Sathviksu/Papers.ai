import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UploadCloud, Library, GitCompare, Download, Settings, User, LogOut } from 'lucide-react';
import { useAuth, signOut } from '@/firebase';

export function Sidebar() {
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
        className={`flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium transition-all duration-200 group ${isActive ? 'bg-aurora-blue text-white shadow-md' : 'text-aurora-text-mid hover:bg-aurora-surface-2 hover:text-aurora-text-high'}`}
      >
        <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-aurora-text-low group-hover:text-aurora-blue transition-colors'}`} />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 glass-nav hidden md:flex flex-col border-r border-[#D5D8F2]">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-[#D5D8F2]/50">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-extrabold font-heading bg-gradient-to-r from-aurora-blue to-aurora-violet bg-clip-text text-transparent tracking-tight">Papers.ai</span>
        </Link>
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
  );
}
