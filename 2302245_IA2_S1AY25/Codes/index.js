let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// add to cart
function addToCart(name, price) {
    let existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ name: name, price: price, quantity: 1 });
    }

    saveCart();
    updateCartCount();

    alert(name + " added to cart!");
    updateCartDisplay?.();
}

// update cart count
function updateCartCount() {
    let count = cart.reduce((total, item) => total + item.quantity, 0);

    let badge = document.getElementById("cart-count");
    if (badge) badge.innerText = `(${count})`;
}

// total calc
function calculateTotals() {
    let subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // 10% discount if subtotal is $2000 JMD or more
    let discount = subtotal >= 2000 ? subtotal * 0.10 : 0;
    let tax = (subtotal - discount) * 0.08; 
    let total = subtotal - discount + tax;

    return {
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        items: cart 
    };
}


function formatCurrency(amount) {
    return `$${amount.toFixed(2)} JMD`;
}

// cart page disp.
function updateCartDisplay() {
    let cartContainer = document.getElementById("cart");
    if (!cartContainer) return;

    if (cartContainer.tagName === 'TBODY') {
        cartContainer.innerHTML = "";
    } else {
        cartContainer.innerHTML = "";
    }

    if (cart.length === 0) {

        let emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="5" style="text-align: center; padding: 20px;">Your order is empty. <a href='menu.html'>Go to Menu</a></td>`;
        cartContainer.appendChild(emptyRow);

        const summary = document.getElementById('cart-summary');
        if (summary) summary.style.display = 'none';
        
        updateCartTotals(); 
        return;
    }
    

    const summary = document.getElementById('cart-summary');
    if (summary) summary.style.display = 'block';

    cart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>
                <input type="number" min="1" value="${item.quantity}" 
                       onchange="changeQty(${index}, this.value)" class="qty-input" style="width: 60px;">
            </td>
            <td>${formatCurrency(item.price * item.quantity)}</td>
            <td>
                <button onclick="removeItem(${index})" class="btn btn-danger btn-small">Remove</button>
            </td>
        `;
        cartContainer.appendChild(row);
    });

    updateCartTotals();
}

function changeQty(index, qty) {
    let newQty = Number(qty);
    if (isNaN(newQty) || newQty < 1) newQty = 1;


    cart[index].quantity = newQty;
    saveCart();
    updateCartDisplay();
    updateCartCount();
}

function removeItem(index) {
    cart.splice(index, 1); 
    saveCart();
    updateCartDisplay();
    updateCartCount();
}

//cart totals
function updateCartTotals() {
    let t = calculateTotals();

    if (document.getElementById("subtotal")) document.getElementById("subtotal").innerText = formatCurrency(t.subtotal);
    if (document.getElementById("discount")) document.getElementById("discount").innerText = formatCurrency(t.discount);
    if (document.getElementById("tax")) document.getElementById("tax").innerText = formatCurrency(t.tax);
    if (document.getElementById("total")) document.getElementById("total").innerText = formatCurrency(t.total);
}


function clearCart() {
    cart = [];
    saveCart();
    updateCartDisplay();
    updateCartCount();
    localStorage.removeItem("finalOrder"); // Also remove any temporary order details
}

// checkout page disp.
function loadCheckoutPageData() {
    let t = calculateTotals();
    let orderItemsDiv = document.getElementById("order-items");
    let checkoutTotalSpan = document.getElementById("checkout-total");
    
    if (!orderItemsDiv || !checkoutTotalSpan) return;

    checkoutTotalSpan.innerText = formatCurrency(t.total);


    orderItemsDiv.innerHTML = "";
    if (t.items.length === 0) {
        orderItemsDiv.innerHTML = "<p>Your order is empty. <a href='menu.html'>Add items!</a></p>";
        

        const checkoutForm = document.getElementById("checkout-form");
        if (checkoutForm) {
            checkoutForm.onsubmit = (e) => { e.preventDefault(); alert("Your cart is empty. Please add items before placing an order."); };
        }
        return;
    }
    
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.onsubmit = processOrder;
    }
    
    t.items.forEach(item => {
        orderItemsDiv.innerHTML += `
            <div class="summary-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
            </div>
        `;
    });
}

function processOrder(event) {
    event.preventDefault(); 
    if (cart.length === 0) {
        alert("Your order is empty. Please add items to your cart before checking out.");
        return;
    }

    const customer = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
    };

    const orderType = document.getElementById("orderType").value;
    const tableNumberInput = document.getElementById("tableNumber");
    const tableNumber = tableNumberInput.value.trim();
    const specialRequests = document.getElementById("specialRequests").value.trim();
    

    if (orderType === "dinein" && !tableNumber) {
        alert("Please enter a Table Number for Dine In orders.");
        tableNumberInput.focus();
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    if (!paymentMethod) {
        alert("Please select a Payment Method.");
        return;
    }
    
    const orderInfo = {
        orderType: orderType,
        tableNumber: orderType === 'dinein' ? tableNumber : null,
        specialRequests: specialRequests,
        paymentMethod: paymentMethod,
        orderDate: new Date().toISOString()
    };

    const totals = calculateTotals();
    
    const finalOrder = {
        customer: customer,
        orderInfo: orderInfo,
        items: totals.items, 
        totals: totals 
    };

    localStorage.setItem("finalOrder", JSON.stringify(finalOrder));

    window.location.href = "invoice.html";
}

