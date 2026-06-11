// ================== গুগল অ্যাপস স্ক্রিপ্ট URL ==================
const googleScriptUrl = "https://script.google.com/macros/s/AKfycbzh8GtVxETVeW7_DBwbxj4AE6TGVuM3qhu6nSxpVBkcWtv1EdjUYWXXekpRIw4C7HWQjg/exec"; 
// উদাহরণ: https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxx/exec

let cart = [];
let deliveryCharge = 0;

// ================== লাইভ প্রোডাক্ট সার্চ ফাংশন ==================
// এই অংশটি নতুন যুক্ত করা হয়েছে যা সার্চ বক্সের সাথে কাজ করবে
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim(); // ইউজার যা সার্চ করছেন
    const productGrid = document.getElementById('productGrid');
    const productCards = productGrid.getElementsByClassName('product-card');
    const noProductMsg = document.getElementById('no-product-msg');
    
    let foundProduct = false;

    // প্রতিটি প্রোডাক্ট কার্ড লুপ করে চেক করা হচ্ছে
    for (let i = 0; i < productCards.length; i++) {
        // কার্ডের ভেতরের h3 ট্যাগ থেকে প্রোডাক্টের নাম নেওয়া হচ্ছে
        const productName = productCards[i].getElementsByTagName('h3')[0].textContent.toLowerCase();

        // নামের সাথে সার্চ টার্ম মিললে কার্ড দেখাবে, না মিললে হাইড করবে
        if (productName.includes(searchTerm)) {
            productCards[i].style.display = "";
            foundProduct = true;
        } else {
            productCards[i].style.display = "none";
        }
    }

    // কোনো প্রোডাক্ট না পাওয়া গেলে মেসেজ দেখাবে
    if (foundProduct) {
        noProductMsg.style.display = "none";
    } else {
        noProductMsg.style.display = "block";
    }
});


// ================== PRODUCT MODAL ==================
let currentProduct = null;

function showProductModal(name, price, imgSrc) {
    currentProduct = { name: name, price: price, imgSrc: imgSrc };
    
    document.getElementById('modal-product-image').src = imgSrc;
    document.getElementById('modal-product-name').textContent = name;
    document.getElementById('modal-product-price').textContent = `৳ ${price}`;
    
    document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

function addCurrentProductToCart() {
    if (currentProduct) {
        addToCart(currentProduct.name, currentProduct.price);
        closeProductModal();
    }
}

// ================== কার্ট ফাংশন ==================
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
}

function addToCart(pName, pPrice) {
    const existingItem = cart.find(item => item.name === pName);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name: pName, price: pPrice, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const subTotalContainer = document.getElementById('sub-total');
    
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-msg">আপনার কার্টটি খালি আছে।</p>';
        subTotalContainer.innerText = '0';
        document.getElementById('delivery-charge').innerText = '0';
        document.getElementById('cart-total').innerText = '0';
        resetCheckoutForm();
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    let subTotal = 0;
    
    cart.forEach((item, index) => {
        subTotal += item.price * item.quantity;
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <div>
                <h4>${item.name}</h4>
                <small>${item.price}৳ × ${item.quantity}</small>
            </div>
            <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><i class="fas fa-trash"></i></button>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
    
    subTotalContainer.innerText = subTotal;
    calculateTotal(subTotal);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateDeliveryCharge() {
    const area = document.getElementById('cust-area').value;
    if (area === "inside") {
        deliveryCharge = 70;
    } else if (area === "outside") {
        deliveryCharge = 120;
    } else {
        deliveryCharge = 0;
    }
    document.getElementById('delivery-charge').innerText = deliveryCharge;
    
    const subTotal = parseInt(document.getElementById('sub-total').innerText) || 0;
    calculateTotal(subTotal);
}

function calculateTotal(subTotal) {
    const finalTotal = subTotal + deliveryCharge;
    document.getElementById('cart-total').innerText = finalTotal;
}

function togglePaymentFields() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const mfsDetails = document.getElementById('mfs-details');
    if (paymentMethod === "Bkash/Nagad") {
        mfsDetails.style.display = 'block';
    } else {
        mfsDetails.style.display = 'none';
        document.getElementById('trx-id').value = '';
    }
}

function showCheckoutForm() {
    if (cart.length === 0) { 
        alert('আপনার কার্টটি খালি!'); 
        return; 
    }
    document.getElementById('checkout-form-section').style.display = 'block';
    document.getElementById('main-checkout-btn').style.display = 'none';
    document.getElementById('confirm-order-btn').style.display = 'block';
}

function resetCheckoutForm() {
    document.getElementById('checkout-form-section').style.display = 'none';
    document.getElementById('main-checkout-btn').style.display = 'block';
    document.getElementById('confirm-order-btn').style.display = 'none';
}

function generateOrderId() {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `#PB-${randomNumber}`;
}

function checkout() {
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const areaSelect = document.getElementById('cust-area');
    const areaText = areaSelect.options[areaSelect.selectedIndex].text;
    const address = document.getElementById('cust-address').value.trim();
    const note = document.getElementById('cust-note').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const trxId = document.getElementById('trx-id').value.trim();
    const totalBill = document.getElementById('cart-total').innerText;

    if (!name || !phone || !areaSelect.value || !address) {
        alert('অনুগ্রহ করে নাম, ফোন, এলাকা এবং ঠিকানা সঠিকভাবে পূরণ করুন।');
        return;
    }

    if (paymentMethod === "Bkash/Nagad" && !trxId) {
        alert('বিকাশ/নগদ সিলেক্ট করলে অবশ্যই TrxID দিতে হবে।');
        return;
    }

    const orderId = generateOrderId();
    let productDetails = cart.map(item => `${item.name} (${item.quantity}টি)`).join(', ');

    const confirmBtn = document.getElementById('confirm-order-btn');
    confirmBtn.innerText = "অর্ডার হচ্ছে...";
    confirmBtn.disabled = true;

    const orderData = {
        orderId: orderId,
        name: name,
        phone: phone,
        area: areaText,
        address: address,
        products: productDetails,
        totalBill: totalBill,
        paymentMethod: paymentMethod,
        trxId: trxId ? trxId : "N/A",
        note: note || "কোনো নোট নেই"
    };

    if (googleScriptUrl && googleScriptUrl.includes("script.google.com")) {
        fetch(googleScriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        })
        .then(() => {
            alertSuccess(orderId);
        })
        .catch(error => {
            console.error("Fetch Error:", error);
            alertSuccess(orderId);
        });
    } else {
        alertSuccess(orderId);
    }
}

function alertSuccess(orderId) {
    alert(`ধন্যবাদ! আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।\n\nআপনার অর্ডার আইডি: ${orderId}\nদয়া করে আইডিটি নোট করে রাখুন।`);
    cart = [];
    updateCartUI();
    toggleCart();
    resetCheckoutForm();
}