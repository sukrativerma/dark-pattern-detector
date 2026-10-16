const input = document.getElementById("token");
const status = document.getElementById("status");

chrome.storage.local.get("apiToken", ({ apiToken }) => {
  status.textContent = apiToken
    ? "✅ A token is saved. Paste a new one to replace it."
    : "No token saved yet.";
});

document.getElementById("save").addEventListener("click", () => {
  const token = input.value.trim();
  if (!token.startsWith("dpd_")) {
    status.textContent = "❌ That doesn't look like a valid token (it should start with dpd_).";
    return;
  }
  chrome.storage.local.set({ apiToken: token }, () => {
    input.value = "";
    status.textContent = "✅ Token saved.";
  });
});

document.getElementById("clear").addEventListener("click", () => {
  chrome.storage.local.remove("apiToken", () => {
    status.textContent = "Token removed. Scans won't be saved until you add a new one.";
  });
});