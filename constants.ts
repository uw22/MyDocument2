import { CategoryItem, DocumentItem, SettingItem } from "./types";

export const DOCUMENTS: DocumentItem[] = [];

export const CATEGORIES: CategoryItem[] = [
  { title: 'Arbeit', count: 0, icon: 'work', color: 'bg-primary/10 text-primary' },
  { title: 'Gesundheit', count: 0, icon: 'favorite', color: 'bg-red-500/10 text-red-500' },
  { title: 'Reisen', count: 0, icon: 'flight', color: 'bg-orange-500/10 text-orange-500' },
  { title: 'Finanzen', count: 0, icon: 'account_balance_wallet', color: 'bg-emerald-500/10 text-emerald-500' },
  { title: 'Zuhause', count: 0, icon: 'home', color: 'bg-purple-500/10 text-purple-500' }
];

export const SETTINGS: SettingItem[] = [
  { icon: 'person', label: 'Profil bearbeiten', sub: 'Name, E-Mail, Passwort' },
  { icon: 'notifications', label: 'Benachrichtigungen', sub: 'Push, E-Mail, Updates' },
  { icon: 'cloud', label: 'Cloud Synchronisierung', sub: 'Google Drive, Dropbox' },
  { icon: 'security', label: 'Sicherheit', sub: 'FaceID, PIN, App-Sperre' }
];

// Helper for Tailwind Aspect Ratio classes
export const getFormatClass = (format?: string) => {
    switch (format) {
        case 'receipt': return 'aspect-[1/2]';
        case 'card': return 'aspect-[1.586/1]';
        case 'square': return 'aspect-square';
        case 'original': return 'aspect-auto';
        case 'a4': 
        default: return 'aspect-[210/297]';
    }
};