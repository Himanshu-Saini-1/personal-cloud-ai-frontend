function str2ab(str) {
  return new TextEncoder().encode(str);
}

function ab2b64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b642ab(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

export async function deriveKeyFromUid(uid) {
  const salt = str2ab("pca_kek_salt_v1"); // fixed salt (could be per-app)
  const base = str2ab(uid);
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    base,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
}

export async function encryptStringWithKey(key, plainText) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    str2ab(plainText)
  );
  return { cipherB64: ab2b64(enc), ivB64: ab2b64(iv) };
}

export async function decryptStringWithKey(key, cipherB64, ivB64) {
  const cipherAb = b642ab(cipherB64);
  const ivAb = b642ab(ivB64);
  const plain = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivAb) },
    key,
    cipherAb
  );
  return new TextDecoder().decode(plain);
}
