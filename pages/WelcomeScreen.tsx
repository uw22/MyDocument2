
import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomeScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark relative overflow-hidden">
             {/* Dynamic Background */}
             <div className="absolute top-0 left-0 w-full h-[60%] mesh-gradient opacity-20 dark:opacity-30 blur-3xl z-0"></div>
             <div className="absolute -top-20 -right-20 size-64 bg-primary/20 rounded-full blur-3xl"></div>
             
             <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="size-28 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0 duration-500 border border-white/50 dark:border-slate-700/50">
                    <span className="material-symbols-outlined text-primary text-6xl font-light">document_scanner</span>
                </div>
                
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                    DocuScan<span className="text-primary">.pro</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-xs mx-auto font-medium">
                    Digitalisieren Sie Ihren Alltag mit intelligenter KI-Erkennung.
                </p>
             </div>

             <div className="relative z-10 p-8 pb-16 w-full max-w-md mx-auto">
                <button 
                    onClick={() => navigate('/', { replace: true })}
                    className="w-full py-5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-glow transition-all flex items-center justify-center gap-3 active:scale-95 group"
                >
                    Loslegen
                    <span className="material-symbols-outlined font-bold group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
                <div className="mt-8 flex justify-center gap-6 text-slate-400">
                    <div className="flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-sm">security</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sicher</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-sm">bolt</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Schnell</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">KI-Power</span>
                    </div>
                </div>
             </div>
        </div>
    );
};

export default WelcomeScreen;
