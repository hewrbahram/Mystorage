// Data Storage
const STORAGE_KEYS = {
    PRODUCTS: 'inv_products',
    CATEGORIES: 'inv_categories',
    TRANSACTIONS: 'inv_transactions',
    SELLERS: 'inv_sellers'
};

// State
let products = [];
let categories = [];
let transactions = [];
let sellers = [];
let cart = [];
let currentModule = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initSampleData();
});

function loadData() {
    products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [];
    categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || [];
    transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
    sellers = JSON.parse(localStorage.getItem(STORAGE_KEYS.SELLERS)) || [];
}

function saveData() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(sellers));
}

function initSampleData() {
    if (categories.length === 0) {
        categories = [
            { id: '1', name: 'Electronics', color: '#6366f1' },
            { id: '2', name: 'Clothing', color: '#ec4899' },
            { id: '3', name: 'Food', color: '#22c55e' }
        ];
    }
    
    if (products.length === 0) {
        products = [
            { id: '1', name: 'Headphones', category: '1', sku: 'HP-001', quantity: 20, buyPrice: 30, sellPrice: 59.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200' },
            { id: '2', name: 'T-Shirt', category: '2', sku: 'TS-001', quantity: 50, buyPrice: 8, sellPrice: 19.99, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200' },
            { id: '3', name: 'Coffee', category: '3', sku: 'CF-001', quantity: 5, buyPrice: 5, sellPrice: 12.99, image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200' }
        ];
    }
    
    if (sellers.length === 0) {
        sellers = [
            { id: '1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' },
            { id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=5' },
            { id: '3', name: 'Bob Johnson', avatar: 'https://i.pravatar.cc/150?img=3' }
        ];
    }
    
    saveData();
}

// Navigation
function openModule(module) {
    currentModule = module;
    
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('app-container').classList.remove('hidden');
    
    // Setup sidebar
    const icons = {
        'dashboard': 'fa-chart-pie',
        'sales-ladder': 'fa-trophy',
        'pos': 'fa-cash-register',
        'stock': 'fa-boxes'
    };
    
    const names = {
        'dashboard': 'Dashboard',
        'sales-ladder': 'Sales Ladder',
        'pos': 'Point of Sale',
        'stock': 'Stock Management'
    };
    
    document.getElementById('current-icon').className = `fas ${icons[module]}`;
    document.getElementById('current-name').textContent = names[module];
    
    // Setup nav menu
    const menus = {
        'dashboard': ['Overview', 'Analytics', 'Reports'],
        'sales-ladder': ['Rankings', 'Performance', 'Goals'],
        'pos': ['New Sale', 'History', 'Returns'],
        'stock': ['Products', 'Categories', 'Inventory']
    };
    
    document.getElementById('nav-menu').innerHTML = menus[module].map((item, i) => `
        <li class="${i === 0 ? 'active' : ''}" onclick="switchTab('${item.toLowerCase()}')">
            <i class="fas fa-circle" style="font-size: 6px;"></i>
            <span>${item}</span>
        </li>
    `).join('');
    
    // Show section
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${module}-section`).classList.remove('hidden');
    
    // Init module
    if (module === 'dashboard') initDashboard();
    if (module === 'sales-ladder') initSalesLadder();
    if (module === 'pos') initPOS();
    if (module === 'stock') initStock();
}

function backToHome() {
    document.getElementById('landing-page').style.display = 'flex';
    document.getElementById('app-container').classList.add('hidden');
    currentModule = '';
}

function switchTab(tab) {
    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    event.target.closest('li').classList.add('active');
}

// DASHBOARD
function initDashboard() {
    // Stats
    document.getElementById('stat-products').textContent = products.length;
    
    const today = new Date().toDateString();
    const todaySales = transactions.filter(t => new Date(t.date).toDateString() === today && t.type === 'sale');
    document.getElementById('stat-sales').textContent = formatCurrency(todaySales.reduce((s, t) => s + t.total, 0));
    document.getElementById('stat-orders').textContent = todaySales.length;
    document.getElementById('stat-alerts').textContent = products.filter(p => p.quantity <= 5).length;
    
    // Chart
    const chart = document.getElementById('sales-chart');
    chart.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${Math.random() * 60 + 20}%`;
        chart.appendChild(bar);
    }
    
    // Activity
    const activities = [
        { type: 'sale', desc: 'New sale completed', user: 'John Doe', time: '2 min ago' },
        { type: 'purchase', desc: 'Stock received', user: 'System', time: '1 hour ago' },
        { type: 'alert', desc: 'Low stock warning', user: 'System', time: '3 hours ago' }
    ];
    
    document.getElementById('activity-list').innerHTML = activities.map(a => `
        <div class="activity-item">
            <div class="activity-icon ${a.type}">
                <i class="fas fa-${a.type === 'sale' ? 'shopping-cart' : a.type === 'purchase' ? 'box' : 'exclamation'}"></i>
            </div>
            <div class="activity-details">
                <h4>${a.desc}</h4>
                <p>${a.user}</p>
            </div>
            <span class="activity-time">${a.time}</span>
        </div>
    `).join('');
    
    // Top products
    const sales = {};
    transactions.filter(t => t.type === 'sale').forEach(t => {
        sales[t.productId] = (sales[t.productId] || 0) + t.quantity;
    });
    
    const top = Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 3);
    document.getElementById('top-products').innerHTML = top.map(([pid, qty], i) => {
        const p = products.find(x => x.id === pid);
        return p ? `
            <div class="top-product">
                <span class="rank">${i + 1}</span>
                <img src="${p.image}" alt="${p.name}">
                <div class="top-product-info">
                    <h4>${p.name}</h4>
                    <p>${getCategoryName(p.category)}</p>
                </div>
                <div class="top-product-sales">
                    <div class="amount">${formatCurrency(qty * p.sellPrice)}</div>
                    <div class="units">${qty} sold</div>
                </div>
            </div>
        ` : '';
    }).join('') || '<p style="color: #94a3b8; text-align: center;">No sales yet</p>';
}

// SALES LADDER
function initSalesLadder() {
    renderLadder();
}

function renderLadder() {
    const period = document.getElementById('ladder-period').value;
    
    // Calculate sales per seller
    const sellerSales = sellers.map(s => {
        let sales = transactions
            .filter(t => t.type === 'sale' && t.sellerId === s.id)
            .reduce((sum, t) => sum + t.total, 0);
        
        // Add random variation for demo if no transactions
        if (sales === 0) sales = Math.floor(Math.random() * 5000) + 1000;
        
        return { ...s, sales };
    }).sort((a, b) => b.sales - a.sales);
    
    // Podium (top 3)
    const podium = document.getElementById('podium');
    const positions = ['second', 'first', 'third'];
    const top3 = [sellerSales[1], sellerSales[0], sellerSales[2]].filter(Boolean);
    
    podium.innerHTML = top3.map((s, i) => `
        <div class="podium-place ${positions[i]}">
            <img src="${s.avatar}" alt="${s.name}" class="podium-avatar">
            <div class="podium-badge">${i === 1 ? '1' : i === 0 ? '2' : '3'}</div>
            <div class="podium-name">${s.name}</div>
            <div class="podium-sales">${formatCurrency(s.sales)}</div>
            <div class="podium-bar"></div>
        </div>
    `).join('');
    
    // Rankings list
    const list = document.getElementById('rankings-list');
    list.innerHTML = sellerSales.map((s, i) => `
        <div class="ranking-item">
            <div class="ranking-rank ${i < 3 ? 'top' : ''}">${i + 1}</div>
            <img src="${s.avatar}" class="ranking-avatar">
            <div class="ranking-info">
                <h4>${s.name}</h4>
                <p>${i < 3 ? 'Top Performer' : 'Sales Rep'}</p>
            </div>
            <div class="ranking-amount">${formatCurrency(s.sales)}</div>
        </div>
    `).join('');
}

function openSellerModal() {
    document.getElementById('seller-modal').classList.add('active');
}

function saveSeller(e) {
    e.preventDefault();
    const name = document.getElementById('seller-name').value;
    sellers.push({
        id: Date.now().toString(),
        name: name,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
    });
    saveData();
    closeModal('seller-modal');
    renderLadder();
    showToast('Seller added');
}

// POINT OF SALE
function initPOS() {
    cart = [];
    renderCart();
    
    // Categories
    const catContainer = document.getElementById('pos-categories');
    catContainer.innerHTML = `
        <button class="cat-btn active" onclick="filterCategory('all')">All</button>
        ${categories.map(c => `<button class="cat-btn" onclick="filterCategory('${c.id}')">${c.name}</button>`).join('')}
    `;
    
    renderPOSProducts();
}

function renderPOSProducts(filter = 'all', search = '') {
    const grid = document.getElementById('pos-products-grid');
    let filtered = products;
    
    if (filter !== 'all') filtered = filtered.filter(p => p.category === filter);
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    
    grid.innerHTML = filtered.map(p => `
        <div class="pos-product-card" onclick="addToCart('${p.id}')">
            <img src="${p.image || 'https://via.placeholder.com/80'}" alt="${p.name}">
            <h4>${p.name}</h4>
            <div class="price">${formatCurrency(p.sellPrice)}</div>
            <div class="stock">${p.quantity} in stock</div>
        </div>
    `).join('');
}

function filterCategory(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    const search = document.getElementById('pos-search').value;
    renderPOSProducts(cat, search);
}

function filterPOSProducts() {
    const search = document.getElementById('pos-search').value;
    const activeCat = document.querySelector('.cat-btn.active');
    const cat = activeCat ? 'all' : 'all'; // Simplified
    renderPOSProducts('all', search);
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity <= 0) {
        showToast('Out of stock', 'error');
        return;
    }
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        if (existing.qty < product.quantity) {
            existing.qty++;
        } else {
            showToast('Max stock reached', 'error');
            return;
        }
    } else {
        cart.push({ ...product, qty: 1 });
    }
    
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cart-plus"></i>
                <p>Click products to add</p>
            </div>
        `;
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${formatCurrency(item.sellPrice)}</p>
                </div>
                <div class="cart-item-qty">
                    <button onclick="updateQty('${item.id}', -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="updateQty('${item.id}', 1)">+</button>
                </div>
            </div>
        `).join('');
    }
    
    // Totals
    const subtotal = cart.reduce((s, i) => s + (i.sellPrice * i.qty), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    document.getElementById('cart-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('cart-tax').textContent = formatCurrency(tax);
    document.getElementById('cart-total').textContent = formatCurrency(total);
}

function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    const product = products.find(p => p.id === id);
    
    if (delta > 0 && item.qty >= product.quantity) {
        showToast('Max stock reached', 'error');
        return;
    }
    
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    renderCart();
}

