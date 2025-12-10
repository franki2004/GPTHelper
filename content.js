(function () {
    let isSelecting = false, startX, startY, endX, endY, selectionBox, selectionJustEnded = false;

    function createBox() {
        const box = document.createElement("div");
        box.id = "chatgpt-selection-box";
        box.style.position = "fixed";
        box.style.border = "1.5px dashed #10a37f"; // ChatGPT green
        box.style.backgroundColor = "rgba(16, 163, 127, 0.08)";
        box.style.zIndex = "2147483647";
        box.style.pointerEvents = "none";
        box.style.display = "none";
        document.body.appendChild(box);
        return box;
    }

    selectionBox = document.getElementById("chatgpt-selection-box") || createBox();

    function collectTextInRect(left, top, right, bottom) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const lines = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const parent = node.parentElement;
            if (!parent) continue;
            const rect = parent.getBoundingClientRect();
            if (rect.width && rect.height && rect.bottom > top && rect.top < bottom &&
                rect.right > left && rect.left < right &&
                getComputedStyle(parent).visibility !== "hidden") {
                const text = node.textContent.trim();
                if (text) lines.push(text);
            }
        }
        return lines.join("\n");
    }

    function showTooltip(x, y, text) {
        const old = document.getElementById("chatgpt-tooltip");
        if (old) old.remove();

        const tip = document.createElement("div");
        tip.id = "chatgpt-tooltip";

        // ChatGPT dark style
        tip.style.position = "fixed";
        tip.style.top = y + "px";
        tip.style.left = x + "px";
        tip.style.width = "480px";
        tip.style.maxHeight = "400px";
        tip.style.background = "#343541"; // chatgpt dark gray
        tip.style.color = "#ececf1";
        tip.style.border = "1px solid #565869";
        tip.style.borderRadius = "10px";
        tip.style.boxShadow = "0 8px 25px rgba(0,0,0,0.5)";
        tip.style.zIndex = "2147483647";
        tip.style.display = "flex";
        tip.style.flexDirection = "column";
        tip.style.overflow = "hidden";
        tip.style.fontSize = "13px";
        tip.style.fontFamily = `'Inter', 'Segoe UI', sans-serif`;

        // Header bar
        const titleBar = document.createElement("div");
        titleBar.style.background = "#40414f";
        titleBar.style.color = "#d1d5db";
        titleBar.style.padding = "6px 10px";
        titleBar.style.cursor = "move";
        titleBar.style.display = "flex";
        titleBar.style.justifyContent = "space-between";
        titleBar.style.alignItems = "center";
        titleBar.style.fontWeight = "500";
        titleBar.innerHTML = `<span>ChatGPT Preview</span>`;

        const closeBtn = document.createElement("button");
        closeBtn.innerText = "×";
        closeBtn.style.background = "transparent";
        closeBtn.style.border = "none";
        closeBtn.style.color = "#d1d5db";
        closeBtn.style.fontSize = "16px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.transition = "color 0.2s";
        closeBtn.onmouseover = () => (closeBtn.style.color = "#fff");
        closeBtn.onmouseout = () => (closeBtn.style.color = "#d1d5db");
        closeBtn.onclick = () => tip.remove();

        titleBar.appendChild(closeBtn);
        tip.appendChild(titleBar);

        // Content area
        const contentWrapper = document.createElement("div");
        contentWrapper.style.display = "flex";
        contentWrapper.style.flex = "1";
        contentWrapper.style.overflow = "hidden";

        const questionDiv = document.createElement("div");
        questionDiv.style.flex = "1";
        questionDiv.style.padding = "10px";
        questionDiv.style.borderRight = "1px solid #565869";
        questionDiv.style.overflowY = "auto";
        questionDiv.style.maxHeight = "calc(100% - 10px)";
        questionDiv.innerText = text || "No text found.";

        const answerDiv = document.createElement("div");
        answerDiv.style.flex = "1";
        answerDiv.style.padding = "10px";
        answerDiv.style.overflowY = "auto";
        answerDiv.style.maxHeight = "calc(100% - 10px)";
        answerDiv.style.color = "#c5c5d2";
        answerDiv.innerText = "Answer will appear here...";

        contentWrapper.appendChild(questionDiv);
        contentWrapper.appendChild(answerDiv);
        tip.appendChild(contentWrapper);

        // Button
        const button = document.createElement("button");
        button.innerText = "Send to ChatGPT";
        button.style.margin = "10px";
        button.style.padding = "8px 14px";
        button.style.background = "#10a37f";
        button.style.color = "#fff";
        button.style.border = "none";
        button.style.borderRadius = "6px";
        button.style.cursor = "pointer";
        button.style.fontWeight = "500";
        button.style.transition = "background 0.2s";
        button.onmouseover = () => (button.style.background = "#0e8c6f");
        button.onmouseout = () => (button.style.background = "#10a37f");

        button.onclick = () => {
            answerDiv.innerText = "Thinking...";
            button.disabled = true;
            button.style.opacity = "0.6";

            chrome.runtime.sendMessage({ action: "askChatGPT", text }, function (response) {
                if (response && response.answer) {
                    answerDiv.innerText = response.answer;
                } else {
                    answerDiv.innerText = "No response from ChatGPT.";
                }
                button.disabled = false;
                button.style.opacity = "1";
            });
        };

        tip.appendChild(button);
        document.body.appendChild(tip);

        // Drag logic
        let isDragging = false, offsetX, offsetY;
        titleBar.addEventListener("mousedown", (e) => {
            isDragging = true;
            offsetX = e.clientX - tip.getBoundingClientRect().left;
            offsetY = e.clientY - tip.getBoundingClientRect().top;
            e.preventDefault();
        });
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            let left = e.clientX - offsetX;
            let top = e.clientY - offsetY;
            left = Math.max(0, Math.min(left, window.innerWidth - tip.offsetWidth));
            top = Math.max(0, Math.min(top, window.innerHeight - tip.offsetHeight));
            tip.style.left = left + "px";
            tip.style.top = top + "px";
        });
        document.addEventListener("mouseup", () => { isDragging = false; });
    }

    // ALT + Drag selection
    document.addEventListener("mousedown", (e) => {
        if (e.altKey && e.button === 0) {
            e.preventDefault();
            isSelecting = true;
            startX = e.clientX;
            startY = e.clientY;
            selectionBox.style.left = startX + "px";
            selectionBox.style.top = startY + "px";
            selectionBox.style.width = "0px";
            selectionBox.style.height = "0px";
            selectionBox.style.display = "block";
        }
    }, true);

    document.addEventListener("mousemove", (e) => {
        if (!isSelecting) return;
        e.preventDefault();
        endX = e.clientX; endY = e.clientY;
        const left = Math.min(startX, endX), top = Math.min(startY, endY);
        const width = Math.abs(startX - endX), height = Math.abs(startY - endY);
        selectionBox.style.left = left + "px";
        selectionBox.style.top = top + "px";
        selectionBox.style.width = width + "px";
        selectionBox.style.height = height + "px";
    }, true);

    document.addEventListener("mouseup", (e) => {
        if (!isSelecting) return;
        e.preventDefault();
        isSelecting = false;
        selectionJustEnded = true;
        selectionBox.style.display = "none";

        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);
        const right = Math.max(startX, endX);
        const bottom = Math.max(startY, endY);

        // Extract DOM text within selection
        const textFromNodes = collectTextInRect(left, top, right, bottom);

        // Ask background to capture screenshot of the visible tab
        chrome.runtime.sendMessage({ action: "captureArea", rect: { left, top, right, bottom } }, async (resp) => {
            let ocrText = "";

            // Run OCR only on cropped area
            if (resp?.dataUrl && window.Tesseract) {
                try {
                    // Create an offscreen image to crop
                    const img = new Image();
                    img.src = resp.dataUrl;
                    await img.decode();

                    const canvas = document.createElement("canvas");
                    canvas.width = right - left;
                    canvas.height = bottom - top;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, left, top, right - left, bottom - top, 0, 0, right - left, bottom - top);

                    const result = await Tesseract.recognize(canvas.toDataURL(), "eng", { logger: () => { } });
                    ocrText = result.data.text.trim();
                } catch (err) {
                    console.warn("OCR failed:", err);
                }
            }

            const finalText = [textFromNodes, ocrText].filter(Boolean).join("\n\n");
            showTooltip(e.clientX + 15, e.clientY + 15, finalText || "No text found");
        });
    }, true);
    document.addEventListener("click", (e) => {
        if (selectionJustEnded) {
            e.preventDefault();
            e.stopImmediatePropagation();
            selectionJustEnded = false;
        }
    }, true);
})();
