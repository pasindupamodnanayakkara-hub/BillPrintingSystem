/**
 * Encryption service using WebCrypto API
 * Implements AES-GCM 256-bit encryption for End-to-End Security
 */

const ALGO = 'AES-GCM';
const KEY_ALGO = 'PBKDF2';
const HASH = 'SHA-256';

/**
 * Gets or generates a local encryption secret.
 * This secret never leaves the device.
 */
const getSystemSecret = () => {
  let secret = localStorage.getItem('STUDIO_ENC_SECRET');
  if (!secret) {
    secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem('STUDIO_ENC_SECRET', secret);
  }
  return secret;
};

/**
 * Derives an AES key from a password and salt
 */
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    KEY_ALGO,
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: KEY_ALGO,
      salt: salt,
      iterations: 100000,
      hash: HASH,
    },
    keyMaterial,
    { name: ALGO, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a JSON object into a Base64 string
 */
export const encryptBackup = async (data) => {
  const secret = getSystemSecret();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secret, salt);
  
  const enc = new TextEncoder();
  const encodedData = enc.encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGO, iv: iv },
    key,
    encodedData
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Return as Base64 for easy transport
  return btoa(String.fromCharCode(...combined));
};

/**
 * Decrypts a Base64 string back into a JSON object
 */
export const decryptBackup = async (base64Data) => {
  const secret = getSystemSecret();
  const combined = new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0)));
  
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);
  
  const key = await deriveKey(secret, salt);
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv: iv },
      key,
      data
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  } catch (err) {
    console.error('Decryption failed. Incorrect key or corrupted data.', err);
    throw new Error('CORRUPT_OR_WRONG_KEY');
  }
};

/**
 * Exports the current encryption secret so user can use it to restore on another PC
 */
export const exportSecret = () => getSystemSecret();

/**
 * Imports an encryption secret (used for manual restore)
 */
export const importSecret = (secret) => {
  localStorage.setItem('STUDIO_ENC_SECRET', secret);
};
