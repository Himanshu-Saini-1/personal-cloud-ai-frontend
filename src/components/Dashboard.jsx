import React, { useState } from "react";
import UploadEncrypted from "./UploadEncrypted";
import FileList from "./FileList";

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Callback runs after file successfully uploads
  const handleUploaded = ({ fileId, dekRawB64 }) => {
    console.log("New file uploaded:", fileId);

    // trigger file list to reload
    setRefreshKey((k) => k + 1);

    // store DEK for potential future sharing (optional)
    if (dekRawB64) {
      localStorage.setItem(`dek-${fileId}`, dekRawB64);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "auto" }}>
      <h2>Personal Cloud Dashboard</h2>
      <p>Upload encrypted files, then share or view them here.</p>

      {/* Upload Section */}
      <UploadEncrypted onUploaded={handleUploaded} />

      {/* File List Section */}
      <FileList refreshKey={refreshKey} />
    </div>
  );
}
