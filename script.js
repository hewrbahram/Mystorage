// script.js
// Data Management
let products = JSON.parse(localStorage.getItem('stockmaster_products')) || [];
let history = JSON.parse(localStorage.getItem('stockmaster_history')) || [];
let charts = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    updateDashboard();
    renderProducts();
    updateCategoryFilter();
    checkAlerts();
    
    // Auto-calculate total value in form
    document.getElementById('productQuantity').addEventListener('input', calculateTotal);
    document.getElementById('productPrice').addEventListener('input', calculateTotal);
    
    // Check for dark mode preference
    if (localStorage.getItem('stockmaster_darkmode') === 'true') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').classList.add('active');
    }
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    // Show selected section
    document.getElementById(sectionName + '-section').style.display = 'block';
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        document.getElementById('sidebar').classList.remove('active');
    }
    
    // Load section specific data
    if (sectionName === 'analytics') {
        setTimeout(() => renderCharts(), 100);
    } else if (sectionName === 'history') {
        renderHistory();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('themeToggle').classList.remove('active');
        localStorage.setItem('stockmaster_darkmode', 'false');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').classList.add('active');
        localStorage.setItem('stockmaster_darkmode', 'true');
    }
}

// Product Management
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productTotalValue').value = '';
    updateCategoryDatalist();
    document.getElementById('productModal').classList.add('active');
}

function openEditModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productSupplier').value = product.supplier || '';
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productMinLevel').value = product.minLevel;
    document.getElementById('productPrice').value = product.price;
    calculateTotal();
    
    document.getElementById('productModal').classList.add('active');
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

function calculateTotal() {
    const qty = parseFloat(document.getElementById('productQuantity').value) || 0;
    const price = parseFloat(document.getElementById('productPrice').value) || 0;
    const total = qty * price;
    document.getElementById('productTotalValue').value = '$' + total.toFixed(2);
}

function saveProduct() {
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value.trim();
    const supplier = document.getElementById('productSupplier').value.trim();
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const minLevel = parseInt(document.getElementById('productMinLevel').value);
    const price = parseFloat(document.getElementById('productPrice').value);
    
    if (!name || !category || isNaN(quantity) || isNaN(minLevel) || isNaN(price)) {
        alert('Please fill in all required fields');
        return;
    }
    
    const totalValue = quantity * price;
    const dateAdded = new Date().toISOString();
    
    if (id) {
        // Edit existing
        const index = products.findIndex(p => p.id === id);
        const oldProduct = products[index];
        products[index] = {
            ...oldProduct,
            name, category, supplier, quantity, minLevel, price,
            totalValue, lastUpdated: dateAdded
        };
        addToHistory('edited', name, quantity - oldProduct.quantity, `Updated product details`);
    } else {
        // Add new
        const newProduct = {
            id: Date.now().toString(),
            name, category, supplier, quantity, minLevel, price,
            totalValue, dateAdded, lastUpdated: dateAdded
        };
        products.push(newProduct);
        addToHistory('added', name, quantity, 'Initial stock');
    }
    
    saveData();
    closeModal();
    updateDashboard();
    renderProducts();
    updateCategoryFilter();
    checkAlerts();
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const product = products.find(p => p.id === id);
    products = products.filter(p => p.id !== id);
    addToHistory('removed', product.name, -product.quantity, 'Product deleted');
    
    saveData();
    updateDashboard();
    renderProducts();
    checkAlerts();
}

// Stock Operations
function openStockModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('stockProductId').value = id;
    document.getElementById('currentStock').value = product.quantity + ' units';
    document.getElementById('stockOperation').value = 'add';
    document.getElementById('stockQuantity').value = '';
    document.getElementById('stockNotes').value = '';
    
    document.getElementById('stockModal').classList.add('active');
}

function closeStockModal() {
    document.getElementById('stockModal').classList.remove('active');
}

