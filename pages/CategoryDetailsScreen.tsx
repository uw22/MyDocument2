
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { DOCUMENTS as INITIAL_DOCUMENTS, getFormatClass } from '../constants';
import { DocumentItem } from '../types';

const CategoryDetailsScreen: React.FC = () => {
    const { title } = useParams<{ title: string }>();
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
        
        handleUpdate();
        window.addEventListener('docuscan-update', handleUpdate);
        return () => {
            window.removeEventListener('docuscan-update', handleUpdate);
        };
    }, [location]);
    
    // Filter documents by category
    const displayDocs = documents.filter(doc => {
        if (doc.isSecure) return false;
        if (title === 'Sonstiges') {
             // For "Sonstiges", include items explicitly labeled "Sonstiges" OR items without a category
            return doc.category === 'Sonstiges' || !doc.category;
        }
        return doc.category === title;
    });

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
             <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center p-4 pb-2 justify-between">
                    <div className="flex size-10 shrink-0 items-center justify-start" onClick={() => navigate(-1)}>
                        <span className="material-symbols-outlined text-2xl cursor-pointer text-slate-900 dark:text-white">chevron_left</span>
                    </div>
                    <h2 className="text-lg font-bold flex-1 text-center text-slate-900 dark:text-white">{title}</h2>
                    <div className="size-10"></div>
                </div>
            </header>

            <main className="pb-32 px-4 flex-1">
                <div className="py-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 px-1">
                        {displayDocs.length} Dokumente in {title}
                    </p>
                    
                    {displayDocs.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {displayDocs.map((doc) => (
                                <div key={doc.id} onClick={() => navigate(`/details/${doc.id}`)} className="flex flex-col gap-2 group cursor-pointer active:scale-95 transition-transform">
                                    <div className={`relative w-full ${getFormatClass(doc.format)} rounded-xl shadow-sm overflow-hidden bg-white dark:bg-slate-800`}>
                                        <img 
                                            src={doc.img} 
                                            alt={doc.name} 
                                            className="w-full h-full object-cover object-top"
                                            style={{ transform: `rotate(${doc.rotation || 0}deg)` }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-active:bg-black/10 transition-colors"></div>
                                        <div className="absolute top-2 right-2 size-8 bg-white/90 dark:bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center shadow-sm">
                                            <span className="material-symbols-outlined text-sm text-primary">{doc.icon}</span>
                                        </div>
                                    </div>
                                    <div className="px-1">
                                        <p className="text-slate-900 dark:text-white text-sm font-semibold truncate leading-tight">{doc.name}</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 font-medium">{doc.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">folder_off</span>
                            <p>Keine Dokumente in dieser Kategorie</p>
                        </div>
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default CategoryDetailsScreen;