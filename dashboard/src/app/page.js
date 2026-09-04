"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/scans")
      .then((res) => res.json())
      .then((data) => {
        setScans(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not connect to backend. Is your server running?");
        setLoading(false);
      });
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">🔍 Dark Pattern Detector Dashboard</h1>
      <p className="text-gray-500 mb-6">
        Scan history from sites you've visited with the extension active.
      </p>

      {loading && <p>Loading scans...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && scans.length === 0 && (
        <p className="text-gray-500">No scans yet — browse with the extension active to see results here.</p>
      )}

      <div className="space-y-4">
        {scans.map((scan) => (
          <div key={scan.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium truncate">{scan.url}</span>
              <span className="text-xs text-gray-400">
                {new Date(scan.created_at).toLocaleString()}
              </span>
            </div>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {scan.findings.map((finding, i) => (
                <li key={i}>{finding}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}