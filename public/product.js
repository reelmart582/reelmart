const API = 'http://localhost:3000/api/products';
const MEDIA_BASE = 'http://localhost:3000/uploads/';
const params = new URLSearchParams(location.search);
const productId = params.get('id');
let currentProduct = null;
let quantity = 1;
let selections = {};
let wished = false;

const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mediaUrl = value => value ? (value.startsWith('http') ? value : MEDIA_BASE + value) : '';
const sellerLabel = seller => seller?.fullName || seller?.username || seller?.name || seller?.email?.split('@')[0] || 'Verified seller';

function showToast(message){
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=message;t.classList.add('show');
  clearTimeout(window.__toast);
  window.__toast=setTimeout(()=>t.classList.remove('show'),2200);
}

function normalizeMap(value){
  if(!value) return {};
  if(typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
}

function normalizeVariants(value){
  if(!Array.isArray(value)) return [];
  return value.filter(v=>v && v.label && Array.isArray(v.options) && v.options.length);
}

function render(product){
  const app=document.getElementById('app');
  const image=mediaUrl(product.image);
  const video=mediaUrl(product.reelVideo);
  const stock=Number(product.stock||0);
  const attributes=normalizeMap(product.attributes);
  const variants=normalizeVariants(product.variants);
  const seller=sellerLabel(product.seller);
  const attrEntries=Object.entries(attributes);

  document.title=`${product.name} | ReelMart`;

  const media = video
    ? `<video id="main-video" src="${esc(video)}" controls playsinline poster="${esc(image)}"></video>`
    : image
      ? `<img id="main-image" src="${esc(image)}" alt="${esc(product.name)}">`
      : `<div class="media-fallback">✦</div>`;

  const thumb = [];
  if(image) thumb.push(`<button class="thumb" onclick="setMedia('image')"><img src="${esc(image)}" alt=""></button>`);
  if(video) thumb.push(`<button class="thumb" onclick="setMedia('video')"><video src="${esc(video)}#t=0.1" muted></video></button>`);

  const variantHtml=variants.map(v=>{
    const key=String(v.label);
    selections[key]=selections[key] || v.options[0];
    return `<div class="config-section">
      <div class="config-label">${esc(key)}</div>
      <div class="options">${v.options.map(option=>`<button class="option ${selections[key]===option?'active':''}" data-variant="${esc(key)}" data-value="${esc(option)}">${esc(option)}</button>`).join('')}</div>
    </div>`;
  }).join('');

  const attributesHtml=attrEntries.length
    ? `<div class="attributes">${attrEntries.map(([k,v])=>`<div class="attr"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`
    : `<div class="empty-details">The seller has not added extra specifications for this product yet. The information above comes directly from the product listing.</div>`;

  app.innerHTML=`
  <header class="topbar">
    <button class="back" onclick="history.length>1?history.back():location.href='/'">← Back</button>
    <div class="logo">Reel<span>Mart</span></div>
    <button class="cart" onclick="location.href='/cart.html'">🛒 Cart <span id="cart-count">0</span></button>
  </header>
  <main class="page">
    <section class="media-panel">
      <div class="main-media">${video?'<div class="reel-pill">● Product reel</div>':''}${media}</div>
      ${thumb.length?`<div class="thumbs">${thumb.join('')}</div>`:''}
    </section>
    <section class="content">
      <div class="breadcrumb">Home / ${esc(product.category||'Products')} / ${esc(product.name)}</div>
      <div class="category">${esc(product.category||'Product')}</div>
      <h1 class="title">${esc(product.name)}</h1>
      <p class="description">${esc(product.description || 'No product description has been provided.')}</p>
      <div class="price-row">
        <div class="price">₦${Number(product.price||0).toLocaleString()}</div>
        <div class="stock ${stock<=0?'out':''}">${stock>0?`● ${stock} in stock`:'● Out of stock'}</div>
      </div>
      <div class="seller">
        <div class="avatar">${esc(seller.slice(0,2).toUpperCase())}</div>
        <div><div class="seller-name">${esc(seller)}</div><div class="seller-meta">Seller information from this listing</div></div>
      </div>
      ${variantHtml}
      <div class="qty-row">
        <div class="config-label" style="margin:0">Quantity</div>
        <div class="qty"><button onclick="changeQty(-1)">−</button><span id="qty">1</span><button onclick="changeQty(1)">+</button></div>
        <span style="font-size:10px;color:var(--text2)">Maximum ${Math.min(stock||1,10)}</span>
      </div>
      <div class="actions">
        <button class="add" id="add-btn" ${stock<=0?'disabled':''} onclick="addToCart()">Add to cart</button>
        <button class="buy" ${stock<=0?'disabled':''} onclick="buyNow()">Buy now</button>
        <button class="wish ${wished?'active':''}" id="wish-btn" onclick="toggleWish()">♡</button>
      </div>
      <div class="info-grid">
        <div class="info-card"><strong>🚚 Delivery</strong><span>Delivery details can be confirmed by the seller at checkout.</span></div>
        <div class="info-card"><strong>🛡 Buyer protection</strong><span>Keep your order and payment records for support.</span></div>
        <div class="info-card"><strong>↩ Returns</strong><span>Return terms depend on the seller's listing policy.</span></div>
        <div class="info-card"><strong>🔒 Secure checkout</strong><span>Continue to checkout to complete your order.</span></div>
      </div>
      <section class="details"><h2>Product details</h2>${attributesHtml}</section>
      <section class="reviews"><h2>Reviews</h2><p>No review data has been added to this product yet.</p></section>
    </section>
  </main>`;

  document.querySelectorAll('.option').forEach(btn=>{
    btn.onclick=()=>{
      const key=btn.dataset.variant;
      selections[key]=btn.dataset.value;
      document.querySelectorAll(`.option[data-variant="${CSS.escape(key)}"]`).forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
    };
  });
  updateCartDisplay();
}

function setMedia(type){
  if(!currentProduct) return;
  const box=document.querySelector('.main-media');
  const image=mediaUrl(currentProduct.image), video=mediaUrl(currentProduct.reelVideo);
  if(type==='video' && video){
    box.innerHTML='<div class="reel-pill">● Product reel</div><video src="'+esc(video)+'" controls playsinline poster="'+esc(image)+'"></video>';
  }else if(image){
    box.innerHTML='<img id="main-image" src="'+esc(image)+'" alt="'+esc(currentProduct.name)+'">';
  }
}

function changeQty(delta){
  const max=Math.max(1,Math.min(Number(currentProduct?.stock||1),10));
  quantity=Math.max(1,Math.min(max,quantity+delta));
  const el=document.getElementById('qty');if(el)el.textContent=quantity;
}

function getCart(){
  return JSON.parse(localStorage.getItem('reelmartCart') || '[]');
}

function saveCart(cart){localStorage.setItem('reelmartCart',JSON.stringify(cart));}

function addToCart(){
  if(!currentProduct || Number(currentProduct.stock||0)<=0) return;
  const cart=getCart();
  const existing=cart.find(item=>item._id===currentProduct._id);
  if(existing) existing.quantity=(existing.quantity||1)+quantity;
  else cart.push({
    _id:currentProduct._id,name:currentProduct.name,price:Number(currentProduct.price||0),
    image:currentProduct.image||'',category:currentProduct.category||'Product',
    quantity, selections:{...selections}
  });
  saveCart(cart);updateCartDisplay();showToast(`${quantity} × ${currentProduct.name} added to cart`);
}

function buyNow(){
  addToCart();
  location.href='/checkout.html';
}

function toggleWish(){
  wished=!wished;
  const btn=document.getElementById('wish-btn');
  if(btn){btn.classList.toggle('active',wished);btn.textContent=wished?'♥':'♡';}
  showToast(wished?'Added to wishlist':'Removed from wishlist');
}

function updateCartDisplay(){
  const count=getCart().reduce((s,i)=>s+Number(i.quantity||1),0);
  const el=document.getElementById('cart-count');if(el)el.textContent=count;
}

async function loadProduct(){
  const app=document.getElementById('app');
  if(!productId){
    app.innerHTML='<div class="error">No product was selected.<br><button onclick="location.href=\'/\'">Return home</button></div>';return;
  }
  try{
    const response=await fetch(`${API}/${encodeURIComponent(productId)}`);
    if(!response.ok) throw new Error('Product not found');
    currentProduct=await response.json();
    render(currentProduct);
  }catch(error){
    console.error(error);
    app.innerHTML='<div class="error"><strong>Product could not be loaded.</strong><br><br>Check that the Node.js server is running and the product still exists.<br><button onclick="location.href=\'/\'">Return home</button></div>';
  }
}

loadProduct();
