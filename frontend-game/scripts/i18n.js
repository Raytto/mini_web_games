(() => {
    'use strict';
    const KEY = 'xiaoxiaoLanguage';
    const messages = window.XiaoxiaoMessages;
    const attributes = ['title', 'alt', 'aria-label', 'placeholder'];
    const originals = new WeakMap();
    const excluded = 'script, style, noscript, [data-i18n-ignore]';
    const normalize = value => value.trim().replace(/\s+/g, ' ');
    const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = messages.patterns.map(([source, target]) => {
        const slots = [];
        const parts = source.split(/(\{\d+\})/g).map(part => {
            if (/^\{\d+\}$/.test(part)) {
                slots.push(part);
                return '(.+?)';
            }
            return escapeRegex(part);
        });
        return { regex: new RegExp('^' + parts.join('') + '$'), slots, target };
    });
    let language = 'en';
    try {
        language = window.parent !== window && window.parent.XiaoxiaoI18n
            ? window.parent.XiaoxiaoI18n.language
            : localStorage.getItem(KEY) === 'zh' ? 'zh' : 'en';
    } catch (_) { /* The current window still works without storage. */ }

    // Translate only the presentation layer. Games keep their original data,
    // including the Chinese names used as persistent collection identifiers.
    function english(source, depth = 0) {
        if (Object.hasOwn(messages.en, source)) return messages.en[source];
        if (depth > 6 || !/[\u3400-\u9fff]/.test(source)) return source;
        for (const pattern of patterns) {
            const match = source.match(pattern.regex);
            if (!match) continue;
            const values = new Map(pattern.slots.map((slot, index) => [slot, english(match[index + 1], depth + 1)]));
            return pattern.target.replace(/\{\d+\}/g, slot => values.get(slot));
        }
        // Names may be decorated by emoji, checkmarks, numbering or counters.
        // Match whole known phrases only; never translate arbitrary substrings.
        const decorated = source.match(/^([^\u3400-\u9fff]*)([\s\S]*?[\u3400-\u9fff])([^\u3400-\u9fff]*)$/);
        if (decorated && (decorated[1] || decorated[3])) {
            const inner = english(decorated[2], depth + 1);
            if (inner !== decorated[2]) return decorated[1] + inner + decorated[3];
        }
        return source;
    }

    function translate(source) {
        const key = normalize(source);
        const value = language === 'en' ? english(key) : (messages.zh[key] || key);
        return value === key ? source : source.replace(source.trim(), value);
    }

    function updateValue(node, key, read, write) {
        let record = originals.get(node);
        if (!record) { record = new Map(); originals.set(node, record); }
        const current = read();
        let entry = record.get(key);
        // New game output replaces the old source; our own translated output
        // must not become the source when switching back to Chinese.
        if (!entry || current !== entry.rendered) entry = { source: current };
        const next = translate(entry.source);
        entry.rendered = next;
        record.set(key, entry);
        if (current !== next) write(next);
    }

    function updateNode(node) {
        const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (!element) return;
        if (element.id === 'language-toggle') { updateButton(); return; }
        if (element.closest(excluded)) return;
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.nodeValue.trim()) updateValue(node, 'text', () => node.nodeValue, value => { node.nodeValue = value; });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (const attribute of attributes) {
                if (node.hasAttribute(attribute)) updateValue(node, attribute, () => node.getAttribute(attribute), value => node.setAttribute(attribute, value));
            }
        }
    }

    function updateTree(root) {
        updateNode(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                if (node.nodeType === Node.ELEMENT_NODE && node.matches(excluded)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        while (walker.nextNode()) updateNode(walker.currentNode);
    }

    function updateButton() {
        const button = document.getElementById('language-toggle');
        if (!button) return;
        const label = language === 'zh' ? 'English' : '中文';
        const locale = language === 'zh' ? 'en' : 'zh-CN';
        const description = language === 'zh' ? 'Switch to English' : '切换为中文';
        if (button.textContent !== label) button.textContent = label;
        if (button.lang !== locale) button.lang = locale;
        if (button.getAttribute('aria-label') !== description) button.setAttribute('aria-label', description);
        if (button.title !== description) button.title = description;
    }

    function applyLanguage(next) {
        language = next === 'en' ? 'en' : 'zh';
        document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
        updateTree(document.documentElement);
        updateButton();
        for (const frame of document.querySelectorAll('iframe')) {
            try { frame.contentWindow.XiaoxiaoI18n?.applyLanguage(language); } catch (_) { /* Same-origin frames only. */ }
        }
    }

    function setLanguage(next) {
        const selected = next === 'en' ? 'en' : 'zh';
        try {
            if (window.parent !== window && window.parent.XiaoxiaoI18n) {
                window.parent.XiaoxiaoI18n.setLanguage(selected);
                return;
            }
        } catch (_) { /* A directly opened game uses its own preference. */ }
        try { localStorage.setItem(KEY, selected); } catch (_) { /* Session-only fallback. */ }
        applyLanguage(selected);
    }

    window.XiaoxiaoI18n = { get language() { return language; }, setLanguage, applyLanguage, translate };
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    // Process only changed subtrees/attributes, not the entire animated scene.
    const observer = new MutationObserver(records => {
        for (const record of records) {
            if (record.type === 'childList') {
                for (const node of record.addedNodes) if (node.isConnected) updateTree(node);
            } else if (record.target.isConnected) updateNode(record.target);
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: attributes });
    // Delegate from the head so the button is usable before slower game assets finish loading.
    document.addEventListener('click', event => {
        if (event.target.closest?.('#language-toggle')) setLanguage(language === 'zh' ? 'en' : 'zh');
    });
    document.addEventListener('DOMContentLoaded', () => {
        applyLanguage(language);
        
    });
    window.addEventListener('storage', event => {
        if (event.key === KEY || event.key === null) applyLanguage(event.newValue === 'zh' ? 'zh' : 'en');
    });
    window.addEventListener('pageshow', () => {
        // Restore a page from the back/forward cache using the current setting.
        try {
            const current = window.parent !== window && window.parent.XiaoxiaoI18n
                ? window.parent.XiaoxiaoI18n.language
                : localStorage.getItem(KEY);
            applyLanguage(current === 'zh' ? 'zh' : 'en');
        } catch (_) { /* Preserve the in-memory choice. */ }
    });
})();
