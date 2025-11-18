import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import { getOwnPrivateKeyPem } from "../utils/storage";
import {
  importPrivateKeyPem,
  rsaDecryptBase64,
  aesGcmDecrypt,
} from "../crypto/cryptoUtils";

export default function FileListGrid({ refreshKey }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [curUid, setCurUid] = useState(null);

  useEffect(() => {
    import("firebase/auth").then(({ getAuth }) => {
      const auth = getAuth();
      if (auth.currentUser) setCurUid(auth.currentUser.uid);
    });
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [refreshKey]);

  async function fetchFiles() {
    setLoading(true);
    try {
      const res = await api.get("/files");
      setFiles(res.data);
    } catch (err) {
      console.error("Fetch files error", err);
    } finally {
      setLoading(false);
    }
  }

  async function decryptName(file) {
    try {
      const privatePem = getOwnPrivateKeyPem();
      if (!privatePem) return file.originalNameHint || "(No key)";
      const entry = (file.dekWrapped || []).find((e) => e.forUid === curUid);
      if (!entry) return file.originalNameHint || "(Not shared)";
      const privKey = await importPrivateKeyPem(privatePem);
      const dekRaw = await rsaDecryptBase64(entry.wrapped, privKey);
      const plainU8 = await aesGcmDecrypt(file.nameEnc, file.nameIv, dekRaw);
      return new TextDecoder().decode(plainU8);
    } catch {
      return file.originalNameHint || "(encrypted)";
    }
  }

  async function handleDownload(fileId) {
    try {
      const res = await api.get(`/files/download/${fileId}`);
      window.open(res.data.downloadUrl, "_blank");
    } catch (err) {
      console.error("Error:Download failed", err);
      //   alert("Download failed");
    }
  }

  return (
    <div style={{ marginLeft: 240, padding: 24 }}>
      <h3>Your Files</h3>
      {loading && <p>Loading...</p>}

      {!loading && files.length === 0 && <p>No files uploaded yet.</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {files.map((file) => (
          <FileCard
            key={file._id}
            file={file}
            decryptName={decryptName}
            handleDownload={handleDownload}
          />
        ))}
      </div>
    </div>
  );
}

function FileCard({ file, decryptName, handleDownload }) {
  const [name, setName] = useState(null);

  useEffect(() => {
    (async () => {
      const n = await decryptName(file);
      setName(n);
    })();
  }, [file]);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        background: "#fff",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 40 }}>📄</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: "bold",
          color: "#244855",
          marginTop: 8,
        }}
      >
        {name || file.originalNameHint || "Unnamed File"}
      </div>
      <button
        onClick={() => handleDownload(file._id)}
        style={{
          marginTop: 10,
          background: "#244855",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "6px 10px",
          cursor: "pointer",
        }}
      >
        Download
      </button>
    </div>
  );
}
