// Global debounce timeout reference for input-based search
let searchTimeout;

// Main event listener that initializes UI interactions once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const goButton = document.getElementById('goButton');
    const clearButton = document.getElementById('clearButton');

    // Attach input event for dynamic customer search with debounce
    searchInput.addEventListener('input', () => searchCustomers(searchInput));

    // Attach click handler for filtering unknown customers
    goButton.addEventListener('click', handleGo);

    // Attach click handler to clear all filters
    clearButton.addEventListener('click', clearFilters);

    // Restore previous filter parameters if present
    repopulateFilters();
});

// Performs debounced server-side search based on input field value
function searchCustomers(input) {
    const searchTerm = input.value.trim();
    clearTimeout(searchTimeout);

    if (!searchTerm) return hideAllDropdowns();

    searchTimeout = setTimeout(() => {
        fetch('/api/customers/search-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search: searchTerm })
        })
        .then(res => res.json())
        .then(data => displayDropdown(data, input))
        .catch(err => console.error('Search error:', err));
    }, 200); // 200ms debounce
}

// Builds and displays a dropdown menu of customer search results
function displayDropdown(items, input) {
    hideAllDropdowns();

    let dropdown = input.parentNode.querySelector('.dropdown-content') || document.createElement('div');
    dropdown.className = 'dropdown-content';
    document.body.appendChild(dropdown);
    dropdown.innerHTML = '';

    // Populate dropdown with clickable customer entries
    items.forEach(item => dropdown.appendChild(buildDropdownItem(item)));

    // Temporarily show to calculate width
    dropdown.style.visibility = 'hidden';
    dropdown.style.display = 'block';

    const maxWidth = Array.from(dropdown.children).reduce((max, el) => Math.max(max, el.offsetWidth), 0);
    dropdown.style.width = `${maxWidth + 35}px`;
    dropdown.style.maxWidth = '100%';

    dropdown.style.visibility = 'visible';

    // Scroll if too many items
    dropdown.style.maxHeight = items.length > 10 ? '70vh' : 'none';
    dropdown.style.overflowY = items.length > 10 ? 'scroll' : 'hidden';

    positionDropdown(dropdown, input);
}

// Creates a single <a> tag for a customer search result
function buildDropdownItem(item) {
    const link = document.createElement('a');
    link.href = `/customer-details?id=${item.id}`;
    link.textContent = buildCustomerLabel(item);
    return link;
}

// Formats customer name for dropdown: includes company if relevant
function buildCustomerLabel(item) {
    const { first_name, last_name, company_name } = item;
    let name = `${first_name || ''} ${last_name || ''}`.trim();
    if (company_name) {
        return name ? `${name}, ${company_name}` : company_name;
    }
    return name;
}

// Calculates absolute position of the dropdown relative to the input field
function positionDropdown(dropdown, input) {
    const rect = input.getBoundingClientRect();
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.top = `${rect.bottom}px`;
}

// Hides any visible dropdowns to prevent overlap or lingering content
function hideAllDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
}

// Handles search/filter logic for unknown customers and redirects
function handleGo() {
    const queryParams = new URLSearchParams();

    const getVal = id => document.getElementById(id).value;

    const start = getVal('datePickerStart');
    const end = getVal('datePickerEnd');
    const minPrice = getVal('numericInput1');
    const maxPrice = getVal('numericInput2');
    const invoice = getVal('invoiceNum');

    // Validation: date range
    if (start && end && start > end) return alert('Start date cannot be after end date.');

    // Validation: decimal prices
    if ((minPrice && !isValidDecimal(minPrice)) || (maxPrice && !isValidDecimal(maxPrice))) {
        return alert('Please enter valid decimal numbers.');
    }

    // Store valid fields
    if (start) queryParams.append('start', start);
    if (end) queryParams.append('end', end);
    if (minPrice) queryParams.append('minPrice', minPrice);
    if (maxPrice) queryParams.append('maxPrice', maxPrice);
    if (invoice) queryParams.append('invoice', invoice);

    sessionStorage.setItem('queryParams', queryParams.toString());

    // Redirect to filtered results
    window.location.href = `/unknown-details?${queryParams.toString()}`;
}

// Clears all input fields in the filter form
function clearFilters() {
    ['datePickerStart', 'datePickerEnd', 'numericInput1', 'numericInput2', 'invoiceNum']
        .forEach(id => document.getElementById(id).value = '');
}

// Repopulates filter fields from sessionStorage if available (persistent filters across sessions)
function repopulateFilters() {
    const params = new URLSearchParams(sessionStorage.getItem('queryParams') || '');
    const fields = {
        'datePickerStart': 'start',
        'datePickerEnd': 'end',
        'numericInput1': 'minPrice',
        'numericInput2': 'maxPrice',
        'invoiceNum': 'invoice'
    };
    for (const [id, key] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el && params.has(key)) el.value = params.get(key);
    }
}

// Simple decimal validation (used for price range inputs)
function isValidDecimal(value) {
    return /^\d+(\.\d+)?$/.test(value);
}
