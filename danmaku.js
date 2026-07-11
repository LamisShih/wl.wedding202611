import { DOM } from './utils.js';

const LANES_COUNT = 8;
// 🧠 新增：記錄每一條軌道「何時才會空出來」的時間戳記 (Timestamp)
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

        spawnDanmaku(activeBlessings[randomIndex], false);
    }, 5500); 
}

export function spawnDanmaku(text, isCustom = false) {
    if (!DOM.danmaku) return;
    
    const now = Date.now();
    const availableLanes = [];
    
    // 🔍 檢查 8 條軌道中，有哪些是目前沒有彈幕、已經冷卻完畢的？
    for (let i = 0; i < LANES_COUNT; i++) {
        if (now >= laneAvailability[i]) {
            availableLanes.push(i);
        }
    }

    let lane;
    if (availableLanes.length > 0) {
        // 從「絕對空的軌道」中隨機挑選一條
        lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    } else {
        // (防呆機制) 如果極端狀況下全滿，找出「最快會空出來」的那條軌道
        lane = laneAvailability.indexOf(Math.min(...laneAvailability));
    }

    const bubble = document.createElement("div");

    bubble.className = isCustom
        ? "danmaku-bubble danmaku-bubble-custom"
        : "danmaku-bubble";
    bubble.textContent = text;
    
    const duration = isCustom ? 6 : (10 + Math.random() * 6);
    bubble.style.animationDuration = `${duration}s`;
    
    // 🔒 鎖定軌道：將這條軌道的冷卻時間設定為「現在 + 動畫秒數 + 1秒緩衝」
    // 確保這顆彈幕徹底消失在畫面左側後，這條軌道才允許下一顆彈幕進入
    laneAvailability[lane] = now + (duration * 1000) + 1000;

    bubble.style.top = `${6 + (lane * 9)}%`;
    DOM.danmaku.appendChild(bubble);
    
    bubble.addEventListener("animationend", () => {
        bubble.remove();
    });
}