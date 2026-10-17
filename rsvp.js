import { DOM } from './utils.js';

/**
 * 當賓客成功解鎖時觸發此函式
 * @param {string} unlockedGuestName - 賓客姓名
 * @param {Array} alreadySubmittedNames - 已報名賓客名單
 * @param {string} guestType - 賓客類型 ('family' | 'party' | 'all')
 */
export function checkSubmissionStatus(unlockedGuestName, alreadySubmittedNames = [], guestType = 'party') {
    if (!unlockedGuestName) return;

    const normalized = unlockedGuestName.trim().toLowerCase();
    
    // 檢查 LocalStorage 或已報名清單
    const hasSubmitted =
        alreadySubmittedNames.some(name => name.trim().toLowerCase() === normalized) ||
        localStorage.getItem("rsvp_submitted_" + normalized) === "true";

    // 1. 取得需要控制顯示/隱藏的區域 DOM
    const sectionEvents = document.getElementById("section-events");
    const familySection = document.getElementById("section-family");
    const allNotice = document.getElementById("all-version-notice");
    const countdownSection = document.getElementById("countdown-section");
    const noticeSection = document.getElementById("section-notice");
    const mapsSection = document.getElementById("section-maps");
    const timelineSection = document.getElementById("section-timeline");
    const mainContainer = document.getElementById("event-details-container");

    // 確保解鎖後的主容器顯示
    if (mainContainer) mainContainer.classList.remove("hidden");

    // 2. 根據賓客類型 (guestType) 做精準切換
    if (guestType === 'family') {
        // 【家宴賓客】：顯示家宴卡片與父容器，隱藏派對的所有區塊
        if (sectionEvents) sectionEvents.classList.remove("hidden");
        if (familySection) familySection.classList.remove("hidden");
        
        if (allNotice) allNotice.classList.add("hidden");
        if (countdownSection) countdownSection.classList.add("hidden");
        if (noticeSection) noticeSection.classList.add("hidden");
        if (mapsSection) mapsSection.classList.add("hidden");
        if (timelineSection) timelineSection.classList.add("hidden");

        // 自動平滑滾動到家宴取消卡片
        setTimeout(() => {
            familySection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

    } else {
        // 【派對賓客 / 共同好友 (party / all)】：隱藏家宴卡片，顯示派對內容
        if (familySection) familySection.classList.add("hidden");
        
        if (guestType === 'all') {
            if (allNotice) allNotice.classList.remove("hidden");
        } else {
            if (allNotice) allNotice.classList.add("hidden");
        }

        // 顯示派對專屬內容
        if (countdownSection) countdownSection.classList.remove("hidden");
        if (noticeSection) noticeSection.classList.remove("hidden");
        if (mapsSection) mapsSection.classList.remove("hidden");
        if (timelineSection) timelineSection.classList.remove("hidden");

        // 自動平滑滾動到派對須知
        setTimeout(() => {
            (allNotice && guestType === 'all' ? allNotice : noticeSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // 3. 更新【派對須知】內的報名狀態提示卡片
    const submittedBox = document.getElementById("rsvp-status-submitted");
    const unsubmittedBox = document.getElementById("rsvp-status-unsubmitted");

    if (hasSubmitted) {
        if (submittedBox) submittedBox.classList.remove("hidden");
        if (unsubmittedBox) unsubmittedBox.classList.add("hidden");
    } else {
        if (submittedBox) submittedBox.classList.add("hidden");
        if (unsubmittedBox) unsubmittedBox.classList.remove("hidden");
    }

    // 4. 家宴取消按鈕鎖定
    const familyBtn = document.getElementById("btn-family-rsvp");
    if (familyBtn) {
        familyBtn.className = "w-full bg-stone-300 text-stone-500 py-3.5 rounded-xl font-semibold cursor-not-allowed transition duration-300";
        familyBtn.innerHTML = `<i class="fa-solid fa-circle-xmark mr-2"></i>此次家宴已取消`;
    }
}

export function handleGuestsChange() { return; }
export function openRsvpModal() { return; }
export function closeRsvpModal() { return; }
export function toggleAttendingForm() { return; }
export function closeSuccessModal() { return; }
