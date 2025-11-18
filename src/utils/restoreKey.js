import api from "../api/apiClient";
import { deriveKeyFromUid, decryptStringWithKey } from "./kek";
import { savePrivateKeyPem, saveOwnPubKeyPem } from "./storage";

export async function restoreEncryptedPrivateKey(uid) {
  try {
    const res = await api.get("/auth/keys");
    const { encryptedPrivateKey, privateKeyIv, pubKey } = res.data || {};
    if (!encryptedPrivateKey || !privateKeyIv) {
      // nothing to restore
      return false;
    }

    const kek = await deriveKeyFromUid(uid);
    const privatePem = await decryptStringWithKey(
      kek,
      encryptedPrivateKey,
      privateKeyIv
    );

    // save locally for session/UX
    savePrivateKeyPem(privatePem);
    if (pubKey) saveOwnPubKeyPem(pubKey);

    return true;
  } catch (err) {
    console.error("restoreEncryptedPrivateKey failed:", err);
    return false;
  }
}
