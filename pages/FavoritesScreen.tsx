import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { DOCUMENTS as INITIAL_DOCUMENTS, getFormatClass } from '../constants';
import { DocumentItem } from '../types';

const FavoritesScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const loadDocuments = () => {
        const saved = localStorage.getItem('docuscan_documents');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return INITIAL_DOCUMENTS;
            }
        }
        return INITIAL_DOCUMENTS;
    };

    const [documents, setDocuments] = useState<DocumentItem[]>(loadDocuments);

    useEffect(() => {
        const handleUpdate = () => {
            setDocuments(loadDocuments());
        };

        // Reload on mount/navigation
        handleUpdate();

        window.addEventListener('docuscan-update', handleUpdate);
        return () => {
            window.removeEventListener('docuscan-update', handleUpdate);
        };
    }, [location]);

    const favorites = documents.filter(doc => doc.isFavorite);

    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center p-4 pb-2 justify-between">
                    <div className="flex size-10 shrink-0 items-center justify-start" onClick={() => navigate(-1)}>
                        <span className="material-symbols-outlined text-2xl cursor-pointer">chevron_left</span>
                    </div>
                    <h2 className="text-lg font-bold flex-1 text-center">Favoriten</h2>
                    <div className="size-10"></div>
                </div>
            </header>
            <main className="pb-32 px-4">
                {favorites.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 py-4">
                        {favorites.map((doc) => (
                            <div key={doc.id} onClick={() => navigate(`/details/${doc.id}`)} className="flex flex-col gap-2 group cursor-pointer active:scale-95 transition-transform">
                                <div className={`relative w-full ${getFormatClass(doc.format)} rounded-xl shadow-sm overflow-hidden bg-white dark:bg-slate-800`}>
                                    <img 
                                        src={doc.img} 
                                        alt={doc.name} 
                                        className="w-full h-full object-cover object-top"
                                        style={{ transform: `rotate(${doc.rotation || 0}deg)` }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                                    <div className="absolute top-2 right-2 size-8 bg-white/90 dark:bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-sm text-yellow-500 active-tab-icon">star</span>
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
                        <span className="material-symbols-outlined text-6xl mb-4">star_outline</span>
                        <p>Noch keine Favoriten hinzugefügt</p>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default FavoritesScreen;