// script.js

// --- CONFIGURATION ---
// REPLACE THIS with your actual n8n Production Webhook URL
const N8N_ORDER_WEBHOOK = "https://n8n.srv1191414.hstgr.cloud/webhook-test/55790ae9-4c5f-4073-87c5-593b5d2364ed";
const N8N_ADMIN_DATA_WEBHOOK = "https://n8n.srv1191414.hstgr.cloud/webhook-test/94ee3ade-06c5-4973-b56d-a09876a722ef";

// --- SECURITY & AUTHENTICATION ---

// 1. Credentials (HARDCODED FOR DEMO)
const ADMIN_USER = "BobBakerWins";
const ADMIN_PASS = "Abundance123"; // Change this password!

// 2. Check Protection on Admin Page
// If we are on admin.html AND not logged in, kick user out.
if (window.location.pathname.includes("admin.html")) {
    if (sessionStorage.getItem("isLoggedIn") !== "true") {
        window.location.href = "login.html";
    }
}

// 3. Login Function (Updated with Animation)
function handleLogin(e) {
    e.preventDefault();
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');
    const loader = document.getElementById('loader'); // Get the loader

    if (userIn === ADMIN_USER && passIn === ADMIN_PASS) {
        // A. Hide Error if it was showing
        errorMsg.style.display = "none";
        
        // B. Show the Loading Animation
        if(loader) loader.style.display = "flex";

        // C. Set session flag
        sessionStorage.setItem("isLoggedIn", "true");

        // D. Wait 2 seconds, then redirect
        setTimeout(() => {
            window.location.href = "admin.html";
        }, 2000);

    } else {
        // Fail
        errorMsg.style.display = "block";
        // Shake animation for visual feedback (optional)
        const loginBox = document.querySelector('.login-box');
        loginBox.style.transform = "translateX(5px)";
        setTimeout(() => loginBox.style.transform = "translateX(0)", 100);
    }
}

