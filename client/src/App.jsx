import React, { useEffect, useState } from "react";
import Ammu from "./public/mascots/Ammu.webp";
import Mottu from "./public/mascots/Mottu.webp";
import Horse from "./public/mascots/Horse.webp";
import Chikku from "./public/mascots/Chikku.webp";
import Piggu from "./public/mascots/Piggu.webp";
import WonderLaLogo from "./public/mascots/wonderLaLogo.png";

const mascots = [
  { id: "mascot1", name: "Ammu", img: Ammu, candidates: [] },
  { id: "mascot2", name: "Mottu", img: Mottu, candidates: [] },
  { id: "mascot3", name: "Horse", img: Horse, candidates: [] },
  { id: "mascot4", name: "Chikku", img: Chikku, candidates: [] },
  { id: "mascot5", name: "Piggu", img: Piggu, candidates: [] }
];

function svgPlaceholder(label) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='#374151'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function imgErrorHandler(candidates, label, onFinal) {
  return (e) => {
    const el = e.currentTarget;
    const i = Number(el.dataset.fallbackIndex || "0");
    if (i < candidates.length) {
      el.dataset.fallbackIndex = String(i + 1);
      el.src = candidates[i];
    } else {
      el.src = svgPlaceholder(label);
      if (onFinal) onFinal();
    }
  };
}

export default function App() {
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [missingAssets, setMissingAssets] = useState(false);

  async function fetchVotes() {
    setError("");
    try {
      const res = await fetch("/api/votes");
      const data = await res.json();
      setVotes(data);
    } catch (e) {
      setError("Failed to load votes");
    }
  }

  useEffect(() => {
    fetchVotes();
  }, []);

  async function vote(id) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mascotId: id })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Vote failed");
      } else {
        setVotes(data);
      }
    } catch (e) {
      setError("Vote failed");
    } finally {
      setLoading(false);
    }
  }

  const container = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
  };
  const bgWrap = {
    minHeight: "100vh",
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url('/backgrounds/park.jpg'), url('/backgrounds/park.svg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  };
  const hero = {
    marginTop: 10,
    marginBottom: 28,
    borderRadius: 16,
    padding: "48px 28px",
    background: "linear-gradient(135deg, #111827 0%, #1f2937 45%, #0ea5e9 100%)",
    color: "white",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10
  };
  const heroTitle = {
    fontSize: "clamp(28px, 6vw, 56px)",
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
    fontWeight: 800
  };
  const heroRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap"
  };
  const logoStyle = {
    height: "clamp(36px, 6vw, 60px)",
    width: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))"
  };
  const heroSubtitle = {
    opacity: 0.9,
    maxWidth: 720,
    fontSize: "clamp(14px, 2.2vw, 18px)"
  };
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 20
  };
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 8px 16px rgba(0,0,0,0.06)",
    background: "white",
    transition: "transform 160ms ease, box-shadow 160ms ease"
  };
  const img = { width: "100%", height: 160, objectFit: "cover", display: "block" };
  const body = { padding: 14, display: "flex", flexDirection: "column", gap: 10 };
  const row = { display: "flex", alignItems: "center", justifyContent: "space-between" };
  const btn = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    transition: "transform 120ms ease, background 120ms ease"
  };
  const badge = {
    padding: "4px 8px",
    borderRadius: 9999,
    background: "#f3f4f6",
    fontWeight: 600
  };

  return (
    <div style={bgWrap}>
      <div style={container}>
      <div style={hero}>
          <div style={heroRow}>
            <img
              src={WonderLaLogo}
              alt="Logo"
              style={logoStyle}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div style={heroTitle}>Vote your Mascot</div>
          </div>
      </div>
      {error ? <div style={{ color: "crimson", marginBottom: 10 }}>{error}</div> : null}
        {missingAssets ? (
          <div style={{ marginBottom: 12, padding: 12, border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 12, color: "#92400e" }}>
            Mascot images not found. Add files under /client/public/mascots/ with names like elephant.webp/png/jpg, monkey.webp/png/jpg, lion.webp/png/jpg, rabbit.webp/png/jpg, pig.webp/png/jpg. Then refresh.
          </div>
        ) : null}
      <div style={grid}>
        {mascots.map((m) => (
          <div
            key={m.id}
            style={card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
            }}
          >
            <img
              src={m.img}
              alt={m.name}
              style={img}
                onError={imgErrorHandler(m.candidates, m.name, () => setMissingAssets(true))}
            />
            <div style={body}>
              <div style={row}>
                <div style={badge}>{votes[m.id] || 0}</div>
              </div>
              <button
                onClick={() => vote(m.id)}
                style={btn}
                disabled={loading}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {loading ? "Submitting..." : "Vote"}
              </button>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
