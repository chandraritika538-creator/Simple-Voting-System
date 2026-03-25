"use client";

import { useState, useCallback } from "react";
import {
  initVoting,
  vote,
  getVotes,
  getAllVotes,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function VoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Candidate Button ────────────────────────────────────────

function CandidateButton({
  name,
  votes,
  selected,
  onClick,
  color,
}: {
  name: string;
  votes: number;
  selected: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between rounded-xl border px-4 py-3 transition-all active:scale-[0.98]",
        selected
          ? "border-white/20 bg-white/[0.06]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <span style={{ color }} className="text-sm font-bold">
            {name.charAt(0)}
          </span>
        </div>
        <span className="font-medium text-white/80">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-white/50">{votes}</span>
        {selected && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#34d399]/20">
            <CheckIcon />
          </span>
        )}
      </div>
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "vote" | "results";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

const DEFAULT_CANDIDATES = ["Alice", "Bob", "Charlie"];
const CANDIDATE_COLORS = ["#7c6cf0", "#4fc3f7", "#fbbf24"];

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("vote");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [customCandidate, setCustomCandidate] = useState("");
  const [isVoting, setIsVoting] = useState(false);

  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [results, setResults] = useState<Record<string, number>>({});

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleVote = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    const candidate = customCandidate.trim() || selectedCandidate;
    if (!candidate) return setError("Select or enter a candidate");
    setError(null);
    setIsVoting(true);
    setTxStatus("Awaiting signature...");
    try {
      await vote(walletAddress, candidate);
      setTxStatus("Vote cast successfully!");
      setSelectedCandidate("");
      setCustomCandidate("");
      // Refresh results
      const allVotes = await getAllVotes();
      if (allVotes) {
        const mapped: Record<string, number> = {};
        for (const [k, v] of Object.entries(allVotes)) {
          mapped[String(k)] = Number(v);
        }
        setResults(mapped);
      }
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(msg.includes("already voted") ? "You have already voted!" : msg);
      setTxStatus(null);
    } finally {
      setIsVoting(false);
    }
  }, [walletAddress, selectedCandidate, customCandidate]);

  const handleLoadResults = useCallback(async () => {
    setError(null);
    setIsLoadingResults(true);
    try {
      const allVotes = await getAllVotes();
      if (allVotes && typeof allVotes === "object") {
        const mapped: Record<string, number> = {};
        for (const [k, v] of Object.entries(allVotes)) {
          mapped[String(k)] = Number(v);
        }
        setResults(mapped);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "vote", label: "Vote", icon: <VoteIcon />, color: "#7c6cf0" },
    { key: "results", label: "Results", icon: <BarChartIcon />, color: "#34d399" },
  ];

  const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("success") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#34d399]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Simple Voting System</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="success" className="text-[10px]">Live</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Vote */}
            {activeTab === "vote" && (
              <div className="space-y-5">
                <MethodSignature name="vote" params="(voter: Address, candidate: String)" color="#7c6cf0" />
                
                <div className="space-y-3">
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">Select Candidate</label>
                  {DEFAULT_CANDIDATES.map((cand, i) => (
                    <CandidateButton
                      key={cand}
                      name={cand}
                      votes={results[cand] || 0}
                      selected={selectedCandidate === cand}
                      onClick={() => { setSelectedCandidate(cand); setCustomCandidate(""); }}
                      color={CANDIDATE_COLORS[i]}
                    />
                  ))}
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-white/30 uppercase">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <Input
                  label="Custom Candidate"
                  value={customCandidate}
                  onChange={(e) => { setCustomCandidate(e.target.value); setSelectedCandidate(""); }}
                  placeholder="Enter candidate name..."
                />

                {walletAddress ? (
                  <ShimmerButton onClick={handleVote} disabled={isVoting} shimmerColor="#7c6cf0" className="w-full">
                    {isVoting ? <><SpinnerIcon /> Casting Vote...</> : <><VoteIcon /> Cast Vote</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to vote
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            {activeTab === "results" && (
              <div className="space-y-5">
                <MethodSignature name="get_all_votes" params="()" returns="-> Map<String, u32>" color="#34d399" />
                
                <ShimmerButton onClick={handleLoadResults} disabled={isLoadingResults} shimmerColor="#34d399" className="w-full">
                  {isLoadingResults ? <><SpinnerIcon /> Loading...</> : <><RefreshIcon /> Refresh Results</>}
                </ShimmerButton>

                {Object.keys(results).length > 0 && (
                  <div className="space-y-3 animate-fade-in-up">
                    {DEFAULT_CANDIDATES.map((cand, i) => {
                      const candVotes = results[cand] || 0;
                      const percentage = totalVotes > 0 ? (candVotes / totalVotes) * 100 : 0;
                      return (
                        <div key={cand} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                          <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-7 w-7 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${CANDIDATE_COLORS[i]}20` }}
                              >
                                <span style={{ color: CANDIDATE_COLORS[i] }} className="text-xs font-bold">
                                  {cand.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium text-white/80">{cand}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-white/60">{candVotes}</span>
                              <span className="text-[10px] text-white/30">votes</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-white/[0.02]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                background: `linear-gradient(to right, ${CANDIDATE_COLORS[i]}, ${CANDIDATE_COLORS[i]}66)`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="pt-2 flex items-center justify-between text-xs text-white/30">
                      <span>Total votes</span>
                      <span className="font-mono">{totalVotes}</span>
                    </div>
                  </div>
                )}

                {Object.keys(results).length === 0 && !isLoadingResults && (
                  <div className="text-center py-8 text-white/30 text-sm">
                    No votes yet. Be the first to vote!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Simple Voting System &middot; Soroban</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                <span className="font-mono text-[9px] text-white/15">Live</span>
              </span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
