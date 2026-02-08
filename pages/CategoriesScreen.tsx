
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { CATEGORIES as INITIAL_CATEGORIES } from '../constants';
import { CategoryItem, DocumentItem } from '../types';

const AVAILABLE_ICONS = [
    'work', 'favorite', 'flight', 'account_balance_wallet', 'home', 
    'shopping_cart', 'school', 'pets', 'fitness_center', 'restaurant',
    'medical_services', 'directions_car', 'videogame_asset', 'local_cafe'
];

const AVAILABLE_COLORS = [
    { name: 'Blue', value: 'bg-primary/10 text-primary', bg: 'bg-blue-500' },
    { name: 'Red', value: 'bg-red-500/10 text-red-500', bg: 'bg-red-500' },
    { name: 'Orange', value: 'bg-orange-500/10 text-orange-500', bg: 'bg-orange-500' },
    { name: 'Emerald', value: 'bg-emerald-500/10 text-emerald-500', bg: 'bg-emerald-500' },
    { name: 'Purple', value: 'bg-purple-500/10 text-purple-500', bg: 'bg-purple-500' },
    { name: 'Pink', value: 'bg-pink-500/10 text-pink-500', bg: 'bg-pink-500' },
    { name: 'Cyan', value: 'bg-cyan-500/10 text-cyan-500', bg: 'bg-cyan-500' },
    { name: 'Yellow', value: 'bg-yellow-500/10 text-yellow-600', bg: 'bg-yellow-500' },
];

