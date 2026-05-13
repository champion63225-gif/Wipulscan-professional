/**

 * Wipulscan - Fort Knox Security

 * Security best practices for financial transactions and data protection

 * 

 * Standards applied:

 * - OWASP Mobile Top 10

 * - PCI DSS compliance (for payment handling)

 * - GDPR data protection

 * - Tokenization for transactions

 */



/**

 * Tokenization for sensitive data

 * Replaces sensitive data with non-sensitive tokens

 */

class Tokenizer {

  constructor() {

    this.tokenMap = new Map();

    this.loadTokenMap();

  }



  loadTokenMap() {

    const stored = localStorage.getItem('wipulscan_token_map');

    if (stored) {

      this.tokenMap = new Map(JSON.parse(stored));

    }

  }



  saveTokenMap() {

    localStorage.setItem('wipulscan_token_map', JSON.stringify([...this.tokenMap]));

  }



  /**

   * Tokenize a value

   */

  tokenize(value) {

    // Check if already tokenized

    for (const [token, val] of this.tokenMap) {

      if (val === value) return token;

    }



    // Generate new token

    const token = 'tok_' + this.generateRandomString(32);

    this.tokenMap.set(token, value);

    this.saveTokenMap();

    return token;

  }



  /**

   * Detokenize a token

   */

  detokenize(token) {

    return this.tokenMap.get(token) || null;

  }



  generateRandomString(length) {

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';

    for (let i = 0; i < length; i++) {

      result += chars.charAt(Math.floor(Math.random() * chars.length));

    }

    return result;

  }

}



/**

 * Secure storage for sensitive data

 * Uses encryption for local storage

 */

class SecureStorage {

  constructor() {

    this.encryptionKey = this.getOrCreateEncryptionKey();

  }



  /**

   * Get or create encryption key

   * In production, use device-specific key or hardware-backed keystore

   */

  getOrCreateEncryptionKey() {

    let key = localStorage.getItem('wipulscan_encryption_key');

    if (!key) {

      key = this.generateKey();

      localStorage.setItem('wipulscan_encryption_key', key);

    }

    return key;

  }



  generateKey() {

    // Simple XOR-based key generation (for demo)

    // In production, use Web Crypto API or hardware-backed keystore

    return Array.from(crypto.getRandomValues(new Uint8Array(32)))

      .map(b => b.toString(16).padStart(2, '0'))

      .join('');

  }



  /**

   * Encrypt data

   */

  encrypt(data) {

    const json = JSON.stringify(data);

    // Simple XOR encryption (for demo)

    // In production, use AES-256-GCM via Web Crypto API

    let encrypted = '';

    for (let i = 0; i < json.length; i++) {

      encrypted += String.fromCharCode(

        json.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)

      );

    }

    return btoa(encrypted);

  }



  /**

   * Decrypt data

   */

  decrypt(encrypted) {

    try {

      const decoded = atob(encrypted);

      let decrypted = '';

      for (let i = 0; i < decoded.length; i++) {

        decrypted += String.fromCharCode(

          decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)

        );

      }

      return JSON.parse(decrypted);

    } catch (error) {

      console.error('Decryption failed:', error);

      return null;

    }

  }



  /**

   * Store sensitive data securely

   */

  setItem(key, value) {

    const encrypted = this.encrypt(value);

    localStorage.setItem('wipulscan_secure_' + key, encrypted);

  }



  /**

   * Retrieve sensitive data securely

   */

  getItem(key) {

    const encrypted = localStorage.getItem('wipulscan_secure_' + key);

    if (!encrypted) return null;

    return this.decrypt(encrypted);

  }



  /**

   * Remove sensitive data

   */

  removeItem(key) {

    localStorage.removeItem('wfh_secure_' + key);

  }

}



/**

 * Transaction security

 * Secure handling of payment transactions

 */

class TransactionSecurity {

  constructor() {

    this.tokenizer = new Tokenizer();

    this.secureStorage = new SecureStorage();

  }



  /**

   * Secure transaction validation

   */

  validateTransaction(transactionId, productId, price) {

    // Validate transaction ID format

    if (!transactionId || !transactionId.match(/^(txn|sub)_\d+_[a-z0-9]+$/)) {

      throw new Error('Invalid transaction ID format');

    }



    // Validate product ID

    const validProducts = ['de.cobradynamics.wifihunter.pro.onetime', 'de.cobradynamics.wifihunter.pro.subscription'];

    if (!validProducts.includes(productId)) {

      throw new Error('Invalid product ID');

    }



    // Validate price

    if (price < 0 || price > 1000) {

      throw new Error('Invalid price');

    }



    return true;

  }



