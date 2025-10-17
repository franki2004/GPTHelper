const apiKeyInput = document.getElementById("apiKeyInput");
const saveBtn = document.getElementById("saveBtn");
const tabKey = document.getElementById("tab-key");
const tabHistory = document.getElementById("tab-history");
const keySection = document.getElementById("key-section");
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

(async () => {
    const { apiKey } = await chrome.storage.local.get("apiKey");
    if (apiKey) apiKeyInput.value = apiKey;
})();

saveBtn.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim();
    if (!key.startsWith("sk-")) {
        alert("Invalid API key format.");
        return;
    }
    await chrome.storage.local.set({ apiKey: key });
    alert("API key saved successfully!");
});

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
      <strong>Q:</strong> ${item.question.slice(0, 120)}...<br>
      <strong>A:</strong> ${item.answer.slice(0, 200)}...<br>
      <small>${item.date}</small>
    `;
        historyList.appendChild(li);
    }
}

clearHistoryBtn.addEventListener("click", async () => {
    await chrome.storage.local.set({ history: [] });
    loadHistory();
});

tabKey.addEventListener("click", () => {
    tabKey.classList.add("active");
    tabHistory.classList.remove("active");
    keySection.classList.remove("hidden");
    historySection.classList.add("hidden");
});

tabHistory.addEventListener("click", async () => {
    tabHistory.classList.add("active");
    tabKey.classList.remove("active");
    historySection.classList.remove("hidden");
    keySection.classList.add("hidden");
    loadHistory();
});
