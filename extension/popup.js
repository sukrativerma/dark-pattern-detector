// Ask the content script (running on the current tab) for its findings
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { type: "GET_FINDINGS" }, (response) => {
    const summaryEl = document.getElementById("summary");
    const findingsEl = document.getElementById("findings");

    if (!response || response.count === 0) {
      summaryEl.textContent = "✅ No dark patterns found on this page.";
      return;
    }

    summaryEl.textContent = `⚠️ ${response.count} pattern(s) found on this page:`;
    response.findings.forEach((finding) => {
      const li = document.createElement("li");
      li.textContent = finding;
      findingsEl.appendChild(li);
    });
  });
});