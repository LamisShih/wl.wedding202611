import { cacheDOM, findMatchedRoleAndName } from './utils.js';
import { GOOGLE_SCRIPT_URL, fetchSubmittedNamesData, sendPostRequest } from './api.js';
import { startDanmakuEngine, spawnDanmaku } from './danmaku.js';
import { preloadGalleryImages, renderGallery } from './gallery.js';
import { openLightbox, closeLightbox, showPrevImage, showNextImage } from './lightbox.js';
import { unlockInvitation, initManualUnlock } from './invitation.js';
import { handleGuestsChange, checkSubmissionStatus, openRsvpModal, closeRsvpModal, toggleAttendingForm, closeSuccessModal } from './rsvp.js?v=2';

// ==================== 全域變數定義 ====================
const LOCAL_INVITE_LIST = { "family": "family", "party": "party", "all": "all" };
let INVITE_LIST = { ...LOCAL_INVITE_LIST };

let activeBlessings = []; // 🚀 1. 已去除預設祝福，改為純粹抓取雲端資料
let unlockedGuestName = "";
let alreadySubmittedNames = [];

// ==================== 倒數計時引擎 ====================
const targetDate = new Date("Nov 21, 2026 14:00:00").getTime();
setInterval(() => {
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

// ==================== 頁面生命週期初始化 ====================
document.addEventListener("DOMContentLoaded", () => {
    cacheDOM();
    preloadGalleryImages();
    renderGallery(openLightbox);
    startDanmakuEngine(activeBlessings);

    fetchSubmittedNamesData().then(data => {
        if (data && data.result === "success") {
            if (data.blessings && data.blessings.length > 0) {
                // 🛡️ 過濾空白字串，並塞入陣列
                data.blessings.forEach(item => {
                    if (item && item.trim() !== "") {
                        activeBlessings.push(item);
                    }
                });
            }
            alreadySubmittedNames = data.names || [];
            if (data.inviteList && Object.keys(data.inviteList).length > 0) INVITE_LIST = data.inviteList;
            if (unlockedGuestName) checkSubmissionStatus(unlockedGuestName, alreadySubmittedNames);
        }

        // 🚀 3. 畫面一載入時，若有雲端資料則至少派發 6 條避免畫面太空
        const initialCount = Math.max(6, activeBlessings.length > 0 ? Math.min(6, activeBlessings.length) : 0);
        for (let i = 0; i < initialCount; i++) {
            setTimeout(() => {
                if (activeBlessings.length > 0) {
                    const randomIndex = Math.floor(Math.random() * activeBlessings.length);
                    spawnDanmaku(activeBlessings[randomIndex], false);
                }
            }, i * 400);
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const passParam = urlParams.get("pass");
    if (passParam) {
        const decodedPass = decodeURIComponent(passParam).trim();
        const match = findMatchedRoleAndName(decodedPass, INVITE_LIST);
        if (match.role) unlockInvitation(match.role, match.name, (n) => unlockedGuestName = n, () => checkSubmissionStatus(unlockedGuestName, alreadySubmittedNames));
    }
});

// ==================== 全域事件綁定 ====================
window.handleManualUnlock = () => initManualUnlock(INVITE_LIST, (n) => unlockedGuestName = n, () => checkSubmissionStatus(unlockedGuestName, alreadySubmittedNames));
window.openRsvpModal = (type) => openRsvpModal(type, unlockedGuestName);
window.closeRsvpModal = closeRsvpModal;
window.toggleAttendingForm = toggleAttendingForm;
window.handleGuestsChange = handleGuestsChange;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.showPrevImage = showPrevImage;
window.showNextImage = showNextImage;
window.closeSuccessModal = closeSuccessModal;

window.submitBlessing = async (e) => {
    e.preventDefault();
    let sender = document.getElementById('blessing-sender').value.trim() || "匿名親友";
    const text = document.getElementById('blessing-text').value.trim();
    const btn = document.getElementById('btn-submit-blessing');
    
    // 🛡️ 防呆：確保不是空白才送出
    if (!text || text.trim() === "") return;

    // 2. 即時手動發送的格式帶有名字與內容（danmaku.js 會自動加上星星裝飾）
    const rawContent = `${sender}: ${text}`;
    
    spawnDanmaku(rawContent, true);
    if (!activeBlessings.includes(rawContent)) {
        activeBlessings.push(rawContent);
    }

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin mr-2"></i>傳送中...';

    await sendPostRequest({ action: 'blessing', name: sender, text: text });

    document.getElementById('blessing-text').value = '';
    btn.disabled = false;
    btn.innerHTML = originalText;
};

window.submitRsvp = async (e) => {
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

    if (submitBtn.disabled) return;
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

    try {
        await sendPostRequest(submission);
        localStorage.setItem("rsvp_submitted_" + normalizedName, "true");
        alreadySubmittedNames.push(guestName);
        checkSubmissionStatus(unlockedGuestName, alreadySubmittedNames);
        closeRsvpModal();
        document.getElementById('success-modal').classList.remove('hidden');
    } catch (error) {
        alert('傳送失敗，請確認您的網路連線！');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
};
