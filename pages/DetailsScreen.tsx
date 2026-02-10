
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DOCUMENTS as INITIAL_DOCUMENTS, CATEGORIES as INITIAL_CATEGORIES, getFormatClass } from '../constants';
import { DocumentItem, DocFormat, CategoryItem } from '../types';
import BottomNav from '../components/BottomNav';

const DetailsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [doc, setDoc] = useState<DocumentItem | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // UI State & Zoom/Pan State
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartPos = useRef({ x: 0, y: 0 });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editRotation, setEditRotation] = useState(0);
    const [editFormat, setEditFormat] = useState<DocFormat>('a4');
    
    // Text Edit State
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [textContent, setTextContent] = useState('');
    
    // Notes Edit State
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesContent, setNotesContent] = useState('');

    const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
    const [isPinSet, setIsPinSet] = useState(false);
    const [showSetupPinModal, setShowSetupPinModal] = useState(false);

    useEffect(() => {
        const savedDocs = localStorage.getItem('docuscan_documents');
        const docs = savedDocs ? JSON.parse(savedDocs) : INITIAL_DOCUMENTS;
        const found = docs.find((d: DocumentItem) => String(d.id) === id);
        if (found) {
            setDoc(found);
            setEditRotation(found.rotation || 0);
            
            if (found.content?.startsWith('data:text/plain')) {
                try {
                    const base64 = found.content.split(',')[1];
                    const decoded = decodeURIComponent(escape(window.atob(base64)));
                    setTextContent(decoded);
                } catch (e) {
                    setTextContent('Fehler beim Dekodieren.');
                }
            }
        }

        const savedCats = localStorage.getItem('docuscan_categories');
        const cats = savedCats ? JSON.parse(savedCats) : INITIAL_CATEGORIES;
        setAvailableCategories(cats);
        
        const storedPin = localStorage.getItem('docuscan_pin');
        setIsPinSet(!!storedPin);
    }, [id]);

    // Reset pan when zoom is reset
    useEffect(() => {
        if (zoom <= 1) {
            setOffset({ x: 0, y: 0 });
        }
    }, [zoom]);

    const saveDocument = (updatedDoc: DocumentItem) => {
        setDoc(updatedDoc);
        try {
            const saved = localStorage.getItem('docuscan_documents');
            const docs = saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
            const updatedDocs = docs.map((d: DocumentItem) => String(d.id) === String(id) ? updatedDoc : d);
            localStorage.setItem('docuscan_documents', JSON.stringify(updatedDocs));
            window.dispatchEvent(new Event('docuscan-update'));
        } catch (e) {
            console.error("Error saving document", e);
        }
    };

    const handleToggleSecure = () => {
        if (!doc) return;
        if (doc.isSecure) {
            saveDocument({ ...doc, isSecure: false });
            return;
        }
        if (!isPinSet) {
            setShowSetupPinModal(true);
        } else {
            saveDocument({ ...doc, isSecure: true });
            navigate(-1);
        }
    };

    const handleOpenEdit = () => {
        if (!doc) return;
        setEditName(doc.name);
        setEditCategory(doc.category || 'Sonstiges');
        setEditRotation(doc.rotation || 0);
        setEditFormat(doc.format || 'a4');
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        if (!doc) return;
        saveDocument({ ...doc, name: editName, category: editCategory, rotation: editRotation, format: editFormat });
        setShowEditModal(false);
    };

    const handleSaveTextContent = () => {
        if (!doc) return;
        try {
            const base64 = window.btoa(unescape(encodeURIComponent(textContent)));
            const newDataUrl = `data:text/plain;base64,${base64}`;
            saveDocument({ ...doc, content: newDataUrl, img: newDataUrl, ocrText: textContent });
            setIsEditingContent(false);
        } catch (e) {
            alert("Fehler beim Speichern.");
        }
    };

    const handleOpenNotesEdit = () => {
        if (!doc) return;
        setNotesContent(doc.notes || '');
        setIsEditingNotes(true);
    };

    const handleSaveNotes = () => {
        if (!doc) return;
        saveDocument({ ...doc, notes: notesContent });
        setIsEditingNotes(false);
    };
    
    // --- Panning Handlers ---
    const handlePanStart = (e: React.MouseEvent) => {
        if (e.button !== 0 || zoom <= 1) return;
        e.preventDefault();
        setIsPanning(true);
        panStartPos.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    };

    const handlePanMove = (e: React.MouseEvent) => {
        if (!isPanning || zoom <= 1) return;
        e.preventDefault();
        setOffset({ x: e.clientX - panStartPos.current.x, y: e.clientY - panStartPos.current.y });
    };

    const handlePanEnd = () => setIsPanning(false);

    const handleTouchPanStart = (e: React.TouchEvent) => {
        if (e.touches.length !== 1 || zoom <= 1) return;
        e.preventDefault();
        setIsPanning(true);
        panStartPos.current = { x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y };
    };

    const handleTouchPanMove = (e: React.TouchEvent) => {
        if (!isPanning || e.touches.length !== 1 || zoom <= 1) return;
        e.preventDefault();
        setOffset({ x: e.touches[0].clientX - panStartPos.current.x, y: e.touches[0].clientY - panStartPos.current.y });
    };


    const renderDocumentContent = () => {
        if (!doc) return null;
        const style = { transform: `rotate(${doc.rotation || 0}deg)` };
        if (doc.content?.startsWith('data:application/pdf')) {
            return <iframe src={doc.content} title={doc.name} className="w-full h-full" style={style} />;
        }
        if (doc.content?.startsWith('data:text/plain')) {
            if (isEditingContent) {
                return (
                    <textarea 
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className="w-full h-full bg-white dark:bg-[#1c2a38] p-4 text-sm font-mono focus:outline-none resize-none border-none dark:text-slate-200"
                        autoFocus
                    />
                );
            }
            return (
                <div className="w-full h-full bg-white dark:bg-[#1c2a38] p-4 overflow-auto" style={style}>
                    <pre className="text-xs font-mono whitespace-pre-wrap dark:text-slate-300">{textContent}</pre>
                </div>
            );
        }
        return (
            <div className="relative w-full h-full flex items-center justify-center">
                <img src={doc.content || doc.img} alt={doc.name} className="w-full h-full object-contain transition-transform" style={style} />
            </div>
        );
    };

    if (!doc) return <div className="p-10 text-center">Lade...</div>;

    const isText = doc.content?.startsWith('data:text/plain');

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden pb-10">
            <div className="sticky top-0 z-10 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between shadow-sm border-b border-slate-100 dark:border-slate-800">
                <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-primary transition-colors"><span className="material-symbols-outlined">arrow_back_ios</span></button>
                <h2 className="text-lg font-bold flex-1 text-center truncate px-4">{doc.name}</h2>
                <div className="flex items-center gap-1">
                    {isEditingContent ? (
                         <button onClick={handleSaveTextContent} className="px-4 py-2 bg-emerald-500 text-white rounded-full text-xs font-bold shadow-sm">Speichern</button>
                    ) : (
                        <>
                            {isText && <button onClick={() => setIsEditingContent(true)} className="p-2 text-slate-500"><span className="material-symbols-outlined">edit_note</span></button>}
                            <button onClick={handleToggleSecure} className={`p-2 ${doc.isSecure ? 'text-emerald-500' : 'text-slate-500'}`}><span className="material-symbols-outlined">{doc.isSecure ? 'lock_open' : 'lock'}</span></button>
                            <button onClick={handleOpenEdit} className="p-2 text-slate-500"><span className="material-symbols-outlined">edit</span></button>
                            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-500"><span className="material-symbols-outlined">delete</span></button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="relative flex-1 w-full flex flex-col bg-slate-50 dark:bg-black/10">
                <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
                     <div
                        className={`${getFormatClass(doc.format)} bg-white dark:bg-[#1c2a38] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 w-full max-w-[480px]`}
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
                            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
                        }}
                        onMouseDown={handlePanStart}
                        onMouseMove={handlePanMove}
                        onMouseUp={handlePanEnd}
                        onMouseLeave={handlePanEnd}
                        onTouchStart={handleTouchPanStart}
                        onTouchMove={handleTouchPanMove}
                        onTouchEnd={handlePanEnd}
                        onTouchCancel={handlePanEnd}
                    >
                        {renderDocumentContent()}
                     </div>
                </div>
                {!isEditingContent && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-20">
                        <button onClick={() => setZoom(z => Math.max(1, z - 0.25))} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">remove</span></button>
                        <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-32 accent-primary"/>
                        <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">add</span></button>
                    </div>
                )}
            </div>

            <div className="pb-24 px-6 space-y-4 pt-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${doc.category ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-200 text-slate-500'}`}>
                        {doc.category || 'Keine Kategorie'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{doc.date}</span>
                </div>

                {doc.ocrText && !isEditingContent && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
                        <h4 className="text-xs font-bold uppercase text-blue-600 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">description</span>
                            Erkannter Text
                        </h4>
                        <p className="text-sm font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{doc.ocrText}</p>
                    </div>
                )}
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 border border-yellow-100 dark:border-yellow-900/30">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold uppercase text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">edit_note</span>
                            Notizen
                        </h4>
                        {!isEditingNotes && (
                            <button onClick={handleOpenNotesEdit} className="text-xs font-bold text-primary">Bearbeiten</button>
                        )}
                    </div>
                    {isEditingNotes ? (
                        <div>
                            <textarea
                                value={notesContent}
                                onChange={(e) => setNotesContent(e.target.value)}
                                className="w-full h-32 bg-white/50 dark:bg-yellow-900/10 rounded-lg p-3 text-sm font-mono focus:outline-none resize-none border border-yellow-200 dark:border-yellow-800 focus:ring-2 focus:ring-primary dark:text-slate-200"
                                placeholder="Notizen hier eingeben..."
                            />
                            <div className="flex gap-2 mt-3">
                                <button onClick={handleSaveNotes} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold">Speichern</button>
                                <button onClick={() => setIsEditingNotes(false)} className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold">Abbrechen</button>
                            </div>
                        </div>
                    ) : (
                        doc.notes ? (
                            <p className="text-sm font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{doc.notes}</p>
                        ) : (
                            <p className="text-sm text-slate-500 italic">Keine Notizen vorhanden.</p>
                        )
                    )}
                </div>

            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1c2a38] rounded-2xl p-6 w-full max-w-sm text-center">
                        <h3 className="text-lg font-bold mb-6">Dokument löschen?</h3>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl border">Abbrechen</button>
                            <button onClick={() => {
                                const docs = JSON.parse(localStorage.getItem('docuscan_documents') || '[]');
                                localStorage.setItem('docuscan_documents', JSON.stringify(docs.filter((d: any) => String(d.id) !== id)));
                                window.dispatchEvent(new Event('docuscan-update'));
                                navigate('/');
                            }} className="flex-1 py-3 rounded-xl bg-red-500 text-white">Löschen</button>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1c2a38] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Details bearbeiten</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Anzeigename</label>
                                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Kategorie</label>
                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary">
                                    {availableCategories.map(c => <option key={c.title} value={c.title}>{c.title}</option>)}
                                    <option value="Sonstiges">Sonstiges</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Abbrechen</button>
                            <button onClick={handleSaveEdit} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold">Speichern</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showSetupPinModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1c2a38] rounded-2xl p-6 w-full max-w-sm text-center">
                        <h3 className="text-lg font-bold mb-2">PIN erforderlich</h3>
                        <p className="text-sm text-slate-500 mb-6">Bitte richten Sie zuerst einen PIN für den Tresor ein, um Dokumente zu sichern.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSetupPinModal(false)} className="flex-1 py-3 rounded-xl border">Später</button>
                            <button onClick={() => {
                                setShowSetupPinModal(false);
                                navigate('/secure');
                            }} className="flex-1 py-3 rounded-xl bg-primary text-white">PIN einrichten</button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default DetailsScreen;