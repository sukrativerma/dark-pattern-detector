"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const API = "http://localhost:3001";

function confidenceStyle(confidence) {
  switch (confidence) {
    case "high":
      return { border: "border-red-500/40", text: "text-red-400", bg: "bg-red-500/10", label: "High risk" };
    case "medium":
      return { border: "border-amber-500/40", text: "text-amber-400", bg: "bg-amber-500/10", label: "Medium risk" };
    case "low":
      return { border: "border-gray-500/40", text: "text-gray-400", bg: "bg-gray-500/10", label: "Low risk" };
    default:
      return { border: "border-gray-600/40", text: "text-gray-500", bg: "bg-gray-600/10", label: "Unscored" };
  }
}

function calculateStats(scans) {
  const typeCounts = {};
  const confidenceCounts = { high: 0, medium: 0, low: 0 };

  scans.forEach((scan) => {
    (scan.findings || []).forEach((finding) => {
      if (typeof finding === "object" && finding !== null) {
        typeCounts[finding.type] = (typeCounts[finding.type] || 0) + 1;
        if (confidenceCounts[finding.confidence] !== undefined) {
          confidenceCounts[finding.confidence]++;
        }
      }
    });
  });

  const chartData = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
  return { chartData, confidenceCounts };
}

export default function Home() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newToken, setNewToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    async function loadScans() {
      try {
        // Ask Clerk for this user's session token and send it to our backend
        const sessionToken = await getToken();
        const res = await fetch(`${API}/scans`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        setScans(Array.isArray(data) ? data : []);
      } catch {
        setError("Could not load scans. Is your backend running?");
      } finally {
        setLoading(false);
      }
    }

    loadScans();
  }, [isLoaded, isSignedIn, getToken]);

  async function generateToken() {
    setTokenLoading(true);
    setTokenError(null);
    try {
      const sessionToken = await getToken();
      const res = await fetch(`${API}/token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setNewToken(data.token);
      setCopied(false);
    } catch {
      setTokenError("Could not generate a token. Is your backend running?");
    } finally {
      setTokenLoading(false);
    }
  }

  async function copyToken() {
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
  }

  const totalFindings = scans.reduce(
    (sum, scan) => sum + (Array.isArray(scan.findings) ? scan.findings.length : 0),
    0
  );

  const { chartData, confidenceCounts } = calculateStats(scans);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="text-xl font-semibold tracking-tight">Dark Pattern Detector</h1>
          {isSignedIn && (
            <p className="text-sm text-gray-500 mt-1">
              {scans.length} page{scans.length !== 1 ? "s" : ""} scanned · {totalFindings} pattern{totalFindings !== 1 ? "s" : ""} flagged
            </p>
          )}
        </div>

        {isLoaded && !isSignedIn && (
          <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-500 text-sm">
            Sign in to see your scan history and connect the extension.
          </div>
        )}

        {isSignedIn && (
          <div className="mb-10 border border-gray-800 rounded-lg p-5 bg-[#151821]">
            <h2 className="text-sm text-gray-400 mb-1">Connect your extension</h2>
            <p className="text-xs text-gray-600 mb-4">
              Generate a personal token and paste it into the extension so your scans are saved to your account.
              Generating a new token replaces the old one.
            </p>

            <button
              onClick={generateToken}
              disabled={tokenLoading}
              className="text-sm bg-amber-500/90 hover:bg-amber-400 text-black font-medium rounded px-4 py-2 disabled:opacity-50 cursor-pointer"
            >
              {tokenLoading ? "Generating…" : newToken ? "Regenerate token" : "Generate API token"}
            </button>

            {tokenError && <p className="text-red-400 text-xs mt-3">{tokenError}</p>}

            {newToken && (
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs bg-black/40 border border-gray-800 rounded px-3 py-2 break-all flex-1">
                    {newToken}
                  </code>
                  <button
                    onClick={copyToken}
                    className="text-xs border border-gray-700 rounded px-3 py-2 hover:bg-gray-800 cursor-pointer"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-amber-400/80 mt-2">
                  Copy it now. For security it is only shown once and can't be retrieved later.
                </p>
              </div>
            )}
          </div>
        )}

        {isSignedIn && !loading && !error && scans.length > 0 && (
          <div className="mb-10 grid grid-cols-3 gap-3">
            <div className="border border-gray-800 rounded-lg p-4 bg-[#151821]">
              <div className="text-2xl font-semibold text-red-400">{confidenceCounts.high}</div>
              <div className="text-xs text-gray-500 mt-1">High risk</div>
            </div>
            <div className="border border-gray-800 rounded-lg p-4 bg-[#151821]">
              <div className="text-2xl font-semibold text-amber-400">{confidenceCounts.medium}</div>
              <div className="text-xs text-gray-500 mt-1">Medium risk</div>
            </div>
            <div className="border border-gray-800 rounded-lg p-4 bg-[#151821]">
              <div className="text-2xl font-semibold text-gray-400">{confidenceCounts.low}</div>
              <div className="text-xs text-gray-500 mt-1">Low risk</div>
            </div>
          </div>
        )}

        {isSignedIn && !loading && !error && chartData.length > 0 && (
          <div className="mb-10 border border-gray-800 rounded-lg p-4 bg-[#151821]">
            <h2 className="text-sm text-gray-400 mb-4">Pattern types found</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="type" tick={{ fill: "#8B92A3", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8B92A3", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#1A1D24", border: "1px solid #333", borderRadius: 6 }}
                  labelStyle={{ color: "#E4E6EB" }}
                />
                <Bar dataKey="count" fill="#F2B84B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {isSignedIn && loading && <p className="text-gray-500 text-sm">Loading scans…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {isSignedIn && !loading && !error && scans.length === 0 && (
          <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-500 text-sm">
            No scans yet. Connect the extension with your token, then browse the web to see results here.
          </div>
        )}

        <div className="space-y-5">
          {scans.map((scan) => (
            <div key={scan.id} className="border border-gray-800 rounded-lg p-5 bg-[#151821]">
              <div className="flex justify-between items-start gap-4 mb-3">
                <span className="font-mono text-xs text-gray-400 break-all">{scan.url}</span>
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {new Date(scan.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-2">
                {(scan.findings || []).map((finding, i) => {
                  const isObject = typeof finding === "object" && finding !== null;
                  const style = confidenceStyle(isObject ? finding.confidence : null);
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2 text-sm border-l-2 ${style.border} ${style.bg} px-3 py-2 rounded-r`}
                    >
                      <span className={`text-xs font-medium ${style.text} whitespace-nowrap mt-0.5`}>
                        {style.label}
                      </span>
                      <span className="text-gray-300">
                        {isObject ? `${finding.type} — ${finding.reason}` : finding}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}