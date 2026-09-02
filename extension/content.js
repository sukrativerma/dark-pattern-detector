console.log("Dark Pattern Detector is running on this page");

function detectPreCheckedBoxes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  let flaggedCount = 0;

  checkboxes.forEach((box) => {
    if (box.checked) {
      box.style.outline = "3px solid red";
      box.title = "⚠️ This box was pre-checked for you — a common dark pattern";
      flaggedCount++;
    }
  });

  if (flaggedCount > 0) {
    console.log(`Dark Pattern Detector: found ${flaggedCount} pre-checked box(es)`);
  }
}

detectPreCheckedBoxes();
setTimeout(detectPreCheckedBoxes, 2000);

function detectCountdownTimers() {
  // Look for text patterns like "00:04:59" or "02:59:41" (common countdown formats)
  const timePattern = /\b\d{1,2}:\d{2}:\d{2}\b/;
  const allElements = document.querySelectorAll("body *");
  let flaggedCount = 0;

  allElements.forEach((el) => {
    // Only check elements with direct text (avoid flagging parent containers repeatedly)
    const directText = Array.from(el.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join(" ")
      .trim();

    if (timePattern.test(directText) && !el.dataset.dpdFlagged) {
      el.style.outline = "3px solid orange";
      el.title = "⚠️ Countdown timer detected — check if it's real urgency or fake pressure";
      el.dataset.dpdFlagged = "true"; // prevent re-flagging on repeated scans
      flaggedCount++;
    }
  });

  if (flaggedCount > 0) {
    console.log(`Dark Pattern Detector: found ${flaggedCount} countdown timer(s)`);
  }
}

detectCountdownTimers();
setTimeout(detectCountdownTimers, 2000);

function detectHiddenLinks() {
  // Keywords commonly hidden using tiny/low-contrast styling
  const suspiciousKeywords = ["unsubscribe", "cancel", "opt out", "opt-out", "delete account", "no thanks"];
const allLinks = document.querySelectorAll("a, button, span, p, div");  let flaggedCount = 0;

  allLinks.forEach((el) => {
    const text = el.textContent.trim().toLowerCase();
    const matchesKeyword = suspiciousKeywords.some((keyword) => text.includes(keyword));

    if (matchesKeyword && !el.dataset.dpdFlagged) {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const color = style.color;
      const bgColor = style.backgroundColor;

      // Simple heuristic: flag if font is tiny (likely hidden-in-plain-sight)
      const isTiny = fontSize < 11;

      // Simple heuristic: flag if text color closely matches background (low contrast)
      const isLowContrast = color === bgColor; // basic check for now — can improve later with real contrast ratio math

      if (isTiny || isLowContrast) {
        el.style.outline = "3px solid purple";
        el.title = `⚠️ Possibly hidden ${matchesKeyword ? "cancel/unsubscribe" : ""} link — tiny or low-contrast text`;
        el.dataset.dpdFlagged = "true";
        flaggedCount++;
      }
    }
  });

  if (flaggedCount > 0) {
    console.log(`Dark Pattern Detector: found ${flaggedCount} hidden/tiny link(s)`);
  }
}

detectHiddenLinks();
setTimeout(detectHiddenLinks, 2000);

function detectFakeScarcity() {
  // Common scarcity/urgency phrases used to pressure buyers
  const scarcityPatterns = [
    /only\s+\d+\s+left/i,
    /\d+\s+people\s+(are\s+)?(viewing|looking at|bought)/i,
    /almost\s+(gone|sold out)/i,
    /selling\s+fast/i,
    /hurry,?\s+(limited|few)\s+(stock|left|remaining)/i,
    /in\s+high\s+demand/i
  ];

  const allElements = document.querySelectorAll("body *");
  let flaggedCount = 0;

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
      flaggedCount++;
    }
  });

  if (flaggedCount > 0) {
    console.log(`Dark Pattern Detector: found ${flaggedCount} scarcity/urgency claim(s)`);
  }
}

detectFakeScarcity();
setTimeout(detectFakeScarcity, 2000);