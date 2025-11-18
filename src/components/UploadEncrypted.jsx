import React, { useState } from "react";
import api from "../api/apiClient";
import {
  genAesKey,
  exportAesRaw,
  aesEncrypt,
  wrapAesWithRsa,
} from "../crypto/crypto";
import { getOwnPubKeyPem } from "../utils/storage";
import { motion } from "framer-motion";

export default function UploadEncrypted({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    if (!file) return alert("Choose file first");
    setBusy(true);
    try {
      // Generate AES key
      const dek = await genAesKey();
      const dekRawB64 = await exportAesRaw(dek);

      // Encrypt file content
      const buf = await file.arrayBuffer();
      const enc = await aesEncrypt(dek, new Uint8Array(buf));

      // Encrypt filename
      const nameEnc = await aesEncrypt(
        dek,
        new TextEncoder().encode(file.name)
      );

      // Get owner's public key
      const ownerPub = getOwnPubKeyPem();
      if (!ownerPub) {
        setBusy(false);
        return alert(
          "Your public key not found. Please generate and publish it first."
        );
      }

      const wrappedForOwner = await wrapAesWithRsa(ownerPub, dekRawB64);

      const payload = {
        nameEnc: nameEnc.cipher,
        nameIv: nameEnc.iv,
        contentIv: enc.iv,
        cipherBase64: enc.cipher,
        dekWrappedForOwner: wrappedForOwner,
        originalNameHint: file.name,
        mimeType: file.type,
        size: file.size,
      };

      const res = await api.post("/files/upload", payload);

      if (res.data?.fileId) {
        console.log("✅ Uploaded file:", res.data.fileId);
        alert("Uploaded successfully!");

        onUploaded?.({ fileId: res.data.fileId, dekRawB64 });

        setFile(null);
      } else {
        alert("Upload failed: " + JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      style={{
        padding: "20px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        maxWidth: "500px",
        marginTop: 20,
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          color: "#244855",
          fontWeight: "600",
          marginBottom: 20,
          fontSize: "22px",
        }}
      >
        Upload Your File Securely 🔐
      </motion.h3>

      {/* File Drop Box */}
      <motion.label
        htmlFor="fileInput"
        style={{
          display: "block",
          border: "2px dashed #244855",
          padding: "30px",
          borderRadius: "14px",
          textAlign: "center",
          cursor: "pointer",
          color: "#244855",
          fontSize: "16px",
          fontWeight: "500",
        }}
        whileHover={{ scale: 1.02, borderColor: "#E64833" }}
        whileTap={{ scale: 0.98 }}
      >
        {file ? (
          <span>
            📄 {file.name}
            <br />
            <small style={{ color: "#555" }}>
              {Math.round(file.size / 1024)} KB
            </small>
          </span>
        ) : (
          <span>📁 Click to choose a file</span>
        )}
      </motion.label>

      <input
        id="fileInput"
        type="file"
        style={{ display: "none" }}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      {/* Upload Button */}
      <motion.button
        onClick={handleUpload}
        disabled={busy}
        whileHover={!busy && { scale: 1.05 }}
        whileTap={!busy && { scale: 0.95 }}
        style={{
          marginTop: 20,
          width: "100%",
          background: busy ? "#888" : "#E64833",
          color: "#fff",
          border: "none",
          padding: "12px",
          fontSize: "16px",
          borderRadius: "10px",
          cursor: busy ? "not-allowed" : "pointer",
          transition: "0.3s",
        }}
      >
        {busy ? "Uploading..." : "🚀 Upload & Encrypt"}
      </motion.button>

      {/* Motivational Animated Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.4 }}
        style={{
          marginTop: 20,
          textAlign: "center",
          color: "#244855",
          fontWeight: "500",
          fontSize: "14px",
        }}
      >
        Your files are protected with end-to-end encryption.
        <br />
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          style={{ color: "#E64833" }}
        >
          Upload with confidence ❤️
        </motion.span>
      </motion.p>
    </motion.div>
  );
}
