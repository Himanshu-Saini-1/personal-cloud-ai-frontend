import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import { wrapAesWithRsa } from "../crypto/crypto";

export default function ShareModal({ ownerDekRawB64 }) {
  const [toUid, setToUid] = useState("");
  const [fileId, setFileId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  // 👇 Listen for the "openShareModal" event fired from FileList
  useEffect(() => {
    function handler(e) {
      if (e?.detail?.fileId) {
        setFileId(e.detail.fileId);
        setVisible(true);
      }
    }
    window.addEventListener("openShareModal", handler);
    return () => window.removeEventListener("openShareModal", handler);
  }, []);

  // 👇 Main share function
  async function doShare() {
    if (!toUid) return alert("Recipient UID required");
    if (!ownerDekRawB64)
      return alert("Owner DEK not found — please re-upload or regenerate key.");

    try {
      setBusy(true);

      // 1️⃣ Get recipient public key from backend
      const r = await api.get(`/api/auth/pubkey/${toUid}`);
      const pub = r.data?.pubKey;
      if (!pub) {
        alert("Recipient has not published a public key yet.");
        setBusy(false);
        return;
      }

      const wrapped = await wrapAesWithRsa(pub, ownerDekRawB64);

      const res = await api.post("/api/files/share", {
        fileId,
        forUid: toUid,
        wrappedDek: wrapped,
      });

      if (res.data?.ok) {
        alert(" File shared successfully!");
        setToUid("");
        setVisible(false);
      } else {
        alert(" Share failed: " + JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Share error:", err);
      alert("Share error: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
          minWidth: 320,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Share File</h3>
        <p style={{ fontSize: 13, color: "#555" }}>
          <strong>File ID:</strong> {fileId}
        </p>

        <input
          type="text"
          placeholder="Enter recipient Firebase UID"
          value={toUid}
          onChange={(e) => setToUid(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 12,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />

        <div style={{ textAlign: "right" }}>
          <button
            onClick={doShare}
            disabled={busy}
            style={{
              padding: "6px 12px",
              background: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            {busy ? "Sharing..." : "Share"}
          </button>

          <button
            onClick={() => {
              setVisible(false);
              setToUid("");
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              border: "1px solid #aaa",
              background: "#f8f9fa",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
