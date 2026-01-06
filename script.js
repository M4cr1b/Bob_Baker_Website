// script.js

// --- CONFIGURATION ---
// REPLACE THIS with your actual n8n Production Webhook URL
const N8N_ORDER_WEBHOOK = "https://n8n.srv1191414.hstgr.cloud/webhook-test/55790ae9-4c5f-4073-87c5-593b5d2364ed";
const N8N_ADMIN_DATA_WEBHOOK = "https://n8n.srv1191414.hstgr.cloud/webhook-test/94ee3ade-06c5-4973-b56d-a09876a722ef";
const N8N_UPDATE_STATUS_WEBHOOK = "https://n8n.srv1191414.hstgr.cloud/webhook-test/115435ed-2540-481c-8a7e-0fdc6af21ae1";
const N8N_CONTACT_WEBHOOK = "https://n8n.srv1191414.hstgr.cloud/webhook-test/7a84a607-f7e1-4f12-9fd0-e81e393032ef";

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

    // 1. UI Feedback
    orderTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Connecting to n8n...</td></tr>';
    if(refreshBtn) refreshBtn.disabled = true; 
    if(refreshIcon) refreshIcon.classList.add('fa-spin'); 

    try {
        const response = await fetch(N8N_ADMIN_DATA_WEBHOOK, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        let orders = await response.json();

        // Handle single object vs array
        if (!Array.isArray(orders)) {
            orders = [orders];
        }

        orderTableBody.innerHTML = '';

        if (orders.length === 0) {
            orderTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders found.</td></tr>';
        } else {
            orders.forEach(order => {
                // Get the Row Number (Essential for Google Sheets updates)
                // If your n8n Google Sheet node outputs "row_number", use that.
                const rowNum = order.row_number || order.id; 
                const customerName = order.Name || order['Customer Name'] || order.customer || 'Guest';
                const orderItems = order['Product Name'] || order.items || 'Unknown Items';
                const currentStatus = order.Status || 'Pending';

                // Create the Dropdown HTML
                const statusOptions = ['Pending', 'Ready','Cancelled'];
                let optionsHtml = '';
                
                statusOptions.forEach(opt => {
                    const isSelected = (opt === currentStatus) ? 'selected' : '';
                    optionsHtml += `<option value="${opt}" ${isSelected}>${opt}</option>`;
                });

                const row = `
                    <tr>
                        <td class="order-id">#${rowNum}</td>
                        <td>${customerName}</td>
                        <td>${orderItems}</td>
                        <td>
                            <select 
                                onchange="updateOrderStatus('${rowNum}', this.value)" 
                                style="padding: 5px; border-radius: 5px; border: 1px solid #ccc; cursor: pointer;"
                            >
                                ${optionsHtml}
                            </select>
                        </td>
                        <td>
                            <i class="fa-regular fa-eye action-icon" title="View Details"></i>
                        </td>
                    </tr>`;
                orderTableBody.innerHTML += row;
            });
        }

    } catch (error) {
        console.error("n8n Load Error:", error);
        orderTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error: ${error.message}</td></tr>`;
    } finally {
        if(refreshBtn) refreshBtn.disabled = false;
        if(refreshIcon) refreshIcon.classList.remove('fa-spin');
    }
}

// --- NEW FUNCTION: Update Status ---
async function updateOrderStatus(rowNumber, newStatus) {
    // 1. Notify Admin process started
    const originalTitle = document.title;
    document.title = "Updating..."; 
    
    // alert(`Updating Order #${rowNumber} to ${newStatus}...`);
    try {
        const response = await fetch(N8N_UPDATE_STATUS_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                row_number: rowNumber,
                status: newStatus
            })
        });

        if (response.ok) {
            console.log("Status updated successfully");
            // loadAdminData(); 
        } else {
            alert("Failed to update status on server.");
        }
    } catch (error) {
        console.error("Update Error:", error);
        alert("Could not connect to update server.");
    } finally {
        document.title = originalTitle;
    }
}

// --- CONTACT FORM LOGIC ---
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;

    // UI Feedback
    btn.innerText = "Sending...";
    btn.disabled = true;

    try {
        const response = await fetch(N8N_CONTACT_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                email: email,
                message: message,
                date: new Date().toISOString()
            })
        });

        if (response.ok) {
            alert("Message sent! We will get back to you shortly.");
            document.getElementById('contact-form').reset();
        } else {
            alert("Something went wrong. Please try again later.");
        }
    } catch (error) {
        console.error("Contact Error:", error);
        alert("Could not connect to the server.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
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

    // CHECK FOR CONTACT FORM
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
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