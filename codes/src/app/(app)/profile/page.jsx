'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { doc, collection, query, updateDoc } from 'firebase/firestore';
import { Card } from '@/components/aurora/Card';
import { Button } from '@/components/aurora/Button';
import { Badge } from '@/components/aurora/Badge';
import { Mail, Briefcase, MapPin, Share2, Edit3, Award, FileText, Zap, User as UserIcon, Loader2, Check, X, Image as ImageIcon } from 'lucide-react';

const CURATED_GRADIENTS = [
  { name: 'Aurora', value: 'linear-gradient(to right, #4361ee, #7209b7, #f72585)' },
  { name: 'Ocean', value: 'linear-gradient(to right, #0ea5e9, #2dd4bf)' },
  { name: 'Sunset', value: 'linear-gradient(to right, #f43f5e, #fb923c)' },
  { name: 'Forest', value: 'linear-gradient(to right, #059669, #10b981)' },
  { name: 'Midnight', value: 'linear-gradient(to right, #0f172a, #334155)' },
  { name: 'Royal', value: 'linear-gradient(to right, #6366f1, #a855f7)' },
];

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: profile, isLoading: profileLoading } = useDoc(userDocRef);

  const papersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/papers`));
  }, [user, firestore]);
  const { data: papers, isLoading: papersLoading } = useCollection(papersQuery);

  const [isEditingCover, setIsEditingCover] = useState(false);
  const [isSavingCover, setIsSavingCover] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const handleSaveCover = async (type, value) => {
    if (!user || !firestore) return;
    setIsSavingCover(true);
    try {
      await updateDoc(userDocRef, {
        coverType: type,
        coverValue: value,
      });
      setIsEditingCover(false);
    } catch (err) {
      console.error('Error saving cover:', err);
      alert('Failed to save cover. Please try again.');
    } finally {
      setIsSavingCover(false);
    }
  };

  const displayName = profile?.name || user?.displayName || 'Research Enthusiast';
  const email = user?.email || profile?.email || '';
  const institution = profile?.institution || 'Academic Institution';
  const location = profile?.location || 'Remote';
  const bio = profile?.bio || 'Passionate about advancing human knowledge through deep research and AI-driven insights.';
  const website = profile?.website || '';
  const handle = profile?.handle || user?.email?.split('@')[0] || 'researcher';

  const papersProcessed = papers?.length || 0;
  const kgCount = papers?.filter(p => p.knowledgeGraphId || p.knowledgeGraph).length || 0;
  const isPro = profile?.isPro || false;

  if (!user && !profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <UserIcon className="w-16 h-16 text-aurora-border mb-4" />
        <h2 className="text-2xl font-bold text-aurora-text-high">Please sign in to view your profile</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
       
       {/* Banner & Avatar Header */}
       <div className="w-full bg-white rounded-[32px] border border-aurora-border shadow-sm overflow-hidden mb-8">
          <div 
            className="h-48 md:h-56 w-full relative overflow-hidden transition-all duration-500"
            style={{ 
              background: profile?.coverType === 'image' 
                ? `url(${profile.coverValue}) center/cover no-repeat` 
                : (profile?.coverValue || 'linear-gradient(to right, #4361ee, #7209b7, #f72585)') 
            }}
          >
             {/* Diagonal glass overlay for texture */}
             <div className="absolute inset-0 bg-white/10 backdrop-blur-md transform -skew-y-12 scale-150 origin-top-left shadow-[inset_0_0_50px_rgba(255,255,255,0.2)] pointer-events-none" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
             
             {isEditingCover && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                   <div className="bg-white rounded-[32px] p-8 shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300 border border-aurora-border">
                      <div className="flex justify-between items-center mb-8">
                         <div className="flex flex-col">
                            <h3 className="text-2xl font-black font-heading text-aurora-text-high leading-tight">Customize Cover</h3>
                            <p className="text-sm text-aurora-text-low font-medium">Select a vibe or use a custom image.</p>
                         </div>
                         <button onClick={() => setIsEditingCover(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-aurora-text-low" />
                         </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-10">
                         {CURATED_GRADIENTS.map((g) => (
                           <button
                             key={g.name}
                             onClick={() => handleSaveCover('gradient', g.value)}
                             disabled={isSavingCover}
                             className={`group relative h-24 rounded-2xl overflow-hidden border-4 transition-all ${
                               profile?.coverValue === g.value ? 'border-aurora-blue scale-[1.02] shadow-lg' : 'border-transparent hover:border-aurora-blue/40'
                             }`}
                             style={{ background: g.value }}
                           >
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all">
                                 {profile?.coverValue === g.value && (
                                   <div className="bg-white rounded-full p-1.5 shadow-xl animate-in zoom-in">
                                      <Check className="w-5 h-5 text-aurora-blue" />
                                   </div>
                                 )}
                                 <span className="absolute bottom-2 left-3 text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">{g.name}</span>
                              </div>
                           </button>
                         ))}
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <ImageIcon className="w-4 h-4 text-aurora-blue" />
                            <label className="text-[11px] font-black uppercase tracking-widest text-aurora-text-low">External Image Link</label>
                         </div>
                         <div className="flex gap-3">
                            <div className="relative flex-1">
                               <input 
                                 type="text" 
                                 placeholder="Paste direct image URL..."
                                 value={customImageUrl}
                                 onChange={(e) => setCustomImageUrl(e.target.value)}
                                 className="w-full h-14 px-5 rounded-2xl bg-aurora-surface-1 border-2 border-aurora-border focus:border-aurora-blue outline-none text-sm font-bold transition-all placeholder:text-aurora-text-low shadow-inner"
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') handleSaveCover('image', customImageUrl);
                                 }}
                               />
                            </div>
                            <Button variant="gradient" className="h-14 px-8 rounded-2xl font-bold shadow-md" onClick={() => handleSaveCover('image', customImageUrl)}>
                               {isSavingCover ? <Loader2 className="animate-spin" /> : 'Apply'}
                            </Button>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditingCover(true)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white border-white/30 backdrop-blur-md font-bold rounded-[12px] z-10"
             >
                <Edit3 className="w-4 h-4 mr-2" /> Edit Cover
             </Button>
          </div>
          
          <div className="px-6 md:px-10 pb-8 relative pt-20 z-10">
             {/* Avatar */}
             <div className="absolute -top-16 md:-top-20 left-6 md:left-10 p-2 bg-white rounded-full">
               <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-aurora-blue to-aurora-cyan border-[6px] border-white shadow-xl overflow-hidden flex items-center justify-center relative">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-extrabold font-heading text-white tracking-widest leading-none">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="absolute inset-0 ring-1 ring-black/5 rounded-full" />
               </div>
             </div>
             
             {/* Actions */}
             <div className="absolute top-6 right-6 md:right-10 flex gap-3">
                <Button variant="outline" className="border-aurora-border bg-white rounded-[16px] shadow-sm font-bold"><Share2 className="w-4 h-4 mr-2 text-aurora-blue" /> Share</Button>
                <Link href="/settings">
                   <Button variant="gradient" className="rounded-[16px] font-bold shadow-md"><Edit3 className="w-4 h-4 mr-2" /> Edit Profile</Button>
                </Link>
             </div>

             {/* Info */}
             <div className="flex flex-col mt-4 md:mt-2">
               <div className="flex flex-col md:flex-row md:items-center gap-3">
                 <h1 className="text-3xl lg:text-4xl font-extrabold font-heading text-aurora-text-high tracking-tight">{displayName}</h1>
                 {isPro ? (
                   <Badge variant="success" className="bg-emerald-100 text-emerald-800 shadow-sm border-emerald-200 mt-2 md:mt-1 self-start md:self-auto py-1 px-3">
                      <Zap className="w-3.5 h-3.5 mr-1.5 fill-emerald-500" /> Pro Member
                   </Badge>
                 ) : (
                   <Badge variant="neutral" className="bg-slate-100 text-slate-600 shadow-sm border-slate-200 mt-2 md:mt-1 self-start md:self-auto py-1 px-3">
                      Free Plan
                   </Badge>
                 )}
               </div>
               
               <p className="text-lg text-aurora-text-mid font-medium mt-1 mb-6 flex items-center gap-2">
                 @{handle}
               </p>

               <div className="flex flex-wrap items-center gap-6 mt-2">
                 <div className="flex items-center gap-2 pt-1 pb-1 px-4 rounded-full bg-aurora-surface-1 border border-aurora-border text-aurora-text-mid text-sm font-semibold shadow-inner">
                   <Briefcase className="w-4 h-4 text-aurora-blue" /> {institution}
                 </div>
                 <div className="flex items-center gap-2 pt-1 pb-1 px-4 rounded-full bg-aurora-surface-1 border border-aurora-border text-aurora-text-mid text-sm font-semibold shadow-inner">
                   <MapPin className="w-4 h-4 text-aurora-rose" /> {location}
                 </div>
                 <div className="flex items-center gap-2 pt-1 pb-1 px-4 rounded-full bg-aurora-surface-1 border border-aurora-border text-aurora-text-mid text-sm font-semibold shadow-inner">
                   <Mail className="w-4 h-4 text-aurora-cyan" /> {email}
                 </div>
               </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* About & Badges Left Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <Card className="p-8 rounded-[32px] border-aurora-border shadow-sm">
               <div className="flex items-center gap-2 mb-6">
                 <div className="w-2 h-6 bg-aurora-blue rounded-full" />
                 <h3 className="text-xl font-bold font-heading text-aurora-text-high">About Me</h3>
               </div>
               <p className="text-aurora-text-mid text-base leading-relaxed font-medium mb-8">
                 {bio}
               </p>
               
               <div className="border-t border-aurora-border/50 pt-8">
                 <h3 className="text-xs font-extrabold uppercase tracking-wider text-aurora-text-low mb-5">Badges & Achievements</h3>
                 <div className="flex flex-wrap gap-3">
                   <Badge variant="neutral" className="bg-aurora-surface-1 shadow-sm text-aurora-blue py-2 px-4 border border-aurora-border rounded-[12px]"><Award className="w-4 h-4 mr-2" /> Early Adopter</Badge>
                   <Badge variant="neutral" className="bg-aurora-surface-1 shadow-sm text-aurora-violet py-2 px-4 border border-aurora-border rounded-[12px]"><FileText className="w-4 h-4 mr-2" /> 100+ Papers</Badge>
                 </div>
               </div>
            </Card>
          </div>

          {/* Activity Right Panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
             <Card className="p-8 md:p-10 rounded-[32px] border border-aurora-border bg-white overflow-hidden relative shadow-sm">
               <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                 <Zap size={300} strokeWidth={1} className="text-aurora-blue" />
               </div>
               
               <div className="flex items-center gap-3 mb-8 relative z-10">
                 <div className="p-2.5 rounded-[12px] bg-gradient-to-br from-aurora-surface-1 to-aurora-surface-2 text-aurora-blue border border-aurora-border shadow-inner">
                   <Zap className="w-5 h-5 fill-aurora-blue/20" />
                 </div>
                 <h3 className="text-2xl font-bold font-heading text-aurora-text-high">Platform Usage</h3>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                 <div className="bg-gradient-to-br from-aurora-surface-1 to-[#FbFcFF] p-8 rounded-[24px] border border-aurora-border/80 shadow-sm flex flex-col items-start hover:border-aurora-blue/40 hover:shadow-md transition-all duration-300">
                   <span className="text-5xl font-extrabold text-aurora-blue font-heading mb-3 tracking-tight">
                     {papersLoading ? <Loader2 className="animate-spin h-8 w-8" /> : papersProcessed}
                   </span>
                   <span className="text-[13px] font-bold uppercase tracking-widest text-aurora-text-low">Papers Processed</span>
                 </div>
                 
                 <div className="bg-gradient-to-br from-aurora-surface-1 to-[#FbFcFF] p-8 rounded-[24px] border border-aurora-border/80 shadow-sm flex flex-col items-start hover:border-aurora-violet/40 hover:shadow-md transition-all duration-300">
                   <span className="text-5xl font-extrabold text-aurora-violet font-heading mb-3 tracking-tight">
                     {papersLoading ? <Loader2 className="animate-spin h-8 w-8" /> : kgCount}
                   </span>
                   <span className="text-[13px] font-bold uppercase tracking-widest text-aurora-text-low">Knowledge Graphs</span>
                 </div>
                 
                 <div className="bg-white p-8 rounded-[24px] border border-aurora-border shadow-sm flex flex-col items-start hover:border-aurora-cyan/40 transition-colors sm:col-span-2">
                   <div className="flex items-center justify-between w-full mb-4">
                     <span className="text-sm font-bold uppercase tracking-widest text-aurora-text-low">Monthly Pro Quota</span>
                     <span className="text-sm font-bold text-aurora-cyan bg-aurora-cyan/10 px-3 py-1 rounded-full">72% Used</span>
                   </div>
                   <div className="w-full h-4 bg-aurora-surface-2 rounded-full overflow-hidden mt-1 shadow-inner">
                     <div className="h-full bg-gradient-to-r from-aurora-cyan via-aurora-blue to-aurora-violet rounded-full w-[72%] relative">
                        <div className="absolute inset-0 bg-white/20" style={{ backgroundSize: '1rem 1rem', backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)' }} />
                     </div>
                   </div>
                   <p className="text-xs font-semibold text-aurora-text-low mt-4">Resets in 11 days. Manage billing in Settings.</p>
                 </div>
               </div>
             </Card>
          </div>
       </div>

    </div>
  );
}
