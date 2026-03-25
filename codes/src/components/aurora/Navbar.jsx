import { Search, Bell } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

export function Navbar({ user }) {
  return (
    <header className="sticky top-0 z-40 h-16 shrink-0 glass-nav border-b border-[#D5D8F2] flex items-center justify-between px-6 md:px-8">
      <div className="flex flex-1 items-center gap-4">
        <div className="w-full max-w-md relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aurora-text-low" />
          <Input placeholder="Search papers, claims, authors..." className="pl-10 h-10 bg-white/50 focus:bg-white border-aurora-border" />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-aurora-text-mid hover:text-aurora-text-high bg-white hover:bg-aurora-surface-1 shadow-sm rounded-full h-10 w-10 border border-aurora-border cursor-pointer">
          <Bell className="h-4 w-4" />
          <span className="absolute top-[8px] right-[10px] h-2 w-2 rounded-full bg-aurora-rose" />
        </Button>
        
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-aurora-blue to-aurora-cyan p-[2px] cursor-pointer shadow-sm hover:shadow-md transition-shadow">
          <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-aurora-text-high">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
