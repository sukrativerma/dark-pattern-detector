console.log("Dark Pattern Detector is running on this page");

// Shared list of human-readable findings, so the popup can display them
let findings = [];

function detectPreCheckedBoxes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((box) => {
    if (box.checked && !box.dataset.dpdFlagged) {
      box.style.outline = "3px solid red";
      box.title = "⚠️ This box was pre-checked for you — a common dark pattern";
      box.dataset.dpdFlagged = "true";
      findings.push("Pre-checked checkbox found");
    }
  });
}

function detectCountdownTimers() {
  const timePattern = /\b\d{1,2}:\d{2}:\d{2}\b/;
  const allElements = document.querySelectorAll("body *");

  allElements.forEach((el) => {
    const directText = Array.from(el.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join(" ")
      .trim();

    if (timePattern.test(directText) && !el.dataset.dpdFlagged) {
      el.style.outline = "3px solid orange";
      el.title = "⚠️ Countdown timer detected — check if it's real urgency or fake pressure";
      el.dataset.dpdFlagged = "true";
      findings.push("Countdown timer detected");
    }
  });
}

function detectHiddenLinks() {
  const suspiciousKeywords = ["unsubscribe", "cancel", "opt out", "opt-out", "delete account", "no thanks"];
  const allElements = document.querySelectorAll("a, button, span, p, div");

  allElements.forEach((el) => {
    const text = el.textContent.trim().toLowerCase();
    const matchesKeyword = suspiciousKeywords.some((keyword) => text.includes(keyword));

    if (matchesKeyword && !el.dataset.dpdFlagged) {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const isTiny = fontSize < 11;
      const isLowContrast = style.color === style.backgroundColor;

      if (isTiny || isLowContrast) {
        el.style.outline = "3px solid purple";
        el.title = "⚠️ Possibly hidden cancel/unsubscribe link — tiny or low-contrast text";
        el.dataset.dpdFlagged = "true";
        findings.push("Hidden/low-contrast link found");
      }
    }
  });
}

function detectFakeScarcity() {
  const scarcityPatterns = [
    /only\s+\d+\s+left/i,
    /\d+\s+people\s+(are\s+)?(viewing|looking at|bought)/i,
    /almost\s+(gone|sold out)/i,
    /selling\s+fast/i,
    /hurry,?\s+(limited|few)\s+(stock|left|remaining)/i,
    /in\s+high\s+demand/i
  ];

  const allElements = document.querySelectorAll("body *");

  allElements.forEach((el) => {
    const directText = Array.from(el.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join(" ")
      .trim();

    if (!directText || el.dataset.dpdFlagged) return;

    const matched = scarcityPatterns.some((pattern) => pattern.test(directText));
    if (matched) {
      el.style.outline = "3px solid crimson";
      el.title = "⚠️ Possible fake scarcity/urgency claim — verify if this is real";
      el.dataset.dpdFlagged = "true";
      findings.push("Fake scarcity/urgency claim found");
    }
  });
}

function runAllDetectors() {
  detectPreCheckedBoxes();
  detectCountdownTimers();
  detectHiddenLinks();
  detectFakeScarcity();

  if (findings.length > 0) {
    console.log(`Dark Pattern Detector: found ${findings.length} pattern(s)`, findings);
  }
}

function sendFindingsToBackend() {
  if (findings.length === 0) return; // don't bother sending empty scans

  fetch("http://localhost:3001/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: window.location.href,
      findings: findings
    })
  })
    .then((res) => res.json())
    .then((data) => console.log("Scan saved to backend:", data))
    .catch((err) => console.error("Failed to save scan:", err));
}

runAllDetectors();
setTimeout(() => {
  runAllDetectors();
  sendFindingsToBackend();
}, 2000);

// Listen for the popup asking "what did you find?"
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_FINDINGS") {
    sendResponse({ count: findings.length, findings: findings });
  }
});