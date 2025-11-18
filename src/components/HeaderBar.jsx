import React from "react";

export default function HeaderBar({ user, onMenuClick }) {
  return (
    <header className="header" role="banner">
      <div className="header-left">
        <button
          className="hamburger-btn"
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          ☰
        </button>

        <div className="brand" style={{ color: "#fff" }}>
          <div className="logo">PC</div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Personal Cloud</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)" }}>
              Secure & Private
            </div>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div className="user-pill" title={user?.email || ""}>
          <div style={{ fontSize: 14 }}>👋</div>
          <div className="user-name">{user?.displayName || user?.email}</div>
        </div>

        <button
          className="btn btn-accent"
          onClick={() => {
            // keep logic same: sign out using firebase (no change to behavior)
            import("firebase/auth").then(({ getAuth, signOut }) => {
              const auth = getAuth();
              signOut(auth).catch(() => {});
              // clear local keys (visual only)
              import("../utils/storage")
                .then((m) => m.clearKeys())
                .catch(() => {});
            });
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
