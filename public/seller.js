const API = "/api/products";
const MEDIA_BASE = "/uploads/";

const form = document.getElementById("productForm");
const productsContainer = document.getElementById("productsContainer");
const attributeRows = document.getElementById("attributeRows");
const variantRows = document.getElementById("variantRows");
const category = document.getElementById("category");

// Require an authenticated ReelMart account before opening the seller area.
// Keep the original destination so auth.html can return the user here.
const currentUser = JSON.parse(localStorage.getItem("reelmartUser") || "null");
const currentToken = localStorage.getItem("reelmartToken");
if (!currentUser || !currentToken) {
  window.location.replace("/auth.html?returnTo=" + encodeURIComponent("/seller_dashboard.html"));
}


const categoryPresets = {
  Electronics: {
    attributes: ["Brand", "Model", "Storage", "RAM", "Display", "Battery", "Warranty"],
    variants: ["Storage", "Color"]
  },
  Fashion: {
    attributes: ["Brand", "Material", "Fit", "Gender", "Care instructions"],
    variants: ["Size", "Color"]
  },
  Footwear: {
    attributes: ["Brand", "Material", "Sole material", "Fit", "Gender"],
    variants: ["Size", "Color"]
  },
  Beauty: {
    attributes: ["Brand", "Skin/Hair type", "Volume", "Ingredients", "Shelf life"],
    variants: ["Shade", "Size"]
  },
  "Home & Living": {
    attributes: ["Brand", "Material", "Dimensions", "Weight", "Warranty"],
    variants: ["Color", "Size"]
  },
  Sports: {
    attributes: ["Brand", "Material", "Sport", "Weight", "Recommended use"],
    variants: ["Size", "Color"]
  },
  Accessories: {
    attributes: ["Brand", "Material", "Dimensions", "Compatibility"],
    variants: ["Color", "Size"]
  },
  Other: { attributes: ["Brand", "Material"], variants: ["Color", "Size"] }
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

function addAttributeRow(key = "", value = "") {
  const row = document.createElement("div");
  row.className = "builder-row";
  row.innerHTML = `<input class="attr-key" placeholder="Specification (e.g. Battery)" value="${escapeHtml(key)}">
    <input class="attr-value" placeholder="Value (e.g. 3274mAh)" value="${escapeHtml(value)}">
    <button type="button" class="remove-row">Remove</button>`;
  row.querySelector(".remove-row").onclick = () => row.remove();
  attributeRows.appendChild(row);
}

function addVariantRow(label = "", options = "") {
  const row = document.createElement("div");
  row.className = "variant-row";
  row.innerHTML = `<input class="variant-label" placeholder="Option name (e.g. Storage)" value="${escapeHtml(label)}">
    <input class="variant-options" placeholder="Choices separated by commas (e.g. 128GB, 256GB, 512GB)" value="${escapeHtml(options)}">
    <button type="button" class="remove-row">Remove</button>`;
  row.querySelector(".remove-row").onclick = () => row.remove();
  variantRows.appendChild(row);
}

function loadCategoryPreset() {
  const preset = categoryPresets[category.value] || { attributes: [], variants: [] };
  attributeRows.innerHTML = "";
  variantRows.innerHTML = "";
  preset.attributes.slice(0, 4).forEach(key => addAttributeRow(key));
  preset.variants.slice(0, 2).forEach(label => addVariantRow(label));
}

function collectAttributes() {
  const result = {};
  document.querySelectorAll(".builder-row").forEach(row => {
    const key = row.querySelector(".attr-key")?.value.trim();
    const value = row.querySelector(".attr-value")?.value.trim();
    if (key && value) result[key] = value;
  });
  return result;
}

function collectVariants() {
  return [...document.querySelectorAll(".variant-row")].map(row => ({
    label: row.querySelector(".variant-label")?.value.trim(),
    options: (row.querySelector(".variant-options")?.value || "").split(",").map(v => v.trim()).filter(Boolean)
  })).filter(v => v.label && v.options.length);
}

async function loadProducts() {
  try {
    const response = await fetch(API);
    const products = await response.json();
    productsContainer.innerHTML = "";
    products.forEach(product => {
      const attributes = product.attributes && typeof product.attributes === "object" ? Object.entries(product.attributes) : [];
      productsContainer.innerHTML += `<div class="product">
        <img src="${MEDIA_BASE}${escapeHtml(product.image || '')}" onerror="this.src='https://via.placeholder.com/300x220?text=No+Image'">
        <div class="info"><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description)}</p>
        <div class="price">₦${Number(product.price || 0).toLocaleString()}</div>
        <p><b>Category:</b> ${escapeHtml(product.category)}</p><p><b>Stock:</b> ${product.stock}</p>
        ${attributes.length ? `<p><b>Specs:</b> ${attributes.slice(0,3).map(([k,v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`).join(" · ")}</p>` : ""}
        <button class="deleteBtn" onclick="deleteProduct('${product._id}')">Delete Product</button></div></div>`;
    });
  } catch (err) { console.log(err); }
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem("reelmartUser") || "null");
  const token = localStorage.getItem("reelmartToken");
  if (!user || !token) {
    window.location.href = "/auth.html?returnTo=" + encodeURIComponent("/seller_dashboard.html");
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  const status = document.getElementById("uploadStatus");
  const progress = document.getElementById("uploadProgress");
  const bar = progress?.querySelector("i");
  submitBtn.disabled = true;
  if (status) { status.classList.add("show"); status.textContent = "Publishing your product…"; }
  if (progress) progress.classList.add("show");
  if (bar) bar.style.width = "15%";

  const formData = new FormData();
  ["name", "description", "price", "category", "stock"].forEach(id => formData.append(id, document.getElementById(id).value));
  formData.append("attributes", JSON.stringify(collectAttributes()));
  formData.append("variants", JSON.stringify(collectVariants()));

  const image = document.getElementById("image").files[0];
  if (image) formData.append("image", image);
  const video = document.getElementById("reelVideo").files[0];
  if (video) formData.append("reelVideo", video);

  try {
    if (bar) bar.style.width = "45%";
    const response = await fetch(API, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Upload failed");
    if (bar) bar.style.width = "100%";
    if (status) status.textContent = "Product published successfully ✓";
    alert(data.message || "Product created successfully");
    form.reset();
    attributeRows.innerHTML = "";
    variantRows.innerHTML = "";
    document.getElementById("imagePreview")?.classList.remove("show");
    document.getElementById("videoPreview")?.classList.remove("show");
    document.getElementById("imageMeta")?.classList.remove("show");
    document.getElementById("videoMeta")?.classList.remove("show");
    document.getElementById("removeImage")?.classList.remove("show");
    document.getElementById("removeVideo")?.classList.remove("show");
    loadCategoryPreset();
    loadProducts();
    setTimeout(()=>progress?.classList.remove("show"),800);
  } catch (err) {
    if (status) status.textContent = "Could not publish: " + err.message;
    if (bar) bar.style.width = "0%";
    alert(err.message);
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});

document.getElementById("addAttribute")?.addEventListener("click", () => addAttributeRow());
document.getElementById("addVariant")?.addEventListener("click", () => addVariantRow());
category?.addEventListener("change", loadCategoryPreset);

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  try {
    const tok = localStorage.getItem("reelmartToken") || "";
    const response = await fetch(API + "/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + tok } });
    const data = await response.json();
    alert(data.message);
    loadProducts();
  } catch (err) { console.log(err); }
}

window.deleteProduct = deleteProduct;
loadCategoryPreset();
loadProducts();
