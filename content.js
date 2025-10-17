(function () {
    let isSelecting = false, startX, startY, endX, endY, selectionBox, selectionJustEnded = false;

    function createBox() {
        const box = document.createElement("div");
        box.id = "chatgpt-selection-box";
        box.style.position = "fixed";
        box.style.border = "2px dashed #007bff";
        box.style.backgroundColor = "rgba(0, 191, 255, 0.1)";
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

        tip.style.position = "fixed";
        tip.style.top = y + "px";
        tip.style.left = x + "px";
        tip.style.width = "450px";
        tip.style.maxHeight = "300px";
        tip.style.background = "#1e1e1e";
        tip.style.color = "#fff";
        tip.style.border = "2px solid #007bff";
        tip.style.borderRadius = "8px";
        tip.style.boxShadow = "0 6px 18px rgba(0,0,0,0.4)";
        tip.style.zIndex = "2147483647";
        tip.style.display = "flex";
        tip.style.flexDirection = "column";
        tip.style.overflow = "hidden";
        tip.style.fontSize = "13px";

        const titleBar = document.createElement("div");
        titleBar.style.background = "#007bff";
        titleBar.style.color = "#111";
        titleBar.style.padding = "6px 10px";
        titleBar.style.cursor = "move";
        titleBar.style.display = "flex";
        titleBar.style.justifyContent = "space-between";
        titleBar.style.alignItems = "center";
        titleBar.innerHTML = `<span>ChatGPT Preview</span>`;

        const closeBtn = document.createElement("button");
        closeBtn.innerText = "X";
        closeBtn.style.background = "transparent";
        closeBtn.style.border = "none";
        closeBtn.style.color = "#111";
        closeBtn.style.fontWeight = "bold";
        closeBtn.style.cursor = "pointer";
        closeBtn.onclick = () => tip.remove();

        titleBar.appendChild(closeBtn);
        tip.appendChild(titleBar);

        const contentWrapper = document.createElement("div");
        contentWrapper.style.display = "flex";
        contentWrapper.style.flex = "1";
        contentWrapper.style.overflow = "hidden";

        const questionDiv = document.createElement("div");
        questionDiv.style.flex = "1";
        questionDiv.style.padding = "10px";
        questionDiv.style.borderRight = "1px solid #007bff";
        questionDiv.style.overflowY = "auto";
        questionDiv.style.maxHeight = "calc(100% - 10px)";
        questionDiv.innerText = text || "No text found.";

        const answerDiv = document.createElement("div");
        answerDiv.style.flex = "1";
        answerDiv.style.padding = "10px";
        answerDiv.style.overflowY = "auto";
        answerDiv.style.maxHeight = "calc(100% - 10px)";
        answerDiv.innerText = "Answer will appear here...";

        contentWrapper.appendChild(questionDiv);
        contentWrapper.appendChild(answerDiv);
        tip.appendChild(contentWrapper);

        const button = document.createElement("button");
        button.innerText = "Send to ChatGPT";
        button.style.margin = "6px 10px 10px 10px";
        button.style.padding = "6px 10px";
        button.style.background = "#007bff";
        button.style.color = "#111";
        button.style.border = "none";
        button.style.borderRadius = "4px";
        button.style.cursor = "pointer";

        button.onclick = () => {
            answerDiv.innerText = "Loading...";
            button.disabled = true; // disable immediately

            // Use Promise to ensure async response is captured
            chrome.runtime.sendMessage({ action: "askChatGPT", text }, function (response) {
                // log full response for debugging
                console.log("Received from background:", response);

                if (response && response.answer) {
                    answerDiv.innerText = response.answer;
                } else {
                    answerDiv.innerText = "No response from ChatGPT.";
                }
            });
        };

        tip.appendChild(button);
        document.body.appendChild(tip);
        let isDragging = false;
        let offsetX, offsetY;

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

            // Keep inside viewport
            left = Math.max(0, Math.min(left, window.innerWidth - tip.offsetWidth));
            top = Math.max(0, Math.min(top, window.innerHeight - tip.offsetHeight));

            tip.style.left = left + "px";
            tip.style.top = top + "px";
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
        });
    }



    document.addEventListener("mousedown", (e) => {
        if (e.altKey && e.button === 0) {
            e.preventDefault(); isSelecting = true;
            startX = e.clientX; startY = e.clientY;
            selectionBox.style.left = startX + "px";
            selectionBox.style.top = startY + "px";
            selectionBox.style.width = "0px"; selectionBox.style.height = "0px";
            selectionBox.style.display = "block";
        }
    }, true);

    document.addEventListener("mousemove", (e) => {
        if (!isSelecting) return;
        e.preventDefault();
        endX = e.clientX; endY = e.clientY;
        const left = Math.min(startX, endX), top = Math.min(startY, endY);
        const width = Math.abs(startX - endX), height = Math.abs(startY - endY);
        selectionBox.style.left = left + "px"; selectionBox.style.top = top + "px";
        selectionBox.style.width = width + "px"; selectionBox.style.height = height + "px";
    }, true);

    document.addEventListener("mouseup", async (e) => {
        if (!isSelecting) return;
        e.preventDefault(); isSelecting = false; selectionJustEnded = true;

        const left = Math.min(startX, endX), top = Math.min(startY, endY);
        const right = Math.max(startX, endX), bottom = Math.max(startY, endY);

        const textFromNodes = collectTextInRect(left, top, right, bottom);

        const finalText = textFromNodes.trim();
        console.log("Captured text:", finalText);

        selectionBox.style.display = "none";
        showTooltip(e.clientX + 12, e.clientY + 12, finalText);
    }, true);

    document.addEventListener("click", (e) => {
        if (selectionJustEnded) {
            e.preventDefault(); e.stopImmediatePropagation(); selectionJustEnded = false;
        }
    }, true);

})();