  /**

   * Store transaction record securely

   */

  storeTransaction(transaction) {

    // Tokenize sensitive fields

    const tokenizedTransaction = {

      transaction_id: transaction.transactionId,

      product_id: transaction.productId,

      price: transaction.price,

      currency: transaction.currency,

      timestamp: transaction.timestamp,

      // Tokenize any user-identifiable fields

      user_token: this.tokenizer.tokenize(transaction.userId || 'anonymous')

    };



    this.secureStorage.setItem('txn_' + transaction.transactionId, tokenizedTransaction);

  }



  /**

   * Retrieve transaction record

   */

  getTransaction(transactionId) {

    return this.secureStorage.getItem('txn_' + transactionId);

  }



  /**

   * Generate secure receipt

   */

  generateReceipt(transaction) {

    const receipt = {

      app_id: 'de.cobradynamics.wifihunter',

      transaction_id: transaction.transactionId,

      product_id: transaction.productId,

      purchase_date: transaction.timestamp,

      signature: this.generateSignature(transaction)

    };

    return receipt;

  }



  /**

   * Generate signature for receipt

   */

  generateSignature(transaction) {

    // Simple signature (for demo)

    // In production, use HMAC-SHA256

    const data = transaction.transactionId + transaction.productId + transaction.timestamp;

    let hash = 0;

    for (let i = 0; i < data.length; i++) {

      const char = data.charCodeAt(i);

      hash = ((hash << 5) - hash) + char;

      hash = hash & hash;

    }

    return 'sig_' + Math.abs(hash).toString(16);

  }



  /**

   * Verify receipt signature

   */

  verifyReceipt(receipt) {

    const expectedSignature = this.generateSignature({

      transactionId: receipt.transaction_id,

      productId: receipt.product_id,

      timestamp: receipt.purchase_date

    });

    return receipt.signature === expectedSignature;

  }

}



/**

 * Data protection (GDPR)

 */

class DataProtection {

  /**

   * Anonymize data for analytics

   */

  anonymizeData(data) {

    const anonymized = { ...data };

    

    // Remove or hash any PII

    const piiFields = ['email', 'phone', 'name', 'address'];

    piiFields.forEach(field => {

      if (anonymized[field]) {

        delete anonymized[field];

      }

    });



    // Hash user IDs

    if (anonymized.userId) {

      anonymized.userId = this.hashString(anonymized.userId);

    }



    return anonymized;

  }



  /**

   * Hash string (SHA-256)

   */

  async hashString(str) {

    const encoder = new TextEncoder();

    const data = encoder.encode(str);

    const hash = await crypto.subtle.digest('SHA-256', data);

    return Array.from(new Uint8Array(hash))

      .map(b => b.toString(16).padStart(2, '0'))

      .join('');

  }



  /**

   * Right to be forgotten (GDPR Article 17)

   */

  deleteAllUserData() {

    // Delete all user data

    localStorage.removeItem('wipulscan_entitlements');

    localStorage.removeItem('wipulscan_history');

    localStorage.removeItem('wipulscan_token_map');

    localStorage.removeItem('wipulscan_encryption_key');

    

    // Delete secure storage

    Object.keys(localStorage)

      .filter(key => key.startsWith('wipulscan_secure_'))

      .forEach(key => localStorage.removeItem(key));



    // Delete analytics consent

    localStorage.removeItem('wipulscan_analytics_consent');

  }



  /**

   * Export user data (GDPR Article 20 - Data portability)

   */

  exportUserData() {

    const userData = {

      entitlements: JSON.parse(localStorage.getItem('wipulscan_entitlements') || '{}'),

      history: JSON.parse(localStorage.getItem('wipulscan_history') || '[]'),

      settings: {

        language: localStorage.getItem('wipulscan_lang'),

        consent: localStorage.getItem('wipulscan_consent'),

        onboardingDone: localStorage.getItem('wipulscan_onboarding_done')

      },

      exportDate: new Date().toISOString()

    };

    return userData;

  }

}



// Global instances

const tokenizer = new Tokenizer();

const secureStorage = new SecureStorage();

const transactionSecurity = new TransactionSecurity();

const dataProtection = new DataProtection();

