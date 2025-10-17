chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "askChatGPT") return;

  (async function handleMessage() {
    try {
      const text = msg.text?.trim();
      if (!text) {
        sendResponse({ answer: "❗ No text selected." });
        return;
      }

      const { apiKey } = await chrome.storage.local.get("apiKey");
      if (!apiKey) {
        sendResponse({ answer: "❗ No API key set." });
        return;
      }

      async function callOpenAI(model) {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "You are assisstant." },
              { role: "user", content: text },
            ],
          }),
        });
        return resp.json();
      }

      let data = await callOpenAI("gpt-4o-mini");

      // fallback to GPT-3.5 if quota exceeded
      if (data?.error?.code === "insufficient_quota") {
        console.warn("GPT-4 quota exceeded, trying GPT-3.5-turbo...");
        data = await callOpenAI("gpt-3.5-turbo");
      }

      let answer = "No response from ChatGPT.";

      if (data?.error) {
        answer = `❗ OpenAI API error: ${data.error.message}`;
      } else if (data?.choices?.[0]?.message?.content) {
        answer = data.choices[0].message.content.trim();
      } else {
        console.warn("Unexpected OpenAI response:", data);
      }

      // save to history
      const { history = [] } = await chrome.storage.local.get("history");
      history.unshift({ question: text.slice(0, 300), answer, date: new Date().toLocaleString() });
      await chrome.storage.local.set({ history: history.slice(0, 10) });

      sendResponse({ answer });
    } catch (err) {
      console.error(err);
      sendResponse({ answer: "Error contacting ChatGPT." });
    }
  })();

  return true;
});
