chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_SCAN") {
    fetch("http://localhost:3001/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload)
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Scan saved to backend:", data);
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        console.error("Failed to save scan:", err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // keep the message channel open for async response
  }
});