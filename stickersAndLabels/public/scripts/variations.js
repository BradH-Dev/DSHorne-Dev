export function showVariationPopup(variations, targetCell, item, dropdown, isSkuSearch = false) {
    hideAllDropdowns();

    document.querySelectorAll('.variation-popup').forEach(p => p.remove());
    const popup = document.createElement('div');
    popup.className = 'variation-popup';

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    variations.forEach(variation => {
        const btn = document.createElement('button');
        btn.textContent = variation.item_variation_data.name;
        btn.addEventListener('click', () => {
            if (isSkuSearch) {
                targetCell.textContent = ``;
                document.getElementById('sku').value = variation.item_variation_data.sku;
            }
            popup.remove();
        });
        popup.appendChild(btn);
    });

    requestAnimationFrame(() => {
        document.body.appendChild(popup);
        window.scrollTo(scrollX, scrollY);
    });

    document.addEventListener('mousedown', function outsideClick(event) {
        if (!popup.contains(event.target)) {
            popup.remove();
            document.removeEventListener('mousedown', outsideClick);
        }
    });
}

export function hideAllDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    document.querySelectorAll('.variation-popup').forEach(p => p.remove());
}
