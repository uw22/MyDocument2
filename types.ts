
export type DocFormat = 'a4' | 'receipt' | 'card' | 'square' | 'original';

export interface DocumentItem {
  id: number | string;
  name: string;
  date: string;
  icon: string;
  img: string;
  content?: string; // Raw data URL for PDF/Text content
  isSecure?: boolean; 
  isFavorite?: boolean;
  category?: string;
  format?: DocFormat;
  notes?: string;
  ocrText?: string; // Extracted text from Gemini
  rotation?: number; // in degrees, e.g. 0, 90, 180, 270
}

export interface CategoryItem {
  title: string;
  count: number;
  icon: string;
  color: string;
}

export interface SettingItem {
  icon: string;
  label: string;
  sub: string;
}

export interface TabItem {
  path: string;
  label: string;
  icon: string;
}