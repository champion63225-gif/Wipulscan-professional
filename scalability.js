/**
 * WiFi Hunter - Proactive Scalability
 * Efficient data structures and caching for high-volume usage
 * 
 * Optimizations:
 * - IndexedDB for large datasets (scan history)
 * - LRU Cache for frequently accessed data
 * - Batch operations for performance
 * - Data compression for storage efficiency
 */

/**
 * IndexedDB wrapper for scalable local storage
 */
class IndexedDBStorage {
  constructor(dbName, version) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create scan history store
        if (!db.objectStoreNames.contains('scan_history')) {
          const store = db.createObjectStore('scan_history', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('signal_strength', 'signal_strength', { unique: false });
        }

        // Create cache store
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }
      };
    });
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * LRU Cache for frequently accessed data
 */
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Scan History Manager with scalable storage
 */
class ScanHistoryManager {
  constructor() {
    this.idb = new IndexedDBStorage('WiFiHunterDB', 1);
    this.cache = new LRUCache(50);
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      await this.idb.init();
      this.initialized = true;
    }
  }

  /**
   * Save scan record with efficient storage
   */
  async saveScan(scanData) {
    await this.init();

    const record = {
      id: 'scan_' + Date.now(),
      timestamp: Date.now(),
      signal_strength: scanData.signalStrength,
      networks: scanData.networks || 0,
      location: scanData.location ? this.compressLocation(scanData.location) : null
    };

    await this.idb.add('scan_history', record);
    
    // Update cache
    this.cache.set(record.id, record);
    
    // Prune old records (keep last 1000)
    await this.pruneOldRecords(1000);
  }

  /**
   * Get scan record
   */
  async getScan(id) {
    await this.init();

    // Check cache first
    const cached = this.cache.get(id);
    if (cached) return cached;

    // Get from IndexedDB
    const record = await this.idb.get('scan_history', id);
    if (record) {
      this.cache.set(id, record);
    }
    return record;
  }

  /**
   * Get recent scans
   */
  async getRecentScans(limit = 50) {
    await this.init();

    const allScans = await this.idb.getAll('scan_history');
    
    // Sort by timestamp (descending)
    allScans.sort((a, b) => b.timestamp - a.timestamp);
    
    return allScans.slice(0, limit);
  }

  /**
   * Get scan statistics
   */
  async getStatistics() {
    await this.init();

    const allScans = await this.idb.getAll('scan_history');
    
    if (allScans.length === 0) {
      return {
        totalScans: 0,
        averageSignal: 0,
        maxSignal: 0,
        minSignal: 0
      };
    }

    const signalStrengths = allScans.map(s => s.signal_strength);
    const total = signalStrengths.reduce((a, b) => a + b, 0);
    
    return {
      totalScans: allScans.length,
      averageSignal: total / allScans.length,
      maxSignal: Math.max(...signalStrengths),
      minSignal: Math.min(...signalStrengths)
    };
  }

  /**
   * Prune old records
   */
  async pruneOldRecords(maxCount) {
    await this.init();

    const allScans = await this.idb.getAll('scan_history');
    
    if (allScans.length > maxCount) {
      // Sort by timestamp (ascending)
      allScans.sort((a, b) => a.timestamp - b.timestamp);
      
      // Delete oldest records
      const toDelete = allScans.slice(0, allScans.length - maxCount);
      
      for (const record of toDelete) {
        await this.idb.delete('scan_history', record.id);
        this.cache.delete(record.id);
      }
    }
  }

  /**
   * Compress location data
   */
  compressLocation(location) {
    // Simple compression: round to 4 decimal places
    return {
      lat: Math.round(location.lat * 10000) / 10000,
      lng: Math.round(location.lng * 10000) / 10000
    };
  }

  /**
   * Delete all scan history
   */
  async clearHistory() {
    await this.init();
    await this.idb.clear('scan_history');
    this.cache.clear();
  }

  /**
   * Export scan history (JSON)
   */
  async exportHistory() {
    await this.init();
    const allScans = await this.idb.getAll('scan_history');
    return JSON.stringify(allScans, null, 2);
  }

  /**
   * Import scan history
   */
  async importHistory(jsonData) {
    await this.init();
    const scans = JSON.parse(jsonData);
    
    for (const scan of scans) {
      await this.idb.add('scan_history', scan);
    }
  }
}

/**
 * Batch operations for performance
 */
class BatchOperations {
  constructor() {
    this.queue = [];
    this.flushTimer = null;
    this.flushInterval = 1000; // 1 second
  }

  /**
   * Add operation to batch queue
   */
  add(operation) {
    this.queue.push(operation);
    
    if (this.queue.length >= 10) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * Flush batched operations
   */
  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.length === 0) return;

    const operations = [...this.queue];
    this.queue = [];

    // Execute operations in batch
    const results = await Promise.allSettled(
      operations.map(op => op())
    );

    return results;
  }

  /**
   * Get queue size
   */
  size() {
    return this.queue.length;
  }
}

/**
 * Data compression for storage efficiency
 */
class DataCompression {
  /**
   * Compress object (simple JSON compression)
   */
  static compress(data) {
    const json = JSON.stringify(data);
    return btoa(json);
  }

  /**
   * Decompress object
   */
  static decompress(compressed) {
    const json = atob(compressed);
    return JSON.parse(json);
  }

  /**
   * Compress array of numbers
   */
  static compressNumbers(numbers) {
    // Simple delta compression
    if (numbers.length === 0) return [];
    
    const deltas = [numbers[0]];
    for (let i = 1; i < numbers.length; i++) {
      deltas.push(numbers[i] - numbers[i - 1]);
    }
    
    return deltas;
  }

  /**
   * Decompress array of numbers
   */
  static decompressNumbers(deltas) {
    if (deltas.length === 0) return [];
    
    const numbers = [deltas[0]];
    for (let i = 1; i < deltas.length; i++) {
      numbers.push(numbers[i - 1] + deltas[i]);
    }
    
    return numbers;
  }
}

// Global instances
const scanHistoryManager = new ScanHistoryManager();
const batchOperations = new BatchOperations();
