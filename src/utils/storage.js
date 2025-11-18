export function savePrivateKeyPem(pem) {
  try {
    localStorage.setItem("pca_private_key_pem", pem);
  } catch (err) {
    console.error("Failed to save private key:", err);
  }
}

export function getOwnPrivateKeyPem() {
  try {
    return localStorage.getItem("pca_private_key_pem");
  } catch (err) {
    console.error("Failed to read private key:", err);
    return null;
  }
}

export function saveOwnPubKeyPem(pem) {
  try {
    localStorage.setItem("pca_pubkey_pem", pem);
  } catch (err) {
    console.error("Failed to save public key:", err);
  }
}

export function getOwnPubKeyPem() {
  try {
    return localStorage.getItem("pca_pubkey_pem");
  } catch (err) {
    console.error("Failed to read public key:", err);
    return null;
  }
}

export function saveEncryptedPrivateKey(cipher) {
  try {
    localStorage.setItem("pca_encrypted_private_key", cipher);
  } catch (err) {
    console.error("Failed to save encrypted key:", err);
  }
}

export function saveEncryptedPrivateKeyIv(iv) {
  try {
    localStorage.setItem("pca_private_key_iv", iv);
  } catch (err) {
    console.error("Failed to save encrypted IV:", err);
  }
}

// Get encrypted values (only for optional usage)
export function getEncryptedPrivateKey() {
  return localStorage.getItem("pca_encrypted_private_key");
}

export function getEncryptedPrivateKeyIv() {
  return localStorage.getItem("pca_private_key_iv");
}

// Secure logout (clears ALL keys)
export function clearKeys() {
  try {
    localStorage.removeItem("pca_private_key_pem");
    localStorage.removeItem("pca_pubkey_pem");
    localStorage.removeItem("pca_encrypted_private_key");
    localStorage.removeItem("pca_private_key_iv");
  } catch (err) {
    console.error("Failed to clear keys:", err);
  }
}
