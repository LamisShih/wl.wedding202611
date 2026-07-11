export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw5yzZ5lj2hVQmt_WKEjLVKW9dN1xnJYZs6cjwLuGQcTSdr8yU4mldDnj1mNa99OjyEXg/exec";

export async function fetchSubmittedNamesData() {
    if (!GOOGLE_SCRIPT_URL) return null;
    try {
        const antiCacheUrl = GOOGLE_SCRIPT_URL + (GOOGLE_SCRIPT_URL.includes('?') ? '&' : '?') + '_t=' + Date.now();
        const response = await fetch(antiCacheUrl, { cache: "no-store" });
        return await response.json();
    } catch (e) {
        console.warn(e);
        return null;
    }
}

export async function sendPostRequest(payload) {
    if (!GOOGLE_SCRIPT_URL) return;
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST', 
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) { 
        console.error(err); 
        throw err;
    }
}