const CategoriesScreen: React.FC = () => {
    const navigate = useNavigate();
    
    // Initialize from localStorage or fallback to constants
    const [categories, setCategories] = useState<CategoryItem[]>(() => {
        const saved = localStorage.getItem('docuscan_categories');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return INITIAL_CATEGORIES;
            }
        }
        return INITIAL_CATEGORIES;
    });

    const [isEditing, setIsEditing] = useState(false);
    
    // Sync function to notify other screens
    const notifyUpdate = () => {
        window.dispatchEvent(new Event('docuscan-update'));
    };

    // Save categories to localStorage
    useEffect(() => {
        localStorage.setItem('docuscan_categories', JSON.stringify(categories));
        notifyUpdate();
    }, [categories]);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formIcon, setFormIcon] = useState(AVAILABLE_ICONS[0]);
    const [formColor, setFormColor] = useState(AVAILABLE_COLORS[0].value);

    const handleOpenModal = (index: number | null = null) => {
        if (index !== null) {
            const cat = categories[index];
            setEditingIndex(index);
            setFormTitle(cat.title);
            setFormIcon(cat.icon);
            setFormColor(cat.color);
        } else {
            setEditingIndex(null);
            setFormTitle('');
            setFormIcon(AVAILABLE_ICONS[0]);
            setFormColor(AVAILABLE_COLORS[0].value);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingIndex(null);
    };

    const handleSave = () => {
        if (!formTitle.trim()) return;

        const oldTitle = editingIndex !== null ? categories[editingIndex].title : null;
        const newTitle = formTitle.trim();

        const newItem: CategoryItem = {
            title: newTitle,
            count: editingIndex !== null ? categories[editingIndex].count : 0,
            icon: formIcon,
            color: formColor
        };

        // Update documents if category name changed
        if (oldTitle && oldTitle !== newTitle) {
            const savedDocs = localStorage.getItem('docuscan_documents');
            if (savedDocs) {
                const docs: DocumentItem[] = JSON.parse(savedDocs);
                const updatedDocs = docs.map(doc => 
                    doc.category === oldTitle ? { ...doc, category: newTitle } : doc
                );
                localStorage.setItem('docuscan_documents', JSON.stringify(updatedDocs));
            }
        }

        if (editingIndex !== null) {
            const updated = [...categories];
            updated[editingIndex] = newItem;
            setCategories(updated);
        } else {
            setCategories([...categories, newItem]);
        }
        handleCloseModal();
    };

    const handleDelete = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        const catToDelete = categories[index].title;
        
        // Update documents that belonged to this category
        const savedDocs = localStorage.getItem('docuscan_documents');
        if (savedDocs) {
            const docs: DocumentItem[] = JSON.parse(savedDocs);
            const updatedDocs = docs.map(doc => 
                doc.category === catToDelete ? { ...doc, category: 'Sonstiges' } : doc
            );
            localStorage.setItem('docuscan_documents', JSON.stringify(updatedDocs));
        }

        setCategories(prev => prev.filter((_, i) => i !== index));
    };

    const handleCategoryClick = (index: number, title: string) => {
        if (isEditing) {
            handleOpenModal(index);
        } else {
            navigate(`/category/${encodeURIComponent(title)}`);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center p-4 pb-2 justify-between">
                    <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-start">
                        <span className="material-symbols-outlined text-2xl cursor-pointer">chevron_left</span>
                    </button>
                    <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Ordner & Kategorien</h2>
                    <div className="flex items-center justify-end w-24">
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-all ${isEditing ? 'bg-primary text-white' : 'text-primary'}`}
                        >
                            {isEditing ? 'Fertig' : 'Bearbeiten'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 pb-48">
                <div className="flex flex-col pt-2">
                    {categories.map((cat, i) => (
                        <div 
                            key={`${cat.title}-${i}`} 
                            onClick={() => handleCategoryClick(i, cat.title)}
                            className={`group flex items-center gap-4 px-4 min-h-[76px] py-2 justify-between cursor-pointer transition-colors ${isEditing ? 'hover:bg-slate-50 dark:hover:bg-slate-800/30' : 'active:bg-slate-100 dark:active:bg-slate-800/50'}`}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                {isEditing && (
                                    <button 
                                        onClick={(e) => handleDelete(e, i)}
                                        className="size-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center shrink-0 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors z-10"
                                    >
                                        <span className="material-symbols-outlined text-xl">remove</span>
                                    </button>
                                )}
                                <div className={`flex items-center justify-center rounded-xl shrink-0 size-12 ${cat.color} transition-all shadow-sm`}>
                                    <span className="material-symbols-outlined">{cat.icon}</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-base font-semibold leading-tight line-clamp-1">{cat.title}</p>
                                    <p className="text-slate-500 dark:text-[#92adc9] text-xs font-normal leading-normal mt-0.5">{cat.count} Dokumente</p>
                                </div>
                            </div>
                            
                            {!isEditing && (
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-300 text-lg">chevron_right</span>
                                </div>
                            )}
                            {isEditing && (
                                <span className="material-symbols-outlined text-slate-400">edit</span>
                            )}
                        </div>
                    ))}
                </div>
            </main>

            {/* Floating Action Button (only when not editing) */}
            {!isEditing && (
                <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto p-6 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent z-10 pointer-events-none">
                    <button 
                        onClick={() => handleOpenModal(null)}
                        className="flex pointer-events-auto w-full items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined font-bold">add_circle</span>
                        <span>Neue Kategorie</span>
                    </button>
                </div>
            )}

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0 transition-opacity">
                    <div className="w-full max-w-md bg-white dark:bg-[#1c2a38] rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 transform transition-all animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingIndex !== null ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
                            </h3>
                            <button onClick={handleCloseModal} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Name</label>
                                <input 
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    placeholder="z.B. Finanzen, Steuern..."
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Farbe</label>
                                <div className="flex gap-3 flex-wrap">
                                    {AVAILABLE_COLORS.map((c) => (
                                        <button
                                            key={c.name}
                                            onClick={() => setFormColor(c.value)}
                                            className={`size-10 rounded-full ${c.bg} ${formColor === c.value ? 'ring-4 ring-offset-2 ring-primary dark:ring-offset-[#1c2a38] scale-110' : 'opacity-60 hover:opacity-100'} transition-all`}
                                            aria-label={c.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Icon</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {AVAILABLE_ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            onClick={() => setFormIcon(icon)}
                                            className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${formIcon === icon ? 'bg-primary text-white border-primary scale-105 shadow-md shadow-primary/30' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            <span className="material-symbols-outlined">{icon}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-10">
                            <button 
                                onClick={handleCloseModal}
                                className="flex-1 py-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={!formTitle.trim()}
                                className="flex-1 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <BottomNav />
        </div>
    );
};

export default CategoriesScreen;
