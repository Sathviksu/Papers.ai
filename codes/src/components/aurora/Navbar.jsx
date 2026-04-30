'use client';

import { Search, Bell, Menu } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Navbar({ user, onMenuClick }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/library?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 h-16 shrink-0 glass-nav border-b border-[#D5D8F2] flex items-center justify-between px-4 sm:px-6 md:px-8">
      <div className="flex flex-1 items-center gap-2 sm:gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-aurora-text-mid hover:text-aurora-text-high"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex-1 max-w-[140px] sm:max-w-xs md:max-w-md relative transition-all duration-300">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aurora-text-low" />
          <Input 
            placeholder="Search..." 
            className="pl-9 h-10 bg-white/50 focus:bg-white border-aurora-border w-full text-sm md:pl-10 md:placeholder:text-ellipsis"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
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
