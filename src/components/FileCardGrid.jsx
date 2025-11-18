import React, { useEffect, useState } from "react";
import api from "../api/apiClient";
import { getAuth } from "firebase/auth";
import { getOwnPrivateKeyPem } from "../utils/storage";
import {
  importPrivateKeyPem,
  rsaDecryptBase64,
  aesGcmDecrypt,
  aesGcmDecryptToBlob,
} from "../crypto/cryptoUtils";
import { saveAs } from "file-saver";
import "./FileCategories.css";

export default function FileCardGrid({ refreshKey }) {
  const [files, setFiles] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [curUid, setCurUid] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) setCurUid(auth.currentUser.uid);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [refreshKey]);

  async function fetchFiles() {
    setLoading(true);
    try {
      const res = await api.get("/files/");
      setFiles(res.data);
    } catch (err) {
      console.error("Fetch files failed:", err);
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------
      CATEGORY DETECTION
  -------------------------------------------------------*/
  function getCategory(name) {
    if (!name) return "Others";
    const n = name.toLowerCase();

    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(n)) return "Images";
    if (/\.(mp4|mov|avi|mkv|webm)$/i.test(n)) return "Videos";
    if (/\.(pdf|doc|docx|txt|ppt|pptx|xls|xlsx)$/i.test(n)) return "Documents";

    return "Others";
  }

  /* ------------------------------------------------------
      DECRYPT NAME (same as old working logic)
  -------------------------------------------------------*/
  async function decryptName(meta) {
    try {
      const privatePem = getOwnPrivateKeyPem();
      if (!privatePem) return meta.originalNameHint;

      const privKey = await importPrivateKeyPem(privatePem);

      const entry = meta.dekWrapped?.find((e) => e.forUid === curUid);
      if (!entry) return meta.originalNameHint;

      const dekRaw = await rsaDecryptBase64(entry.wrapped, privKey);

      const plainU8 = await aesGcmDecrypt(meta.nameEnc, meta.nameIv, dekRaw);

      return new TextDecoder().decode(plainU8);
    } catch {
      return meta.originalNameHint;
    }
  }

  /* ------------------------------------------------------
      GROUP BY CATEGORY (AFTER decrypting names)
  -------------------------------------------------------*/
  useEffect(() => {
    async function group() {
      let buckets = { Images: [], Videos: [], Documents: [], Others: [] };

      for (const f of files) {
        const name = await decryptName(f);
        const cat = getCategory(name);

        buckets[cat].push({
          ...f,
          displayName: name,
        });
      }

      setGrouped(buckets);
    }

    if (files.length > 0) group();
  }, [files]);

  /* ------------------------------------------------------
      SEARCH FILTER
  -------------------------------------------------------*/
  function filtered(list) {
    if (!search.trim()) return list;
    return list.filter((f) =>
      f.displayName?.toLowerCase().includes(search.toLowerCase())
    );
  }

  /* ------------------------------------------------------
      OLD WORKING DOWNLOAD (kept unchanged)
  -------------------------------------------------------*/
  async function handleDownload(fileId) {
    try {
      const res = await api.get(`/files/download/${fileId}`);
      const meta = res.data;

      // const encResp = await fetch(meta.downloadUrl);
      // const encBytes = new Uint8Array(await encResp.arrayBuffer());

      const encResp = await api.get(`/files/raw/${fileId}`, {
        responseType: "arraybuffer",
      });

      const encBytes = new Uint8Array(encResp.data);

      const privatePem = getOwnPrivateKeyPem();
      if (!privatePem) return alert("Your private key is missing.");

      const privKey = await importPrivateKeyPem(privatePem);

      const entry = meta.dekWrapped.find((e) => e.forUid === curUid);
      if (!entry) return alert("You do not have access to decrypt this file.");

      const dekRaw = await rsaDecryptBase64(entry.wrapped, privKey);

      const plainBlob = await aesGcmDecryptToBlob(
        encBytes,
        meta.contentIv,
        dekRaw,
        meta.mimeType
      );

      const nameU8 = await aesGcmDecrypt(meta.nameEnc, meta.nameIv, dekRaw);
      const fileName = new TextDecoder().decode(nameU8);

      saveAs(plainBlob, fileName);

      alert("✅ File downloaded & decrypted!");
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to decrypt file: " + err.message);
    }
  }

  /* ------------------------------------------------------
      OLD WORKING DELETE (kept unchanged)
  -------------------------------------------------------*/
  async function handleDelete(fileId) {
    if (!window.confirm("Delete this file?")) return;
    try {
      await api.delete(`/files/${fileId}`);
      fetchFiles();
    } catch {
      alert("Delete failed");
    }
  }

  /* ------------------------------------------------------
      FINAL RETURN UI
  -------------------------------------------------------*/
  return (
    <div>
      <h2>Your Files</h2>

      {/* ⭐ Search Bar */}
      <input
        type="text"
        placeholder="Search files…"
        className="search-input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Loading…</p>}

      {!loading &&
        ["Images", "Videos", "Documents", "Others"].map((cat) => {
          const list = filtered(grouped[cat] || []);
          if (list.length === 0) return null;

          return (
            <CategoryBlock
              key={cat}
              title={cat}
              items={list}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          );
        })}
    </div>
  );
}

/* ======================================================================
   CATEGORY BLOCK
========================================================================*/
function CategoryBlock({ title, items, onDownload, onDelete }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="category-block">
      <div className="category-header" onClick={() => setOpen(!open)}>
        <span className="category-title">{title}</span>
        <span className="category-toggle">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="file-grid">
          {items.map((f) => (
            <FileCard
              key={f._id}
              file={f}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   FILE CARD — with download & delete buttons working
========================================================================*/
function FileCard({ file, onDownload, onDelete }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="file-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="file-icon">📄</div>
      <div className="file-name">{file.displayName}</div>

      {(hover || window.innerWidth < 720) && (
        <div className="card-controls">
          <button
            className="btn btn-primary"
            onClick={() => onDownload(file._id)}
          >
            ⬇ Download
          </button>

          <button className="btn btn-danger" onClick={() => onDelete(file._id)}>
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}
