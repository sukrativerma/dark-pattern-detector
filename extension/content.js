console.log("Dark Pattern Detector is running on this page");

let findings = []; // now stores objects instead of plain strings

function addFinding(type, confidence, reason) {
  findings.push({ type, confidence, reason });
}

function detectPreCheckedBoxes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const lowRiskKeywords = ["terms", "policy", "required", "agree"];
  const highRiskKeywords = ["insurance", "subscribe", "newsletter", "add-on", "protection", "warranty"];

  checkboxes.forEach((box) => {
    if (box.checked && !box.dataset.dpdFlagged) {
      // Try to read nearby label text for context
      const label = box.closest("label")?.textContent?.toLowerCase() || "";

      let confidence = "medium";
      let reason = "Pre-checked checkbox with unclear context";

      if (highRiskKeywords.some((kw) => label.includes(kw))) {
        confidence = "high";
        reason = "Pre-checked box likely adds a paid extra or subscription without asking";
      } else if (lowRiskKeywords.some((kw) => label.includes(kw))) {
        confidence = "low";
        reason = "Pre-checked box appears to be a standard required agreement";
      }

      box.style.outline = confidence === "low" ? "2px dashed gray" : "3px solid red";
      box.title = `⚠️ ${reason}`;
      box.dataset.dpdFlagged = "true";
      addFinding("Pre-checked checkbox", confidence, reason);
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
      // Store first-seen value to detect resets on reload (basic version using localStorage)
      const key = "dpd_timer_" + window.location.hostname;
      const seenBefore = localStorage.getItem(key);
      const currentMatch = directText.match(timePattern)[0];

      let confidence = "low";
      let reason = "Countdown timer present — could be a real, time-limited offer";

      if (seenBefore && seenBefore === currentMatch) {
        confidence = "high";
        reason = "Countdown timer shows the same time as your last visit — likely fake urgency";
      }

      localStorage.setItem(key, currentMatch);

      el.style.outline = confidence === "low" ? "2px dashed gray" : "3px solid orange";
      el.title = `⚠️ ${reason}`;
      el.dataset.dpdFlagged = "true";
      addFinding("Countdown timer", confidence, reason);
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
        const confidence = isTiny && isLowContrast ? "high" : "medium";
        const reason = isTiny && isLowContrast
          ? "Cancel/unsubscribe link is both tiny and low-contrast — likely deliberately hidden"
          : "Cancel/unsubscribe link is harder to notice than it should be";

        el.style.outline = "3px solid purple";
        el.title = `⚠️ ${reason}`;
        el.dataset.dpdFlagged = "true";
        addFinding("Hidden link", confidence, reason);
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
      // Scarcity claims are inherently hard to verify without repeated visits — default medium
      const confidence = "medium";
      const reason = "Urgency/scarcity claim found — verify if the number or claim is real";

      el.style.outline = "3px solid crimson";
      el.title = `⚠️ ${reason}`;
      el.dataset.dpdFlagged = "true";
      addFinding("Fake scarcity claim", confidence, reason);
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
  if (findings.length === 0) return;

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_FINDINGS") {
    sendResponse({ count: findings.length, findings: findings });
  }
});