function saveStockOperation() {
    const id = document.getElementById('stockProductId').value;
    const operation = document.getElementById('stockOperation').value;
    const qty = parseInt(document.getElementById('stockQuantity').value);
    const notes = document.getElementById('stockNotes').value.trim();
    
    if (!qty || qty < 1) {
        alert('Please enter a valid quantity');
        return;
    }
    
    const product = products.find(p => p.id === id);
    let newQty = product.quantity;
    
    if (operation === 'add') {
        newQty += qty;
        addToHistory('added', product.name, qty, notes || 'Stock added');
    } else {
        if (qty > product.quantity) {
            alert('Cannot remove more than current stock');
            return;
        }
        newQty -= qty;
        addToHistory('removed', product.name, -qty, notes || 'Stock removed');
    }
    
    product.quantity = newQty;
    product.totalValue = newQty * product.price;
    product.lastUpdated = new Date().toISOString();
    
    saveData();
    closeStockModal();
    updateDashboard();
    renderProducts();
    checkAlerts();
}

// History Management
function addToHistory(action, productName, quantity, notes) {
    const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        action,
        productName,
        quantity,
        notes
    };
    history.unshift(entry);
    if (history.length > 100) history = history.slice(0, 100); // Keep last 100
    localStorage.setItem('stockmaster_history', JSON.stringify(history));
}

function renderHistory() {
    const container = document.getElementById('historyContainer');
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No history yet</h3>
                <p>Stock operations will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = history.map(entry => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const actionClass = entry.action;
        const actionIcon = entry.action === 'added' ? '➕' : entry.action === 'removed' ? '➖' : '✏️';
        const qtyStr = entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity;
        
        return `
            <div class="history-item ${actionClass}">
                <div class="history-info">
                    <h4>${actionIcon} ${entry.productName}</h4>
                    <p>${dateStr} • ${entry.notes || 'No notes'}</p>
                </div>
                <div class="history-quantity">${qtyStr} units</div>
            </div>
        `;
    }).join('');
}

function clearHistory() {
    if (!confirm('Clear all history?')) return;
    history = [];
    localStorage.setItem('stockmaster_history', JSON.stringify(history));
    renderHistory();
}

