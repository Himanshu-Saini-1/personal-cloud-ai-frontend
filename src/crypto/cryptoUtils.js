export function base64ToUint8Array(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function aesGcmDecryptToBlob(
  cipherBytes,
  ivBase64,
  keyRaw,
  mimeType
) {
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyRaw, "AES-GCM", false, [
    "decrypt",
  ]);
  const plainBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBytes
  );
  return new Blob([plainBytes], {
    type: mimeType || "application/octet-stream",
  });
}

export function uint8ArrayToBase64(u8) {
  let binary = "";
  for (let i = 0; i < u8.byteLength; i++) binary += String.fromCharCode(u8[i]);
  return btoa(binary);
}

// Convert PEM (PKCS8 private or SPKI public) to ArrayBuffer
function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/, "")
    .replace(/-----END [A-Z ]+-----/, "")
    .replace(/\s+/g, "");
  return base64ToUint8Array(b64).buffer;
}

// Import private RSA key (PKCS#8 PEM) for RSA-OAEP SHA-256
export async function importPrivateKeyPem(pkcs8Pem) {
  const keyData = pemToArrayBuffer(pkcs8Pem);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
}

// RSA-OAEP decrypt base64 wrapped key -> returns Uint8Array
export async function rsaDecryptBase64(wrappedBase64, privateKeyCryptoKey) {
  const wrapped = base64ToUint8Array(wrappedBase64);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKeyCryptoKey,
    wrapped.buffer
  );
  return new Uint8Array(decrypted);
}

// Import AES raw key from raw bytes (Uint8Array) for AES-GCM
export async function importAesKeyFromRaw(rawUint8) {
  return await window.crypto.subtle.importKey(
    "raw",
    rawUint8,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
}

// AES-GCM decrypt: ciphertextBase64 + ivBase64/Uint8Array
export async function aesGcmDecrypt(
  cipherBase64,
  ivBase64OrBytes,
  rawAesUint8
) {
  const cipher = base64ToUint8Array(cipherBase64);
  const ivBytes =
    typeof ivBase64OrBytes === "string"
      ? base64ToUint8Array(ivBase64OrBytes)
      : ivBase64OrBytes;
  const aesKey = await importAesKeyFromRaw(rawAesUint8);
  const plainBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    aesKey,
    cipher.buffer
  );
  return new Uint8Array(plainBuffer);
}

// Decrypt nameEnc (base64) using wrapped DEK (base64) and user's private key PEM
export async function decryptNameForUser(fileObj, privateKeyPem) {
  // fileObj must contain nameEnc, nameIv, dekWrapped: [{forUid, wrapped},...]
  const entry = (fileObj.dekWrapped || []).find(
    (e) => e.forUid === fileObj.currentUid || e.forUid === fileObj.requestingUid
  );
  if (!entry) throw new Error("Wrapped DEK not found for this user");
  const privKey = await importPrivateKeyPem(privateKeyPem);
  const dekRawU8 = await rsaDecryptBase64(entry.wrapped, privKey); // Uint8Array of raw AES key
  const plainNameU8 = await aesGcmDecrypt(
    fileObj.nameEnc,
    fileObj.nameIv,
    dekRawU8
  );
  // decode utf-8
  return new TextDecoder().decode(plainNameU8);
}
