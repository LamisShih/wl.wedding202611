import { DOM } from './utils.js';

// 8 張相片資料庫
export const galleryImages = [
    { src: 'IMG_2742', alt: '婚紗1' },
    { src: 'IMG_2918', alt: '婚紗2' },
    { src: 'DSC00587', alt: '婚紗3' },
    { src: 'wl_46', alt: '婚紗4' },
    { src: 'DSC2297', alt: '婚紗5' }
];

export function preloadGalleryImages() {
    galleryImages.forEach(img => {
        const image = new Image();
        image.loading = "eager";
        image.decoding = "async";
        image.fetchPriority = "high";
        image.src = `photowall/${img.src}.webp`;
    });
}

export function renderGallery(openLightboxCallback) {
    if (!DOM.gallery) return;
    DOM.gallery.innerHTML = galleryImages.map((img, index) => {
        // 📁 調整 2：在路徑前面加上新資料夾名稱 photowall/
        const webp = `photowall/${img.src}.webp`;
        return `
        <div
            class="gallery-item relative overflow-hidden rounded-xl group cursor-pointer border border-stone-200/40 shadow-sm"
            data-index="${index}">
            <img
                src="${webp}"
                alt="${img.alt}"
                loading="eager"
                fetchpriority="${index === 0 ? "high" : "auto"}"
                decoding="async"
                draggable="false"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
            <div class="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/30 transition-all duration-300 flex justify-center items-center">
                <i class="fa-solid fa-magnifying-glass-plus text-white text-xl opacity-0 group-hover:opacity-100 transition"></i>
            </div>
        </div>
        `;
    }).join("");

    // 綁定點擊事件
    DOM.gallery.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            openLightboxCallback(Number(item.dataset.index));
        });
    });
}