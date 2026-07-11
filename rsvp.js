import { DOM } from './utils.js';

export function handleGuestsChange() {
    const guestsEl = document.getElementById("rsvp-guests");
    const attendingRadio = document.querySelector('input[name="attending"]:checked');
    if (!guestsEl || !attendingRadio) return;

    const guests = Number(guestsEl.value);
    const attending = attendingRadio.value === "yes";
    
    if (guests > 1 && attending) {
        DOM.otherNames.classList.remove("hidden");
        DOM.otherNamesInput.required = true;
    } else {
        DOM.otherNames.classList.add("hidden");
        DOM.otherNamesInput.required = false;
    }
}

export function disableRsvpButton(button, text) {
    if (!button) return;
    button.disabled = true;
    button.className = "w-full bg-stone-300 text-stone-500 py-3.5 rounded-xl font-semibold cursor-not-allowed";
    button.innerHTML = `<i class="fa-solid fa-circle-check mr-2"></i>${text}`;
}

export function checkSubmissionStatus(unlockedGuestName, alreadySubmittedNames) {
    if (!unlockedGuestName) return;

    const normalized = unlockedGuestName.trim().toLowerCase();
    const hasSubmitted =
        alreadySubmittedNames.some(name => name.trim().toLowerCase() === normalized) ||
        localStorage.getItem("rsvp_submitted_" + normalized) === "true";

    if (!hasSubmitted) return;

    disableRsvpButton(
        document.getElementById("btn-family-rsvp"),
        "已完成家宴回覆"
    );

    disableRsvpButton(
        document.getElementById("btn-party-rsvp"),
        "已完成派對回覆"
    );
}

export function openRsvpModal(eventType, unlockedGuestName) {
    DOM.rsvpModal.classList.remove("hidden");
    DOM.rsvpForm.reset();
    document.getElementById("form-event-type").value = eventType;
    toggleAttendingForm(true);
    
    const name = document.getElementById("rsvp-guest-name");
    if (unlockedGuestName) {
        name.value = unlockedGuestName;
        name.readOnly = true;
        name.classList.add("bg-stone-100", "text-stone-500", "cursor-not-allowed");
    }
    
    DOM.modalTitle.innerText = eventType === "family" ? "家宴出席調查" : "派對出席調查";
    DOM.driving.classList.toggle("hidden", eventType === "family");
    handleGuestsChange();
}

export function closeRsvpModal() {
    DOM.rsvpModal.classList.add("hidden");
}

export function toggleAttendingForm(isAttending) {
    DOM.attendingDetails.classList.toggle("hidden", !isAttending);
    document.getElementById("rsvp-guest-phone").required = isAttending;
    document.getElementById("rsvp-guest-email").required = isAttending;
    handleGuestsChange();
}

export function closeSuccessModal() {
    document.getElementById('success-modal').classList.add('hidden');
}