let allProducts = [];

document.getElementById('site-title').textContent = CONFIG.STORE_NAME;
document.getElementById('header-title').textContent = CONFIG.STORE_NAME;

async function fetchProducts() {
    if (CONFIG.APPS_SCRIPT_URL === "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE") {
        showStatus("Please configure your Apps Script URL in config.js");
        return;
    }

    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        allProducts = data.data || [];
        populateCategories();
        renderProducts();
    } catch (error) {
        showStatus("Error loading products. Please try again later.");
        console.error("Fetch error:", error);
    }
}

function showStatus(message) {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    document.getElementById('product-grid').innerHTML = '';
}

function populateCategories() {
    const select = document.getElementById('category-select');
    const currentVal = select.value;
    const categories = new Set(allProducts.map(p => p.category).filter(c => c));
    
    select.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
    select.value = currentVal;
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    const statusDiv = document.getElementById('status-message');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedCategory = document.getElementById('category-select').value;

    let filtered = allProducts.filter(p => {
        const matchesSearch = p.product_name.toLowerCase().includes(searchTerm) || 
                              p.short_description.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
        if (a.featured === 'Yes' && b.featured !== 'Yes') return -1;
        if (b.featured === 'Yes' && a.featured !== 'Yes') return 1;
        return (parseInt(a.sort_order) || 999) - (parseInt(b.sort_order) || 999);
    });

    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        statusDiv.textContent = "No products found.";
        statusDiv.style.display = 'block';
        return;
    }
    statusDiv.style.display = 'none';

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';

        const img = document.createElement('img');
        img.src = p.image_url;
        img.alt = p.product_name;
        img.onerror = () => { img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="200" fill="%23eee"%3E%3Crect width="100%25" height="100%25"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16px" fill="%23999"%3EImage Not Available%3C/text%3E%3C/svg%3E'; };
        card.appendChild(img);

        if (p.category) {
            const catBadge = document.createElement('span');
            catBadge.className = 'category-badge';
            catBadge.textContent = p.category;
            card.appendChild(catBadge);
        }

        const title = document.createElement('h2');
        title.textContent = p.product_name;
        card.appendChild(title);

        const desc = document.createElement('p');
        desc.className = 'description';
        desc.textContent = p.short_description;
        card.appendChild(desc);

        if (p.price) {
            const price = document.createElement('div');
            price.className = 'price';
            price.textContent = p.price;
            card.appendChild(price);

            if (p.price_checked_date) {
                const date = document.createElement('div');
                date.className = 'price-date';
                date.textContent = `Verified: ${p.price_checked_date}`;
                card.appendChild(date);
            }
        }

        if (p.earnkaro_link) {
            const btn = document.createElement('a');
            btn.className = 'buy-btn';
            btn.href = p.earnkaro_link;
            btn.textContent = 'View Deal';
            btn.target = '_blank';
            btn.rel = 'sponsored nofollow noopener noreferrer';
            card.appendChild(btn);
        }

        grid.appendChild(card);
    });
}

document.getElementById('search-input').addEventListener('input', renderProducts);
document.getElementById('category-select').addEventListener('change', renderProducts);

fetchProducts();
setInterval(fetchProducts, CONFIG.REFRESH_INTERVAL_MS);