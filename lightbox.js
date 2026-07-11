import { DOM } from './utils.js';
import { galleryImages } from './gallery.js';

let currentGalleryIndex = 0;

export function openLightbox(index) {
    currentGalleryIndex = index;
    
    // 💡 修正：改用最安全的字串串接 (+號)，確保路徑絕對正確
    DOM.lightboxImg.src = "photowall/" + galleryImages[index].src + ".webp";
    
    DOM.lightbox.classList.remove("hidden");
    requestAnimationFrame(() => {
        DOM.lightbox.classList.remove("opacity-0");
        DOM.lightboxImg.classList.remove("scale-95");
    });
}

export function closeLightbox() {
    DOM.lightbox.classList.add("opacity-0");
    DOM.lightboxImg.classList.add("scale-95");
    setTimeout(() => {
        DOM.lightbox.classList.add("hidden");
    }, 300);
}

export function showPrevImage() {
    currentGalleryIndex--;
    if (currentGalleryIndex < 0) {
        currentGalleryIndex = galleryImages.length - 1;
    }
    // 💡 修正：改用最安全的字串串接 (+號)
    DOM.lightboxImg.src = "photowall/" + galleryImages[currentGalleryIndex].src + ".webp";
}

export function showNextImage() {
    currentGalleryIndex++;
    if (currentGalleryIndex >= galleryImages.length) {
        currentGalleryIndex = 0;
    }
    // 💡 修正：改用最安全的字串串接 (+號)
    DOM.lightboxImg.src = "photowall/" + galleryImages[currentGalleryIndex].src + ".webp";
}