// Rendering
function renderProducts() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;
    
    let filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search) || 
                            p.category.toLowerCase().includes(search);
        const matchesCategory = !categoryFilter || p.category === categoryFilter;
        
        let matchesStock = true;
        if (stockFilter === 'low') matchesStock = p.quantity > 0 && p.quantity <= p.minLevel;
        else if (stockFilter === 'out') matchesStock = p.quantity === 0;
        else if (stockFilter === 'normal') matchesStock = p.quantity > p.minLevel;
        
        return matchesSearch && matchesCategory && matchesStock;
    });
    
    const tbody = document.getElementById('productsTable');
    const emptyState = document.getElementById('emptyState');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = filtered.map(p => {
        const status = p.quantity === 0 ? 'out' : p.quantity <= p.minLevel ? 'low' : 'normal';
        const badgeClass = status === 'out' ? 'badge-danger' : status === 'low' ? 'badge-warning' : 'badge-success';
        const badgeText = status === 'out' ? 'Out of Stock' : status === 'low' ? 'Low Stock' : 'In Stock';
        
        return `
            <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>${p.quantity}</td>
                <td>${p.minLevel}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td>$${p.totalValue.toFixed(2)}</td>
                <td>${p.supplier || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="icon-btn stock" onclick="openStockModal('${p.id}')" title="Update Stock">📊</button>
                        <button class="icon-btn edit" onclick="openEditModal('${p.id}')" title="Edit">✏️</button>
                        <button class="icon-btn delete" onclick="deleteProduct('${p.id}')" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterProducts() {
    renderProducts();
}

function updateDashboard() {
    const totalProducts = products.length;
    const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = products.reduce((sum, p) => sum + p.totalValue, 0);
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minLevel).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalQuantity').textContent = totalQty.toLocaleString();
    document.getElementById('totalValue').textContent = '$' + totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('lowStockCount').textContent = lowStock + outOfStock;
    
    // Recent products table (last 5)
    const recent = [...products].reverse().slice(0, 5);
    document.getElementById('recentProductsTable').innerHTML = recent.map(p => {
        const status = p.quantity === 0 ? 'out' : p.quantity <= p.minLevel ? 'low' : 'normal';
        const badgeClass = status === 'out' ? 'badge-danger' : status === 'low' ? 'badge-warning' : 'badge-success';
        const badgeText = status === 'out' ? 'Out of Stock' : status === 'low' ? 'Low Stock' : 'In Stock';
        
        return `
            <tr>
                <td>${p.name}</td>
                <td>${p.category}</td>
                <td>${p.quantity}</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td>$${p.totalValue.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    
    // Update insights
    updateInsights();
}

function updateInsights() {
    if (products.length === 0) return;
    
    // Most stocked
    const mostStocked = [...products].sort((a, b) => b.quantity - a.quantity)[0];
    document.getElementById('mostStocked').textContent = mostStocked.name;
    document.getElementById('mostStockedDesc').textContent = `${mostStocked.quantity} units in stock`;
    
    // Least stocked (excluding out of stock)
    const leastStocked = [...products].filter(p => p.quantity > 0).sort((a, b) => a.quantity - b.quantity)[0];
    if (leastStocked) {
        document.getElementById('leastStocked').textContent = leastStocked.name;
        document.getElementById('leastStockedDesc').textContent = `${leastStocked.quantity} units remaining`;
    }
    
    // Top category
    const categories = {};
    products.forEach(p => {
        categories[p.category] = (categories[p.category] || 0) + p.quantity;
    });
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        document.getElementById('topCategory').textContent = topCategory[0];
        document.getElementById('topCategoryDesc').textContent = `${topCategory[1]} total units`;
    }
    
    // Restock count
    const restockNeeded = products.filter(p => p.quantity <= p.minLevel).length;
    document.getElementById('restockCount').textContent = restockNeeded;
}

function updateCategoryFilter() {
    const categories = [...new Set(products.map(p => p.category))];
    const select = document.getElementById('categoryFilter');
    const currentVal = select.value;
    
    select.innerHTML = '<option value="">All Categories</option>' + 
        categories.map(c => `<option value="${c}">${c}</option>`).join('');
    select.value = currentVal;
}

function updateCategoryDatalist() {
    const categories = [...new Set(products.map(p => p.category))];
    document.getElementById('categories').innerHTML = 
        categories.map(c => `<option value="${c}">`).join('');
}

// Alerts System
function checkAlerts() {
    const container = document.getElementById('alertsContainer');
    const alerts = [];
    
    const outOfStock = products.filter(p => p.quantity === 0);
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minLevel);
    
    outOfStock.forEach(p => {
        alerts.push({ type: 'danger', message: `⚠️ <strong>${p.name}</strong> is OUT OF STOCK! Immediate restocking required.` });
    });
    
    lowStock.forEach(p => {
        alerts.push({ type: 'warning', message: `📦 <strong>${p.name}</strong> is running low (${p.quantity} units remaining). Minimum level: ${p.minLevel}` });
    });
    
    // Smart suggestions
    const suggestionsPanel = document.getElementById('suggestionsPanel');
    const suggestionsList = document.getElementById('suggestionsList');
    
    if (outOfStock.length > 0 || lowStock.length > 0) {
        suggestionsPanel.style.display = 'block';
        let suggestions = [];
        
        if (outOfStock.length > 0) {
            suggestions.push(`<div class="suggestion-item"><span class="suggestion-icon">🚨</span> You need to add stock for: ${outOfStock.map(p => p.name).join(', ')}</div>`);
        }
        
        // Check categories with low stock
        const categoryStats = {};
        products.forEach(p => {
            if (!categoryStats[p.category]) categoryStats[p.category] = { total: 0, low: 0 };
            categoryStats[p.category].total++;
            if (p.quantity <= p.minLevel) categoryStats[p.category].low++;
        });
        
        Object.entries(categoryStats).forEach(([cat, stats]) => {
            if (stats.low / stats.total > 0.5) {
                suggestions.push(`<div class="suggestion-item"><span class="suggestion-icon">📉</span> The "${cat}" category is running low (${stats.low}/${stats.total} products need restocking)</div>`);
            }
        });
        
        suggestionsList.innerHTML = suggestions.join('');
    } else {
        suggestionsPanel.style.display = 'none';
    }
    
    container.innerHTML = alerts.map(a => 
        `<div class="alert alert-${a.type}">${a.message}</div>`
    ).join('');
}

