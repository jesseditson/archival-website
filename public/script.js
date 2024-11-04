window.onload = function() {
    document.querySelectorAll(".photo-item").forEach(function(item) {
        item.addEventListener("click", function() {
            const img = item.querySelector("img");
            openLightbox(img.src, img.getAttribute("alt"))
        })
    })
}

// Open
function openLightbox(imageUrl, imageAlt) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    lightboxImg.src = imageUrl;
    lightboxImg.alt = imageAlt;
    lightbox.classList.add('active');
}

// Close
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
}
