chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_SCAN") {
    chrome.storage.local.get("apiToken", ({ apiToken }) => {
      if (!apiToken) {
        console.warn("Dark Pattern Detector: no API token set, scan not saved. Add one in the extension options.");
        sendResponse({ success: false, error: "No API token" });
        return;
      }

      fetch("http://localhost:3001/scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Token": apiToken,
        },
        body: JSON.stringify(message.payload),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Request failed");
          return data;
        })
        .then((data) => {
          console.log("Scan saved to backend:", data);
          sendResponse({ success: true, data });
        })
        .catch((err) => {
          console.error("Failed to save scan:", err.message);
          sendResponse({ success: false, error: err.message });
        });
    });
    return true; // keep the message channel open for the async response
  }
});