function clearCart() {
    cart = [];
    renderCart();
}

function openCheckout() {
    if (cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }
    const total = document.getElementById('cart-total').textContent;
    document.getElementById('checkout-total-amount').textContent = total;
    document.getElementById('checkout-modal').classList.add('active');
}

function completeSale() {
    // Record transaction
    cart.forEach(item => {
        transactions.push({
            id: Date.now().toString(),
            type: 'sale',
            date: new Date().toISOString(),
            productId: item.id,
            quantity: item.qty,
            unitPrice: item.sellPrice,
            total: item.sellPrice * item.qty,
            sellerId: '1' // Default seller
        });
        
        // Update stock
        const product = products.find(p => p.id === item.id);
        product.quantity -= item.qty;
    });
    
    saveData();
    closeModal('checkout-modal');
    clearCart();
    showToast('Sale completed!');
    initDashboard(); // Refresh stats
}

// STOCK MANAGEMENT
function initStock() {
    switchStockTab('products');
}

function switchStockTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    
    event.target.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    
    if (tab === 'products') renderProducts();
    if (tab === 'categories') renderCategories();
    if (tab === 'inventory') renderInventory();
}

function renderProducts() {
    const search = document.getElementById('product-search')?.value || '';
    let filtered = products;
    
    if (search) {
        filtered = products.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku?.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    document.getElementById('products-table-body').innerHTML = filtered.map(p => {
        const isLow = p.quantity <= 5;
        return `
            <tr>
                <td>
                    <div class="product-cell">
                        <img src="${p.image || 'https://via.placeholder.com/40'}" alt="${p.name}">
                        <div>
                            <h4>${p.name}</h4>
                            <p>${p.sku || 'No SKU'}</p>
                        </div>
                    </div>
                </td>
                <td>${getCategoryName(p.category)}</td>
                <td>
                    <span class="stock-tag ${isLow ? 'stock-low' : 'stock-ok'}">
                        <i class="fas fa-${isLow ? 'exclamation' : 'check'}-circle"></i>
                        ${p.quantity}
                    </span>
                </td>
                <td>${formatCurrency(p.buyPrice)}</td>
                <td>${formatCurrency(p.sellPrice)}</td>
                <td>
                    <div class="action-btns">
                        <button class="edit" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="delete" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderCategories() {
    document.getElementById('categories-grid').innerHTML = categories.map(c => {
        const count = products.filter(p => p.category === c.id).length;
        return `
            <div class="category-box" style="border-left-color: ${c.color}">
                <h4>${c.name}</h4>
                <p>${count} products</p>
                <div class="category-meta">
                    <span><i class="fas fa-box"></i> ${count} items</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderInventory() {
    const totalItems = products.reduce((s, p) => s + p.quantity, 0);
    const stockValue = products.reduce((s, p) => s + (p.quantity * p.buyPrice), 0);
    const lowStock = products.filter(p => p.quantity <= 5).length;
    
    document.getElementById('inv-total-items').textContent = totalItems;
    document.getElementById('inv-stock-value').textContent = formatCurrency(stockValue);
    document.getElementById('inv-low-stock').textContent = lowStock;
    
    // Alerts
    const alerts = products.filter(p => p.quantity <= 5);
    document.getElementById('stock-alerts').innerHTML = alerts.map(p => `
        <div class="activity-item">
            <div class="activity-icon alert">
                <i class="fas fa-exclamation"></i>
            </div>
            <div class="activity-details">
                <h4>${p.name}</h4>
                <p>Only ${p.quantity} remaining</p>
            </div>
        </div>
    `).join('') || '<p style="color: #94a3b8;">No alerts</p>';
}

// Product Modal
function openProductModal() {
    document.getElementById('product-modal-title').textContent = 'Add Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    
    const catSelect = document.getElementById('product-category');
    catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    document.getElementById('product-modal').classList.add('active');
}

function editProduct(id) {
    const p = products.find(x => x.id === id);
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('product-id').value = p.id;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-sku').value = p.sku || '';
    document.getElementById('product-quantity').value = p.quantity;
    document.getElementById('product-buy-price').value = p.buyPrice;
    document.getElementById('product-sell-price').value = p.sellPrice;
    document.getElementById('product-image').value = p.image || '';
    document.getElementById('product-description').value = p.description || '';
    
    const catSelect = document.getElementById('product-category');
    catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    catSelect.value = p.category;
    
    document.getElementById('product-modal').classList.add('active');
}

function saveProduct(e) {
    e.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const data = {
        id: id || Date.now().toString(),
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        sku: document.getElementById('product-sku').value,
        quantity: parseInt(document.getElementById('product-quantity').value),
        buyPrice: parseFloat(document.getElementById('product-buy-price').value),
        sellPrice: parseFloat(document.getElementById('product-sell-price').value),
        image: document.getElementById('product-image').value,
        description: document.getElementById('product-description').value
    };
    
    if (id) {
        const idx = products.findIndex(p => p.id === id);
        products[idx] = data;
    } else {
        products.push(data);
    }
    
    saveData();
    closeModal('product-modal');
    renderProducts();
    showToast('Product saved');
}

function deleteProduct(id) {
    if (confirm('Delete this product?')) {
        products = products.filter(p => p.id !== id);
        saveData();
        renderProducts();
        showToast('Product deleted');
    }
}

// Category Modal
function openCategoryModal() {
    document.getElementById('category-modal').classList.add('active');
}

function saveCategory(e) {
    e.preventDefault();
    categories.push({
        id: Date.now().toString(),
        name: document.getElementById('category-name').value,
        color: document.getElementById('category-color').value
    });
    saveData();
    closeModal('category-modal');
    renderCategories();
    showToast('Category added');
}

// Utilities
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function getCategoryName(id) {
    const c = categories.find(x => x.id === id);
    return c ? c.name : 'Uncategorized';
}

function formatCurrency(n) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(n || 0);
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Export/Import
function exportData() {
    const data = { products, categories, transactions, sellers };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Data exported');
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm(`Import ${data.products?.length || 0} products?`)) {
                products = data.products || [];
                categories = data.categories || [];
                transactions = data.transactions || [];
                sellers = data.sellers || [];
                saveData();
                showToast('Data imported');
                if (currentModule) openModule(currentModule);
            }
        } catch (err) {
            alert('Invalid file');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// Close modals on backdrop click
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
};
