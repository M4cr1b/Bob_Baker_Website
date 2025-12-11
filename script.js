// script.js

// 1. DATA SIMULATION (Products)
const products = [
    {
        id: 1,
        name: "Butter Bread",
        price: 20.00,
        image: "https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=2070&auto=format&fit=crop"
    },
    {
        id: 2,
        name: "Sourdough Loaf",
        price: 25.00,
        image: "https://images.unsplash.com/photo-1585476263060-855885342ebf?q=80&w=2070&auto=format&fit=crop"
    },
    {
        id: 3,
        name: "Whole Wheat Bread",
        price: 22.00,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop"
    },
    {
        id: 4,
        name: "French Baguette",
        price: 15.00,
        image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=2070&auto=format&fit=crop"
    }
];

// 2. CART STATE MANAGEMENT
// Try to load cart from LocalStorage, otherwise start empty
let cart = JSON.parse(localStorage.getItem('bakeryCart')) || [];

// 3. CORE FUNCTIONS

// Function to save cart to browser storage
function saveCart() {
    localStorage.setItem('bakeryCart', JSON.stringify(cart));
    updateCartUI();
}

// Function to add item to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart(); // Save and update UI
    
    // Optional: Visual feedback
    alert(`${product.name} added to cart!`);
}

// Function to remove item
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

// Function to Update UI (Badge count & Cart List)
function updateCartUI() {
    // 1. Update Badge Count
    const cartCountElement = document.querySelector('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if(cartCountElement) cartCountElement.textContent = totalItems;

    // 2. Update Cart Modal List
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
                const itemEl = document.createElement('div');
                itemEl.classList.add('cart-item');
                itemEl.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>GH₵ ${item.price.toFixed(2)} x ${item.quantity}</p>
                    </div>
                    <i class="fa-solid fa-trash remove-btn" onclick="removeFromCart(${item.id})"></i>
                `;
                cartItemsContainer.appendChild(itemEl);
            });
        }
        cartTotalElement.textContent = `GH₵ ${totalPrice.toFixed(2)}`;
    }
}


// 4. RENDER PRODUCTS (Menu Page)
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
            </div>
        `;
        productContainer.appendChild(card);
    });
}


// 5. EVENT LISTENERS & NAVIGATION
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI(); // Load cart on page start

    // Toggle Cart Modal
    const cartIcon = document.querySelector('.cart-icon');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');

    if (cartIcon && cartOverlay && closeCartBtn) {
        cartIcon.addEventListener('click', () => {
            cartOverlay.classList.add('open');
        });

        closeCartBtn.addEventListener('click', () => {
            cartOverlay.classList.remove('open');
        });

        // Close if clicking outside the white box
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) {
                cartOverlay.classList.remove('open');
            }
        });
    }

    // Navigation Highlight Logic (From previous step)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active-link');
            link.style.color = '#D97706'; 
            link.style.fontWeight = '600';
        }
    });
});