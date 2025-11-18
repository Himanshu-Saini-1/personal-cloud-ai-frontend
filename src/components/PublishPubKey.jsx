import React, { useState } from "react";
import api from "../api/apiClient";
import { generateRsaKeyPair } from "../crypto/crypto";
import { saveOwnPubKeyPem } from "../utils/storage";
import { deriveKeyFromUid, encryptStringWithKey } from "../utils/kek";
import { getAuth } from "firebase/auth";

export default function PublishPubKey({ onPublished }) {
  const [pem, setPem] = useState("");
  const [busy, setBusy] = useState(false);

  async function genAndSave() {
    const { publicKeyPem, privateKeyPem } = await generateRsaKeyPair();
    setPem(publicKeyPem);

    // Do NOT save private key to server unencrypted. We'll encrypt and store server-side.
    // We'll handle encryption & upload in publish()
    window._tmpPrivatePem = privateKeyPem; // keep temporarily in memory
    alert("Generated keypair. Click Publish to store (encrypted) on server.");
  }

  async function publish() {
    if (!pem) return alert("Paste or generate a public key first.");
    try {
      setBusy(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return alert("Login required");

      const uid = user.uid;

      // Get private PEM from temporary memory or prompt user to paste/upload
      const privatePem =
        window._tmpPrivatePem ||
        localStorage.getItem("pca_private_key_pem") ||
        null;

      if (!privatePem) {
        return alert(
          "Private key not found locally. Generate a keypair first (Generate Keypair)."
        );
      }

      // Derive KEK and encrypt
      const kek = await deriveKeyFromUid(uid);
      const { cipherB64, ivB64 } = await encryptStringWithKey(kek, privatePem);

      // send pubKey and encryptedPrivateKey to backend
      const res = await api.post("/auth/pubkey", {
        pubKey: pem,
        encryptedPrivateKey: cipherB64,
        privateKeyIv: ivB64,
      });

      if (res.data?.ok) {
        saveOwnPubKeyPem(pem);
        // store the private key in localStorage as well for local convenience
        localStorage.setItem("pca_private_key_pem", privatePem);
        window._tmpPrivatePem = null;
        alert("Public key + encrypted private key stored successfully.");
        onPublished && onPublished();
      } else {
        alert("Publish failed: " + JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Publish error:", err);
      alert("Publish failed: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <h4>Publish Public Key</h4>
      <button onClick={genAndSave} disabled={busy}>
        Generate Keypair (browser)
      </button>
      <div>
        <textarea
          value={pem}
          onChange={(e) => setPem(e.target.value)}
          rows={6}
          cols={70}
          placeholder="Paste your public key PEM here"
        />
      </div>
      <button onClick={publish} disabled={busy}>
        Publish PubKey to Server (encrypted private key stored)
      </button>
    </div>
  );
}
