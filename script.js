import { cacheDOM, findMatchedRoleAndName } from './utils.js';
import { GOOGLE_SCRIPT_URL, fetchSubmittedNamesData, sendPostRequest } from './api.js';
import { startDanmakuEngine, spawnDanmaku } from './danmaku.js';
import { preloadGalleryImages, renderGallery } from './gallery.js';
import { openLightbox, closeLightbox, showPrevImage, showNextImage } from './lightbox.js';
import { unlockInvitation, initManualUnlock } from './invitation.js';
import { handleGuestsChange, checkSubmissionStatus, openRsvpModal, closeRsvpModal, toggleAttendingForm, closeSuccessModal } from './rsvp.js';

// ==================== 全域變數定義 ====================
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
            alreadySubmittedNames = data.names || [];
            if (data.inviteList && Object.keys(data.inviteList).length > 0) INVITE_LIST = data.inviteList;
            if (unlockedGuestName) checkSubmissionStatus(unlockedGuestName, alreadySubmittedNames);
            if (data.blessings && data.blessings.length > 0) activeBlessings = [...DEFAULT_BLESSINGS, ...data.blessings];
        }

        for (let i = 0; i < Math.min(3, activeBlessings.length); i++) {
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * activeBlessings.length);
                spawnDanmaku(activeBlessings[randomIndex], false);
            }, i * 300);
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

// 暴露全域函數供 HTML 綁定使用 (若有需要)
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
    if (!text) return;

    const formattedText = `✦ ${sender}: ${text} ✦`;
    spawnDanmaku(formattedText, true);
    if (!activeBlessings.includes(formattedText)) activeBlessings.push(formattedText);

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