// Charts
function renderCharts() {
    // Destroy existing charts
    Object.values(charts).forEach(c => c.destroy());
    
    if (products.length === 0) return;
    
    const ctx1 = document.getElementById('quantityChart').getContext('2d');
    const ctx2 = document.getElementById('categoryChart').getContext('2d');
    const ctx3 = document.getElementById('trendChart').getContext('2d');
    
    // Quantity by Product (Bar Chart)
    charts.quantity = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: products.map(p => p.name),
            datasets: [{
                label: 'Current Stock',
                data: products.map(p => p.quantity),
                backgroundColor: products.map(p => {
                    if (p.quantity === 0) return 'rgba(239, 68, 68, 0.8)';
                    if (p.quantity <= p.minLevel) return 'rgba(245, 158, 11, 0.8)';
                    return 'rgba(99, 102, 241, 0.8)';
                }),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    
    // Category Distribution (Pie Chart)
    const categoryData = {};
    products.forEach(p => {
        categoryData[p.category] = (categoryData[p.category] || 0) + p.quantity;
    });
    
    charts.category = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Stock Value Trends (Line Chart) - simulate based on history
    const last7Days = [];
    const values = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        // Calculate value based on history up to that date
        const dateStr = date.toISOString().split('T')[0];
        const dayHistory = history.filter(h => h.date.startsWith(dateStr));
        let dayValue = products.reduce((sum, p) => sum + p.totalValue, 0);
        values.push(dayValue);
    }
    
    charts.trend = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Inventory Value',
                data: values,
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Export/Import
function exportData() {
    if (products.length === 0) {
        alert('No products to export');
        return;
    }
    
    const csv = [
        ['ID', 'Name', 'Category', 'Quantity', 'Min Level', 'Price', 'Total Value', 'Supplier', 'Date Added', 'Last Updated'],
        ...products.map(p => [
            p.id, p.name, p.category, p.quantity, p.minLevel, p.price, p.totalValue, 
            p.supplier || '', p.dateAdded, p.lastUpdated
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockmaster_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = line.split(',');
            if (cols.length < 6) continue;
            
            const newProduct = {
                id: Date.now().toString() + i,
                name: cols[1],
                category: cols[2],
                quantity: parseInt(cols[3]) || 0,
                minLevel: parseInt(cols[4]) || 0,
                price: parseFloat(cols[5]) || 0,
                totalValue: (parseInt(cols[3]) || 0) * (parseFloat(cols[5]) || 0),
                supplier: cols[7] || '',
                dateAdded: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            products.push(newProduct);
            addToHistory('added', newProduct.name, newProduct.quantity, 'Imported via CSV');
        }
        
        saveData();
        updateDashboard();
        renderProducts();
        updateCategoryFilter();
        checkAlerts();
        alert('Import completed successfully!');
    };
    reader.readAsText(file);
    input.value = '';
}

// Reports
function generateReport() {
    const totalProducts = products.length;
    const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = products.reduce((sum, p) => sum + p.totalValue, 0);
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minLevel);
    const outOfStock = products.filter(p => p.quantity === 0);
    
    const categoryBreakdown = {};
    products.forEach(p => {
        if (!categoryBreakdown[p.category]) {
            categoryBreakdown[p.category] = { count: 0, value: 0, quantity: 0 };
        }
        categoryBreakdown[p.category].count++;
        categoryBreakdown[p.category].value += p.totalValue;
        categoryBreakdown[p.category].quantity += p.quantity;
    });
    
    const reportHTML = `
        <div style="padding: 20px;">
            <h2 style="margin-bottom: 20px; color: var(--primary);">Inventory Report - ${new Date().toLocaleDateString()}</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: var(--bg); padding: 20px; border-radius: 8px;">
                    <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Total Products</div>
                    <div style="font-size: 24px; font-weight: 700; margin-top: 8px;">${totalProducts}</div>
                </div>
                <div style="background: var(--bg); padding: 20px; border-radius: 8px;">
                    <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Total Units</div>
                    <div style="font-size: 24px; font-weight: 700; margin-top: 8px;">${totalQty.toLocaleString()}</div>
                </div>
                <div style="background: var(--bg); padding: 20px; border-radius: 8px;">
                    <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Total Value</div>
                    <div style="font-size: 24px; font-weight: 700; margin-top: 8px;">$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
                <div style="background: var(--bg); padding: 20px; border-radius: 8px;">
                    <div style="font-size: 12px; color: var(--text-secondary); text-transform: uppercase;">Alerts</div>
                    <div style="font-size: 24px; font-weight: 700; margin-top: 8px; color: ${lowStock.length + outOfStock.length > 0 ? 'var(--danger)' : 'var(--success)'}">${lowStock.length + outOfStock.length}</div>
                </div>
            </div>
            
            <h3 style="margin-bottom: 16px;">Category Breakdown</h3>
            <table style="width: 100%; margin-bottom: 30px;">
                <thead>
                    <tr style="background: var(--bg);">
                        <th style="padding: 12px; text-align: left;">Category</th>
                        <th style="padding: 12px; text-align: center;">Products</th>
                        <th style="padding: 12px; text-align: center;">Quantity</th>
                        <th style="padding: 12px; text-align: right;">Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(categoryBreakdown).map(([cat, data]) => `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 12px;">${cat}</td>
                            <td style="padding: 12px; text-align: center;">${data.count}</td>
                            <td style="padding: 12px; text-align: center;">${data.quantity}</td>
                            <td style="padding: 12px; text-align: right;">$${data.value.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            ${lowStock.length > 0 ? `
                <h3 style="margin-bottom: 16px; color: var(--warning);">Low Stock Items (${lowStock.length})</h3>
                <table style="width: 100%; margin-bottom: 30px;">
                    <thead>
                        <tr style="background: var(--bg);">
                            <th style="padding: 12px; text-align: left;">Product</th>
                            <th style="padding: 12px; text-align: center;">Current</th>
                            <th style="padding: 12px; text-align: center;">Minimum</th>
                            <th style="padding: 12px; text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lowStock.map(p => `
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 12px;">${p.name}</td>
                                <td style="padding: 12px; text-align: center;">${p.quantity}</td>
                                <td style="padding: 12px; text-align: center;">${p.minLevel}</td>
                                <td style="padding: 12px; text-align: center;"><span style="color: var(--warning);">⚠️ Low</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : ''}
            
            ${outOfStock.length > 0 ? `
                <h3 style="margin-bottom: 16px; color: var(--danger);">Out of Stock Items (${outOfStock.length})</h3>
                <table style="width: 100%; margin-bottom: 30px;">
                    <thead>
                        <tr style="background: var(--bg);">
                            <th style="padding: 12px; text-align: left;">Product</th>
                            <th style="padding: 12px; text-align: center;">Current</th>
                            <th style="padding: 12px; text-align: center;">Minimum</th>
                            <th style="padding: 12px; text-align: center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${outOfStock.map(p => `
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 12px;">${p.name}</td>
                                <td style="padding: 12px; text-align: center;">${p.quantity}</td>
                                <td style="padding: 12px; text-align: center;">${p.minLevel}</td>
                                <td style="padding: 12px; text-align: center;"><span style="color: var(--danger);">❌ Out</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border); color: var(--text-secondary); font-size: 12px; text-align: center;">
                Generated by StockMaster Pro on ${new Date().toLocaleString()}
            </div>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = reportHTML;
}

// Data Persistence
function saveData() {
    localStorage.setItem('stockmaster_products', JSON.stringify(products));
}