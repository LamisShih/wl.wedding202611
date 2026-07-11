import { DOM, findMatchedRoleAndName } from './utils.js';

export const ROLE_CONFIG = {
    family: {
        badge: "專屬家宴邀請",
        sections: ["section-family", "map-family"]
    },
    party: {
        badge: "專屬派對邀請",
        sections: ["section-party", "map-party"]
    },
    all: {
        badge: "完整版邀請",
        sections: [
            "all-version-notice",
            "section-family",
            "section-party",
            "map-family",
            "map-party"
        ]
    }
};

export function hideAllSections() {
    [
        "section-family",
        "section-party",
        "map-family",
        "map-party",
        "section-seating",
        "all-version-notice"
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });
}

export function showRoleSections(role) {
    ROLE_CONFIG[role].sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("hidden");
    });
}

export function unlockInvitation(role, guestName, setUnlockedGuestNameCallback, checkSubmissionStatusCallback) {
    const defaultPasses = ["family", "party", "all", "willylamis"];

    if (!defaultPasses.includes(guestName.toLowerCase())) {
        setUnlockedGuestNameCallback(guestName);
        const bs = document.getElementById("blessing-sender");
        if (bs) bs.value = guestName;
    }

    document.getElementById("event-details-container").classList.remove("hidden");

    const badge = document.getElementById("nav-badge");
    badge.classList.remove("hidden");

    hideAllSections();
    showRoleSections(role);

    badge.innerText = `${guestName} 的${ROLE_CONFIG[role].badge}`;

    checkSubmissionStatusCallback();

    document.getElementById("event-details-container").scrollIntoView({
        behavior: "smooth"
    });
}

export function initManualUnlock(INVITE_LIST, setUnlockedGuestNameCallback, checkSubmissionStatusCallback) {
    const rawInput = document.getElementById('passcode-input').value.trim();
    if (!rawInput) return;
    
    const match = findMatchedRoleAndName(rawInput, INVITE_LIST);
    
    if (match.role) {
        const defaultPasses = ['family', 'party', 'all', 'willylamis'];
        const nameToUse = defaultPasses.includes(match.name.toLowerCase()) ? rawInput : match.name;
        unlockInvitation(match.role, nameToUse, setUnlockedGuestNameCallback, checkSubmissionStatusCallback);
    } else {
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