'use client';
import { useState } from 'react';
import { Button } from '@/components/aurora/Button';
import { Input } from '@/components/aurora/Input';
import { Card, CardTitle } from '@/components/aurora/Card';
import { User, Bell, Key, CreditCard, Shield, Save } from 'lucide-react';

const Toggle = ({ active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-11 h-6 rounded-full transition-colors relative shadow-inner ${active ? 'bg-aurora-blue' : 'bg-aurora-border'}`}
  >
    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-sm ${active ? 'translate-x-[22px]' : 'translate-x-[4px]'}`} />
  </button>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const [toggles, setToggles] = useState({
    emailNotifs: true,
    weeklyDigest: false,
    autoExtract: true,
    publicProfile: false
  });

  const tabs = [
    { id: 'account', label: 'Account Details', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl lg:text-4xl font-extrabold font-heading text-aurora-text-high tracking-tight">
          Settings
        </h1>
        <p className="text-aurora-text-mid font-medium mb-4">Manage your account preferences, API integrations, and billing.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-[16px] font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-aurora-blue shadow-sm border border-aurora-border' 
                  : 'text-aurora-text-mid hover:text-aurora-text-high hover:bg-white border border-transparent hover:border-aurora-border/50'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-aurora-blue' : 'text-aurora-text-low'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Card className="p-8 rounded-[32px] bg-white border-aurora-border shadow-sm min-h-[500px]">
             {activeTab === 'account' && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <CardTitle className="text-2xl mb-6 font-heading font-bold">Account Details</CardTitle>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2 relative">
                      <label className="text-sm font-bold text-aurora-text-high ml-1">First Name</label>
                      <Input defaultValue="Dr. John" className="bg-aurora-surface-1 border-aurora-border h-[52px] shadow-inner focus-visible:ring-aurora-blue/30" />
                    </div>
                    <div className="flex flex-col gap-2 relative">
                      <label className="text-sm font-bold text-aurora-text-high ml-1">Last Name</label>
                      <Input defaultValue="Doe" className="bg-aurora-surface-1 border-aurora-border h-[52px] shadow-inner focus-visible:ring-aurora-blue/30" />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2 relative">
                      <label className="text-sm font-bold text-aurora-text-high ml-1 flex items-center justify-between">
                         Email Address <span className="text-xs text-aurora-blue bg-aurora-blue/10 px-2 py-0.5 rounded-md font-bold">Verified</span>
                      </label>
                      <Input defaultValue="researcher@university.edu" className="bg-aurora-surface-2 border-aurora-border h-[52px] text-aurora-text-mid cursor-not-allowed" disabled />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2 relative">
                      <label className="text-sm font-bold text-aurora-text-high ml-1">Institution</label>
                      <Input defaultValue="Stanford University" className="bg-aurora-surface-1 border-aurora-border h-[52px] shadow-inner focus-visible:ring-aurora-blue/30" />
                    </div>
                 </div>
                 <div className="mt-10 pt-8 border-t border-aurora-border/50 flex justify-end">
                   <Button variant="gradient" className="h-14 px-10 rounded-full font-bold shadow-md hover:shadow-lg transition-all active:scale-95 text-base">
                     <Save className="w-5 h-5 mr-2" /> Save Changes
                   </Button>
                 </div>
               </div>
             )}

             {activeTab === 'preferences' && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <CardTitle className="text-2xl mb-8 font-heading font-bold">System Preferences</CardTitle>
                 
                 <h3 className="text-xs font-extrabold uppercase tracking-wider text-aurora-text-low mb-4 pl-4 border-l-[3px] border-aurora-blue">Notifications</h3>
                 <div className="space-y-4 mb-12">
                   <div className="flex items-center justify-between p-5 rounded-[20px] border border-aurora-border hover:border-aurora-blue/30 transition-colors bg-white shadow-sm">
                     <div className="flex flex-col">
                       <span className="font-bold text-aurora-text-high">Email Notifications</span>
                       <span className="text-sm font-medium text-aurora-text-mid mt-0.5">Receive updates when core document processing completes.</span>
                     </div>
                     <Toggle active={toggles.emailNotifs} onClick={() => setToggles({...toggles, emailNotifs: !toggles.emailNotifs})} />
                   </div>
                   <div className="flex items-center justify-between p-5 rounded-[20px] border border-aurora-border hover:border-aurora-violet/30 transition-colors bg-white shadow-sm">
                     <div className="flex flex-col">
                       <span className="font-bold text-aurora-text-high">Weekly Digest</span>
                       <span className="text-sm font-medium text-aurora-text-mid mt-0.5">Get a specialized summary of your research activity every Monday.</span>
                     </div>
                     <Toggle active={toggles.weeklyDigest} onClick={() => setToggles({...toggles, weeklyDigest: !toggles.weeklyDigest})} />
                   </div>
                 </div>

                 <h3 className="text-xs font-extrabold uppercase tracking-wider text-aurora-text-low mb-4 pl-4 border-l-[3px] border-aurora-cyan">Processing Engine</h3>
                 <div className="space-y-4">
                   <div className="flex items-center justify-between p-5 rounded-[20px] border border-aurora-border hover:border-aurora-cyan/30 transition-colors bg-white shadow-sm">
                     <div className="flex flex-col">
                       <span className="font-bold text-aurora-text-high">Auto-Extract Equations (Experimental)</span>
                       <span className="text-sm font-medium text-aurora-text-mid mt-0.5">Use optical character recognition to systematically rip LaTeX formulas on upload.</span>
                     </div>
                     <Toggle active={toggles.autoExtract} onClick={() => setToggles({...toggles, autoExtract: !toggles.autoExtract})} />
                   </div>
                 </div>
               </div>
             )}

             {/* Fill other tabs minimally or state "Coming soon" */}
             {(activeTab === 'api' || activeTab === 'billing') && (
                <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center text-center h-[300px]">
                   <Shield className="w-16 h-16 text-aurora-border mb-6" />
                   <h3 className="text-2xl font-bold font-heading text-aurora-text-high mb-2">Coming Soon</h3>
                   <p className="text-aurora-text-mid font-medium max-w-sm">This section is currently under development and will be available to early access members next release.</p>
                </div>
             )}
          </Card>
        </div>
      </div>
    </div>
  );
}
