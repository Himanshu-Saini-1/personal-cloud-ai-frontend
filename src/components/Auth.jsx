
import React from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function Auth({ onUser }) {
  const handleGoogleSignIn = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      // 🔥 Always show account chooser
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      onUser(result.user);
    } catch (err) {
      console.error("Google Login failed:", err);
      alert("Login failed: " + err.message);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #244855, #E64833)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "40px 50px",
          width: "380px",
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          animation: "fadeIn 0.5s ease-out",
        }}
      >
        <h1
          style={{
            marginBottom: "10px",
            color: "#244855",
            fontSize: "26px",
            fontWeight: "700",
          }}
        >
          ☁️ Personal Cloud AI
        </h1>

        <p style={{ color: "#666", marginBottom: "30px", fontSize: "14px" }}>
          Secure, Encrypted Personal Cloud — powered by Google Login
        </p>

        <button
          onClick={handleGoogleSignIn}
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "50px",
            padding: "12px 18px",
            width: "100%",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "0.25s",
            boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-3px)";
            e.target.style.boxShadow = "0 6px 15px rgba(0,0,0,0.25)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0px)";
            e.target.style.boxShadow = "0 3px 8px rgba(0,0,0,0.12)";
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google Icon"
            style={{ width: "24px", height: "24px" }}
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
