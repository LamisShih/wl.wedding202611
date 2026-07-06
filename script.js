// ==================== 系統設定 ====================
// 設定您的 Apps Script 網址
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw5yzZ5lj2hVQmt_WKEjLVKW9dN1xnJYZs6cjwLuGQcTSdr8yU4mldDnj1mNa99OjyEXg/exec"; 

const LOCAL_INVITE_LIST = { "family": "family", "party": "party", "all": "all" };
let INVITE_LIST = { ...LOCAL_INVITE_LIST };

const DEFAULT_BLESSINGS = [
    "恭喜 Willy & Lamis！新婚大喜！🎉", "百年好合，永浴愛河！❤️", "新婚快樂，新家落成大吉！🏡",
    "祝你們天天開心，幸福美滿！🌸", "要一直一直幸福下去喔！✨", "恭喜拉！期待當天的民宿烤肉派對！🥳",
    "新婚大喜，早生貴子！👶", "超替你們高興的！幸福滿滿！💖", "執子之手，與子偕老👫", "祝這對神仙眷侶甜甜蜜蜜！🥂"
];

let activeBlessings = [...DEFAULT_BLESSINGS];
let unlockedGuestName = "";
let alreadySubmittedNames = [];
const LANES_COUNT = 8;
let lastLaneUsed = -1;

// 8 張相片資料庫
const galleryImages = [
    { src: 'DSC00587', alt: '婚紗相片 1' },
    { src: 'DSC00744', alt: '婚紗相片 2' },
    { src: 'IMG_2918', alt: '婚紗相片 3'},
    { src: 'wl_33',    alt: '婚紗相片 4' },
    { src: 'DSC2297',  alt: '婚紗相片 5' },
    { src: 'IMG_2742', alt: '婚紗相片 6' },
    { src: 'wl_46',    alt: '婚紗相片 7' },
    { src: 'IMG_0488', alt: '婚紗相片 8' }
];

// ==================== 倒數計時引擎 ====================
const targetDate = new Date("Nov 21, 2026 14:00:00").getTime();
const countdownTimer = setInterval(function() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById("days");
    if (daysEl) {
        daysEl.innerText = days < 10 ? "0" + days : days;
        document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
        document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
        document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
    }
}, 1000);

// ==================== 網頁啟動核心 ====================
document.addEventListener("DOMContentLoaded", function() {
    renderGallery();
    startDanmakuEngine();

    fetchSubmittedNames().then(() => {
        for (let i = 0; i < Math.min(3, activeBlessings.length); i++) {
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * activeBlessings.length);
                spawnDanmaku(activeBlessings[randomIndex], false);
            }, i * 300);
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const passParam = urlParams.get('pass');
    if (passParam) {
        const decodedPass = decodeURIComponent(passParam).trim();
        const match = findMatchedRoleAndName(decodedPass);
        if (match.role) unlockInvitation(match.role, match.name);
    }
});

// ==================== 核心功能函數 ====================

// 🚀 修正效能：移除 sync 解碼與 eager 載入，讓手機不卡頓
function renderGallery() {
    const gridContainer = document.getElementById('gallery-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = galleryImages.map(img => {
        const webpUrl = `${img.src}.webp`;
        return `
            <div class="relative overflow-hidden rounded-xl group cursor-pointer border border-stone-200/40 shadow-sm h-[300px] md:h-[420px]" 
                 onclick="openLightbox('${webpUrl}')">
                <img src="${webpUrl}" loading="lazy" decoding="async" alt="${img.alt}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                <div class="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/35 transition-all duration-300 flex items-center justify-center">
                    <i class="fa-solid fa-magnifying-glass-plus text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
                </div>
            </div>
        `;
    }).join('');
}

// 🚀 修正效能：將彈幕間率調降至 2000ms，減輕手機渲染負擔
function startDanmakuEngine() {
    setInterval(() => {
        if (document.hidden) return;
        const randomIndex = Math.floor(Math.random() * activeBlessings.length);
        spawnDanmaku(activeBlessings[randomIndex], false);
    }, 4000);
}

function spawnDanmaku(text, isCustom = false) {
    const container = document.getElementById('danmaku-container');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = isCustom ? 'danmaku-bubble danmaku-bubble-custom' : 'danmaku-bubble';
    bubble.innerText = text;

    const duration = isCustom ? 5 : (6 + Math.random() * 4);
    bubble.style.animationDuration = `${duration}s`;

    let lane;
    do { lane = Math.floor(Math.random() * LANES_COUNT); } while (lane === lastLaneUsed);
    lastLaneUsed = lane;

    bubble.style.top = `${8 + (lane * 9)}%`;
    container.appendChild(bubble);

    setTimeout(() => { bubble.remove(); }, duration * 1000);
}

