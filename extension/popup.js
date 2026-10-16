chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "GET_FINDINGS" }, (response) => {
    const summaryEl = document.getElementById("summary");
    const findingsEl = document.getElementById("findings");

    // No reply means the content script isn't running on this tab
    if (chrome.runtime.lastError || !response) {
      summaryEl.textContent = "⚠️ The detector isn't active on this page. Try refreshing the tab.";
      return;
    }

    if (response.count === 0) {
      summaryEl.textContent = "✅ Page scanned: no dark patterns found.";
      return;
    }

    summaryEl.textContent = `⚠️ ${response.count} pattern(s) found on this page:`;
    response.findings.forEach((finding) => {
      const li = document.createElement("li");
      li.textContent = `[${finding.confidence.toUpperCase()}] ${finding.type}: ${finding.reason}`;
      findingsEl.appendChild(li);
    });
  });
});