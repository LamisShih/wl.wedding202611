import { DOM } from './utils.js';

export function handleGuestsChange() {
    return;
}

export function checkSubmissionStatus(unlockedGuestName, alreadySubmittedNames) {
    if (!unlockedGuestName) return;

    const normalized = unlockedGuestName.trim().toLowerCase();
    
    const hasSubmitted =
        alreadySubmittedNames.some(name => name.trim().toLowerCase() === normalized) ||
        localStorage.getItem("rsvp_submitted_" + normalized) === "true";

    const partyBtn = document.getElementById("btn-party-rsvp");

    if (partyBtn) {
        if (hasSubmitted) {
            partyBtn.className = "w-full bg-[#2d3831] text-white text-center py-3.5 rounded-xl font-semibold shadow-md cursor-not-allowed opacity-90 transition duration-300";
            partyBtn.innerHTML = `✅ 報名已截止 ✦ 您已成功報名派對`;
        } else {
            partyBtn.className = "w-full bg-stone-200 text-stone-500 text-center py-3.5 rounded-xl font-semibold cursor-not-allowed transition duration-300";
            partyBtn.innerHTML = `❌ 報名已截止 ✦ 期待未來再相聚`;
        }
    }
    
    const familyBtn = document.getElementById("btn-family-rsvp");
    if (familyBtn) {
        familyBtn.className = "w-full bg-stone-300 text-stone-500 py-3.5 rounded-xl font-semibold cursor-not-allowed transition duration-300";
        familyBtn.innerHTML = `<i class="fa-solid fa-circle-xmark mr-2"></i>此次家宴已取消`;
    }
}

export function openRsvpModal(eventType, unlockedGuestName) {
    return;
}

export function closeRsvpModal() {
    return;
}

export function toggleAttendingForm(isAttending) {
    return;
}

export function closeSuccessModal() {
    return;
}
