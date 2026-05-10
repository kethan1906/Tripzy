/**
 * Offline Store - IndexedDB wrapper for offline trip data
 * Supports saving itineraries, trips, and pending actions
 */

const DB_NAME = 'tripzy-offline';
const DB_VERSION = 1;
const STORES = {
  TRIPS: 'trips',
  ITINERARIES: 'itineraries',
  BOOKINGS: 'bookings',
  PENDING_EXPENSES: 'pending-expenses',
  MAP_TILES: 'map-tiles',
  USER_PREFS: 'user-prefs',
};

class OfflineDB {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: '_id' });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).put({ ...data, _cachedAt: Date.now() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineDB = new OfflineDB();
export { STORES };

// ─── Offline Helpers ──────────────────────────────────────────────────────────

export const saveForOffline = async (type, data) => {
  await offlineDB.put(STORES[type.toUpperCase()] || STORES.TRIPS, data);
  // Also notify service worker
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SAVE_TRIP_OFFLINE',
      payload: data
    });
  }
};

export const getOfflineData = async (type, id) => {
  if (id) return offlineDB.get(STORES[type.toUpperCase()], id);
  return offlineDB.getAll(STORES[type.toUpperCase()]);
};

export const addPendingExpense = async (expense) => {
  const id = `pending-${Date.now()}`;
  await offlineDB.put(STORES.PENDING_EXPENSES, { ...expense, _id: id, _pending: true });
  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('sync-expenses');
  }
};

export const isOnline = () => navigator.onLine;

export const useOnlineStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
};

// Import useState and useEffect at top if used as hook
import { useState, useEffect } from 'react';
