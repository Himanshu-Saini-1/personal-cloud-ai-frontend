// import React, { useEffect, useState } from "react";
// import api from "../api/apiClient";
// import {
//   importPrivateKeyPem,
//   rsaDecryptBase64,
//   aesGcmDecrypt,
//   uint8ArrayToBase64,
// } from "../crypto/cryptoUtils";
// import { getOwnPrivateKeyPem } from "../utils/storage";

// export default function FileList({ refreshKey }) {
//   const [files, setFiles] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [curUid, setCurUid] = useState(null);

//   useEffect(() => {
//     import("firebase/auth").then(({ getAuth }) => {
//       const auth = getAuth();
//       if (auth.currentUser) setCurUid(auth.currentUser.uid);
//       // also listen for changes if you prefer
//     });
//   }, []);

//   useEffect(() => {
//     fetchFiles();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [refreshKey, curUid]);

//   async function fetchFiles() {
//     setLoading(true);
//     try {
//       const res = await api.get("/files/");
//       // attach current uid to each file for helper decrypt functions
//       const list = res.data.map((f) => ({ ...f, currentUid: curUid }));
//       setFiles(list);
//     } catch (err) {
//       console.error("Fetch files error", err);
//       setFiles([]);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function deleteFile(fileId) {
//     if (!confirm("Delete this file?")) return;
//     try {
//       await api.delete(`/files/${fileId}`);
//       alert("Deleted");
//       fetchFiles();
//     } catch (err) {
//       console.error("Delete failed", err);
//       alert("Delete failed: " + (err?.response?.data?.error || err.message));
//     }
//   }

//   // Download the object (encrypted) via presigned URL (backend endpoint returns downloadUrl)
//   async function downloadEncrypted(fileId) {
//     try {
//       const res = await api.get(`/files/download/${fileId}`);
//       const url = res.data?.downloadUrl;
//       if (!url) return alert("No download URL");
//       // open in new tab
//       window.open(url, "_blank");
//     } catch (err) {
//       console.error(err);
//       alert("Download failed: " + err.message);
//     }
//   }

//   // Download & decrypt file in browser (requires private key stored locally)
//   async function downloadDecrypted(file) {
//     try {
//       const privatePem = getOwnPrivateKeyPem();
//       if (!privatePem)
//         return alert(
//           "No private key found. Generate & save private key first."
//         );

//       // find dekWrapped entry for current user
//       const entry = (file.dekWrapped || []).find((e) => e.forUid === curUid);
//       if (!entry) return alert("No wrapped DEK for you (not shared)");

//       // import private key and decrypt wrapped DEK
//       const privKey = await importPrivateKeyPem(privatePem);
//       const dekRaw = await rsaDecryptBase64(entry.wrapped, privKey); // Uint8Array

//       // Fetch presigned url for raw object
//       const pres = await api.get(`/files/download/${file._id}`);
//       const url = pres.data?.downloadUrl;
//       if (!url) throw new Error("No download URL");

//       // get encrypted blob
//       const blobRes = await fetch(url);
//       const encryptedArrayBuffer = await blobRes.arrayBuffer();
//       const encryptedU8 = new Uint8Array(encryptedArrayBuffer);

//       // decrypt using AES-GCM; file.contentIv is base64 (ensure)
//       const plainU8 = await aesGcmDecrypt(
//         uint8ArrayToBase64(encryptedU8),
//         file.contentIv,
//         dekRaw
//       );
//       // create a blob and download
//       const blob = new Blob([plainU8], {
//         type: file.mimeType || "application/octet-stream",
//       });
//       const a = document.createElement("a");
//       a.href = URL.createObjectURL(blob);
//       a.download = file.originalNameHint || "download";
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(a.href);
//     } catch (err) {
//       console.error("Decrypt download failed", err);
//       alert("Decrypt download failed: " + (err?.message || err));
//     }
//   }

//   // Decrypt and display filename (if possible)
//   async function decryptName(file) {
//     try {
//       const privatePem = getOwnPrivateKeyPem();
//       if (!privatePem) return null;
//       const entry = (file.dekWrapped || []).find((e) => e.forUid === curUid);
//       if (!entry) return null;
//       const privKey = await importPrivateKeyPem(privatePem);
//       const dekRaw = await rsaDecryptBase64(entry.wrapped, privKey);
//       const nameU8 = await aesGcmDecrypt(file.nameEnc, file.nameIv, dekRaw);
//       return new TextDecoder().decode(nameU8);
//     } catch (err) {
//       console.warn("Name decrypt failed:", err.message);
//       return null;
//     }
//   }

//   // UI render
//   return (
//     <div>
//       <h3>Your Files</h3>
//       {loading && <div>Loading...</div>}
//       {!loading && files.length === 0 && <div>No files found.</div>}
//       <ul style={{ paddingLeft: 0 }}>
//         {files.map((f) => (
//           <li
//             key={f._id}
//             style={{
//               listStyle: "none",
//               padding: 8,
//               borderBottom: "1px solid #eee",
//             }}
//           >
//             <strong>
//               <DecryptedFileName file={f} decryptName={decryptName} />
//             </strong>
//             <div style={{ marginTop: 6, fontSize: 13, color: "#666" }}>
//               <span style={{ marginRight: 12 }}>Size: {f.size ?? "-"}</span>
//               <button
//                 onClick={() => downloadEncrypted(f._id)}
//                 style={{ marginRight: 8 }}
//               >
//                 Download (Encrypted)
//               </button>
//               <button
//                 onClick={() => downloadDecrypted(f)}
//                 style={{ marginRight: 8 }}
//               >
//                 Download (Decrypted)
//               </button>
//               <button
//                 onClick={() => {
//                   navigator.clipboard.writeText(f._id);
//                   alert("Copied file id");
//                 }}
//                 style={{ marginRight: 8 }}
//               >
//                 Copy ID
//               </button>
//               <button
//                 onClick={() => deleteFile(f._id)}
//                 style={{ marginRight: 8 }}
//               >
//                 Delete
//               </button>
//               <button
//                 onClick={() =>
//                   window.dispatchEvent(
//                     new CustomEvent("openShareModal", {
//                       detail: { fileId: f._id },
//                     })
//                   )
//                 }
//               >
//                 Share
//               </button>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// function DecryptedFileName({ file, decryptName }) {
//   const [name, setName] = useState(null);
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         const n = await decryptName(file);
//         if (mounted && n) setName(n);
//       } catch (err) {
//         console.warn("Failed to decrypt filename:", err.message);
//       }
//     })();
//     return () => (mounted = false);
//   }, [file, decryptName]);
//   return <span>{name || file.originalNameHint || "(encrypted name)"}</span>;
// }
