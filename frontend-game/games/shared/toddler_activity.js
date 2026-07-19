(function () {
    const cfg = window.TODDLER_ACTIVITY_CONFIG;
    const root = document.getElementById("activity-root");
    if (!cfg || !root) return;

    const state = {
        completed: new Set(),
        sequenceIndex: 0,
        active: null,
        selected: null,
        toastTimer: null,
        guideTimer: null,
        round: 1,
        streak: 0,
        mistakes: 0,
        zoneOrder: [],
        itemOrder: []
    };

    const totalItems = cfg.items.length;
    const gameId = cfg.assetKey || (window.MINI_GAME && window.MINI_GAME.id) || "activity";
    const assetRoot = cfg.assetRoot || "../shared/generated_assets";

    function h(tag, attrs, children) {
        const node = document.createElement(tag);
        Object.entries(attrs || {}).forEach(([key, value]) => {
            if (key === "class") node.className = value;
            else if (key === "text") node.textContent = value;
            else if (key === "html") node.innerHTML = value;
            else if (key.startsWith("data-")) node.setAttribute(key, value);
            else node[key] = value;
        });
        (children || []).forEach((child) => node.appendChild(child));
        return node;
    }

    function currentStep() {
        return cfg.steps ? cfg.steps[state.sequenceIndex] : null;
    }

    function isSequenceMode() {
        return cfg.mode === "sequence";
    }

    function isCollectMode() {
        return cfg.mode === "collect";
    }

    function assetUrl(kind, id) {
        return `${assetRoot}/${gameId}_${kind}_${id}.png`;
    }

    function makeVisual(className, src, fallbackText, alt) {
        const wrap = h("div", { class: className });
        const img = h("img", { src, alt: alt || "", draggable: false });
        img.addEventListener("error", () => {
            wrap.classList.add("asset-fallback");
            wrap.textContent = fallbackText || "";
        }, { once: true });
        wrap.appendChild(img);
        return wrap;
    }

    function zonePosition(index, count) {
        if (cfg.zonePositions && cfg.zonePositions[index]) return cfg.zonePositions[index];
        if (count === 1) return { x: 50, y: 56, w: 42, h: 58 };
        if (count === 2) return { x: index === 0 ? 32 : 68, y: 56, w: 32, h: 58 };
        const xs = [20, 50, 80, 20, 50, 80];
        const ys = count <= 3 ? [56, 56, 56] : [42, 42, 42, 70, 70, 70];
        return { x: xs[index] || 50, y: ys[index] || 56, w: 28, h: count <= 3 ? 58 : 34 };
    }

    function makeZone(zone) {
        const accept = isSequenceMode() || isCollectMode()
            ? (isCollectMode() ? "all" : "sequence-target")
            : Array.isArray(zone.accepts) ? zone.accepts.join(",") : zone.id;
        const node = h("div", {
            class: "drop-zone",
            "data-zone-id": zone.id,
            "data-accept": accept,
            role: "button",
            tabIndex: 0,
            ariaLabel: zone.label
        }, [
            h("div", { class: "placed-items" }),
            makeVisual("zone-visual", zone.sprite || assetUrl("zone", zone.id), zone.emoji, zone.label),
            h("div", { class: "zone-label", text: zone.label })
        ]);
        const pos = zonePosition(cfg.zones.indexOf(zone), cfg.zones.length);
        node.style.setProperty("--zone-x", `${pos.x}%`);
        node.style.setProperty("--zone-y", `${pos.y}%`);
        node.style.setProperty("--zone-w", `${pos.w}%`);
        node.style.setProperty("--zone-h", `${pos.h}%`);
        node.addEventListener("click", () => handleZoneTap(node));
        node.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleZoneTap(node);
            }
        });
        return node;
    }

    function makeItem(item) {
        const node = h("div", {
            class: "drag-item",
            "data-item-id": item.id,
            "data-target": item.target || "",
            role: "button",
            ariaLabel: item.label || item.id
        });
        node.appendChild(makeVisual("item-visual", item.sprite || assetUrl("item", item.id), item.emoji, item.label));
        node.addEventListener("pointerdown", startDrag);
        node.addEventListener("click", () => {
            if (node.dataset.ignoreClick === "true") {
                node.dataset.ignoreClick = "false";
                return;
            }
            selectItem(item, node);
        });
        return node;
    }

    function shuffled(items) {
        const copy = [...items];
        for (let index = copy.length - 1; index > 0; index -= 1) {
            const target = Math.floor(Math.random() * (index + 1));
            [copy[index], copy[target]] = [copy[target], copy[index]];
        }
        return copy;
    }

    function render() {
        document.title = cfg.title;
        document.documentElement.style.setProperty("--activity-bg", cfg.background || "#fff4d6");
        document.documentElement.style.setProperty("--scene-bg", cfg.sceneBackground || "rgba(255, 255, 255, 0.42)");
        document.documentElement.style.setProperty("--activity-accent", cfg.accent || "#ff7b54");
        document.documentElement.style.setProperty("--activity-title", cfg.titleColor || "#273043");
        document.documentElement.style.setProperty("--slot-count", Math.max(1, cfg.zones.length));
        document.documentElement.style.setProperty("--scene-image", `url("${cfg.backgroundImage || `${assetRoot}/${gameId}_bg.png`}")`);
        document.documentElement.style.setProperty("--scene-position", cfg.backgroundPosition || "center");

        root.className = `activity scene-mode game-${gameId}`;
        root.innerHTML = "";
        const sceneClass = cfg.zones.length === 1 ? "scene single-target" : "scene";

        state.zoneOrder = isSequenceMode() ? [...cfg.zones] : shuffled(cfg.zones);
        state.itemOrder = isSequenceMode() ? [...cfg.items] : shuffled(cfg.items);

        root.append(
            h("header", { class: "topbar" }, [
                h("a", { class: "back-btn", href: "../../home.html", text: "‹", ariaLabel: "返回" }),
                h("div", { class: "title-wrap" }, [
                    h("h1", { class: "activity-title", text: cfg.title }),
                    h("div", { class: "activity-hint", text: cfg.hint || "拖一拖，放进去" })
                ]),
                h("button", { class: "reset-btn", type: "button", text: "↻", ariaLabel: "重新开始", onclick: resetGame })
            ]),
            h("div", { class: "round-status", ariaLive: "polite" }, [
                h("span", { class: "round-chip", text: `第 ${state.round} 关` }),
                h("span", { class: "streak-chip", text: state.streak > 1 ? `连续答对 ${state.streak}` : (cfg.statusText || "准备好啦") })
            ]),
            h("main", { class: "stage" }, [
                h("section", { class: sceneClass }, state.zoneOrder.map(makeZone)),
                h("section", { class: "tray" }, state.itemOrder.map(makeItem))
            ]),
            h("div", { class: "progress", ariaHidden: "true" }, [
                h("div", { class: "progress-fill" })
            ]),
            h("div", { class: "toast" }),
            h("div", { class: "success" }, [
                h("div", { class: "success-panel" }, [
                    h("div", { class: "success-emoji", text: cfg.successEmoji || "🎉" }),
                    h("div", { class: "success-text", text: cfg.successText || "完成啦！" }),
                    h("div", { class: "round-result", text: "" }),
                    h("button", { class: "again-btn", type: "button", text: "下一关 →", onclick: nextRound })
                ])
            ]),
            h("div", { class: "gesture-guide", ariaHidden: "true" }, [h("span", { text: "☝" })])
        );

        updateGuides();
        updateProgress();
        scheduleGuide();
    }

    function resetGame() {
        window.clearTimeout(state.guideTimer);
        state.completed.clear();
        state.sequenceIndex = 0;
        state.active = null;
        state.selected = null;
        state.streak = 0;
        state.mistakes = 0;
        render();
    }

    function nextRound() {
        window.GameJuice?.sound("tap");
        state.round += 1;
        resetGame();
    }

    function selectItem(item, node) {
        if (state.active || state.completed.has(item.id)) return;
        if (isSequenceMode() && currentStep() && currentStep().id !== item.id) {
            failAttempt(node, currentStep().hint || "先拿发光的那个");
            return;
        }
        const wasSelected = state.selected === item.id;
        state.selected = wasSelected ? null : item.id;
        document.querySelectorAll(".drag-item").forEach((candidate) => candidate.classList.toggle("selected", !wasSelected && candidate === node));
        if (!wasSelected) {
            window.GameJuice?.sound(cfg.itemSounds?.[item.id] || "pick");
            window.GameJuice?.vibrate(10);
            const target = targetZone(item);
            if (target) target.classList.add("tap-target");
            showToast(`再点${target?.querySelector(".zone-label")?.textContent || "它的位置"}`);
        }
    }

    function handleZoneTap(zone) {
        if (!state.selected) {
            window.GameJuice?.sound("tap");
            zone.classList.add("tap-pulse");
            window.setTimeout(() => zone.classList.remove("tap-pulse"), 380);
            return;
        }
        const item = itemById(state.selected);
        if (item && accepts(item, zone)) {
            state.active = { item, node: document.querySelector(`[data-item-id="${item.id}"]`) };
            completeItem(item, zone);
            state.active = null;
        } else {
            failAttempt(zone, cfg.tryAgainText || "再看看，它们哪里一样？");
        }
        state.selected = null;
        document.querySelectorAll(".drag-item").forEach((node) => node.classList.remove("selected"));
        document.querySelectorAll(".drop-zone").forEach((node) => node.classList.remove("tap-target"));
    }

    function startDrag(event) {
        const itemNode = event.currentTarget;
        const item = itemById(itemNode.dataset.itemId);
        if (!item || state.completed.has(item.id)) return;
        if (isSequenceMode() && currentStep().id !== item.id) {
            failAttempt(itemNode, currentStep().hint || "先拿发光的那个");
            return;
        }

        event.preventDefault();
        window.clearTimeout(state.guideTimer);
        document.querySelector(".gesture-guide")?.classList.remove("show");
        window.GameJuice?.sound(cfg.itemSounds?.[item.id] || "pick");
        window.GameJuice?.vibrate(10);
        const rect = itemNode.getBoundingClientRect();
        state.active = {
            item,
            node: itemNode,
            originalParent: itemNode.parentNode,
            originalNext: itemNode.nextSibling,
            startX: event.clientX,
            startY: event.clientY
        };
        itemNode.style.width = rect.width + "px";
        itemNode.style.height = rect.height + "px";
        itemNode.classList.add("dragging");
        document.body.appendChild(itemNode);
        moveNode(itemNode, event.clientX, event.clientY);
        itemNode.setPointerCapture(event.pointerId);
        itemNode.addEventListener("pointermove", moveDrag);
        itemNode.addEventListener("pointerup", endDrag);
        itemNode.addEventListener("pointercancel", cancelDrag);
        updateGuides();
    }

    function moveDrag(event) {
        if (!state.active) return;
        event.preventDefault();
        moveNode(state.active.node, event.clientX, event.clientY);
        highlightZone(event.clientX, event.clientY);
    }

    function endDrag(event) {
        if (!state.active) return;
        event.preventDefault();
        if (Math.hypot(event.clientX - state.active.startX, event.clientY - state.active.startY) < 8) {
            const { item, node } = state.active;
            returnItem();
            node.dataset.ignoreClick = "true";
            clearActiveDrag(event.pointerId);
            selectItem(item, node);
            return;
        }
        const zone = zoneFromPoint(event.clientX, event.clientY);
        if (zone && accepts(state.active.item, zone)) {
            completeItem(state.active.item, zone);
        } else {
            failAttempt(state.active.node, cfg.tryAgainText || "再靠近一点");
            returnItem();
        }
        clearActiveDrag(event.pointerId);
    }

    function cancelDrag(event) {
        if (!state.active) return;
        returnItem();
        clearActiveDrag(event.pointerId);
    }

    function moveNode(node, x, y) {
        node.style.left = x + "px";
        node.style.top = y + "px";
    }

    function zoneFromPoint(x, y) {
        return document.elementsFromPoint(x, y).find((node) => node.classList && node.classList.contains("drop-zone"));
    }

    function highlightZone(x, y) {
        document.querySelectorAll(".drop-zone").forEach((zone) => zone.classList.remove("ready"));
        const zone = zoneFromPoint(x, y);
        if (zone && state.active && accepts(state.active.item, zone)) {
            zone.classList.add("ready");
        }
    }

    function accepts(item, zone) {
        if (isCollectMode()) return zone.dataset.accept === "all";
        if (isSequenceMode()) return zone.dataset.accept === "sequence-target" && currentStep().id === item.id;
        const accepted = zone.dataset.accept.split(",").filter(Boolean);
        return accepted.includes(item.target || item.id);
    }

    function completeItem(item, zone) {
        state.completed.add(item.id);
        state.streak += 1;
        if (isSequenceMode()) state.sequenceIndex += 1;
        const placed = zone.querySelector(".placed-items");
        placed.appendChild(makeVisual("placed-emoji", item.placedSprite || item.sprite || assetUrl("item", item.id), item.emoji, item.label));
        zone.classList.add("done");
        if (!isCollectMode() && !isSequenceMode()) {
            const zoneItems = cfg.items.filter((candidate) => (candidate.target || candidate.id) === zone.dataset.zoneId);
            const zoneDone = zoneItems.every((candidate) => state.completed.has(candidate.id));
            zone.classList.toggle("done", zoneDone);
        }
        state.active.node.classList.add("used");
        state.active.node.remove();
        showToast(item.good || "真棒！");
        window.GameJuice?.sound(cfg.itemSounds?.[item.id] || "correct");
        window.GameJuice?.vibrate(20);
        window.GameJuice?.burst(zone, { symbols: cfg.particles || ["★", "●", "✦"] });
        document.querySelector(".streak-chip").textContent = state.streak > 1 ? `连续答对 ${state.streak}` : "答对啦！";
        root.dataset.effect = item.target || item.id;
        updateProgress();
        if (state.completed.size >= totalItems) {
            window.setTimeout(completeRound, 420);
        } else {
            updateGuides();
            scheduleGuide(2600);
        }
    }

    function failAttempt(target, message) {
        state.mistakes += 1;
        state.streak = 0;
        window.GameJuice?.sound("wrong");
        window.GameJuice?.vibrate([18, 35, 18]);
        window.GameJuice?.shake(target);
        showToast(message);
        const chip = document.querySelector(".streak-chip");
        if (chip) chip.textContent = "没关系，再试试";
    }

    function completeRound() {
        window.GameJuice?.sound("complete");
        window.GameJuice?.vibrate([25, 45, 35]);
        const success = document.querySelector(".success");
        const result = document.querySelector(".round-result");
        if (result) result.textContent = state.mistakes === 0 ? "全都一次成功，三颗星！" : `完成 ${totalItems} 个任务，继续挑战吧`;
        success.classList.add("show");
        window.GameJuice?.burst(success.querySelector(".success-panel"), { count: 24, symbols: ["★", "✦", "❤"] });
        if (cfg.onCompleteSound) window.setTimeout(() => window.GameJuice?.sound(cfg.onCompleteSound), 420);
    }

    function returnItem() {
        const active = state.active;
        active.node.classList.remove("dragging");
        active.node.style.left = "";
        active.node.style.top = "";
        active.node.style.width = "";
        active.node.style.height = "";
        active.originalParent.insertBefore(active.node, active.originalNext);
        updateGuides();
    }

    function clearActiveDrag(pointerId) {
        const node = state.active && state.active.node;
        if (node) {
            try {
                node.releasePointerCapture(pointerId);
            } catch (err) {
                // Pointer may already be released by the browser.
            }
            node.removeEventListener("pointermove", moveDrag);
            node.removeEventListener("pointerup", endDrag);
            node.removeEventListener("pointercancel", cancelDrag);
        }
        state.active = null;
        document.querySelectorAll(".drop-zone").forEach((zone) => zone.classList.remove("ready"));
    }

    function updateGuides() {
        document.querySelectorAll(".drag-item").forEach((node) => {
            const item = itemById(node.dataset.itemId);
            const isNext = !isSequenceMode() || (currentStep() && currentStep().id === item.id);
            node.classList.toggle("next", isNext && !state.completed.has(item.id));
        });
        if (isSequenceMode() && currentStep()) {
            const hint = document.querySelector(".activity-hint");
            hint.textContent = currentStep().hint || cfg.hint || "按顺序拖一拖";
        }
    }

    function targetZone(item) {
        return [...document.querySelectorAll(".drop-zone")].find((zone) => accepts(item, zone));
    }

    function scheduleGuide(delay = 1700) {
        window.clearTimeout(state.guideTimer);
        state.guideTimer = window.setTimeout(() => {
            if (state.active || state.selected || state.completed.size >= totalItems) return;
            const source = document.querySelector(".drag-item.next:not(.used)") || document.querySelector(".drag-item:not(.used)");
            if (!source) return;
            const item = itemById(source.dataset.itemId);
            const zone = targetZone(item);
            const guide = document.querySelector(".gesture-guide");
            if (!zone || !guide) return;
            const from = source.getBoundingClientRect();
            const to = zone.getBoundingClientRect();
            guide.style.setProperty("--guide-from-x", `${from.left + from.width / 2}px`);
            guide.style.setProperty("--guide-from-y", `${from.top + from.height / 2}px`);
            guide.style.setProperty("--guide-to-x", `${to.left + to.width / 2}px`);
            guide.style.setProperty("--guide-to-y", `${to.top + to.height / 2}px`);
            guide.classList.remove("show");
            void guide.offsetWidth;
            guide.classList.add("show");
            state.guideTimer = window.setTimeout(() => guide.classList.remove("show"), 1900);
        }, delay);
    }

    function updateProgress() {
        const fill = document.querySelector(".progress-fill");
        if (fill) fill.style.width = Math.round((state.completed.size / totalItems) * 100) + "%";
    }

    function showToast(text) {
        const toast = document.querySelector(".toast");
        window.clearTimeout(state.toastTimer);
        toast.textContent = text;
        toast.classList.add("show");
        state.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 900);
    }

    function itemById(id) {
        return cfg.items.find((item) => item.id === id);
    }

    render();
})();
