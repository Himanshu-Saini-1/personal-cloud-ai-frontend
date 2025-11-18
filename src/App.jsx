import "./firebaseConfig";
// import React, { useState, useEffect } from "react";
// import { getAuth, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";

// import Auth from "./components/Auth";
// import PublishPubKey from "./components/PublishPubKey";
// import UploadEncrypted from "./components/UploadEncrypted";
// import FileCardGrid from "./components/FileCardGrid";
// import HeaderBar from "./components/HeaderBar";
// import Sidebar from "./components/Sidebar";
// import ShareModal from "./components/ShareModal";

// import { restoreEncryptedPrivateKey } from "./utils/restoreKey";
// import { getOwnPrivateKeyPem, getOwnPubKeyPem } from "./utils/storage";

// export default function App() {
//   const [user, setUser] = useState(null);
//   const [pubKeyReady, setPubKeyReady] = useState(false);
//   const [refreshKey, setRefreshKey] = useState(0);
//   const [currentTab, setCurrentTab] = useState("upload");

//   const [drawerVisible, setDrawerVisible] = useState(false);

//   useEffect(() => {
//     const auth = getAuth();

//     const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
//       setUser(firebaseUser);

//       if (!firebaseUser) {
//         console.log("⚠ User logged out — clearing UI states");
//         setPubKeyReady(false);
//         return;
//       }

//       console.log("🔐 User logged in:", firebaseUser.uid);
//       console.log("🔄 Restoring encrypted private key from backend…");

//       // Try to restore the encrypted private key into localStorage
//       await restoreEncryptedPrivateKey(firebaseUser.uid);

//       // Check if private + pub keys now exist in browser
//       const priv = getOwnPrivateKeyPem();
//       const pub = getOwnPubKeyPem();

//       if (priv && pub) {
//         console.log("✅ Keys restored. pubKeyReady = true");
//         setPubKeyReady(true);
//       } else {
//         console.log("⚠ Keys missing. pubKeyReady = false");
//         setPubKeyReady(false);
//       }
//     });

//     return () => unsub();
//   }, []);

//   const handleUploaded = () => {
//     setRefreshKey((k) => k + 1);
//   };

//   if (!user) {
//     return <Auth onUser={(u) => setUser(u)} />;
//   }
//   //   return (
//   //     <div>
//   //       <HeaderBar user={user} />
//   //       <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

//   //       <main
//   //         style={{
//   //           marginLeft: 240,
//   //           padding: 24,
//   //           minHeight: "100vh",
//   //           background: "#f8f9fa",
//   //         }}
//   //       >
//   //         {/* ---------------- UPLOAD TAB ---------------- */}
//   //         {currentTab === "upload" && (
//   //           <>
//   //             {!pubKeyReady ? (
//   //               <PublishPubKey onPublished={() => setPubKeyReady(true)} />
//   //             ) : (
//   //               <UploadEncrypted onUploaded={handleUploaded} />
//   //             )}
//   //             <ShareModal />
//   //           </>
//   //         )}

//   //         {/* ---------------- FILES TAB ---------------- */}
//   //         {currentTab === "files" && <FileCardGrid refreshKey={refreshKey} />}

//   //         {/* ---------------- DASHBOARD TAB ---------------- */}
//   //         {currentTab === "dashboard" && (
//   //           <div>
//   //             <h2>Welcome back, {user.displayName || user.email} 👋</h2>
//   //             <p>Your encrypted personal cloud is ready.</p>
//   //           </div>
//   //         )}
//   //       </main>
//   //     </div>
//   //   );
//   // }

//   return (
//     <div>
//       <HeaderBar
//         user={user}
//         onToggleSidebar={() => setDrawerVisible((v) => !v)}
//       />

//       <div className="pca-layout">
//         <Sidebar
//           currentTab={currentTab}
//           setCurrentTab={setCurrentTab}
//           visible={drawerVisible}
//           onClose={() => setDrawerVisible(false)}
//         />

//         <main
//           className="pca-main"
//           style={{ marginLeft: window.innerWidth > 720 ? 240 : 0 }}
//         >
//           {currentTab === "upload" && (
//             <>
//               {!pubKeyReady ? (
//                 <PublishPubKey onPublished={() => setPubKeyReady(true)} />
//               ) : (
//                 <UploadEncrypted onUploaded={handleUploaded} />
//               )}
//               <ShareModal />
//             </>
//           )}
//           {currentTab === "files" && <FileCardGrid refreshKey={refreshKey} />}
//         </main>
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import HeaderBar from "./components/HeaderBar";
import Sidebar from "./components/Sidebar";
import Auth from "./components/Auth";
import PublishPubKey from "./components/PublishPubKey";
import UploadEncrypted from "./components/UploadEncrypted";
import FileCardGrid from "./components/FileCardGrid";
import ShareModal from "./components/ShareModal";
import "./styles/ui.css";
import { restoreEncryptedPrivateKey } from "./utils/restoreKey";
import { getOwnPrivateKeyPem, getOwnPubKeyPem } from "./utils/storage";

export default function App() {
  const [user, setUser] = useState(null);
  const [pubKeyReady, setPubKeyReady] = useState(false);
  const [currentTab, setCurrentTab] = useState("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        console.log("⚠ User logged out — clearing UI states");
        setPubKeyReady(false);
        return;
      }

      console.log("🔐 User logged in:", firebaseUser.uid);
      console.log("🔄 Restoring encrypted private key from backend…");

      // Try to restore the encrypted private key into localStorage
      await restoreEncryptedPrivateKey(firebaseUser.uid);

      // Check if private + pub keys now exist in browser
      const priv = getOwnPrivateKeyPem();
      const pub = getOwnPubKeyPem();

      if (priv && pub) {
        console.log("✅ Keys restored. pubKeyReady = true");
        setPubKeyReady(true);
      } else {
        console.log("⚠ Keys missing. pubKeyReady = false");
        setPubKeyReady(false);
      }
    });

    return () => unsub();
  }, []);

  const handleUploaded = () => {
    setRefreshKey((k) => k + 1);
  };

  if (!user) {
    return <Auth onUser={(u) => setUser(u)} />;
  }
  return (
    <div className="app-shell">
      <HeaderBar user={user} onMenuClick={() => setSidebarOpen(true)} />

      <div className="shell-body">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="main">
          {/* center panel */}
          <div className="panel">
            {currentTab === "upload" && (
              <>
                {!pubKeyReady ? (
                  <PublishPubKey onPublished={() => setPubKeyReady(true)} />
                ) : (
                  <UploadEncrypted onUploaded={handleUploaded} />
                )}
                <ShareModal />
              </>
            )}

            {currentTab === "files" && <FileCardGrid refreshKey={refreshKey} />}
          </div>
        </main>
      </div>
    </div>
  );
}
