function b64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
function arrayBufferToB64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function genAesKey() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}
export async function exportAesRaw(key) {
  const raw = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToB64(raw);
}
export async function importAesRaw(b64) {
  const buf = b64ToArrayBuffer(b64);
  return crypto.subtle.importKey("raw", buf, "AES-GCM", true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function aesEncrypt(key, dataUint8) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    dataUint8
  );
  return { iv: arrayBufferToB64(iv.buffer), cipher: arrayBufferToB64(cipher) };
}
export async function aesDecrypt(key, ivB64, cipherB64) {
  const iv = b64ToArrayBuffer(ivB64);
  const cipher = b64ToArrayBuffer(cipherB64);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    cipher
  );
  return new Uint8Array(plain);
}

// RSA public key import from PEM (SPKI)
export async function importRsaPublicPem(pem) {
  const b64 = pem.replace(/-----.*?-----/g, "").replace(/\s/g, "");
  const buf = b64ToArrayBuffer(b64);
  return crypto.subtle.importKey(
    "spki",
    buf,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

export async function wrapAesWithRsa(pubPem, aesRawB64) {
  const pubKey = await importRsaPublicPem(pubPem);
  const raw = b64ToArrayBuffer(aesRawB64);
  const wrapped = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    pubKey,
    raw
  );
  return arrayBufferToB64(wrapped);
}

// optional: generate RSA key pair in-browser (for testing)
export async function generateRsaKeyPair() {
  const kp = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  const spki = await crypto.subtle.exportKey("spki", kp.publicKey);
  const pkB64 = arrayBufferToB64(spki);
  const pubPem =
    "-----BEGIN PUBLIC KEY-----\n" +
    pkB64.match(/.{1,64}/g).join("\n") +
    "\n-----END PUBLIC KEY-----";
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  const privB64 = arrayBufferToB64(pkcs8);
  const privPem =
    "-----BEGIN PRIVATE KEY-----\n" +
    privB64.match(/.{1,64}/g).join("\n") +
    "\n-----END PRIVATE KEY-----";
  return { publicKeyPem: pubPem, privateKeyPem: privPem };
}
