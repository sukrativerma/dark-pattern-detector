"use client";

import { useEffect, useState } from "react";

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

export default function Home() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/scans")
      .then((res) => res.json())
      .then((data) => {
        setScans(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not connect to backend. Is your server running?");
        setLoading(false);
      });
  }, []);

  const totalFindings = scans.reduce(
    (sum, scan) => sum + (Array.isArray(scan.findings) ? scan.findings.length : 0),
    0
  );

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="text-xl font-semibold tracking-tight">Dark Pattern Detector</h1>
          <p className="text-sm text-gray-500 mt-1">
            {scans.length} page{scans.length !== 1 ? "s" : ""} scanned · {totalFindings} pattern{totalFindings !== 1 ? "s" : ""} flagged
          </p>
        </div>

        {loading && <p className="text-gray-500 text-sm">Loading scans…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!loading && !error && scans.length === 0 && (
          <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-500 text-sm">
            No scans yet. Browse the web with the extension active to see results here.
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