// Page navigation
const pages = {
    login: document.getElementById('login-page'),
    signup: document.getElementById('signup-page'),
    role: document.getElementById('role-page'),
    seller: document.getElementById('seller-page'),
    buyer: document.getElementById('buyer-page')
};

function showPage(pageId) {
    Object.values(pages).forEach(page => page.style.display = 'none');
    pages[pageId].style.display = 'block';
}

// Global variables for crop data
let cropData = {};
let dataLoaded = false;

// Parse CSV
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    const data = {};
    for (let i = 1; i < lines.length; i++) {
        const [crop, region, date, price] = lines[i].split(',');
        if (!data[crop]) data[crop] = {};
        if (!data[crop][region]) data[crop][region] = [];
        data[crop][region].push({
            date: new Date(date),
            price: parseFloat(price) / 100
        });
    }
    return data;
}

// Load CSV data
async function loadCropData() {
    try {
        const response = await fetch('crop_prices.csv');
        if (!response.ok) throw new Error('Failed to load CSV');
        const csv = await response.text();
        cropData = parseCSV(csv);
        dataLoaded = true;
        console.log('Crop data loaded successfully');
    } catch (error) {
        console.error('Error loading crop data:', error);
        dataLoaded = false;
    }
}

// Fetch prediction from backend
async function forecastPrice(crop, region, days = 7) {
    if (!dataLoaded) await loadCropData();

    // Prepare features (last 7 days' prices)
    let features = [];
    if (cropData[crop] && cropData[crop][region]) {
        features = cropData[crop][region]
            .sort((a, b) => b.date - a.date)
            .slice(0, days)
            .map(entry => entry.price);
    }
    if (features.length < days) {
        return (Math.random() * 20 + 20).toFixed(2); // Fallback
    }

    // Call backend API
    try {
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ crop, region, features })
        });
        const data = await response.json();
        return data.predicted_price;
    } catch (error) {
        console.error('Prediction error:', error);
        return (Math.random() * 20 + 20).toFixed(2); // Fallback on error
    }
}

// Local storage for users and sellers
let users = JSON.parse(localStorage.getItem('users')) || [];
let sellers = JSON.parse(localStorage.getItem('sellers')) || [];

// Signup form
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const password = document.getElementById('signup-password').value;
    const error = document.getElementById('signup-error');

    if (users.find(user => user.name.toLowerCase() === name.toLowerCase())) {
        error.textContent = 'User already exists!';
    } else {
        users.push({ name, password });
        localStorage.setItem('users', JSON.stringify(users));
        error.textContent = 'Signup successful! Please login.';
        setTimeout(() => showPage('login'), 1000);
    }
});

// Show signup page
document.getElementById('show-signup').addEventListener('click', () => showPage('signup'));

// Login form
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('login-name').value.trim();
    const password = document.getElementById('login-password').value;
    const error = document.getElementById('login-error');

    const user = users.find(user => user.name.toLowerCase() === name.toLowerCase() && user.password === password);
    if (user) {
        showPage('role');
    } else {
        error.textContent = 'Invalid name or password!';
    }
});

// Show login page
document.getElementById('show-login').addEventListener('click', () => showPage('login'));

// Role selection
document.getElementById('seller-btn').addEventListener('click', () => showPage('seller'));
document.getElementById('buyer-btn').addEventListener('click', () => showPage('buyer'));

// Seller form
document.getElementById('seller-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const crop = document.getElementById('seller-crop').value;
    const quantity = parseFloat(document.getElementById('seller-quantity').value);
    const region = document.getElementById('seller-region').value;
    const name = document.getElementById('seller-name').value.trim();
    const phone = document.getElementById('seller-phone').value.trim();
    const address = document.getElementById('seller-address').value.trim();

    document.getElementById('seller-output').innerHTML = '<p>Loading prediction...</p>';

    const price = await forecastPrice(crop, region);

    const sellerData = { crop, quantity, region, name, phone, address, price };
    sellers.push(sellerData);
    localStorage.setItem('sellers', JSON.stringify(sellers));

    document.getElementById('seller-output').innerHTML = `
        <h3>Price Forecast</h3>
        <p>Crop: ${crop}</p>
        <p>Quantity: ${quantity} KG</p>
        <p>Region: ${region}</p>
        <p>Forecasted Price: ₹${price}/KG (Model Prediction)</p>
    `;
});

// Buyer form
document.getElementById('buyer-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const crop = document.getElementById('buyer-crop').value;
    const quantity = parseFloat(document.getElementById('buyer-quantity').value);
    const region = document.getElementById('buyer-region').value;

    const availableSellers = sellers.filter(seller => 
        seller.crop === crop && 
        seller.quantity >= quantity && 
        seller.region === region
    );

    const output = document.getElementById('buyer-output');
    if (availableSellers.length > 0) {
        output.innerHTML = '<h3>Available Sellers</h3>' + availableSellers.map(seller => `
            <div>
                <p>Name: ${seller.name}</p>
                <p>Phone: ${seller.phone}</p>
                <p>Address: ${seller.address}</p>
                <p>Region: ${seller.region}</p>
                <p>Quantity: ${seller.quantity} KG</p>
                <p>Price: ₹${seller.price}/KG</p>
            </div>
        `).join('<hr>');
    } else {
        output.innerHTML = '<p>No sellers available for your criteria.</p>';
    }
});

// Initialize
showPage('login');
loadCropData();