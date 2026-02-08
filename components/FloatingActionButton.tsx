
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FloatingActionButtonProps {
    onImport?: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onImport }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity max-w-md mx-auto" 
                    onClick={() => setIsOpen(false)}
                />
            )}
            <div className="fixed bottom-28 right-6 z-50 flex flex-col items-end gap-4">
                {isOpen && (
                    <div className="flex flex-col items-end gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className="flex items-center gap-4">
                            <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                                Importieren
                            </span>
                            <button 
                                onClick={() => { setIsOpen(false); onImport?.(); }}
                                className="size-12 rounded-2xl bg-white dark:bg-slate-800 text-primary shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 border border-slate-100 dark:border-slate-700"
                            >
                                <span className="material-symbols-outlined text-2xl">file_upload</span>
                            </button>
                        </div>
                    
                        <div className="flex items-center gap-4">
                            <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                                Scannen
                            </span>
                            <button 
                                onClick={() => { setIsOpen(false); navigate('/scan'); }}
                                className="size-12 rounded-2xl bg-white dark:bg-slate-800 text-primary shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 border border-slate-100 dark:border-slate-700"
                            >
                                <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                            </button>
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`size-16 rounded-3xl bg-primary text-white shadow-2xl flex items-center justify-center transition-all duration-500 hover:shadow-primary/40 active:scale-90 ${isOpen ? 'rotate-[135deg] bg-slate-900 dark:bg-white dark:text-slate-900' : ''}`}
                >
                    <span className="material-symbols-outlined text-3xl font-light">add</span>
                </button>
            </div>
        </>
    );
};

export default FloatingActionButton;
