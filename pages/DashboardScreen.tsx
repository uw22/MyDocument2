
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import FloatingActionButton from '../components/FloatingActionButton';
import { DOCUMENTS as INITIAL_DOCUMENTS, CATEGORIES as INITIAL_CATEGORIES, getFormatClass } from '../constants';
import { DocumentItem, CategoryItem } from '../types';

const DashboardScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const restoreInputRef = useRef<HTMLInputElement>(null);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Alle');
    const [deleteId, setDeleteId] = useState<string | number | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [showRestoreWarning, setShowRestoreWarning] = useState(false);
    const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [filterCategories, setFilterCategories] = useState<string[]>([]);

    const loadData = () => {
        try {
            const savedDocs = localStorage.getItem('docuscan_documents');
            let docs = INITIAL_DOCUMENTS;
            if (savedDocs) {
                const parsed = JSON.parse(savedDocs);
                if (Array.isArray(parsed)) {
                    docs = parsed;
                }
            }
            setDocuments(docs);

            const savedCats = localStorage.getItem('docuscan_categories');
            let cats: CategoryItem[] = INITIAL_CATEGORIES;
            if (savedCats) {
                const parsedCats = JSON.parse(savedCats);
                if (Array.isArray(parsedCats)) {
                    cats = parsedCats;
                }
            }
            
            const customTitles = cats.map(c => c?.title).filter(t => t && t !== 'Alle' && t !== 'Sonstiges');
            setFilterCategories(['Alle', ...customTitles, 'Sonstiges']);
        } catch (e) {
            console.error("Critical error loading data:", e);
            setDocuments(INITIAL_DOCUMENTS);
            setFilterCategories(['Alle', 'Sonstiges']);
        }
    };

    useEffect(() => {
        loadData();
        const handleUpdate = () => loadData();
        window.addEventListener('docuscan-update', handleUpdate);
        return () => window.removeEventListener('docuscan-update', handleUpdate);
    }, []);

    useEffect(() => {
         loadData();
         setIsMenuOpen(false);
    }, [location]);

    const handleImportTrigger = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsImporting(true);
        const importedDocs: DocumentItem[] = [];

        for (const file of Array.from(files) as File[]) {
            try {
                // Warning for very large files (> 2MB) as localStorage is limited to ~5MB total
                if (file.size > 2 * 1024 * 1024) {
                    console.warn(`Datei ${file.name} ist sehr groß (${(file.size / 1024 / 1024).toFixed(2)}MB). Dies könnte den Speicher sprengen.`);
                }

                const result = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                let icon = 'description';
                if (file.type.includes('image')) {
                    icon = 'image';
                } else if (file.type.includes('pdf')) {
                    icon = 'picture_as_pdf';
                } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
                    icon = 'text_snippet';
                }

                const newDoc: DocumentItem = {
                    id: Date.now() + Math.floor(Math.random() * 10000),
                    name: file.name,
                    date: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
                    icon: icon,
                    img: result,
                    content: result,
                    isSecure: false,
                    category: 'Sonstiges',
                    format: 'a4',
                    rotation: 0
                };

                importedDocs.push(newDoc);
            } catch (err) {
                console.error("Error importing file:", file.name, err);
                alert(`Fehler beim Laden von ${file.name}`);
            }
        }

        if (importedDocs.length > 0) {
            try {
                const saved = localStorage.getItem('docuscan_documents');
                const currentDocs = saved ? JSON.parse(saved) : [];
                const updated = [...importedDocs, ...currentDocs];
                localStorage.setItem('docuscan_documents', JSON.stringify(updated));
                window.dispatchEvent(new Event('docuscan-update'));
                setSaveStatus(`${importedDocs.length} Datei(en) importiert`);
                setTimeout(() => setSaveStatus(null), 3000);
            } catch (e: any) {
                console.error("Storage error:", e);
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    alert("Speicher voll! Bitte löschen Sie einige Dokumente, bevor Sie neue importieren. (Web-Browser limitieren den Speicherplatz)");
                } else {
                    alert("Fehler beim Speichern der Dokumente.");
                }
            }
        }

        setIsImporting(false);
    };

    // --- Sidebar Actions ---

    const handleManualSave = () => {
        setSaveStatus("Datenstand gesichert");
        setTimeout(() => setSaveStatus(null), 2000);
    };

    const handleExportBackup = () => {
        try {
            const data = {
                documents: JSON.parse(localStorage.getItem('docuscan_documents') || '[]'),
                categories: JSON.parse(localStorage.getItem('docuscan_categories') || '[]'),
                pin: localStorage.getItem('docuscan_pin') || '',
                version: 1,
                timestamp: new Date().toISOString(),
                device: navigator.userAgent
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateStr = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `DocuScan_Backup_${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsMenuOpen(false);
        } catch (error) {
            alert("Backup fehlgeschlagen.");
        }
    };

    const handleRestoreTrigger = () => {
        restoreInputRef.current?.click();
    };

    const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target?.result as string);
                if (parsed && Array.isArray(parsed.documents)) {
                    setPendingRestoreData(parsed);
                    setShowRestoreWarning(true);
                    setIsMenuOpen(false);
                } else {
                    alert("Ungültiges Backup-Format.");
                }
            } catch (err) {
                alert("Fehler beim Lesen der Datei.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const confirmRestore = () => {
        if (!pendingRestoreData) return;
        try {
            localStorage.setItem('docuscan_documents', JSON.stringify(pendingRestoreData.documents));
            if (pendingRestoreData.categories) localStorage.setItem('docuscan_categories', JSON.stringify(pendingRestoreData.categories));
            if (pendingRestoreData.pin) localStorage.setItem('docuscan_pin', pendingRestoreData.pin);
            window.dispatchEvent(new Event('docuscan-update'));
            setShowRestoreWarning(false);
            setPendingRestoreData(null);
            alert("Wiederherstellung erfolgreich!");
        } catch (e) {
            alert("Fehler beim Wiederherstellen. Speicherplatz reicht evtl. nicht aus.");
        }
    };

    const handleCloseApp = () => {
        setIsMenuOpen(false);
        navigate('/welcome', { replace: true });
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        try {
            const saved = localStorage.getItem('docuscan_documents');
            const currentDocs = saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
            const updated = currentDocs.filter((doc: DocumentItem) => String(doc.id) !== String(deleteId));
            localStorage.setItem('docuscan_documents', JSON.stringify(updated));
            window.dispatchEvent(new Event('docuscan-update'));
        } catch (err) {
            console.error("Error deleting document:", err);
        } finally {
            setDeleteId(null);
        }
    };

    const filteredDocuments = documents.filter(doc => {
        if (!doc) return false;
        if (doc.isSecure) return false;
        if (activeCategory === 'Alle') return true;
        return doc.category === activeCategory || (activeCategory === 'Sonstiges' && !doc.category);
    });

    const renderCardContent = (doc: DocumentItem) => {
        const style = { transform: `rotate(${doc.rotation || 0}deg)` };
        if (doc.content?.startsWith('data:application/pdf')) {
            return (
                <div className="w-full h-full relative bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-2">
                    <span className="material-symbols-outlined text-3xl text-slate-300">picture_as_pdf</span>
                </div>
            );
        }
        if (doc.content?.startsWith('data:text/plain')) {
            return (
                <div className="w-full h-full bg-white dark:bg-[#1c2a38] p-2 overflow-hidden relative" style={style}>
                     <span className="material-symbols-outlined absolute top-1 right-1 text-slate-200 text-sm">text_snippet</span>
                     <p className="text-[4px] text-slate-300 font-mono leading-tight whitespace-pre-wrap opacity-60">
                        {doc.ocrText || 'Text...'}
                     </p>
                </div>
            );
        }
        return <img src={doc.content || doc.img} alt={doc.name} className="w-full h-full object-cover object-top" style={style} />;
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,application/pdf,text/plain,.txt" 
                multiple 
            />
            <input type="file" ref={restoreInputRef} onChange={handleRestoreFileChange} className="hidden" accept=".json,application/json" />

            {/* Sidebar Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] max-w-md mx-auto">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute top-0 left-0 bottom-0 w-[80%] bg-white dark:bg-background-dark shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                        <div className="p-6 pt-10 border-b border-slate-100 dark:border-slate-800">
                            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-3xl">account_circle</span>
                            </div>
                            <h3 className="font-bold text-lg">DocuScan Pro</h3>
                            <p className="text-xs text-slate-500">Menü & Verwaltung</p>
                        </div>
                        
                        <div className="flex-1 py-6 overflow-y-auto">
                            <div className="px-4 space-y-2">
                                <button onClick={() => { setIsMenuOpen(false); handleImportTrigger(); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="material-symbols-outlined text-primary">add_box</span>
                                    <span className="font-semibold text-sm">Dokument importieren</span>
                                </button>
                                <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="material-symbols-outlined text-slate-500">settings</span>
                                    <span className="font-semibold text-sm">Einstellungen</span>
                                </button>
                                <button onClick={handleManualSave} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="material-symbols-outlined text-emerald-500">save</span>
                                    <span className="font-semibold text-sm">Backup jetzt</span>
                                </button>
                                <button onClick={handleExportBackup} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="material-symbols-outlined text-primary">download</span>
                                    <span className="font-semibold text-sm">Daten exportieren</span>
                                </button>
                                <button onClick={handleRestoreTrigger} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="material-symbols-outlined text-orange-500">upload</span>
                                    <span className="font-semibold text-sm">Daten importieren</span>
                                </button>
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button onClick={handleCloseApp} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <span className="material-symbols-outlined text-red-500">logout</span>
                                        <span className="font-semibold text-sm">App schließen</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-800/20">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                <span>Speicherstatus</span>
                                <span>{documents.length} Dokumente</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (documents.length / 40) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast for Save */}
            {saveStatus && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-6 py-2.5 rounded-full shadow-lg font-bold text-xs animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-2">
                         <span className="material-symbols-outlined text-sm">check_circle</span>
                         {saveStatus}
                    </div>
                </div>
            )}

            {/* Import/Restore Warning Modal */}
            {showRestoreWarning && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1c2a38] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="size-14 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center mb-5 mx-auto">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">Restore bestätigen?</h3>
                        <p className="text-sm text-center text-slate-500 mb-6">
                            Alle aktuellen Dokumente werden durch das Backup ({pendingRestoreData?.documents?.length} Dateien) ersetzt. Dieser Vorgang kann nicht rückgängig gemacht werden.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowRestoreWarning(false)} className="flex-1 py-3 rounded-xl border">Abbrechen</button>
                            <button onClick={confirmRestore} className="flex-1 py-3 rounded-xl bg-orange-500 text-white">Überschreiben</button>
                        </div>
                    </div>
                </div>
            )}

            {isImporting && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-background-dark p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                        <div className="size-16 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-primary animate-spin"></div>
                        <p className="font-bold text-slate-900 dark:text-white">Dokumente werden geladen...</p>
                        <p className="text-xs text-slate-500">Bitte warten Sie einen Moment.</p>
                    </div>
                </div>
            )}

            <div className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md shadow-sm">
                <div className="flex items-center p-4 pb-2 justify-between">
                    <button onClick={() => setIsMenuOpen(true)} className="size-12 flex items-center justify-start text-slate-900 dark:text-white active:scale-90 transition-transform">
                        <span className="material-symbols-outlined text-2xl">menu</span>
                    </button>
                    <h2 className="text-lg font-bold flex-1 text-center">Meine Ablage</h2>
                    <button onClick={() => setIsEditing(!isEditing)} className={`text-sm font-semibold px-3 py-1.5 rounded-full ${isEditing ? 'bg-primary text-white' : 'text-primary'}`}>
                        {isEditing ? 'Fertig' : 'Edit'}
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto pb-40">
                <div className="flex flex-wrap gap-2 px-4 py-3">
                    {filterCategories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full border text-[13px] font-medium transition-all ${activeCategory === cat ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white dark:bg-[#233648] border-slate-200 dark:border-transparent text-slate-700 dark:text-white'}`}>
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3">
                    {filteredDocuments.map((doc) => (
                        <div key={doc.id} onClick={() => !isEditing && navigate(`/details/${doc.id}`)} className="flex flex-col gap-1 group relative">
                            <div className={`relative w-full ${getFormatClass(doc.format)} rounded-lg shadow-sm overflow-hidden bg-white dark:bg-slate-600 ${isEditing ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                                {renderCardContent(doc)}
                                {isEditing ? (
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(doc.id); }} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                    </button>
                                ) : (
                                    <div className="absolute top-1 right-1 size-5 bg-white/90 dark:bg-black/40 backdrop-blur-md rounded flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-[10px] text-primary">{doc.icon}</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-slate-900 dark:text-white text-[9px] font-medium truncate leading-tight px-0.5">{doc.name}</p>
                        </div>
                    ))}
                </div>
                {filteredDocuments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <span className="material-symbols-outlined text-6xl opacity-20">cloud_upload</span>
                        <p className="text-sm mt-4">Noch keine Dokumente</p>
                        <button onClick={handleImportTrigger} className="mt-4 text-primary text-xs font-bold border border-primary/20 px-4 py-2 rounded-full">Jetzt importieren</button>
                    </div>
                )}
            </main>

            {deleteId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-background-dark p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Dokument löschen?</h3>
                        <p className="text-sm text-slate-500 mb-6">Diese Aktion kann nicht rückgängig gemacht werden.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-slate-200">Abbrechen</button>
                            <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">Löschen</button>
                        </div>
                    </div>
                </div>
            )}

            {!isEditing && <FloatingActionButton onImport={handleImportTrigger} />}
            <BottomNav />
        </div>
    );
};

export default DashboardScreen;