async function submitBlessing(e) {
    e.preventDefault();
    let sender = document.getElementById('blessing-sender').value.trim() || "匿名親友";
    const text = document.getElementById('blessing-text').value.trim();
    const btn = document.getElementById('btn-submit-blessing');

    if (!text) return;

    const formattedText = `✦ ${sender}: ${text} ✦`;
    spawnDanmaku(formattedText, true);
    activeBlessings.push(formattedText);

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin mr-2"></i>傳送中...';

    if (GOOGLE_SCRIPT_URL) {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'blessing', name: sender, text: text })
            });
        } catch (err) { console.error(err); }
    }

    document.getElementById('blessing-text').value = '';
    btn.disabled = false;
    btn.innerHTML = originalText;
}

async function fetchSubmittedNames() {
    if (!GOOGLE_SCRIPT_URL) return;
    try {
        const antiCacheUrl = GOOGLE_SCRIPT_URL + (GOOGLE_SCRIPT_URL.includes('?') ? '&' : '?') + '_t=' + Date.now();
        const response = await fetch(antiCacheUrl);
        const data = await response.json();
        if (data && data.result === "success") {
            alreadySubmittedNames = data.names || [];
            if (data.inviteList && Object.keys(data.inviteList).length > 0) INVITE_LIST = data.inviteList;
            if (unlockedGuestName) checkSubmissionStatus();
            if (data.blessings && data.blessings.length > 0) activeBlessings = [...DEFAULT_BLESSINGS, ...data.blessings];
        }
    } catch (e) { console.warn(e); }
}

// 🛡️ 新增：防呆比對引擎（無視大小寫、無視任何空格）
function findMatchedRoleAndName(rawInput) {
    if (!rawInput) return { role: null, name: rawInput };
    
    // 將輸入值轉小寫並拔除所有空白
    let normalizedInput = rawInput.toLowerCase().replace(/\s+/g, '');
    
    for (let key in INVITE_LIST) {
        // 將名單庫的 Key 也轉小寫並拔除所有空白
        let normalizedKey = key.toLowerCase().replace(/\s+/g, '');
        if (normalizedInput === normalizedKey) {
            // 比對成功，回傳對應的權限，以及「名單上正確的原始名稱」(讓畫面顯示不會擠在一起)
            return { role: INVITE_LIST[key], name: key }; 
        }
    }
    return { role: null, name: rawInput };
}

// 觸發手動解鎖
function handleManualUnlock() {
    const rawInput = document.getElementById('passcode-input').value.trim();
    if (!rawInput) return;
    
    // 使用新的防呆引擎檢查
    const match = findMatchedRoleAndName(rawInput);
    
    if (match.role) {
        // 若為系統通用密碼，維持顯示使用者當下輸入的名字
        const defaultPasses = ['family', 'party', 'all', 'willylamis'];
        if (defaultPasses.includes(match.name.toLowerCase())) {
            unlockInvitation(match.role, rawInput);
        } else {
            unlockInvitation(match.role, match.name);
        }
    } else {
        // 解鎖失敗動畫
        const inputEl = document.getElementById('passcode-input');
        inputEl.classList.add('border-red-500', 'shake-animation');
        inputEl.placeholder = '不在受邀名單中，請重新確認';
        inputEl.value = '';
        setTimeout(() => {
            inputEl.classList.remove('border-red-500', 'shake-animation');
            inputEl.placeholder = '請輸入您的姓名 / 邀請碼';
        }, 1500);
    }
}

function unlockInvitation(role, guestName) {
    const defaultPasses = ['family', 'party', 'all', 'willylamis'];
    if (!defaultPasses.includes(guestName.toLowerCase())) {
        unlockedGuestName = guestName;
        const bs = document.getElementById('blessing-sender');
        if (bs) bs.value = guestName;
    }

    document.getElementById('event-details-container').classList.remove('hidden');
    document.getElementById('nav-badge').classList.remove('hidden');

    ['section-family', 'section-party', 'map-family', 'map-party', 'section-seating', 'all-version-notice'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });

    const badge = document.getElementById('nav-badge');
    if (role === 'family') {
        badge.innerText = guestName + " 的專屬家宴邀請";
        document.getElementById('section-family').classList.remove('hidden');
        document.getElementById('map-family').classList.remove('hidden');
    } else if (role === 'party') {
        badge.innerText = guestName + " 的專屬派驚邀請";
        document.getElementById('section-party').classList.remove('hidden');
        document.getElementById('map-party').classList.remove('hidden');
    } else if (role === 'all') {
        badge.innerText = guestName + " 的完整版邀請";
        document.getElementById('all-version-notice').classList.remove('hidden');
        document.getElementById('section-family').classList.remove('hidden');
        document.getElementById('section-party').classList.remove('hidden');
        document.getElementById('map-family').classList.remove('hidden');
        document.getElementById('map-party').classList.remove('hidden');
    }
    
    checkSubmissionStatus();
    document.querySelector('#event-details-container').scrollIntoView({ behavior: 'smooth' });
}

