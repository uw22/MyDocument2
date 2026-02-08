
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DOCUMENTS as INITIAL_DOCUMENTS, CATEGORIES as INITIAL_CATEGORIES, getFormatClass } from '../constants';
import { DocumentItem, DocFormat, CategoryItem } from '../types';
import BottomNav from '../components/BottomNav';
import { analyzeDocument } from '../services/gemini';

const DetailsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [doc, setDoc] = useState<DocumentItem | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // UI State
    const [zoom, setZoom] = useState(1);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editRotation, setEditRotation] = useState(0);
    const [editFormat, setEditFormat] = useState<DocFormat>('a4');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Text Edit State
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [textContent, setTextContent] = useState('');

    // Crop State
    const [isCropping, setIsCropping] = useState(false);
    const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 });
    const [dragMode, setDragMode] = useState<'move' | 'tl' | 'tr' | 'bl' | 'br' | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const cropContainerRef = useRef<HTMLDivElement>(null);

    const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);

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
    }, [id]);

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

    const handleRunAnalysis = async () => {
        if (!doc || isAnalyzing) return;
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeDocument(doc.content || doc.img);
            if (analysis) {
                const updatedDoc = {
                    ...doc,
                    name: analysis.title || doc.name,
                    category: analysis.category || doc.category,
                    ocrText: analysis.ocrText || doc.ocrText
                };
                saveDocument(updatedDoc);
            }
        } catch (err) {
            alert("KI-Analyse fehlgeschlagen. Bitte API-Key prüfen.");
        } finally {
            setIsAnalyzing(false);
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

    const performCrop = () => {
        if (!imgRef.current || !doc) return;
        const originalImg = new Image();
        originalImg.src = doc.content || doc.img;
        originalImg.onload = () => {
            const rotation = doc.rotation || 0;
            const isHorizontal = rotation === 90 || rotation === 270;
            const sourceW = originalImg.naturalWidth;
            const sourceH = originalImg.naturalHeight;
            const tempCanvas = document.createElement('canvas');
            const tCtx = tempCanvas.getContext('2d')!;
            if (rotation % 360 === 0) {
                tempCanvas.width = sourceW;
                tempCanvas.height = sourceH;
                tCtx.drawImage(originalImg, 0, 0);
            } else {
                tempCanvas.width = isHorizontal ? sourceH : sourceW;
                tempCanvas.height = isHorizontal ? sourceW : sourceH;
                tCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                tCtx.rotate((rotation * Math.PI) / 180);
                tCtx.drawImage(originalImg, -sourceW / 2, -sourceH / 2);
            }
            const scaleX = tempCanvas.width / 100;
            const scaleY = tempCanvas.height / 100;
            const cropX = cropArea.x * scaleX;
            const cropY = cropArea.y * scaleY;
            const cropW = cropArea.width * scaleX;
            const cropH = cropArea.height * scaleY;
            const canvas = document.createElement('canvas');
            canvas.width = cropW;
            canvas.height = cropH;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            const croppedDataUrl = canvas.toDataURL('image/png');
            saveDocument({ ...doc, content: croppedDataUrl, img: croppedDataUrl, rotation: 0 });
            setIsCropping(false);
        };
    };

    const handleRestoreOriginal = () => {
        if (!doc || !doc.originalContent) return;
        if (confirm("Änderungen rückgängig machen?")) {
            saveDocument({ ...doc, content: doc.originalContent, img: doc.originalContent, rotation: 0 });
        }
    };

    const handleCropInteraction = (e: React.MouseEvent | React.TouchEvent, mode: typeof dragMode = null) => {
        if (mode) { setDragMode(mode); return; }
        if (!dragMode || !cropContainerRef.current) return;
        const rect = cropContainerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        setCropArea(prev => {
            let newArea = { ...prev };
            if (dragMode === 'move') {
                newArea.x = Math.max(0, Math.min(100 - prev.width, x - prev.width / 2));
                newArea.y = Math.max(0, Math.min(100 - prev.height, y - prev.height / 2));
            } else if (dragMode === 'tl') {
                const nx = Math.max(0, Math.min(prev.x + prev.width - 5, x));
                const ny = Math.max(0, Math.min(prev.y + prev.height - 5, y));
                newArea.width = prev.x + prev.width - nx;
                newArea.height = prev.y + prev.height - ny;
                newArea.x = nx; newArea.y = ny;
            } else if (dragMode === 'br') {
                newArea.width = Math.max(5, Math.min(100 - prev.x, x - prev.x));
                newArea.height = Math.max(5, Math.min(100 - prev.y, y - prev.y));
            } else if (dragMode === 'tr') {
                newArea.width = Math.max(5, Math.min(100 - prev.x, x - prev.x));
                const ny = Math.max(0, Math.min(prev.y + prev.height - 5, y));
                newArea.height = prev.y + prev.height - ny;
                newArea.y = ny;
            } else if (dragMode === 'bl') {
                const nx = Math.max(0, Math.min(prev.x + prev.width - 5, x));
                newArea.width = prev.x + prev.width - nx;
                newArea.x = nx;
                newArea.height = Math.max(5, Math.min(100 - prev.y, y - prev.y));
            }
            return newArea;
        });
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
                <img ref={imgRef} src={doc.content || doc.img} alt={doc.name} className="w-full h-full object-contain transition-transform" style={style} />
                {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-wider">KI analysiert...</p>
                    </div>
                )}
            </div>
        );
    };

    if (!doc) return <div className="p-10 text-center">Lade...</div>;

    const isImage = !doc.content?.startsWith('data:application/pdf') && !doc.content?.startsWith('data:text/plain');
    const isText = doc.content?.startsWith('data:text/plain');
    const isEdited = doc.originalContent && doc.content !== doc.originalContent;

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden pb-10">
            {isCropping && isImage && (
                <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center select-none touch-none" onMouseMove={(e) => handleCropInteraction(e)} onTouchMove={(e) => handleCropInteraction(e)} onMouseUp={() => setDragMode(null)} onTouchEnd={() => setDragMode(null)}>
                    <div className="w-full p-4 flex justify-between items-center text-white bg-black/50 backdrop-blur-md">
                        <button onClick={() => setIsCropping(false)} className="p-2"><span className="material-symbols-outlined">close</span></button>
                        <h3 className="font-bold">Zuschneiden</h3>
                        <div className="flex gap-2">
                             <button onClick={() => setCropArea({ x: 0, y: 0, width: 100, height: 100 })} className="px-4 py-2 text-sm font-semibold text-white/70">Reset</button>
                            <button onClick={performCrop} className="bg-primary px-6 py-2 rounded-full text-sm font-bold shadow-lg">Fertig</button>
                        </div>
                    </div>
                    <div ref={cropContainerRef} className="flex-1 w-full relative overflow-hidden flex items-center justify-center p-4">
                        <div className="relative inline-block max-w-full max-h-full">
                            <img src={doc.content || doc.img} alt="Target" className="max-w-full max-h-full object-contain pointer-events-none opacity-40 transition-transform" style={{ transform: `rotate(${doc.rotation || 0}deg)` }} />
                            <div className="absolute border-2 border-primary shadow-[0_0_0_2000px_rgba(0,0,0,0.7)] cursor-move" style={{ left: `${cropArea.x}%`, top: `${cropArea.y}%`, width: `${cropArea.width}%`, height: `${cropArea.height}%` }} onMouseDown={(e) => { e.stopPropagation(); setDragMode('move'); }} onTouchStart={(e) => { e.stopPropagation(); setDragMode('move'); }}>
                                {['tl', 'tr', 'bl', 'br'].map(m => (
                                    <div key={m} className={`absolute size-6 bg-primary rounded-full border-4 border-white shadow-md cursor-${m}-resize ${m.includes('t') ? '-top-3' : '-bottom-3'} ${m.includes('l') ? '-left-3' : '-right-3'}`} onMouseDown={(e) => { e.stopPropagation(); setDragMode(m as any); }} onTouchStart={(e) => { e.stopPropagation(); setDragMode(m as any); }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="sticky top-0 z-10 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between shadow-sm border-b border-slate-100 dark:border-slate-800">
                <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-primary transition-colors"><span className="material-symbols-outlined">arrow_back_ios</span></button>
                <h2 className="text-lg font-bold flex-1 text-center truncate px-4">{doc.name}</h2>
                <div className="flex items-center gap-1">
                    {isEditingContent ? (
                         <button onClick={handleSaveTextContent} className="px-4 py-2 bg-emerald-500 text-white rounded-full text-xs font-bold shadow-sm">Speichern</button>
                    ) : (
                        <>
                            <button onClick={handleRunAnalysis} disabled={isAnalyzing} className={`p-2 transition-all ${isAnalyzing ? 'text-primary animate-pulse' : 'text-primary hover:scale-110'}`} title="KI-Analyse anfordern">
                                <span className="material-symbols-outlined">{isAnalyzing ? 'sync' : 'auto_awesome'}</span>
                            </button>
                            {isEdited && <button onClick={handleRestoreOriginal} className="p-2 text-orange-500"><span className="material-symbols-outlined">restart_alt</span></button>}
                            {isImage && <button onClick={() => setIsCropping(true)} className="p-2 text-slate-500"><span className="material-symbols-outlined">crop</span></button>}
                            {isText && <button onClick={() => setIsEditingContent(true)} className="p-2 text-slate-500"><span className="material-symbols-outlined">edit_note</span></button>}
                            <button onClick={() => saveDocument({ ...doc, isFavorite: !doc.isFavorite })} className={`p-2 ${doc.isFavorite ? 'text-yellow-500' : 'text-slate-500'}`}><span className="material-symbols-outlined">star</span></button>
                            <button onClick={handleOpenEdit} className="p-2 text-slate-500"><span className="material-symbols-outlined">edit</span></button>
                            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-500"><span className="material-symbols-outlined">delete</span></button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="relative flex-1 w-full flex flex-col bg-slate-50 dark:bg-black/10">
                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                     <div className={`${getFormatClass(doc.format)} bg-white dark:bg-[#1c2a38] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all`} style={{ width: `${zoom * 100}%`, maxWidth: zoom > 1 ? 'none' : '480px' }}>
                        {renderDocumentContent()}
                     </div>
                </div>
                {!isEditingContent && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-20">
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">remove</span></button>
                        <input type="range" min="0.5" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-32 accent-primary"/>
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

                {!doc.ocrText && !isAnalyzing && (
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 border border-dashed border-slate-300 dark:border-slate-700 text-center">
                        <p className="text-xs text-slate-500 mb-4">Dieses Dokument wurde noch nicht von der KI analysiert.</p>
                        <button onClick={handleRunAnalysis} className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-lg">auto_awesome</span>
                            KI-Analyse starten
                        </button>
                    </div>
                )}
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
                        <h3 className="text-lg font-bold mb-4">Details bearbeiten</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Anzeigename</label>
                                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border dark:border-slate-700 dark:bg-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Kategorie</label>
                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border dark:border-slate-700 dark:bg-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary">
                                    {availableCategories.map(c => <option key={c.title} value={c.title}>{c.title}</option>)}
                                    <option value="Sonstiges">Sonstiges</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 border rounded-xl text-sm font-semibold">Abbrechen</button>
                            <button onClick={handleSaveEdit} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold">Speichern</button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default DetailsScreen;
