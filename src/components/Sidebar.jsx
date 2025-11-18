import React from "react";

export default function Sidebar({
  currentTab,
  setCurrentTab,
  open = false,
  onClose = () => {},
}) {
  const baseStyle = {
    padding: 18,
    width: 240,
  };

  return (
    <>
      {/* Desktop sidebar (hidden on small screens by CSS) */}
      <aside className="sidebar" aria-hidden={false}>
        <div className="side-brand">Welcome</div>
        <nav className="side-nav">
          <div
            className={`side-item ${currentTab === "upload" ? "active" : ""}`}
            onClick={() => setCurrentTab("upload")}
          >
            📤 Upload
          </div>

          <div
            className={`side-item ${currentTab === "files" ? "active" : ""}`}
            onClick={() => setCurrentTab("files")}
          >
            📁 Files
          </div>
        </nav>
      </aside>

      {/* Mobile drawer — rendered when `open===true` */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10010,
            display: "flex",
          }}
        >
          <div
            style={{
              width: 280,
              background: "linear-gradient(180deg,var(--accent), #1f4850)",
              color: "#fff",
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <strong>Menu</strong>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                className={`side-item ${
                  currentTab === "upload" ? "active" : ""
                }`}
                onClick={() => {
                  setCurrentTab("upload");
                  onClose();
                }}
              >
                📤 Upload
              </div>
              <div
                className={`side-item ${
                  currentTab === "files" ? "active" : ""
                }`}
                onClick={() => {
                  setCurrentTab("files");
                  onClose();
                }}
              >
                📁 Files
              </div>
            </div>
          </div>

          <div
            onClick={onClose}
            style={{ flex: 1, background: "rgba(0,0,0,0.35)" }}
          />
        </div>
      )}
    </>
  );
}
