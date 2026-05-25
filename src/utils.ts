import { SRRecord } from './types';
import { INITIAL_RECORDS } from './mockData';

const LOCAL_RECORDS_KEY = 'sr_dashboard_records';
const APPS_SCRIPT_URL_KEY = 'sr_dashboard_gas_url';

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
