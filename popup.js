const apiKeyInput = document.getElementById("apiKeyInput");
const systemPromptInput = document.getElementById("systemPromptInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const savePromptBtn = document.getElementById("savePromptBtn");
const tabKey = document.getElementById("tab-key");
const tabHistory = document.getElementById("tab-history");
const keySection = document.getElementById("key-section");
const promptSection = document.getElementById("prompt-section");
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

// Load saved values
(async () => {
    const { apiKey, systemPrompt } = await chrome.storage.local.get(["apiKey", "systemPrompt"]);
    if (apiKey) apiKeyInput.value = apiKey;
    if (systemPrompt) systemPromptInput.value = systemPrompt;
})();

// Save API key
saveKeyBtn.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim();
    if (!key.startsWith("sk-")) {
        alert("Invalid API key format.");
        return;
    }
    await chrome.storage.local.set({ apiKey: key });
    alert("API Key saved successfully!");
});

// Save system prompt
savePromptBtn.addEventListener("click", async () => {
    const prompt = systemPromptInput.value.trim() || "Act as an assistant.";
    await chrome.storage.local.set({ systemPrompt: prompt });
    alert("System prompt saved!");
});

// Load history
async function loadHistory() {
    const { history = [] } = await chrome.storage.local.get("history");
    historyList.innerHTML = "";

    if (history.length === 0) {
        historyList.innerHTML = "<li>No history yet.</li>";
        return;
    }

    for (const item of history) {
        const li = document.createElement("li");
        li.innerHTML = `
      <strong>Question:</strong> ${item.question.slice(0, 100)}...<br>
      <strong>Answer:</strong> ${item.answer.slice(0, 200)}...<br>
      <small>${item.date}</small>
    `;
        historyList.appendChild(li);
    }
}

// Clear history
clearHistoryBtn.addEventListener("click", async () => {
    await chrome.storage.local.set({ history: [] });
    loadHistory();
});

// Tab switching logic
tabKey.addEventListener("click", () => {
    tabKey.classList.add("active");
    tabHistory.classList.remove("active");
    keySection.classList.remove("hidden");
    promptSection.classList.remove("hidden");
    historySection.classList.add("hidden");
});

tabHistory.addEventListener("click", async () => {
    tabHistory.classList.add("active");
    tabKey.classList.remove("active");
    historySection.classList.remove("hidden");
    keySection.classList.add("hidden");
    promptSection.classList.add("hidden");
    loadHistory();
});
