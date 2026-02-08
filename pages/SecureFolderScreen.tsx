import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { DOCUMENTS as INITIAL_DOCUMENTS, getFormatClass } from '../constants';
import { DocumentItem } from '../types';

const SecureFolderScreen: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'SETUP' | 'LOCKED' | 'OPEN'>('LOCKED');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [documents, setDocuments] = useState<DocumentItem[]>([]);

    useEffect(() => {
        const storedPin = localStorage.getItem('docuscan_pin');
        if (!storedPin) {
            setMode('SETUP');
        }

        const loadDocs = () => {
            const saved = localStorage.getItem('docuscan_documents');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setDocuments(parsed.filter((d: DocumentItem) => d.isSecure));
                } catch (e) {
                    console.error(e);
                }
            }
        };
        loadDocs();
        window.addEventListener('docuscan-update', loadDocs);
        return () => window.removeEventListener('docuscan-update', loadDocs);
    }, []);

    const handleNumberClick = (num: number) => {
        setError('');
        if (mode === 'SETUP') {
            if (pin.length < 4) {
                setPin(prev => prev + num);
            } else if (confirmPin.length < 4) {
                setConfirmPin(prev => prev + num);
            }
        } else if (mode === 'LOCKED') {
            if (pin.length < 4) {
                const newPin = pin + num;
                setPin(newPin);
                if (newPin.length === 4) {
                    // Check PIN immediately
                    const storedPin = localStorage.getItem('docuscan_pin');
                    if (newPin === storedPin) {
                        setMode('OPEN');
                        setPin('');
                    } else {
                        setError('Falscher PIN');
                        setTimeout(() => setPin(''), 300);
                    }
                }
            }
        }
    };

    const handleBackspace = () => {
        setError('');
        if (mode === 'SETUP') {
            if (confirmPin.length > 0) {
                setConfirmPin(prev => prev.slice(0, -1));
            } else {
                setPin(prev => prev.slice(0, -1));
            }
        } else {
            setPin(prev => prev.slice(0, -1));
        }
    };

    useEffect(() => {
        if (mode === 'SETUP' && pin.length === 4 && confirmPin.length === 4) {
            if (pin === confirmPin) {
                localStorage.setItem('docuscan_pin', pin);
                setMode('OPEN');
                setPin('');
                setConfirmPin('');
            } else {
                setError('PINs stimmen nicht überein');
                setConfirmPin('');
                setPin('');
            }
        }
    }, [pin, confirmPin, mode]);

    const RenderKeypad = () => (
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] mx-auto mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    className="size-16 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-2xl font-medium active:bg-slate-300 dark:active:bg-slate-700 transition-colors mx-auto flex items-center justify-center"
                >
                    {num}
                </button>
            ))}
            <div className="size-16"></div>
            <button
                onClick={() => handleNumberClick(0)}
                className="size-16 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-2xl font-medium active:bg-slate-300 dark:active:bg-slate-700 transition-colors mx-auto flex items-center justify-center"
            >
                0
            </button>
            <button
                onClick={handleBackspace}
                className="size-16 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mx-auto flex items-center justify-center"
            >
                <span className="material-symbols-outlined text-2xl">backspace</span>
            </button>
        </div>
    );

    if (mode === 'OPEN') {
        return (
            <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-background-dark">
                <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                    <div className="flex items-center p-4 pb-2 justify-between">
                        <div className="flex size-10 shrink-0 items-center justify-start" onClick={() => navigate(-1)}>
                            <span className="material-symbols-outlined text-2xl cursor-pointer">chevron_left</span>
                        </div>
                        <h2 className="text-lg font-bold flex-1 text-center flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500">lock</span>
                            Tresor
                        </h2>
                        <button onClick={() => setMode('LOCKED')} className="size-10 flex items-center justify-center text-slate-500">
                             <span className="material-symbols-outlined">logout</span>
                        </button>
                    </div>
                </header>
                
                <main className="pb-32 px-4 flex-1">
                    {documents.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 py-4">
                            {documents.map((doc) => (
                                <div key={doc.id} onClick={() => navigate(`/details/${doc.id}`)} className="flex flex-col gap-2 group cursor-pointer active:scale-95 transition-transform">
                                    <div className={`relative w-full ${getFormatClass(doc.format)} rounded-xl shadow-sm overflow-hidden bg-white dark:bg-slate-800 border-2 border-emerald-500/20`}>
                                        <img 
                                            src={doc.img} 
                                            alt={doc.name} 
                                            className="w-full h-full object-cover object-top blur-[2px] group-hover:blur-0 transition-all duration-300"
                                            style={{ transform: `rotate(${doc.rotation || 0}deg)` }}
                                        />
                                        <div className="absolute top-2 right-2 size-8 bg-emerald-500/90 backdrop-blur-md rounded-lg flex items-center justify-center shadow-sm z-10">
                                            <span className="material-symbols-outlined text-sm text-white">lock</span>
                                        </div>
                                    </div>
                                    <div className="px-1">
                                        <p className="text-slate-900 dark:text-white text-sm font-semibold truncate leading-tight">{doc.name}</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium mt-1">{doc.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                            <div className="size-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-4xl text-slate-400">lock_open</span>
                            </div>
                            <p>Keine Dokumente im Tresor.</p>
                            <p className="text-xs mt-2 max-w-[200px]">Markieren Sie Dokumente mit dem Schloss-Symbol, um sie hierher zu verschieben.</p>
                        </div>
                    )}
                </main>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark items-center justify-center relative overflow-hidden">
            <div className="w-full max-w-md px-8 flex flex-col items-center z-10">
                <div className="mb-8 size-20 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl">lock</span>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {mode === 'SETUP' ? (pin.length === 4 ? 'PIN bestätigen' : 'PIN erstellen') : 'Tresor öffnen'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-8 text-sm">
                    {mode === 'SETUP' 
                        ? 'Legen Sie einen 4-stelligen Code fest, um Ihre Dokumente zu schützen.' 
                        : 'Geben Sie Ihren PIN ein.'}
                </p>

                <div className="flex gap-4 mb-8">
                    {[0, 1, 2, 3].map(i => (
                        <div 
                            key={i} 
                            className={`size-4 rounded-full transition-all duration-200 ${
                                (mode === 'SETUP' ? (pin.length === 4 ? confirmPin.length : pin.length) : pin.length) > i 
                                ? 'bg-emerald-500 scale-110' 
                                : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                        />
                    ))}
                </div>

                {error && (
                    <div className="mb-6 text-red-500 text-sm font-medium animate-pulse flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {error}
                    </div>
                )}

                <RenderKeypad />
                
                {mode === 'LOCKED' && (
                    <button 
                        onClick={() => navigate('/')} 
                        className="mt-4 text-slate-400 text-sm font-medium hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        Abbrechen
                    </button>
                )}
            </div>
            
            <BottomNav />
        </div>
    );
};

export default SecureFolderScreen;