
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabItem } from '../types';

const BottomNav: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const tabs: TabItem[] = [
        { path: '/', label: 'Ablage', icon: 'grid_view' },
        { path: '/categories', label: 'Ordner', icon: 'folder' },
        { path: '/secure', label: 'Tresor', icon: 'shield_lock' },
        { path: '/settings', label: 'Profil', icon: 'person' }
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
            <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-[2rem] shadow-2xl px-2 py-2 flex justify-between items-center">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <button 
                            key={tab.label}
                            onClick={() => navigate(tab.path)}
                            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 rounded-2xl transition-all duration-300 relative group active:scale-90 ${
                                isActive 
                                ? 'text-primary' 
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                        >
                            {/* Background Highlight for Active Tab */}
                            {isActive && (
                                <div className="absolute inset-x-1 inset-y-1 bg-primary/10 dark:bg-primary/20 rounded-[1.25rem] animate-in fade-in zoom-in-95 duration-300"></div>
                            )}
                            
                            <div className="relative">
                                <span className={`material-symbols-outlined text-[26px] transition-all duration-300 ${
                                    isActive ? 'active-tab-icon' : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-100'
                                }`}>
                                    {tab.icon}
                                </span>
                                
                                {isActive && (
                                    <div className="absolute -top-0.5 -right-0.5 size-1.5 bg-primary rounded-full border border-white dark:border-[#1e293b]"></div>
                                )}
                            </div>
                            
                            <span className={`text-[10px] tracking-tight font-bold transition-all duration-300 ${
                                isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 group-hover:opacity-50'
                            }`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
