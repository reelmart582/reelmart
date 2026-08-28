let cart = JSON.parse(localStorage.getItem("reelmartCart")) || [];

function saveCart() {
    localStorage.setItem(
        "reelmartCart",
        JSON.stringify(cart)
    );
}


function renderCart() {

    const container =
        document.getElementById("cart-items");

    if (!container) return;

    container.innerHTML = "";

    if (cart.length === 0) {

        container.innerHTML = `
            <div class="empty">

                <div class="empty-icon">
                    🛍️
                </div>

                <h2>Your cart is empty</h2>

                <p style="margin-top:8px;">
                    Discover something you love and add it to your cart.
                </p>

                <button
                    class="shop-btn"
                    onclick="goHome()"
                >
                    Start Shopping
                </button>

            </div>
        `;

        updateSummary();

        return;
    }


    cart.forEach((item, index) => {

        const image = item.image
            ? (
                item.image.startsWith("http")
                    ? item.image
                    : `http://localhost:3000/uploads/${item.image}`
              )
            : "https://via.placeholder.com/200x200?text=Product";


        container.innerHTML += `

            <div class="cart-item">

                <img
                    class="product-image"
                    src="${image}"
                    alt="${item.name}"
                >

                <div class="item-info">

                    <div class="item-name">
                        ${item.name}
                    </div>

                    <div class="item-category">
                        ${item.category || "Product"}
                    </div>

                    <div class="item-price">
                        ₦${Number(item.price).toLocaleString()}
                    </div>

                    <button
                        class="remove-btn"
                        onclick="removeItem(${index})"
                    >
                        Remove
                    </button>

                </div>


                <div class="quantity">

                    <button
                        onclick="changeQuantity(${index}, -1)"
                    >
                        −
                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button
                        onclick="changeQuantity(${index}, 1)"
                    >
                        +
                    </button>

                </div>

            </div>
        `;
    });


    updateSummary();
}


function changeQuantity(index, change) {

    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }

    saveCart();

    renderCart();
}


function removeItem(index) {

    const name = cart[index].name;

    cart.splice(index, 1);

    saveCart();

    renderCart();

    showToast(name + " removed from cart.");
}


function updateSummary() {

    let itemCount = 0;
    let subtotal = 0;

    cart.forEach(item => {

        itemCount += item.quantity;

        subtotal +=
            Number(item.price) *
            item.quantity;

    });


    // Temporary delivery calculation
    const delivery = subtotal > 0 ? 2500 : 0;

    const total = subtotal + delivery;


    document.getElementById("item-count")
        .textContent = itemCount;


    document.getElementById("subtotal")
        .textContent =
        "₦" + subtotal.toLocaleString();


    document.getElementById("delivery")
        .textContent =
        "₦" + delivery.toLocaleString();


    document.getElementById("total")
        .textContent =
        "₦" + total.toLocaleString();
}


function goHome() {

    window.location.href = "/";
}


function goToCheckout() {

    if (cart.length === 0) {

        showToast("Your cart is empty.");

        return;
    }

    window.location.href = "/checkout.html";
}


function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2200);
}


renderCart();