function handleGuestsChange() {
    const guestsVal = parseInt(document.getElementById('rsvp-guests').value);
    const isAttending = document.querySelector('input[name="attending"]:checked').value === 'yes';
    const gpOtherNames = document.getElementById('form-group-other-names');
    
    if (guestsVal > 1 && isAttending) {
        gpOtherNames.classList.remove('hidden');
        document.getElementById('rsvp-other-names').required = true;
    } else {
        gpOtherNames.classList.add('hidden');
        document.getElementById('rsvp-other-names').required = false;
    }
}

function checkSubmissionStatus() {
    if (!unlockedGuestName) return;
    const normalizedUnlocked = unlockedGuestName.trim().toLowerCase();
    const hasSubmitted = alreadySubmittedNames.some(name => name.trim().toLowerCase() === normalizedUnlocked) || 
                         localStorage.getItem("rsvp_submitted_" + normalizedUnlocked) === "true";

    const bF = document.getElementById('btn-family-rsvp');
    const bP = document.getElementById('btn-party-rsvp');

    if (hasSubmitted) {
        if (bF) { bF.disabled = true; bF.className = "w-full bg-stone-300 text-stone-500 py-3.5 rounded-xl font-semibold cursor-not-allowed"; bF.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>已完成家宴回覆'; }
        if (bP) { bP.disabled = true; bP.className = "w-full bg-stone-300 text-stone-500 py-3.5 rounded-xl font-semibold cursor-not-allowed"; bP.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>已完成派對回覆'; }
    }
}

function openRsvpModal(eventType) {
    document.getElementById('rsvp-modal').classList.remove('hidden');
    document.getElementById('form-event-type').value = eventType;
    document.getElementById('rsvp-form').reset();
    toggleAttendingForm(true);

    const nameInput = document.getElementById('rsvp-guest-name');
    if (unlockedGuestName) {
        nameInput.value = unlockedGuestName;
        nameInput.readOnly = true;
        nameInput.classList.add('bg-stone-100', 'text-stone-500', 'cursor-not-allowed');
    }

    const title = document.getElementById('modal-title');
    if (eventType === 'family') {
        title.innerText = "家宴出席調查";
        document.getElementById('form-group-driving').classList.add('hidden');
    } else {
        title.innerText = "派對出席調查";
        document.getElementById('form-group-driving').classList.remove('hidden');
    }
    handleGuestsChange();
}

function closeRsvpModal() { document.getElementById('rsvp-modal').classList.add('hidden'); }

function toggleAttendingForm(isAttending) {
    const div = document.getElementById('attending-details');
    if (isAttending) div.classList.remove('hidden');
    else div.classList.add('hidden');
    document.getElementById('rsvp-guest-phone').required = isAttending;
    document.getElementById('rsvp-guest-email').required = isAttending;
    handleGuestsChange();
}

function openLightbox(src) {
    const m = document.getElementById('lightbox-modal');
    const i = document.getElementById('lightbox-img');
    i.src = src; m.classList.remove('hidden');
    setTimeout(() => { m.classList.remove('opacity-0'); i.classList.remove('scale-95'); }, 10);
}

function closeLightbox() {
    const m = document.getElementById('lightbox-modal');
    const i = document.getElementById('lightbox-img');
    m.classList.add('opacity-0'); i.classList.add('scale-95');
    setTimeout(() => { m.classList.add('hidden'); }, 300);
}

async function submitRsvp(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    const guestName = formData.get('name').toString().trim();
    const normalizedName = guestName.toLowerCase();

    const hasSubmitted = alreadySubmittedNames.some(name => name.trim().toLowerCase() === normalizedName) || 
                         localStorage.getItem("rsvp_submitted_" + normalizedName) === "true";

    if (hasSubmitted) {
        alert("⚠️ 您已完成過此場次的出席回覆，請勿重複提交！");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin mr-2"></i>傳送中...';

    let submission = {
        id: Date.now(), eventType: formData.get('eventType'), name: guestName,
        phone: formData.get('phone') || '無', email: formData.get('email') || '無',
        attending: formData.get('attending'), blessing: formData.get('blessing')
    };

    if (formData.get('attending') === 'yes') {
        submission.guests = parseInt(formData.get('guests'));
        submission.otherNames = formData.get('otherNames') || '無';
        submission.diet = Array.from(form.querySelectorAll('input[name="diet"]:checked')).map(cb => cb.value);
        submission.driving = formData.get('driving') || '無';
    }

    if (GOOGLE_SCRIPT_URL) {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submission)
            });
            
            localStorage.setItem("rsvp_submitted_" + normalizedName, "true");
            alreadySubmittedNames.push(guestName);
            checkSubmissionStatus();
            closeRsvpModal();
            document.getElementById('success-modal').classList.remove('hidden');
        } catch (error) {
            alert('傳送失敗，請確認您的網路連線！');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

function closeSuccessModal() { document.getElementById('success-modal').classList.add('hidden'); }
