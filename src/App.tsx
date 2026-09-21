import { useState, useEffect } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Screen = "marketplace" | "upload" | "detail" | "dashboard" | "checkout" | "certificate";
type UploadStage = "idle" | "ai_checking" | "ai_pass" | "ai_fail" | "signing" | "done";
type LicenseType = "standard" | "exclusive";
type CheckoutStage = "summary" | "signing" | "confirmed";

interface TrackData {
  id: number;
  title: string;
  model: string;
  price: string;
  genre: string;
  status: "verified" | "pending" | "rejected";
  plays: string;
  contributors: number;
  date: string;
  similarity?: number;
  rejectReason?: string;
}

// ─── Badge ──────────────────────────────────────────────────────────────────────
function Badge({ children, variant = "verified" }: {
  children: React.ReactNode;
  variant?: "verified" | "primary" | "muted" | "warning" | "danger";
}) {
  const styles = {
    verified: "border border-emerald-500 text-emerald-400 bg-emerald-500/10",
    primary: "border border-blue-500 text-blue-400 bg-blue-500/10",
    muted: "border border-[#30363d] text-[#9CA3AF] bg-[#161b22]",
    warning: "border border-amber-500 text-amber-400 bg-amber-500/10",
    danger: "border border-red-500 text-red-400 bg-red-500/10",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-mono ${styles[variant]}`}>
      {children}
    </span>
  );
}

// ─── Waveform ───────────────────────────────────────────────────────────────────
function Waveform({ color = "#2f80ed", playing = false, seed = 0 }: {
  color?: string; playing?: boolean; seed?: number;
}) {
  const base = [14, 24, 32, 20, 38, 28, 16, 36, 22, 30, 18, 26];
  const heights = base.map((h, i) => {
    const r = ((seed * 17 + i * 31) % 22) - 11;
    return Math.max(6, Math.min(42, h + r));
  });
  return (
    <div className="flex items-center gap-[3px] h-10">
      {heights.map((h, i) => (
        <div key={i} className="w-[3px] rounded-full transition-all" style={{
          height: h, background: color, opacity: playing ? 1 : 0.45,
          animation: playing ? `wave 1.2s ease-in-out ${(i * 0.08).toFixed(2)}s infinite` : "none",
        }} />
      ))}
    </div>
  );
}

// ─── How It Works Modal ─────────────────────────────────────────────────────────
function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-[540px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-white">서비스 작동 방식</h3>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="space-y-4">
          {[
            { num: "01", title: "AI 유사도 검증", desc: "LAION-CLAP 모델로 512-dim 오디오 임베딩을 추출하고, 등록 음원 벡터 DB(온체인 CID 앵커)와 코사인 유사도를 비교합니다. 85% 초과 시 표절 판정 → 등록 차단.", icon: "🔍", color: "#2f80ed" },
            { num: "02", title: "온체인 Mint", desc: "검증 통과 시 창작 이력(프롬프트·기여도·검증 해시)이 IPFS에 저장되고, ERC-1155 NFT로 Polygon Amoy 테스트넷에 영구 기록됩니다.", icon: "⛓", color: "#7c3aed" },
            { num: "03", title: "스마트 컨트랙트 거래", desc: "구매 즉시 에스크로 컨트랙트가 수익을 프롬프트 엔지니어·보이스 제공자·플랫폼에 자동 분배합니다. 분쟁 발생 시 14일 동결 후 운영자 심사.", icon: "⚡", color: "#10b981" },
          ].map((s, i, arr) => (
            <div key={s.num} className="flex gap-4">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border" style={{ background: `${s.color}15`, borderColor: `${s.color}40` }}>{s.icon}</div>
                {i < arr.length - 1 && <div className="w-px flex-1 bg-[#21262d] min-h-[16px]"></div>}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono" style={{ color: s.color }}>Step {s.num}</span>
                  <span className="text-sm font-semibold text-white">{s.title}</span>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[#21262d]">
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            Polygon Network (Amoy) · Web3Auth AA 지갑 · LAION-CLAP gatekeeper-v2.1
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GNB ───────────────────────────────────────────────────────────────────────
function GNB({ screen, setScreen, walletConnected, setWalletConnected, showWalletModal, setShowWalletModal, showHowItWorks, setShowHowItWorks }: {
  screen: Screen; setScreen: (s: Screen) => void;
  walletConnected: boolean; setWalletConnected: (v: boolean) => void;
  showWalletModal: boolean; setShowWalletModal: (v: boolean) => void;
  showHowItWorks: boolean; setShowHowItWorks: (v: boolean) => void;
}) {
  const navItems: { id: Screen; label: string }[] = [
    { id: "marketplace", label: "Explore" },
    { id: "upload", label: "Upload" },
    { id: "dashboard", label: "Dashboard" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 mr-8">
          <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10 Q7 2 12 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              <circle cx="7" cy="5" r="1.5" fill="white"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Track-AI</span>
        </div>
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setScreen(item.id)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${screen === item.id ? "text-white bg-[#21262d]" : "text-[#9CA3AF] hover:text-[#e6edf3]"}`}>
              {item.label}
            </button>
          ))}
          <button onClick={() => setShowHowItWorks(true)} className="px-3 py-1.5 rounded text-sm transition-colors text-[#9CA3AF] hover:text-[#e6edf3]">
            How it works
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-white hover:bg-gray-100 text-gray-800 text-xs font-medium transition-colors border border-gray-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            구글로 3초 만에 시작하기
          </button>
          {walletConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#161b22] border border-[#30363d]">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-mono text-[#e6edf3]">0x3a7f...c4d2</span>
            </div>
          ) : (
            <button onClick={() => setShowWalletModal(true)} className="px-4 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors">
              지갑 연결
            </button>
          )}
        </div>
      </header>

      {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}

      {showWalletModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWalletModal(false)}>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-[360px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">지갑 연결</h3>
              <button onClick={() => setShowWalletModal(false)} className="text-[#9CA3AF] hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="space-y-2">
              {[
                { name: "Web3Auth (Google)", icon: "🔵", desc: "소셜 로그인 · AA 지갑 · 가스비 대납" },
                { name: "MetaMask", icon: "🦊", desc: "Browser Extension" },
                { name: "WalletConnect", icon: "🔗", desc: "Mobile & Desktop" },
              ].map(w => (
                <button key={w.name} onClick={() => { setWalletConnected(true); setShowWalletModal(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1c2128] hover:bg-[#21262d] border border-[#30363d] transition-colors">
                  <span className="text-xl">{w.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">{w.name}</div>
                    <div className="text-xs text-[#9CA3AF]">{w.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Track Data ─────────────────────────────────────────────────────────────────
const tracks: TrackData[] = [
  { id: 1, title: "Neon Cascade", model: "Suno v4.5", price: "50 POL", genre: "Electronic", status: "verified", plays: "2.4k", contributors: 2, date: "2025-11-03" },
  { id: 2, title: "Ambient Drift 01", model: "Udio v2", price: "30 POL", genre: "Ambient", status: "verified", plays: "1.8k", contributors: 1, date: "2025-10-14" },
  { id: 3, title: "Lo-Fi Morning", model: "Suno v4.5", price: "80 POL", genre: "Lo-Fi", status: "verified", plays: "5.1k", contributors: 2, date: "2025-09-22" },
  { id: 4, title: "Synthetic Pulse", model: "Stable Audio 2.0", price: "60 POL", genre: "Techno", status: "pending", plays: "—", contributors: 1, date: "2026-01-05" },
  { id: 5, title: "Void Echoes", model: "Udio v2", price: "40 POL", genre: "Dark Ambient", status: "verified", plays: "920", contributors: 3, date: "2025-12-08" },
  { id: 6, title: "Solar Wind", model: "Suno v4.5", price: "120 POL", genre: "Cinematic", status: "rejected", plays: "—", contributors: 2, date: "2026-01-11", similarity: 91, rejectReason: "'Orion Drift'와 근사 복제 의심" },
];

// ─── Track Card ─────────────────────────────────────────────────────────────────
function TrackCard({ track, onClick, onBuy }: { track: TrackData; onClick: () => void; onBuy: () => void }) {
  const [playing, setPlaying] = useState(false);
  const isVerified = track.status === "verified";
  const isPending = track.status === "pending";
  const isRejected = track.status === "rejected";

  return (
    <div onClick={onClick}
      className={`bg-[#161b22] border rounded-xl overflow-hidden transition-all group cursor-pointer ${isRejected ? "border-red-500/30 opacity-80" : isPending ? "border-amber-500/30" : "border-[#21262d] hover:border-[#30363d]"}`}>
      <div className="h-28 bg-gradient-to-br from-[#1c2128] to-[#0d1117] relative flex items-center justify-center">
        <div className="absolute inset-0 opacity-20" style={{ background: isRejected ? "radial-gradient(ellipse at 30% 50%, #ef444433 0%, transparent 70%)" : isPending ? "radial-gradient(ellipse at 30% 50%, #f59e0b33 0%, transparent 70%)" : "radial-gradient(ellipse at 30% 50%, #2f80ed33 0%, transparent 70%)" }} />
        {isVerified ? (
          <button onClick={e => { e.stopPropagation(); setPlaying(!playing); }}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors z-10">
            {playing ? <svg width="12" height="12" viewBox="0 0 12 12" fill="white"><rect x="1" y="1" width="4" height="10" rx="1"/><rect x="7" y="1" width="4" height="10" rx="1"/></svg>
              : <svg width="12" height="12" viewBox="0 0 12 12" fill="white"><path d="M3 2L10 6L3 10V2Z"/></svg>}
          </button>
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 text-lg ${isPending ? "bg-amber-500/10 border border-amber-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
            {isPending ? "⏳" : "✗"}
          </div>
        )}
        <div className="absolute bottom-3 left-4 right-4">
          <Waveform seed={track.id} playing={playing} color={isRejected ? "#ef4444" : isPending ? "#f59e0b" : "#2f80ed"} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className={`text-sm font-semibold text-white ${isVerified ? "group-hover:text-blue-400" : ""} transition-colors`}>{track.title}</h3>
            <span className="text-xs text-[#9CA3AF] font-mono">{track.model}</span>
          </div>
          <div>
            {isVerified && <Badge variant="verified">✓ AI Verified</Badge>}
            {isPending && <Badge variant="warning">⏳ 검증 중</Badge>}
            {isRejected && <Badge variant="danger">✗ 등록 차단</Badge>}
          </div>
        </div>
        {isRejected && (
          <div className="text-[10px] text-red-400 font-mono bg-red-500/5 border border-red-500/20 rounded px-2 py-1 mb-2">
            유사도 {track.similarity}% — {track.rejectReason}
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#9CA3AF] bg-[#1c2128] px-2 py-0.5 rounded font-mono">{track.genre}</span>
          {isVerified && <span className="text-xs text-[#9CA3AF]">▶ {track.plays}</span>}
          <span className="text-xs text-[#9CA3AF] ml-auto">👥 {track.contributors}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-[#21262d]">
          <div>
            {isVerified ? <div className="text-sm font-semibold text-white">{track.price}</div>
              : <div className="text-xs text-[#9CA3AF] font-mono">{isPending ? "검증 대기 중" : "등록 거부됨"}</div>}
          </div>
          {isVerified && (
            <button onClick={e => { e.stopPropagation(); onBuy(); }}
              className="px-3 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-white text-xs font-medium transition-all">
              라이선스 구매
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Marketplace ────────────────────────────────────────────────────────────────
function MarketplaceScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const genres = ["All", "Electronic", "Ambient", "Lo-Fi", "Cinematic", "Techno", "Dark Ambient"];
  const filtered = tracks.filter(t =>
    (filter === "All" || t.genre === filter) &&
    (search === "" || t.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="pt-14 min-h-screen">
      <div className="px-6 py-12 border-b border-[#21262d]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#30363d] bg-[#161b22] text-xs text-[#9CA3AF] font-mono mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            Polygon Network (Amoy) · 1,247 트랙 온체인 등록
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            프롬프트·보이스·편집,<br />
            <span className="text-blue-400">기여한 만큼 자동 정산되는 AI 음원 마켓</span>
          </h1>
          <p className="text-[#9CA3AF] text-sm mb-7 max-w-lg mx-auto">
            모든 음원은 AI 유사도 검증 후 블록체인에 기록되며, 스마트 컨트랙트로 기여자에게 즉시 분배됩니다.
          </p>
          <div className="relative max-w-lg mx-auto">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="트랙 제목, AI 모델, 장르 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#161b22] border border-[#30363d] text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>
      </div>
      <div className="border-b border-[#21262d] bg-[#0d1117]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6 text-xs font-mono text-[#9CA3AF]">
          {[["Total Volume", "842,400 POL"], ["트랙 등록", "1,247"], ["검증 통과율", "94.2%"], ["활성 크리에이터", "386명"]].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2"><span>{k}</span><span className="text-white font-semibold">{v}</span></div>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-6">
          {genres.map(g => (
            <button key={g} onClick={() => setFilter(g)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filter === g ? "bg-blue-500 text-white" : "bg-[#161b22] text-[#9CA3AF] hover:text-white border border-[#21262d] hover:border-[#30363d]"}`}>
              {g}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(track => (
            <TrackCard key={track.id} track={track} onClick={() => setScreen("detail")} onBuy={() => setScreen("checkout")} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI Checking View ───────────────────────────────────────────────────────────
function AICheckingView({ fileName, failMode, onDone }: {
  fileName: string; failMode: boolean; onDone: (r: "pass" | "fail") => void;
}) {
  const [checkStep, setCheckStep] = useState(0);
  const [compareCount, setCompareCount] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setCheckStep(1), 500);
    const t2 = setTimeout(() => setCheckStep(2), 1400);
    const t3 = setTimeout(() => setCheckStep(3), 2500);
    const tCount = setTimeout(() => {
      let c = 0;
      const iv = setInterval(() => { c = Math.min(c + 52, 1247); setCompareCount(c); if (c >= 1247) clearInterval(iv); }, 80);
    }, 2300);
    const t4 = setTimeout(() => onDone(failMode ? "fail" : "pass"), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(tCount); clearTimeout(t4); };
  }, []);

  const steps = [
    { label: "오디오 특징 추출", sub: "20 MFCC · 128 mel bands · 44.1kHz", done: checkStep >= 1 },
    { label: "LAION-CLAP 임베딩", sub: "512-dim 오디오-텍스트 벡터 생성", done: checkStep >= 2 },
    { label: "벡터 DB 코사인 유사도 비교", sub: `${compareCount.toLocaleString()} / 1,247건`, done: checkStep >= 3 },
  ];

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-5" style={{ animationDuration: "1s" }}></div>
          <h2 className="text-xl font-bold text-white mb-2">AI 유사도 검증 중</h2>
          <p className="text-sm text-[#9CA3AF]"><span className="font-mono text-blue-400">{fileName}</span> 분석 중입니다</p>
        </div>
        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#21262d] bg-[#1c2128]">
            <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">gatekeeper-v2.1 · LAION-CLAP</span>
          </div>
          <div className="p-6 space-y-4">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 flex-shrink-0 w-8">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${step.done ? "bg-emerald-500/10 border-emerald-500/30" : checkStep === i ? "border-blue-500/50 bg-blue-500/5" : "border-[#30363d] bg-[#1c2128]"}`}>
                    {step.done ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5L5 9L9.5 3.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : checkStep === i ? <div className="w-3 h-3 rounded-full border border-blue-400 border-t-transparent animate-spin" style={{ animationDuration: "0.8s" }}></div>
                      : <span className="text-[10px] font-mono text-[#484f58]">{i + 1}</span>}
                  </div>
                  {i < steps.length - 1 && <div className="w-px h-4 bg-[#21262d]"></div>}
                </div>
                <div className="flex-1 pt-1">
                  <div className={`text-sm font-medium transition-colors ${step.done ? "text-white" : checkStep === i ? "text-blue-400" : "text-[#9CA3AF]"}`}>{step.label}</div>
                  <div className="text-xs font-mono text-[#9CA3AF] mt-0.5">{step.sub}</div>
                  {i === 2 && checkStep >= 2 && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full bg-[#30363d] overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(compareCount / 1247) * 100}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
                {step.done && <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex-shrink-0">DONE</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI Pass View ────────────────────────────────────────────────────────────────
function AIPassView({ onSign, onReset }: { onSign: () => void; onReset: () => void }) {
  const top3 = [
    { title: "Ambient Drift 01", similarity: 8, model: "Udio v2" },
    { title: "Stellar Haze", similarity: 5, model: "Suno v4.5" },
    { title: "Crystal Shore", similarity: 3, model: "MusicGen" },
  ];
  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-[#161b22] border border-emerald-500/40 rounded-2xl overflow-hidden mb-5">
          <div className="px-6 py-4 bg-emerald-500/5 border-b border-emerald-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-emerald-400">PASS — 독창성 검증 완료</div>
              <div className="text-xs text-[#9CA3AF] font-mono">gatekeeper-v2.1 · 2026-01-13 09:21:44 UTC</div>
            </div>
            <Badge variant="verified">✓ AI Verified</Badge>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 h-2 rounded-full bg-[#30363d] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: "8%" }}></div>
                </div>
                <span className="text-xl font-black font-mono text-emerald-400">8%</span>
              </div>
              <div className="text-[10px] text-[#9CA3AF] font-mono">최고 코사인 유사도 · 기준 임계값 85% · 표절 위험 없음</div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#9CA3AF] mb-2">최근접 Top-3 음원</div>
              <div className="space-y-2">
                {top3.map((t, i) => (
                  <div key={t.title} className="flex items-center gap-3 bg-[#1c2128] rounded-lg px-3 py-2 border border-[#30363d]">
                    <span className="text-[10px] font-mono text-[#9CA3AF] w-3">{i + 1}</span>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-white">{t.title}</span>
                      <span className="text-[10px] text-[#9CA3AF] font-mono ml-2">{t.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-[#30363d] overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${t.similarity}%` }}></div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 w-5 text-right">{t.similarity}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onReset} className="px-4 py-2.5 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] text-sm text-[#9CA3AF] hover:text-white transition-colors">돌아가기</button>
          <button onClick={onSign} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            <span>🦊</span> MetaMask에서 서명 후 Mint →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Fail View ────────────────────────────────────────────────────────────────
function AIFailView({ onReset }: { onReset: () => void }) {
  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-[#161b22] border border-red-500/40 rounded-2xl overflow-hidden mb-5">
          <div className="px-6 py-4 bg-red-500/5 border-b border-red-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-red-400">FAIL — 등록 차단</div>
              <div className="text-xs text-[#9CA3AF] font-mono">gatekeeper-v2.1 · 2026-01-13 09:21:44 UTC</div>
            </div>
            <Badge variant="danger">✗ 표절 의심</Badge>
          </div>
          <div className="p-6 space-y-5">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="text-sm font-semibold text-red-400 mb-1">유사도 93% — 근사 복제 의심</div>
              <div className="text-xs text-[#9CA3AF]">
                최근접 음원 <span className="text-white font-mono">"Solar Wind" (Suno v4.5)</span>과 코사인 유사도 93%가 검출되어 등록이 차단되었습니다. 임계값(85%)을 초과하면 독립 창작물로 인정되지 않습니다.
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#9CA3AF] mb-2">최근접 Top-3 음원</div>
              <div className="space-y-2">
                {[
                  { title: "Solar Wind", similarity: 93, model: "Suno v4.5", flag: true },
                  { title: "Neon Cascade", similarity: 12, model: "Suno v4.5", flag: false },
                  { title: "Cosmic Drift", similarity: 8, model: "Udio v2", flag: false },
                ].map((t, i) => (
                  <div key={t.title} className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${t.flag ? "bg-red-500/5 border-red-500/30" : "bg-[#1c2128] border-[#30363d]"}`}>
                    <span className="text-[10px] font-mono text-[#9CA3AF] w-3">{i + 1}</span>
                    <div className="flex-1">
                      <span className={`text-xs font-medium ${t.flag ? "text-red-400" : "text-white"}`}>{t.title}</span>
                      <span className="text-[10px] text-[#9CA3AF] font-mono ml-2">{t.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-[#30363d] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${t.similarity}%`, background: t.flag ? "#ef4444" : "#10b981" }}></div>
                      </div>
                      <span className={`text-xs font-mono w-6 text-right ${t.flag ? "text-red-400" : "text-emerald-400"}`}>{t.similarity}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs text-[#9CA3AF] bg-[#1c2128] border border-[#30363d] rounded-lg p-3">
              <span className="text-amber-400 font-medium">안내:</span> 음원을 충분히 변형하거나 원본 저작권자의 동의를 얻은 경우 재신청할 수 있습니다. 이의 제기는 support@track-ai.io로 문의해주세요.
            </div>
          </div>
        </div>
        <button onClick={onReset} className="w-full py-2.5 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] text-sm text-white font-medium transition-colors">
          다시 업로드하기
        </button>
      </div>
    </div>
  );
}

// ─── Upload Screen ──────────────────────────────────────────────────────────────
function UploadScreen() {
  const [stage, setStage] = useState<UploadStage>("idle");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [prompt, setPrompt] = useState("Pulsing neon synth with driving 4/4 beat, hypnotic arpeggios, and late-night Tokyo cityscape vibes for a commercial trailer");
  const [platform, setPlatform] = useState("Suno v4.5");
  const [promptWeight, setPromptWeight] = useState(70);
  const [voiceWeight, setVoiceWeight] = useState(20);
  const [voiceAddress, setVoiceAddress] = useState("");
  const [voiceInvited, setVoiceInvited] = useState(false);
  const [voiceSigned, setVoiceSigned] = useState(false);
  const [projectFile, setProjectFile] = useState("");
  const [failDemo, setFailDemo] = useState(false);

  const editWeight = 100 - promptWeight - voiceWeight;

  const handleInvite = () => {
    setVoiceInvited(true);
    setTimeout(() => setVoiceSigned(true), 4000);
  };

  const handleAIDone = (result: "pass" | "fail") => setStage(result === "pass" ? "ai_pass" : "ai_fail");

  const handleSign = () => {
    setStage("signing");
    setTimeout(() => setStage("done"), 2200);
  };

  const handleReset = () => {
    setStage("idle");
    setFileName("");
    setVoiceInvited(false);
    setVoiceSigned(false);
    setVoiceAddress("");
    setFailDemo(false);
  };

  if (stage === "ai_checking") return <AICheckingView fileName={fileName} failMode={failDemo} onDone={handleAIDone} />;
  if (stage === "ai_pass") return <AIPassView onSign={handleSign} onReset={() => setStage("idle")} />;
  if (stage === "ai_fail") return <AIFailView onReset={handleReset} />;

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-white mb-1">음원 업로드 & AI 검증</h2>
          <p className="text-sm text-[#9CA3AF]">AI 유사도 분석 후 블록체인에 창작 이력을 영구 기록합니다</p>
        </div>
        <div className="flex items-center mb-8">
          {["파일 업로드", "AI 유사도 검증", "온체인 Mint"].map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              {i > 0 && <div className="flex-1 h-px bg-[#21262d]"></div>}
              <div className="flex items-center gap-2 px-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-blue-500 text-white" : "bg-[#21262d] text-[#484f58]"}`}>{i + 1}</div>
                <span className={`text-xs font-medium ${i === 0 ? "text-white" : "text-[#484f58]"}`}>{step}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-[#21262d]"></div>}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Drop zone */}
          <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFileName(f.name); }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragging ? "border-blue-500 bg-blue-500/5" : fileName ? "border-emerald-500/40 bg-emerald-500/5" : "border-[#30363d] hover:border-[#484f58]"}`}
            onClick={() => !fileName && setFileName("neon_cascade_v3.wav")}>
            {fileName ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 12V4M5 8L9 4L13 8" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 14h12" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-emerald-400">{fileName}</div>
                  <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">44.1kHz · 16-bit · WAV · 4.2MB · 3:42</div>
                </div>
                <Waveform seed={42} color="#10b981" />
                <button onClick={e => { e.stopPropagation(); setFileName(""); }} className="text-xs text-[#9CA3AF] hover:text-white underline">파일 제거</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1c2128] border border-[#30363d] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 13V5M6 9L10 5L14 9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15h14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-[#e6edf3]">WAV, MP3 파일을 업로드하세요</div>
                  <div className="text-xs text-[#9CA3AF] mt-1">드래그 & 드롭 또는 클릭하여 선택 · 최대 100MB</div>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-white">창작 이력 (온체인 기록)</h3>
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">사용된 프롬프트 <span className="text-blue-400">*</span></label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-blue-500 resize-none font-mono text-xs leading-relaxed transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">AI 플랫폼</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  {["Suno v4.5", "Suno", "Udio v2", "Stable Audio 2.0", "MusicGen"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">라이선스 유형</label>
                <select className="w-full px-3 py-2.5 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white focus:outline-none focus:border-blue-500 transition-colors">
                  <option>Standard BGM</option>
                  <option>Exclusive</option>
                  <option>Creative Commons</option>
                </select>
              </div>
            </div>

            {/* Contributor split */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-[#9CA3AF]">기여도 설정 (수익 분배 비율)</label>
                <span className="text-xs font-mono font-semibold text-emerald-400">합계: 100% ✓</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "프롬프트 엔지니어", value: promptWeight, onChange: (v: number) => setPromptWeight(Math.min(v, 100 - voiceWeight)), color: "#2f80ed" },
                  { label: "보이스 제공자", value: voiceWeight, onChange: (v: number) => setVoiceWeight(Math.min(v, 100 - promptWeight)), color: "#7c3aed" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-xs text-[#e6edf3] w-32">{s.label}</span>
                    <input type="range" min={0} max={100} value={s.value} onChange={e => s.onChange(+e.target.value)} className="flex-1 accent-blue-500" />
                    <span className="text-xs font-mono w-8 text-right" style={{ color: s.color }}>{s.value}%</span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#e6edf3] w-32">편집 기여자</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#30363d]">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${editWeight}%` }}></div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 w-8 text-right">{editWeight}%</span>
                </div>
              </div>
            </div>

            {/* Voice contributor invite */}
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">보이스 제공자 지갑 / 이메일 초대</label>
              <div className="flex gap-2">
                <input value={voiceAddress} onChange={e => setVoiceAddress(e.target.value)} placeholder="0x... 또는 이메일 주소"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#1c2128] border border-[#30363d] text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-blue-500 font-mono text-xs transition-colors" />
                <button onClick={handleInvite} disabled={!voiceAddress || voiceInvited}
                  className="px-3 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  합의 서명 초대
                </button>
              </div>
              {voiceInvited && (
                <div className={`mt-2 flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${voiceSigned ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-amber-500/5 border-amber-500/20 text-amber-400"}`}>
                  {voiceSigned ? "✓ 서명 완료 — 보이스 제공자가 기여도에 동의했습니다" : "⏳ 서명 대기 중 — 상대방의 합의 서명을 기다리고 있습니다"}
                </div>
              )}
            </div>

            {/* Smart contract deploy notice */}
            <p className="text-[10px] leading-relaxed text-[#6B7280] border-l-2 border-purple-500/30 pl-2.5 -mt-1">
              💡 모든 기여자의 지갑 서명(동의)이 완료되어야 스마트 컨트랙트가 배포됩니다.
            </p>

            {/* Optional project file */}
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">프로젝트 파일 <span className="text-[#9CA3AF] font-normal">(선택) — DAW 세션, 작업 로그</span></label>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed cursor-pointer transition-colors ${projectFile ? "border-emerald-500/30 bg-emerald-500/5" : "border-[#30363d] hover:border-[#484f58]"}`}
                onClick={() => !projectFile && setProjectFile("neon_cascade_project.als")}>
                {projectFile ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="#10b981" strokeWidth="1.2"/><path d="M4 5h6M4 7.5h4" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    <span className="text-xs font-mono text-emerald-400 flex-1">{projectFile}</span>
                    <button onClick={e => { e.stopPropagation(); setProjectFile(""); }} className="text-[10px] text-[#9CA3AF] hover:text-white">제거</button>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="#9CA3AF" strokeWidth="1.2"/><path d="M7 4v6M4 7h6" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    <span className="text-xs text-[#9CA3AF]">.als, .flp, .logic, .zip 파일 업로드</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Fail demo toggle */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#f59e0b" strokeWidth="1.2"/><path d="M7 4v3.5M7 9.5v.5" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <span className="text-xs text-amber-400 flex-1">데모 시뮬레이션: 표절 케이스 보기</span>
            <button onClick={() => setFailDemo(!failDemo)} className={`relative w-9 h-5 rounded-full transition-colors ${failDemo ? "bg-red-500" : "bg-[#30363d]"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${failDemo ? "left-4" : "left-0.5"}`}></div>
            </button>
          </div>

          <button onClick={() => setStage("ai_checking")} disabled={!fileName}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
            {failDemo ? "AI 검증 시작 (표절 케이스 시뮬레이션)" : "AI 검증 후 온체인 Mint"}
          </button>
        </div>
      </div>

      {stage === "signing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 w-[380px] text-center">
            <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">🦊</div>
            <h3 className="text-base font-semibold text-white mb-2">MetaMask 서명 대기 중</h3>
            <p className="text-sm text-[#9CA3AF]">지갑에서 트랜잭션을 승인하면 음원이 Polygon Amoy에 영구 기록됩니다.</p>
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 w-[420px] text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">온체인 등록 완료!</h3>
            <p className="text-sm text-[#9CA3AF] mb-4">Polygon Amoy에 ERC-1155 NFT로 Mint되었습니다.</p>
            <div className="bg-[#1c2128] rounded-lg p-3 text-left space-y-2 mb-5">
              {[["TX Hash", "0x7d2f...a91c"], ["Block", "#47,293,841"], ["IPFS CID", "QmXz9...f4aK"], ["NFT Token ID", "#3891"]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-xs text-[#9CA3AF] font-mono">{k}</span>
                  <span className="text-xs text-blue-400 font-mono">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={handleReset} className="w-full py-2.5 rounded-xl bg-[#1c2128] hover:bg-[#21262d] border border-[#30363d] text-white text-sm font-medium transition-colors">
              새 음원 업로드
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pie Chart ──────────────────────────────────────────────────────────────────
function PieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  let offset = 0;
  const r = 40, cx = 50, cy = 50;
  const paths = slices.map(s => {
    const angle = (s.value / 100) * 360;
    const startRad = ((offset - 90) * Math.PI) / 180;
    const endRad = ((offset + angle - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
    offset += angle;
    return { d, color: s.color, label: s.label, value: s.value };
  });
  return (
    <div className="flex items-center gap-5">
      <svg width="100" height="100" viewBox="0 0 100 100">{paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}</svg>
      <div className="space-y-1.5">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }}></div>
            <span className="text-xs text-[#9CA3AF]">{p.label}</span>
            <span className="text-xs font-mono text-white ml-auto">{p.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Infringement Modal ─────────────────────────────────────────────────────────
function InfringementModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#161b22] border border-red-500/30 rounded-2xl w-[480px] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L12.5 11.5H1.5L7 2Z" stroke="#ef4444" strokeWidth="1.4"/><path d="M7 6v2.5M7 10.5v.5" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </div>
            <h3 className="text-base font-semibold text-white">저작권 침해 신고</h3>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="space-y-3 mb-5">
          {[
            { step: "01", title: "신고 접수 즉시 에스크로 동결", desc: "해당 음원의 판매 수익이 즉시 에스크로 보류 상태로 전환됩니다. 신규 판매도 일시 중단됩니다.", color: "#f59e0b" },
            { step: "02", title: "14일 심사 기간", desc: "운영자 및 AI 검증 시스템이 신고 내용을 심사합니다. 양측에 소명 기회가 주어집니다.", color: "#2f80ed" },
            { step: "03", title: "판정 결과 집행", desc: "침해 인정 시 에스크로 환불 + 음원 삭제. 무혐의 시 에스크로 해제 + 크리에이터 정산 재개.", color: "#10b981" },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-mono font-bold border mt-0.5" style={{ borderColor: `${s.color}40`, color: s.color, background: `${s.color}10` }}>{s.step}</div>
              <div>
                <div className="text-xs font-semibold text-white mb-0.5">{s.title}</div>
                <div className="text-xs text-[#9CA3AF]">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-5">
          <div className="text-xs text-amber-400 font-medium mb-0.5">허위 신고 패널티</div>
          <div className="text-xs text-[#9CA3AF]">허위 또는 악의적 신고로 판정될 경우 신고자 계정 30일 정지 및 에스크로 몰수될 수 있습니다.</div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-[#1c2128] border border-[#30363d] text-sm text-[#9CA3AF] hover:text-white transition-colors">취소</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-sm text-red-400 font-semibold transition-colors">신고 접수</button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Screen ──────────────────────────────────────────────────────────────
function DetailScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [license, setLicense] = useState<LicenseType>("standard");
  const [playing, setPlaying] = useState(false);
  const [showInfringement, setShowInfringement] = useState(false);
  const prices = { standard: { pol: "50 POL", usd: "$43.50" }, exclusive: { pol: "350 POL", usd: "$304.50" } };

  return (
    <div className="pt-14 min-h-screen">
      {showInfringement && <InfringementModal onClose={() => setShowInfringement(false)} />}
      <div className="border-b border-[#21262d] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-[#9CA3AF]">
          <button onClick={() => setScreen("marketplace")} className="hover:text-white transition-colors">Explore</button>
          <span>/</span>
          <span className="text-white">Neon Cascade</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-7">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
              <div className="h-44 bg-gradient-to-br from-[#1a1f2e] via-[#161b22] to-[#0d1117] relative flex items-end p-5">
                <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 20% 40%, #2f80ed22 0%, transparent 60%)" }} />
                <div className="relative z-10 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => setPlaying(!playing)} className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-colors flex-shrink-0">
                      {playing ? <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><rect x="1" y="1" width="5" height="12" rx="1.5"/><rect x="8" y="1" width="5" height="12" rx="1.5"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M3 2L12 7L3 12V2Z"/></svg>}
                    </button>
                    <div className="flex-1"><Waveform seed={1} playing={playing} color={playing ? "#2f80ed" : "#484f58"} /></div>
                    <span className="text-xs font-mono text-[#9CA3AF]">3:42</span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-xl font-bold text-white mb-1">Neon Cascade</h1>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#9CA3AF] font-mono">by 0x8f3a...d7e1</span>
                      <span className="text-[#484f58]">·</span>
                      <span className="text-xs text-[#9CA3AF]">Suno v4.5</span>
                      <span className="text-[#484f58]">·</span>
                      <span className="text-xs text-[#9CA3AF]">👥 2 contributors</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="verified">✓ AI Verified</Badge>
                    <Badge variant="muted">Electronic</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#9CA3AF] font-mono">
                  <span>▶ 2,412 plays</span>
                  <span>📋 18 licenses sold</span>
                  <span>🕐 2025-11-03</span>
                </div>
              </div>
            </div>

            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-5">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#2f80ed" strokeWidth="1.5"/></svg>
                Provenance — 창작 이력 (온체인)
              </h2>
              <div>
                <div className="text-xs font-medium text-[#9CA3AF] mb-1.5">Original Prompt</div>
                <div className="bg-[#1c2128] rounded-lg p-3 text-xs text-[#e6edf3] font-mono leading-relaxed border border-[#30363d]">
                  "Pulsing neon synth with driving 4/4 beat, hypnotic arpeggios, and late-night Tokyo cityscape vibes for a commercial trailer"
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[["IPFS CID", "QmXz9f4aKp8...mN3d"], ["Smart Contract", "0x4aC7...f3E2"]].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-xs font-medium text-[#9CA3AF] mb-1.5">{label}</div>
                    <a href="#" className="flex items-center gap-1.5 text-xs text-blue-400 font-mono hover:text-blue-300 bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-2 transition-colors">
                      <span className="truncate">{val}</span>
                      <svg className="flex-shrink-0" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </a>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-medium text-[#9CA3AF] mb-3">Revenue Split (스마트 컨트랙트 자동 정산)</div>
                <PieChart slices={[
                  { label: "프롬프트 엔지니어", value: 70, color: "#2f80ed" },
                  { label: "보이스 제공자", value: 20, color: "#7c3aed" },
                  { label: "플랫폼 수수료", value: 10, color: "#30363d" },
                ]} />
              </div>
              <div>
                <div className="text-xs font-medium text-[#9CA3AF] mb-2">유사도 검증 결과</div>
                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-20 h-1.5 rounded-full bg-[#30363d] overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: "12%" }}></div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">12% similarity</span>
                    <span className="text-xs text-[#9CA3AF] font-mono">— 최근접: Void Echoes</span>
                  </div>
                  <Badge variant="verified">✓ Pass</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">라이선스 구매</h3>
              <div className="space-y-2 mb-4">
                {(["standard", "exclusive"] as LicenseType[]).map(l => (
                  <button key={l} onClick={() => setLicense(l)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all ${license === l ? "border-blue-500 bg-blue-500/5" : "border-[#30363d] hover:border-[#484f58]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{l === "standard" ? "Standard BGM" : "Exclusive"}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${license === l ? "border-blue-500 bg-blue-500" : "border-[#484f58]"}`}>
                        {license === l && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] space-y-0.5">
                      {l === "standard" ? (
                        <>
                          <div>✓ 상업적·비상업적 BGM 사용</div>
                          <div>✓ 스트리밍·유튜브 업로드</div>
                          <div className="text-red-400/70">✗ 재판매·재라이선스 금지</div>
                          <div className="text-red-400/70">✗ AI 학습 데이터 사용 금지</div>
                        </>
                      ) : (
                        <>
                          <div>✓ 독점 사용권 (타인 판매 중단)</div>
                          <div>✓ 재판매·서브라이선스 가능</div>
                          <div>✓ 원본 파일 제공</div>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-[#1c2128] rounded-lg p-3 mb-4 space-y-1.5 border border-[#30363d]">
                <div className="text-[10px] text-[#9CA3AF] font-medium">라이선스 약관 온체인 기록</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#9CA3AF] font-mono">IPFS:</span>
                  <span className="text-[10px] text-blue-400 font-mono truncate">QmLf3x7T2...w9Kp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#9CA3AF] font-mono">Hash:</span>
                  <span className="text-[10px] text-blue-400 font-mono">0x92e1...a4b3</span>
                  <a href="#" className="text-[10px] text-[#9CA3AF] hover:text-blue-400 transition-colors ml-auto whitespace-nowrap">Polygonscan ↗</a>
                </div>
              </div>
              <div className="border-t border-[#21262d] pt-4 mb-4">
                <div className="text-2xl font-bold text-white mb-0.5">{prices[license].pol}</div>
                <div className="text-sm text-[#9CA3AF] font-mono">≈ {prices[license].usd}</div>
              </div>
              <button onClick={() => setScreen("checkout")} className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors">
                라이선스 구매하기
              </button>
              <p className="text-xs text-[#9CA3AF] text-center mt-3">스마트 컨트랙트 즉시 정산 · 환불 불가</p>
              <button onClick={() => setShowInfringement(true)}
                className="mt-3 w-full py-2 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-xs text-red-400 font-medium transition-colors flex items-center justify-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5L10.5 9.5H1.5L6 1.5Z" stroke="#ef4444" strokeWidth="1.2"/><path d="M6 5v1.5M6 8.5v.5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/></svg>
                저작권 침해 의심 신고 (에스크로 보류)
              </button>
            </div>

            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 space-y-2.5">
              <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">트랜잭션 정보</h4>
              {[["Minted", "2025-11-03"], ["Network", "Polygon (Amoy)"], ["Standard", "ERC-1155"], ["재판매 로열티", "10%"]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-xs text-[#9CA3AF]">{k}</span>
                  <span className="text-xs font-mono text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────
const initialTxns = [
  { date: "2025-12-28", track: "Neon Cascade", buyer: "0x9f2a...b3c1", license: "Standard", role: "creator", split: "70%", earned: "35 POL", status: "settled" },
  { date: "2025-12-15", track: "Void Echoes", buyer: "0x7f2c...a3d1", license: "Standard", role: "voice", split: "20%", earned: "10 POL", status: "frozen" },
  { date: "2025-12-10", track: "Ambient Drift 01", buyer: "0x1d4e...7f9a", license: "Exclusive", role: "creator", split: "70%", earned: "245 POL", status: "settled" },
  { date: "2025-11-28", track: "Neon Cascade", buyer: "0x5c7b...2e4d", license: "Standard", role: "creator", split: "70%", earned: "35 POL", status: "settled" },
  { date: "2025-11-15", track: "Solar Wind", buyer: "0x3a8f...d1e2", license: "Standard", role: "voice", split: "20%", earned: "24 POL", status: "settled" },
  { date: "2025-10-30", track: "Lo-Fi Morning", buyer: "0x6e1c...9b5f", license: "Exclusive", role: "creator", split: "70%", earned: "245 POL", status: "settled" },
];

const myTracks = [
  { title: "Neon Cascade", status: "verified", genre: "Electronic", model: "Suno v4.5", date: "2025-11-03", earnings: "175 POL" },
  { title: "Ambient Drift 01", status: "verified", genre: "Ambient", model: "Udio v2", date: "2025-10-14", earnings: "245 POL" },
  { title: "Lo-Fi Morning", status: "verified", genre: "Lo-Fi", model: "Suno v4.5", date: "2025-09-22", earnings: "245 POL" },
  { title: "Void Echoes", status: "verified", genre: "Dark Ambient", model: "Udio v2", date: "2025-12-08", earnings: "10 POL" },
  { title: "Solar Wind", status: "verified", genre: "Cinematic", model: "Suno v4.5", date: "2025-11-20", earnings: "84 POL" },
  { title: "Synthetic Pulse", status: "pending", genre: "Techno", model: "Stable Audio 2.0", date: "2026-01-05", earnings: "—" },
  { title: "Orion Drift", status: "rejected", genre: "Electronic", model: "Suno v4.5", date: "2026-01-11", earnings: "—" },
];

function DashboardScreen() {
  const [totalEarned, setTotalEarned] = useState(594);
  const [txns, setTxns] = useState(initialTxns);
  const [animated, setAnimated] = useState(false);
  const [justBought, setJustBought] = useState(false);
  const [trackTab, setTrackTab] = useState<"all" | "verified" | "pending" | "rejected">("all");

  useEffect(() => {
    const t = setTimeout(() => {
      setTotalEarned(prev => prev + 35);
      setTxns(prev => [
        { date: "2026-01-13", track: "Neon Cascade", buyer: "0x2b9e...f1a4", license: "Standard", role: "creator", split: "70%", earned: "35 POL", status: "settled" },
        ...prev,
      ]);
      setAnimated(true); setJustBought(true);
      setTimeout(() => setAnimated(false), 600);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const stats = [
    { label: "총 누적 수익", value: `${totalEarned} POL`, sub: `≈ $${(totalEarned * 0.87).toFixed(0)} USD`, delta: "+35 POL", up: true, animate: animated },
    { label: "이번 달 거래", value: "14건", sub: "전월 대비 +3건", delta: "+27%", up: true, animate: false },
    { label: "등록된 음원", value: "7개", sub: "Active 5 · Pending 1 · Rejected 1", delta: "", up: false, animate: false },
    { label: "평균 유사도", value: "11.3%", sub: "최근 30일 기준", delta: "안전 구간", up: false, animate: false },
  ];

  const filteredTracks = trackTab === "all" ? myTracks : myTracks.filter(t => t.status === trackTab);

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-7">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">크리에이터 대시보드</h2>
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF] font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              실시간 정산 · 스마트 컨트랙트 자동 실행
              {justBought && <span className="text-emerald-400 ml-2">· 새 거래 확인됨</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF] bg-[#161b22] border border-[#21262d] px-3 py-1.5 rounded-lg">
            <span>지갑</span><span className="text-white">0x3a7f...c4d2</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className={`bg-[#161b22] border rounded-xl p-4 transition-all ${s.animate ? "border-emerald-500/50 bg-emerald-500/5" : "border-[#21262d]"}`}>
              <div className="text-xs text-[#9CA3AF] mb-2">{s.label}</div>
              <div className="text-2xl font-bold text-white mb-1 font-mono">{s.value}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">{s.sub}</span>
                {s.delta && <span className={`text-xs font-mono ${s.up ? "text-emerald-400" : "text-[#9CA3AF]"}`}>{s.up ? "↑ " : ""}{s.delta}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-2 bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">월별 수익</h3>
              <Badge variant="muted">최근 6개월</Badge>
            </div>
            <div className="flex items-end gap-2 h-28">
              {[0.12, 0.08, 0.19, 0.24, 0.15, 0.35].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t" style={{ height: `${v * 280}px`, background: i === 5 ? "#2f80ed" : "#21262d" }}></div>
                  <span className="text-xs font-mono text-[#9CA3AF]">{["8월", "9월", "10월", "11월", "12월", "1월"][i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">라이선스 유형</h3>
            <PieChart slices={[{ label: "Standard BGM", value: 68, color: "#2f80ed" }, { label: "Exclusive", value: 32, color: "#7c3aed" }]} />
          </div>
        </div>

        {/* My Tracks with tabs */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
            <h3 className="text-sm font-semibold text-white">내 음원</h3>
            <div className="flex items-center gap-1">
              {(["all", "verified", "pending", "rejected"] as const).map(tab => (
                <button key={tab} onClick={() => setTrackTab(tab)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${trackTab === tab ? "bg-[#21262d] text-white" : "text-[#9CA3AF] hover:text-white"}`}>
                  {tab === "all" ? "전체" : tab === "verified" ? "검증 완료" : tab === "pending" ? "검증 대기" : "등록 거부"}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-[#21262d]">
            {filteredTracks.map((t, i) => (
              <div key={i} className="flex items-center px-5 py-3 hover:bg-[#1c2128] transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{t.title}</span>
                    {t.status === "verified" && <Badge variant="verified">✓</Badge>}
                    {t.status === "pending" && <Badge variant="warning">⏳ 검증 중</Badge>}
                    {t.status === "rejected" && <Badge variant="danger">✗ 거부</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#9CA3AF] font-mono">
                    <span>{t.genre}</span><span>·</span><span>{t.model}</span><span>·</span><span>{t.date}</span>
                  </div>
                </div>
                <div className="text-sm font-mono font-semibold text-emerald-400">{t.earnings}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
            <h3 className="text-sm font-semibold text-white">트랜잭션 히스토리</h3>
            <span className="text-xs text-[#9CA3AF] font-mono">{txns.length}건</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#21262d]">
                {["날짜", "음원명", "구매자 지갑", "라이선스", "내 역할", "지분", "정산 금액"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.map((tx, i) => (
                <tr key={i} className={`border-b border-[#21262d] last:border-0 transition-colors ${tx.status === "frozen" ? "bg-amber-500/5" : i === 0 && justBought ? "bg-emerald-500/5" : "hover:bg-[#1c2128]"}`}>
                  <td className="px-5 py-3 text-xs font-mono text-[#9CA3AF]">{tx.date}</td>
                  <td className="px-5 py-3 text-xs text-white font-medium">{tx.track}</td>
                  <td className="px-5 py-3 text-xs font-mono text-blue-400">{tx.buyer}</td>
                  <td className="px-5 py-3"><Badge variant={tx.license === "Exclusive" ? "primary" : "muted"}>{tx.license}</Badge></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-mono ${tx.role === "voice" ? "text-purple-400" : "text-[#9CA3AF]"}`}>
                      {tx.role === "voice" ? "보이스" : "크리에이터"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-[#9CA3AF]">{tx.split}</td>
                  <td className="px-5 py-3">
                    {tx.status === "frozen"
                      ? <span className="text-xs font-mono font-semibold text-amber-400">⏸ {tx.earned} 동결</span>
                      : <span className="text-xs font-mono font-semibold text-emerald-400">{i === 0 && justBought ? "↑ " : ""}{tx.earned}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout ───────────────────────────────────────────────────────────────────
function CheckoutScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [stage, setStage] = useState<CheckoutStage>("summary");
  const [license, setLicense] = useState<LicenseType>("standard");
  const [paymentMethod, setPaymentMethod] = useState<"google" | "metamask">("google");
  const prices = { standard: { pol: "50 POL", usd: "$43.50" }, exclusive: { pol: "350 POL", usd: "$304.50" } };

  const handleConfirm = () => { setStage("signing"); setTimeout(() => setStage("confirmed"), 2200); };

  return (
    <div className="pt-14 min-h-screen flex items-start justify-center">
      <div className="w-full max-w-6xl px-6 py-8 grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-4 font-mono">
              {[{ n: 1, label: "주문 확인", active: stage === "summary", done: stage !== "summary" },
                { n: 2, label: "결제 서명", active: stage === "signing", done: stage === "confirmed" },
                { n: 3, label: "완료", active: false, done: stage === "confirmed" }].map((s, i) => (
                <span key={s.n} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[#30363d]">──</span>}
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${s.done ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : s.active ? "border-blue-500 text-blue-400" : "border-[#30363d]"}`}>{s.n}</span>
                  <span className={s.done ? "text-emerald-400" : s.active ? "text-white" : ""}>{s.label}</span>
                </span>
              ))}
            </div>
            <h2 className="text-xl font-bold text-white">결제 및 스마트 컨트랙트 서명</h2>
          </div>

          {/* Order summary */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#21262d] bg-[#1c2128]">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">주문 내역</span>
            </div>
            <div className="p-5 flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] flex items-center justify-center border border-[#30363d] flex-shrink-0">
                <Waveform seed={1} color="#2f80ed" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-0.5">Neon Cascade</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-[#9CA3AF] font-mono">by 0x8f3a...d7e1</span>
                  <span className="text-[#30363d]">·</span>
                  <span className="text-xs text-[#9CA3AF]">Suno v4.5</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="verified">✓ AI Verified</Badge>
                  <Badge variant="muted">유사도 12%</Badge>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 space-y-2">
              <div className="text-xs font-medium text-[#9CA3AF] mb-2">라이선스 유형 선택</div>
              <div className="grid grid-cols-2 gap-2">
                {(["standard", "exclusive"] as LicenseType[]).map(l => (
                  <button key={l} onClick={() => setLicense(l)}
                    className={`p-3 rounded-lg border text-left transition-all ${license === l ? "border-blue-500 bg-blue-500/5" : "border-[#30363d] hover:border-[#484f58]"}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-white">{l === "standard" ? "Standard BGM" : "Exclusive"}</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${license === l ? "border-blue-500 bg-blue-500" : "border-[#484f58]"}`}>
                        {license === l && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#9CA3AF]">{l === "standard" ? "상업적 BGM 사용 허가" : "독점 사용 + 재판매 가능"}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#21262d] bg-[#1c2128]">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">결제 방법</span>
            </div>
            <div className="p-4 space-y-2">
              {[
                { id: "google" as const, label: "Google 계정으로 결제", sub: "Web3Auth AA 지갑 · 가스비 Track-AI 대납 · 지갑 없이도 시작 가능", icon: "🔵", rec: true },
                { id: "metamask" as const, label: "MetaMask 직접 결제", sub: "POL 토큰 보유 필요 · Polygon Amoy", icon: "🦊", rec: false },
              ].map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-lg border transition-all ${paymentMethod === m.id ? "border-blue-500 bg-blue-500/5" : "border-[#30363d] hover:border-[#484f58]"}`}>
                  <span className="text-xl">{m.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{m.label}</span>
                      {m.rec && <span className="text-[10px] font-mono text-blue-400 border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 rounded">추천</span>}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] mt-0.5">{m.sub}</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${paymentMethod === m.id ? "border-blue-500 bg-blue-500" : "border-[#484f58]"}`}>
                    {paymentMethod === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Smart contract split */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#21262d] bg-[#1c2128] flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z" stroke="#2f80ed" strokeWidth="1.2"/></svg>
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Smart Contract 수익 분배</span>
              <span className="ml-auto text-[10px] font-mono text-[#9CA3AF]">ERC-1155 · Polygon Amoy</span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#9CA3AF]">결제 즉시 스마트 컨트랙트가 수익을 자동 분배합니다. 중간 유통사 없이 투명하게 정산됩니다.</p>
              <div className="flex h-6 rounded-lg overflow-hidden gap-0.5">
                <div className="flex items-center justify-center text-[10px] font-mono font-bold text-white" style={{ width: "70%", background: "#2f80ed" }}>70%</div>
                <div className="flex items-center justify-center text-[10px] font-mono font-bold text-white" style={{ width: "20%", background: "#7c3aed" }}>20%</div>
                <div className="flex items-center justify-center text-[10px] font-mono font-bold text-white" style={{ width: "10%", background: "#484f58" }}>10%</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "프롬프트 엔지니어", pct: "70%", amt: license === "standard" ? "35 POL" : "245 POL", color: "#2f80ed" },
                  { label: "보이스 제공자", pct: "20%", amt: license === "standard" ? "10 POL" : "70 POL", color: "#7c3aed" },
                  { label: "플랫폼 수수료", pct: "10%", amt: license === "standard" ? "5 POL" : "35 POL", color: "#484f58" },
                ].map(s => (
                  <div key={s.label} className="bg-[#1c2128] rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.color }}></div>
                      <span className="text-[10px] text-[#9CA3AF]">{s.label}</span>
                    </div>
                    <div className="text-sm font-bold text-white font-mono">{s.pct}</div>
                    <div className="text-[10px] font-mono text-[#9CA3AF]">{s.amt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="col-span-2 space-y-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 space-y-4 sticky top-20">
            <h3 className="text-sm font-semibold text-white">결제 요약</h3>
            <div className="space-y-2 pb-4 border-b border-[#21262d]">
              <div className="flex justify-between text-xs text-[#9CA3AF]">
                <span>{license === "standard" ? "Standard BGM" : "Exclusive"} 라이선스</span>
                <span className="font-mono text-white">{prices[license].pol}</span>
              </div>
              <div className="flex justify-between text-xs text-[#9CA3AF]">
                <span>가스비 {paymentMethod === "google" ? "(Track-AI 대납)" : "(예상)"}</span>
                <span className="font-mono text-white">{paymentMethod === "google" ? "무료" : "~0.01 POL"}</span>
              </div>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-white">총 결제</span>
              <div className="text-right">
                <div className="text-xl font-bold text-white font-mono">{prices[license].pol}</div>
                <div className="text-xs text-[#9CA3AF] font-mono">≈ {prices[license].usd}</div>
              </div>
            </div>

            {stage === "summary" && (
              <button onClick={handleConfirm} className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <span>{paymentMethod === "google" ? "🔵" : "🦊"}</span>
                {paymentMethod === "google" ? "Google 계정으로 결제" : "MetaMask로 결제"}
              </button>
            )}
            {stage === "signing" && (
              <div className="w-full py-3 rounded-xl border border-orange-500/30 bg-orange-500/5 flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border border-orange-400 border-t-transparent animate-spin" style={{ animationDuration: "0.8s" }}></div>
                <span className="text-sm text-orange-400 font-medium">{paymentMethod === "google" ? "결제 처리 중..." : "MetaMask 서명 대기 중..."}</span>
              </div>
            )}
            {stage === "confirmed" && (
              <div className="space-y-3">
                <div className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-sm text-emerald-400 font-semibold">결제 및 트랜잭션 완료</span>
                </div>
                <button onClick={() => setScreen("certificate")} className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors">
                  AI 독창성 검증 리포트 보기 →
                </button>
              </div>
            )}

            <div className="pt-2 space-y-2">
              {[["🔒", "스마트 컨트랙트 자동 정산"], ["📄", "ERC-1155 라이선스 NFT 즉시 발급"], ["🛡️", "AI 독창성 검증 완료 음원만 거래"]].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {stage === "signing" && paymentMethod === "metamask" && (
            <div className="bg-[#161b22] border border-orange-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-400"><span>🦊</span> MetaMask — 트랜잭션 확인 요청</div>
              <div className="bg-[#1c2128] rounded-lg p-3 space-y-2 border border-[#30363d]">
                {[["From", "0x3a7f...c4d2"], ["To", "0x4aC7...f3E2 (Contract)"], ["Value", prices[license].pol], ["Network", "Polygon Amoy"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs font-mono">
                    <span className="text-[#9CA3AF]">{k}</span><span className="text-white">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 py-2 rounded-lg border border-[#30363d] text-xs text-[#9CA3AF] text-center">거절</div>
                <div className="flex-1 py-2 rounded-lg bg-blue-500 text-xs text-white text-center font-medium">승인</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Certificate ────────────────────────────────────────────────────────────────
function CertificateScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  const steps = [
    { num: "01", title: "오디오 특징 추출", desc: "Librosa 기반 MFCC · 템포 · 멜-스펙트로그램 추출", detail: "20 MFCC coefficients · 128 mel bands · 44.1kHz · 3.42s window" },
    { num: "02", title: "프롬프트 임베딩", desc: "LAION-CLAP 오디오-텍스트 벡터화 완료", detail: "LAION-CLAP · 512-dim audio-text embedding" },
    { num: "03", title: "벡터 DB 유사도 비교", desc: "Cosine Similarity 연산 완료 (1,247건)", detail: "등록 음원 벡터 DB (온체인 CID 앵커) · 최고 유사도: 12% · 임계값: 85%" },
  ];
  const top3 = [
    { title: "Void Echoes", similarity: 12, model: "Udio v2" },
    { title: "Synthetic Pulse", similarity: 8, model: "Stable Audio 2.0" },
    { title: "Neon Grid", similarity: 5, model: "MusicGen" },
  ];

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-[#161b22] border border-emerald-500/30 rounded-2xl p-7 mb-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(ellipse at 50% 0%, #10b981 0%, transparent 60%)" }}></div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">결제가 완료되었습니다</h2>
            <p className="text-sm text-[#9CA3AF] max-w-md mx-auto">ERC-1155 라이선스 NFT가 지갑으로 전송되었습니다. AI 독창성 검증 리포트를 확인하세요.</p>
            <div className="flex items-center justify-center gap-3 mt-4 text-xs font-mono text-[#9CA3AF]">
              <span>TX: <span className="text-blue-400">0x7d2f...a91c</span></span>
              <span>·</span>
              <span>NFT Token ID: <span className="text-white">#3891</span></span>
              <span>·</span>
              <span>Block: <span className="text-white">#47,293,841</span></span>
            </div>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#21262d] bg-[#1c2128] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#7c3aed" strokeWidth="1.4"/><circle cx="7" cy="7" r="2" fill="#7c3aed"/></svg>
              <span className="text-sm font-semibold text-white">AI 독창성 검증 리포트</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9CA3AF] font-mono">gatekeeper-v2.1</span>
              <Badge variant="verified">검증 완료</Badge>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-[#21262d]">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] flex items-center justify-center border border-[#30363d] flex-shrink-0">
                <Waveform seed={1} color="#2f80ed" />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold text-white">Neon Cascade</div>
                <div className="text-xs text-[#9CA3AF] font-mono">Suno v4.5 · by 0x8f3a...d7e1 · Standard BGM License</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#9CA3AF] mb-0.5">검증 시각</div>
                <div className="text-xs font-mono text-white">2026-01-13 · 09:21:44 UTC</div>
              </div>
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={step.num} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5L5 9L9.5 3.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {i < steps.length - 1 && <div className="w-px h-8 bg-[#21262d]"></div>}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-emerald-400">Step {step.num}</span>
                      <span className="text-sm font-semibold text-white">{step.title}</span>
                    </div>
                    <div className="text-xs text-[#9CA3AF] mb-1">{step.desc}</div>
                    <div className="text-[10px] font-mono text-[#9CA3AF] bg-[#1c2128] px-2 py-1 rounded border border-[#30363d] inline-block">{step.detail}</div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex-shrink-0">PASS</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10.5L8 14.5L16 6.5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-emerald-400 mb-1">PASS — 독창성 검증 완료</div>
                  <div className="text-sm text-[#e6edf3] mb-3">
                    유사도 <span className="font-mono font-bold text-emerald-400">12%</span> (기준: 85% 미만) — 표절 위험 없음. 독립 창작물로 판정됩니다.
                  </div>
                  <div className="mb-3">
                    <div className="text-xs font-medium text-[#9CA3AF] mb-2">최근접 Top-3 음원</div>
                    <div className="space-y-1.5">
                      {top3.map((t, i) => (
                        <div key={t.title} className="flex items-center gap-3 bg-[#1c2128] rounded-lg px-3 py-1.5 border border-[#30363d]">
                          <span className="text-[10px] font-mono text-[#9CA3AF] w-3">{i + 1}</span>
                          <div className="flex-1">
                            <span className="text-xs text-white">{t.title}</span>
                            <span className="text-[10px] text-[#9CA3AF] font-mono ml-2">{t.model}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1 rounded-full bg-[#30363d] overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${t.similarity}%` }}></div>
                            </div>
                            <span className="text-xs font-mono text-emerald-400 w-5 text-right">{t.similarity}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono">
                    <span className="text-[#9CA3AF]">IPFS CID:</span>
                    <span className="text-blue-400">QmXz9f4aKp8...mN3d</span>
                    <span className="text-[#484f58]">·</span>
                    <span className="text-[#9CA3AF]">온체인 해시:</span>
                    <span className="text-blue-400">0x4aC7...f3E2</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-black font-mono text-emerald-400">12%</div>
                  <div className="text-[10px] text-[#9CA3AF]">Cosine Similarity</div>
                  <div className="mt-1 w-20 h-2 rounded-full bg-[#30363d] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: "12%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attestation */}
            <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">온체인 Attestation (EIP-712)</div>
              {[
                ["검증자 서명", "0x8f3a9c2e1b7d4f6a...d7e1 (EIP-712)"],
                ["모델 버전", "gatekeeper-v2.1 · LAION-CLAP-2024"],
                ["검증 해시 온체인", "0x92e1a4b3...f7c8 (Polygonscan Amoy ↗)"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="text-[10px] text-[#9CA3AF] font-mono w-32 flex-shrink-0">{k}</span>
                  <span className="text-[10px] text-blue-400 font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] text-sm text-white font-medium transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            리포트 PDF 다운로드
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] text-sm text-white font-medium transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Polygonscan (Amoy) 확인
          </button>
          <button onClick={() => setScreen("marketplace")} className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-sm text-white font-semibold transition-colors">
            마켓플레이스로 →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("marketplace");
  const [walletConnected, setWalletConnected] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <GNB
        screen={screen} setScreen={setScreen}
        walletConnected={walletConnected} setWalletConnected={setWalletConnected}
        showWalletModal={showWalletModal} setShowWalletModal={setShowWalletModal}
        showHowItWorks={showHowItWorks} setShowHowItWorks={setShowHowItWorks}
      />
      {screen === "marketplace" && <MarketplaceScreen setScreen={setScreen} />}
      {screen === "upload" && <UploadScreen />}
      {screen === "detail" && <DetailScreen setScreen={setScreen} />}
      {screen === "dashboard" && <DashboardScreen />}
      {screen === "checkout" && <CheckoutScreen setScreen={setScreen} />}
      {screen === "certificate" && <CertificateScreen setScreen={setScreen} />}
    </div>
  );
}
