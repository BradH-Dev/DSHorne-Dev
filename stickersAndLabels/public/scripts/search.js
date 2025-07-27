import { hideAllDropdowns } from './variations.js';

let skuTimeout = null;

export function setupSkuSearch() {
    const skuSearchCell = document.getElementById('skuSearchCell');

    skuSearchCell.addEventListener('input', function (event) {
        clearTimeout(skuTimeout);
        const target = event.target;
        hideAllDropdowns();

        skuTimeout = setTimeout(() => {
            const userText = (target.childNodes[0] && target.childNodes[0].nodeValue || "").trim();
            if (userText.length > 0) {
                searchItems(userText, target);
            } else {
                hideAllDropdowns();
            }
        }, 300);
    });

    document.body.addEventListener('click', function (event) {
        if (!event.target.closest('#skuSearchContainer')) {
            hideAllDropdowns();
        }
    });
}

function searchItems(query, targetCell) {
    const data = {
        "object_types": ["ITEM"],
        "query": {
            "text_query": {
                "keywords": [query.trim()]
            }
        }
    };

    showSearchingDropdown(targetCell);

    fetch('/proxy', {
        method: 'POST',
        headers: {
            'Square-Version': '2024-05-15',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => displayDropdown(data.objects, targetCell, true))
    .catch(err => {
        console.error('ITEM search error:', err);
        displayDropdown([], targetCell, true);
    });
}

function showSearchingDropdown(targetCell) {
    hideAllDropdowns();
    let dropdown = targetCell.nextElementSibling;
    dropdown.innerHTML = '<div style="padding: 5px; color: #1e90ff;">Searching...</div>';
    dropdown.style.display = 'block';
}

function displayDropdown(items, targetCell, isSkuSearch) {
    hideAllDropdowns();
    let dropdown = targetCell.nextElementSibling;
    dropdown.innerHTML = '';
    dropdown.style.display = 'block';

    if (!items || items.length === 0) {
        const noResult = document.createElement('div');
        noResult.textContent = 'No results found';
        noResult.style.color = 'red';
        dropdown.appendChild(noResult);
        return;
    }

    items.slice(0, 10).forEach(item => {
        const option = document.createElement('div');
        option.textContent = item.item_data.name;
        option.addEventListener('click', () => {
            if (item.item_data.variations.length > 1) {
                hideAllDropdowns();
                import('./variations.js').then(module => {
                    module.showVariationPopup(item.item_data.variations, targetCell, item, dropdown, isSkuSearch);
                });
            } else {
                const variation = item.item_data.variations[0];
                if (variation) {
                    targetCell.textContent = ``;
                    document.getElementById('sku').value = variation.item_variation_data.sku;
                }
                dropdown.style.display = 'none';
            }
        });
        dropdown.appendChild(option);
    });
}
