import { SRRecord, MechanicST } from './types';
import { INITIAL_RECORDS } from './mockData';

const LOCAL_RECORDS_KEY = 'sr_dashboard_records';
const APPS_SCRIPT_URL_KEY = 'sr_dashboard_gas_url';
const LOCAL_MECHANIC_ST_KEY = 'sr_dashboard_mechanic_st';

export const DEFAULT_MECHANIC_ST: MechanicST[] = [
  { id: 'mech-1', name: 'Agung Kristianto', stStart: '2026-05-25', stEnd: '2026-05-29', stDays: 5 },
  { id: 'mech-2', name: 'Doni Abdillah', stStart: '2026-05-26', stEnd: '2026-05-29', stDays: 4 },
  { id: 'mech-3', name: 'Agus Saputra', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-4', name: 'Cahya Deni Novrizal', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-5', name: 'Adi Tri', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-6', name: 'Muhammad Wahyudi', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-7', name: 'Tristan Rayhan', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-8', name: 'Jeri', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-9', name: 'Lingga', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-10', name: 'Indra', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-11', name: 'Soni', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-12', name: 'Yusuf', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-13', name: 'Arifin', stStart: '', stEnd: '', stDays: 0 },
  { id: 'mech-14', name: 'Ari', stStart: '', stEnd: '', stDays: 0 }
];

/**
 * Loads mechanic ST records from localStorage or returns defaults.
 */
export function getStoredMechanicST(): MechanicST[] {
  try {
    const stored = localStorage.getItem(LOCAL_MECHANIC_ST_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as MechanicST[];
      const parsedIds = new Set(parsed.map(m => m.id));
      const missing = DEFAULT_MECHANIC_ST.filter(m => !parsedIds.has(m.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        saveStoredMechanicST(merged);
        return merged;
      }
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load mechanic ST from localStorage', error);
  }
  return DEFAULT_MECHANIC_ST;
}

/**
 * Saves mechanic ST records to localStorage.
 */
export function saveStoredMechanicST(records: MechanicST[]): void {
  try {
    localStorage.setItem(LOCAL_MECHANIC_ST_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save mechanic ST to localStorage', error);
  }
}

/**
 * Calculates number of weekdays (Monday through Friday) between startStr and endStr (inclusive)
 */
export function calculateSTDays(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  try {
    const startObj = new Date(startStr);
    const endObj = new Date(endStr);
    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) return 0;
    if (startObj > endObj) return 0;
    
    let count = 0;
    const cur = new Date(startObj);
    let iterations = 0;
    while (cur <= endObj && iterations < 366) {
      iterations++;
      const day = cur.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  } catch (error) {
    console.error('Error calculating ST days:', error);
    return 0;
  }
}

/**
 * Loads records from localStorage or falls back to the high-fidelity mock data.
 */
export function getStoredRecords(): SRRecord[] {
  try {
    const stored = localStorage.getItem(LOCAL_RECORDS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load records from localStorage', error);
  }
  return INITIAL_RECORDS;
}

/**
 * Saves records to local storage.
 */
export function saveStoredRecords(records: SRRecord[]): void {
  try {
    localStorage.setItem(LOCAL_RECORDS_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save records to localStorage', error);
  }
}

/**
 * Loads the saved Google Apps Script URL from localStorage.
 */
export function getSavedGasUrl(): string {
  return localStorage.getItem(APPS_SCRIPT_URL_KEY) || '';
}

/**
 * Stores the Google Apps Script Web App URL.
 */
export function saveGasUrl(url: string): void {
  localStorage.setItem(APPS_SCRIPT_URL_KEY, url);
}

/**
 * Formats date string (YYYY-MM-DD or standard JS) to local human-friendly format
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD format
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Computes average aging based on records list
 */
export function calculateAvgAging(records: SRRecord[]): number {
  if (records.length === 0) return 0;
  const sum = records.reduce((acc, curr) => acc + (Number(curr.srAging) || 0), 0);
  return Math.round((sum / records.length) * 10) / 10;
}