function togglePickupFields() {
    const orderType = document.getElementById("orderType")?.value;
    const dineInFields = document.getElementById("pickup-fields");
    const tableNumberInput = document.getElementById("tableNumber");

    if (!dineInFields || !tableNumberInput) return;

    if (orderType === "dinein") {
        dineInFields.style.display = "block";
        tableNumberInput.setAttribute("required", "required"); 
    } else {
        dineInFields.style.display = "none";
        tableNumberInput.removeAttribute("required"); 

    }
}


function selectPayment(method) {
    const radio = document.getElementById(`payment-${method}`);
    if (radio) radio.checked = true;
    

    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`#payment-${method}`)?.closest('.payment-option');
    if (selectedOption) selectedOption.classList.add('selected');
}


function loadInvoice() {

    let finalOrder = JSON.parse(localStorage.getItem("finalOrder"));
    let invoiceContent = document.getElementById("invoice-content");

    if (!finalOrder || !invoiceContent) {
        if(invoiceContent) {
            invoiceContent.innerHTML = `<div style="text-align: center; padding: 50px;">
                <h2>Order Not Found</h2>
                <p>There was an issue loading your receipt. Please ensure you completed the checkout process.</p>
                <button onclick="window.location.href='index.html'" class="btn btn-primary">Back to Home</button>
            </div>`;
        }
        return;
    }

    let t = finalOrder.totals;
    let customer = finalOrder.customer;
    let orderInfo = finalOrder.orderInfo;

    invoiceContent.innerHTML = `
        <div class="invoice-container">
            <div class="invoice-header">
                <h2>🧾 Order Receipt</h2>
                <h1>Very Vegan Cafe</h1>
                <p>Date: <span id="inv-date">${new Date(finalOrder.orderInfo.orderDate).toLocaleDateString()} ${new Date(finalOrder.orderInfo.orderDate).toLocaleTimeString()}</span></p>
            </div>
            
            <div class="invoice-section">
                <h3>Customer Details</h3>
                <p><strong>Name:</strong> ${customer.firstName} ${customer.lastName}</p>
                <p><strong>Email:</strong> ${customer.email}</p>
                <p><strong>Phone:</strong> ${customer.phone}</p>
            </div>

            <div class="invoice-section">
                <h3>Order Information</h3>
                <p><strong>Order Type:</strong> ${orderInfo.orderType === 'pickup' ? 'Takeout (Pickup)' : 'Dine In'}</p>
                ${orderInfo.orderType === 'dinein' && orderInfo.tableNumber ? `<p><strong>Table No.:</strong> ${orderInfo.tableNumber}</p>` : ''}
                ${orderInfo.specialRequests ? `<p><strong>Requests:</strong> ${orderInfo.specialRequests}</p>` : ''}
                <p><strong>Payment:</strong> ${orderInfo.paymentMethod === 'cash' ? 'Cash on Delivery/Pickup' : 'Credit/Debit Card'}</p>
            </div>

            <div class="invoice-section">
                <h3>Order Items</h3>
                <table class="invoice-items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody id="invoice-body">
                        ${finalOrder.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>${formatCurrency(item.price)}</td>
                                <td>${formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="invoice-totals">
                <div class="total-row"><span>Subtotal:</span><span id="inv-subtotal">${formatCurrency(t.subtotal)}</span></div>
                <div class="total-row discount"><span>Discount (10% over $20 JMD):</span><span id="inv-discount">-${formatCurrency(t.discount)}</span></div>
                <div class="total-row"><span>Tax (8%):</span><span id="inv-tax">${formatCurrency(t.tax)}</span></div>
                <div class="total-row grand-total"><span>Grand Total:</span><span id="inv-total">${formatCurrency(t.total)}</span></div>
            </div>
            
            <p class="thank-you">Thank you for ordering from Very Vegan Cafe!</p>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" class="btn btn-secondary">Print Receipt</button>
                <button onclick="window.location.href='index.html'" class="btn btn-primary">Back to Home</button>
            </div>
        </div>
    `;
    

    clearCart();
    localStorage.removeItem("finalOrder"); 
}


document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();

    if (document.getElementById("cart")) updateCartDisplay(); 
    if (document.getElementById("subtotal")) updateCartTotals();
    if (document.getElementById("order-items")) {
        loadCheckoutPageData();

        togglePickupFields();
    }
    if (document.getElementById("invoice-content")) loadInvoice();

    if (document.getElementById("myButton")) {
        document.getElementById("myButton").onclick = function () {
            window.location.href = "menu.html";
        };
    }
});