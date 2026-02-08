import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const SettingsScreen: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for Profile
    const [profile, setProfile] = useState({
        name: 'Max Mustermann',
        email: 'max.mustermann@example.com'
    });

    // State for Toggles
    const [settings, setSettings] = useState({
        notifications: true,
        cloud: false,
        security: true
    });

    // Modal States
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [showImportWarning, setShowImportWarning] = useState(false);
    const [pendingImportData, setPendingImportData] = useState<any>(null);
    
    // Profile Edit States
    const [tempName, setTempName] = useState('');
    const [tempEmail, setTempEmail] = useState('');

    const handleOpenProfile = () => {
        setTempName(profile.name);
        setTempEmail(profile.email);
        setIsProfileModalOpen(true);
    };

    const handleSaveProfile = () => {
        setProfile({ name: tempName, email: tempEmail });
        setIsProfileModalOpen(false);
    };

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // --- Backup & Restore Logic ---

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
        } catch (error) {
            console.error("Backup failed", error);
            alert("Fehler beim Erstellen des Backups.");
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const result = ev.target?.result as string;
                const parsed = JSON.parse(result);
                
                // Basic validation
                if (parsed && Array.isArray(parsed.documents)) {
                    setPendingImportData(parsed);
                    setShowImportWarning(true);
                } else {
                    alert("Ungültige Backup-Datei: Kein gültiges Format erkannt.");
                }
            } catch (err) {
                console.error("Import parse error", err);
                alert("Fehler beim Lesen der Backup-Datei.");
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const confirmImport = () => {
        if (!pendingImportData) return;

        try {
            localStorage.setItem('docuscan_documents', JSON.stringify(pendingImportData.documents));
            
            if (pendingImportData.categories) {
                localStorage.setItem('docuscan_categories', JSON.stringify(pendingImportData.categories));
            }
            
            if (pendingImportData.pin) {
                localStorage.setItem('docuscan_pin', pendingImportData.pin);
            }

            // Dispatch update event so other components reload data
            window.dispatchEvent(new Event('docuscan-update'));
            
            setShowImportWarning(false);
            setPendingImportData(null);
            alert("Daten erfolgreich wiederhergestellt!");
        } catch (err) {
            console.error("Restore failed", err);
            alert("Fehler beim Wiederherstellen der Daten.");
        }
    };

    // Toggle Switch Component
    const ToggleSwitch = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
        <div 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${active ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
            <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen relative">
            {/* Hidden Input for Import */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json,application/json"
            />

            <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center p-4 pb-2 justify-between">
                    <div className="flex size-10 shrink-0 items-center justify-start" onClick={() => navigate(-1)}>
                        <span className="material-symbols-outlined text-2xl cursor-pointer">chevron_left</span>
                    </div>
                    <h2 className="text-lg font-bold flex-1 text-center">Einstellungen</h2>
                    <div className="size-10"></div>
                </div>
            </header>

            <main className="pb-32 flex-1">
                <div className="mt-4 flex flex-col gap-1">
                    {/* Profile Section */}
                    <div 
                        onClick={handleOpenProfile}
                        className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 active:bg-slate-200 dark:active:bg-slate-800 transition-colors"
                    >
                        <div className="size-12 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-semibold text-slate-900 dark:text-white">{profile.name}</p>
                            <p className="text-xs text-slate-500">{profile.email}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">edit</span>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 mx-4 my-2"></div>

                    {/* Toggles Section */}
                    <div className="flex items-center gap-4 px-4 py-3">
                        <div className="size-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">notifications</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-semibold text-slate-900 dark:text-white">Benachrichtigungen</p>
                            <p className="text-xs text-slate-500">Push, E-Mail, Updates</p>
                        </div>
                        <ToggleSwitch active={settings.notifications} onToggle={() => toggleSetting('notifications')} />
                    </div>

                    <div className="flex items-center gap-4 px-4 py-3">
                        <div className="size-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">cloud</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-semibold text-slate-900 dark:text-white">Cloud Sync</p>
                            <p className="text-xs text-slate-500">Google Drive, Dropbox</p>
                        </div>
                        <ToggleSwitch active={settings.cloud} onToggle={() => toggleSetting('cloud')} />
                    </div>

                    <div className="flex items-center gap-4 px-4 py-3">
                        <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <span className="material-symbols-outlined">security</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-semibold text-slate-900 dark:text-white">Sicherheit</p>
                            <p className="text-xs text-slate-500">FaceID, PIN, App-Sperre</p>
                        </div>
                        <ToggleSwitch active={settings.security} onToggle={() => toggleSetting('security')} />
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 mx-4 my-2"></div>

                    {/* Local Backup Section */}
                    <div className="px-4 py-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Datensicherung</p>
                        
                        <button 
                            onClick={handleExportBackup}
                            className="w-full flex items-center gap-4 px-2 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 active:bg-slate-200 dark:active:bg-slate-800 transition-colors rounded-xl"
                        >
                            <div className="size-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">download</span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-base font-semibold text-slate-900 dark:text-white">Backup erstellen</p>
                                <p className="text-xs text-slate-500">Daten lokal speichern</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                        </button>

                        <button 
                            onClick={handleImportClick}
                            className="w-full flex items-center gap-4 px-2 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 active:bg-slate-200 dark:active:bg-slate-800 transition-colors rounded-xl mt-1"
                        >
                            <div className="size-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">upload</span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-base font-semibold text-slate-900 dark:text-white">Backup laden</p>
                                <p className="text-xs text-slate-500">Daten wiederherstellen</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                        </button>
                    </div>

                </div>
            </main>

            {/* Profile Edit Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0 transition-opacity">
                    <div className="w-full max-w-md bg-white dark:bg-[#1c2a38] rounded-2xl shadow-2xl p-6 transform transition-all animate-in slide-in-from-bottom-10">
                        <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                            Profil bearbeiten
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400 material-symbols-outlined text-xl">person</span>
                                    <input 
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 pl-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="Ihr Name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">E-Mail</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400 material-symbols-outlined text-xl">mail</span>
                                    <input 
                                        value={tempEmail}
                                        onChange={(e) => setTempEmail(e.target.value)}
                                        className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 pl-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="ihre.email@beispiel.de"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => setIsProfileModalOpen(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button 
                                onClick={handleSaveProfile}
                                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20 transition-all"
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Warning Modal */}
            {showImportWarning && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1c2a38] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                        <div className="size-14 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center mb-5 mx-auto">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Daten überschreiben?</h3>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-300 mb-6 leading-relaxed">
                            Achtung: Dies wird alle aktuellen Dokumente, Kategorien und Einstellungen mit den Daten aus dem Backup ersetzen.
                            <br/><br/>
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {pendingImportData?.documents?.length || 0} Dokumente gefunden.
                            </span>
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => { setShowImportWarning(false); setPendingImportData(null); }}
                                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button 
                                onClick={confirmImport}
                                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20 transition-all"
                            >
                                Überschreiben
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default SettingsScreen;