// 4. Logout Function
function logout() {
    sessionStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

// 1. DATA (Static Products for now, but could also be fetched from n8n)
const products = [
    { id: 1, name: "Banana Bread", price: 20.00, image: "https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=2070&auto=format&fit=crop" },
    { id: 2, name: "Coconut Bread", price: 20.00, image: "https://images.unsplash.com/photo-1585476263060-855885342ebf?q=80&w=2070&auto=format&fit=crop" },
    { id: 3, name: "Pawpaw Bread", price: 20.00, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop" },
    { id: 4, name: "Banapaw bread", price: 20.00, image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=2070&auto=format&fit=crop" }
];

// 2. CART LOGIC
let cart = JSON.parse(localStorage.getItem('bakeryCart')) || [];

function saveCart() {
    localStorage.setItem('bakeryCart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) { existingItem.quantity += 1; } 
    else { cart.push({ ...product, quantity: 1 }); }
    saveCart();
    alert(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    if(cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.querySelector('#cart-total');
    
    if (cartItemsContainer && cartTotalElement) {
        cartItemsContainer.innerHTML = '';
        let totalPrice = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; color:#888;">Your cart is empty.</p>';
        } else {
            cart.forEach(item => {
                totalPrice += item.price * item.quantity;
                cartItemsContainer.innerHTML += `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <p>GH₵ ${item.price.toFixed(2)} x ${item.quantity}</p>
                        </div>
                        <i class="fa-solid fa-trash remove-btn" onclick="removeFromCart(${item.id})"></i>
                    </div>`;
            });
        }
        cartTotalElement.textContent = `GH₵ ${totalPrice.toFixed(2)}`;
    }
}

// 3. SEND ORDER TO n8n (Updated with Customer Data)
async function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    // --- NEW: Grab Input Values ---
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const paymentInput = document.getElementById('payment-method');

    const customerName = nameInput ? nameInput.value.trim() : "";
    const customerPhone = phoneInput ? phoneInput.value.trim() : "";
    const paymentMethod = paymentInput ? paymentInput.value : "";

    // --- NEW: Validation Check ---
    if (!customerName || !customerPhone || !paymentMethod) {
        alert("Please fill in your Name, Phone, and Payment Method to checkout.");
        return; // Stop the function here
    }

    const checkoutBtn = document.querySelector('.checkout-btn');
    const originalText = checkoutBtn.innerText;
    
    // 1. Show Processing State
    checkoutBtn.innerText = "Processing...";
    checkoutBtn.disabled = true;

    // Prepare Data (Now includes customer details)
    const orderData = {
        customer_id: customerName, // Using Name as ID for simplicity
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_type: paymentMethod,
        items: cart,
        total_price: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString()
    };

    try {
        // 2. Send to n8n
        const response = await fetch(N8N_ORDER_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            // --- SUCCESS ---
            
            // Clear inputs
            if(nameInput) nameInput.value = "";
            if(phoneInput) phoneInput.value = "";
            if(paymentInput) paymentInput.value = "";

            cart = []; 
            saveCart();
            
            document.getElementById('cart-overlay').classList.remove('open');
            
            const successOverlay = document.getElementById('success-overlay');
            if(successOverlay) {
                successOverlay.classList.add('active');
            } else {
                alert("Order completed! You will be called shortly.");
            }

        } else {
            alert("Error connecting to server. Please try again.");
        }
    } catch (error) {
        console.error("n8n Connection Error:", error);
        alert("Could not connect to the Bakery System. Check console for details.");
    } finally {
        // Reset Button
        checkoutBtn.innerText = originalText;
        checkoutBtn.disabled = false;
    }
}

// --- 4. ADMIN DASHBOARD LOGIC ---

async function loadAdminData() {
    const orderTableBody = document.getElementById('order-rows');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = refreshBtn ? refreshBtn.querySelector('i') : null;

    if (!orderTableBody) return; 

    // 1. UI Feedback: Show loading state
    orderTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Connecting to n8n...</td></tr>';
    if(refreshBtn) refreshBtn.disabled = true; 
    if(refreshIcon) refreshIcon.classList.add('fa-spin'); // Make icon spin

    try {
        console.log("Fetching from:", N8N_ADMIN_DATA_WEBHOOK);
        
        // 2. Fetch Data
        // Your n8n "Respond to Webhook" node MUST return a JSON array like:
        // [
        //   { "id": "101", "customer": "John", "items": "Bread", "status": "Pending" },
        //   { "id": "102", "customer": "Jane", "items": "Cake", "status": "Baked" }
        // ]
        const response = await fetch(N8N_ADMIN_DATA_WEBHOOK, {
            method: 'POST', // Or 'POST' depending on your n8n trigger
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const orders = await response.json();
        console.log("Data received:", orders);

        // 3. Clear Table
        orderTableBody.innerHTML = '';

        // 4. Populate Table
        if (orders.length === 0) {
            orderTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders found in n8n.</td></tr>';
        } else {
            orders.forEach(order => {
                let statusClass = '';
                // Normalize status text to lowercase to match correctly
                const status = order.status ? order.status.toLowerCase() : 'pending';

                if(status.includes('deliver')) statusClass = 'status-delivered';
                else if(status.includes('bake')) statusClass = 'status-baked';
                else statusClass = 'status-pending';

                const row = `
                    <tr>
                        <td class="order-id">#${order.id || 'N/A'}</td>
                        <td>${order.customer || 'Guest'}</td>
                        <td>${order.items || 'Unknown Items'}</td>
                        <td><span class="status-badge ${statusClass}">${order.status || 'Pending'}</span></td>
                        <td>
                            <i class="fa-regular fa-eye action-icon"></i>
                            <i class="fa-regular fa-pen-to-square action-icon"></i>
                        </td>
                    </tr>`;
                orderTableBody.innerHTML += row;
            });
        }

    } catch (error) {
        console.error("n8n Load Error:", error);
        orderTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error loading data: ${error.message}</td></tr>`;
    } finally {
        // 5. Restore Button
        if(refreshBtn) refreshBtn.disabled = false;
        if(refreshIcon) refreshIcon.classList.remove('fa-spin');
    }
}

// --- 5. INITIALIZATION & EVENTS ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. GLOBAL CHECKS (Run these on every page)
    
    // CHECK FOR LOGIN FORM
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // CHECK FOR LOGOUT BUTTON (Moved here so it works on Admin Page too)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // 2. Page Specific Logic
    const refreshBtn = document.getElementById('refresh-btn');
    
    if (refreshBtn) {
        // --- WE ARE ON ADMIN PAGE ---
        refreshBtn.addEventListener('click', loadAdminData);
        // Optional: Auto-load on startup
        loadAdminData();

    } else {
        // --- WE ARE ON CUSTOMER PAGE ---
        updateCartUI(); 
        const productContainer = document.getElementById('product-list');
        
        if (productContainer) {
            products.forEach(product => {
                const card = document.createElement('div');
                card.classList.add('product-card');
                card.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <div class="p-details">
                        <h3>${product.name}</h3>
                        <p class="price">GH₵ ${product.price.toFixed(2)}</p>
                        <button class="add-btn" onclick="addToCart(${product.id})">
                            <i class="fa-solid fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>`;
                productContainer.appendChild(card);
            });
        }
        
        // Cart Listeners
        const realCheckoutBtn = document.querySelector('.cart-footer .checkout-btn');
        if(realCheckoutBtn) realCheckoutBtn.addEventListener('click', checkout);
        
        const cartIcon = document.querySelector('.cart-icon');
        const cartOverlay = document.getElementById('cart-overlay');
        const closeCartBtn = document.getElementById('close-cart');

        if (cartIcon && cartOverlay && closeCartBtn) {
            cartIcon.addEventListener('click', () => cartOverlay.classList.add('open'));
            closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('open'));
            cartOverlay.addEventListener('click', (e) => {
                if (e.target === cartOverlay) cartOverlay.classList.remove('open');
            });
        }
    }
});

// Add this helper function at the top or bottom of script.js
function closeSuccessModal() {
    document.getElementById('success-overlay').classList.remove('active');
}