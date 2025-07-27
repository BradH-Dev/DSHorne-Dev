let overflowCounter = 0;

export function updateGrid() {
    let totalQuantity = 0;
    document.querySelectorAll('#entries tr:not(:first-child) td:nth-child(2) input').forEach(input => {
        const quantity = parseInt(input.value) || 0;
        totalQuantity += quantity;
    });

    overflowCounter = Math.floor(totalQuantity / 65);
    let effectiveQuantity = totalQuantity % 65;

    const gridElement = document.querySelector('.grid');
    const overflowMessage = document.getElementById('overflowMessage');
    gridElement.innerHTML = '';

    overflowMessage.textContent = overflowCounter > 0
        ? `Filled ${overflowCounter} full page(s) with the following final page:`
        : '';

    for (let i = 0; i < 65; i++) {
        const box = document.createElement('div');
        box.className = 'grid-box';
        box.style.backgroundColor = (overflowCounter > 0 && effectiveQuantity === 0) ? '#eee' : (i < effectiveQuantity ? '#1e90ff' : '#eee');
        gridElement.appendChild(box);
    }

    if (overflowCounter > 0 && effectiveQuantity === 0) {
        for (let i = 0; i < 65; i++) {
            gridElement.children[i].style.backgroundColor = '#eee';
        }
    }
}
