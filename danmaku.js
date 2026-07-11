import { DOM } from './utils.js';

const LANES_COUNT = 8;
let laneAvailability = new Array(LANES_COUNT).fill(0); 

let danmakuTimer = null;
let recentlyUsedIndices = []; 

export function startDanmakuEngine(activeBlessings) {
    if (danmakuTimer) clearInterval(danmakuTimer);
    
    danmakuTimer = setInterval(() => {
        if (document.hidden) return;
        if (!DOM.danmaku) return;
        const rect = DOM.danmaku.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        
        if (!activeBlessings || activeBlessings.length === 0) return;
        
        const maxMemory = Math.floor(activeBlessings.length * 0.6); 
        let randomIndex;
        let attempts = 0;
        
        do {
            randomIndex = Math.floor(Math.random() * activeBlessings.length);
            attempts++;
        } while (recentlyUsedIndices.includes(randomIndex) && attempts < 10);
        
        recentlyUsedIndices.push(randomIndex);
        if (recentlyUsedIndices.length > maxMemory) {
            recentlyUsedIndices.shift(); 
        }

        // 🛡️ 這裡傳入 false，代表從陣列（雲端）載入的一律絕對是純文字
        spawnDanmaku(activeBlessings[randomIndex], false);
    }, 1800); 
}

export function spawnDanmaku(text, isCustom = false) {
    if (!DOM.danmaku || !text) return;
    
    // 🛡️ 雙重保險：如果在傳進來前帶有 ✦ 符號，我們直接用程式把它們拔掉（防堵舊快取或寫死字串）
    let cleanText = text.replace(/✦/g, '').trim();
    if (cleanText === "") return;

    const now = Date.now();
    const availableLanes = [];
    
    for (let i = 0; i < LANES_COUNT; i++) {
        if (now >= laneAvailability[i]) {
            availableLanes.push(i);
        }
    }

    let lane;
    if (availableLanes.length > 0) {
        lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    } else {
        lane = laneAvailability.indexOf(Math.min(...laneAvailability));
    }

    const bubble = document.createElement("div");

    // 🌟 外觀切換：只有手動即時發送的(isCustom = true)才套用專屬外觀
    bubble.className = isCustom
        ? "danmaku-bubble danmaku-bubble-custom"
        : "danmaku-bubble";
        
    // 🌟 條件式文字：只有 isCustom 為 true 時才在前後加上 ✦ 裝飾，否則一律只顯示乾淨的 cleanText
    bubble.textContent = isCustom ? `✦ ${cleanText} ✦` : cleanText;
    
    const duration = isCustom ? 6 : (9 + Math.random() * 4);
    bubble.style.animationDuration = `${duration}s`;
    
    laneAvailability[lane] = now + (duration * 300);

    bubble.style.top = `${6 + (lane * 9)}%`;
    DOM.danmaku.appendChild(bubble);
    
    bubble.addEventListener("animationend", () => {
        bubble.remove();
    });
}
