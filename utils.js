// ==================== DOM Cache ====================
export const DOM = {};

export function cacheDOM() {
    DOM.gallery = document.getElementById("gallery-grid");
    DOM.danmaku = document.getElementById("danmaku-container");
    DOM.lightbox = document.getElementById("lightbox-modal");
    DOM.lightboxImg = document.getElementById("lightbox-img");

    DOM.rsvpModal = document.getElementById("rsvp-modal");
    DOM.rsvpForm = document.getElementById("rsvp-form");
    DOM.modalTitle = document.getElementById("modal-title");

    DOM.otherNames = document.getElementById("form-group-other-names");
    DOM.otherNamesInput = document.getElementById("rsvp-other-names");

    DOM.driving = document.getElementById("form-group-driving");
    DOM.attendingDetails = document.getElementById("attending-details");
}

// 🛡️ 防呆比對引擎（無視大小寫、無視任何空格）
export function findMatchedRoleAndName(rawInput, inviteList) {
    if (!rawInput) return { role: null, name: rawInput };
    
    let normalizedInput = rawInput.toLowerCase().replace(/\s+/g, '');
    
    for (let key in inviteList) {
        let normalizedKey = key.toLowerCase().replace(/\s+/g, '');
        if (normalizedInput === normalizedKey) {
            return { role: inviteList[key], name: key }; 
        }
    }
    return { role: null, name: rawInput };
}