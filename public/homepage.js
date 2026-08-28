const API = 'http://localhost:3000/api/products';
const MEDIA_BASE = 'http://localhost:3000/uploads/';
let allProducts = [];
let activeCategory = 'All';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imageUrl = p => p?.image ? (p.image.startsWith('http') ? p.image : MEDIA_BASE + p.image) : '';

function updateNav(){
  const user = JSON.parse(localStorage.getItem('reelmartUser') || 'null');
  const token = localStorage.getItem('reelmartToken');
  const link = document.getElementById('sign-in-link');
  if(!link) return;
  if(token && user){
    link.textContent = user.fullName || user.email?.split('@')[0] || 'Account';
    link.href = '#';
    if(!document.getElementById('logout-link')){
      const logout = document.createElement('a');
      logout.id='logout-link'; logout.textContent='Logout';
      logout.style.color='#E8522A';
      logout.onclick=()=>{localStorage.removeItem('reelmartToken');localStorage.removeItem('reelmartUser');location.reload()};
      link.parentElement.appendChild(logout);
    }
  }
}

function updateCartCount(){
  const cart = JSON.parse(localStorage.getItem('reelmartCart') || '[]');
  const count = cart.reduce((sum,item)=>sum + Number(item.quantity || 1),0);
  const btn=document.querySelector('.cart-btn');
  if(btn) btn.textContent=`🛒 Cart (${count})`;
}

function addToCart(product){
  if(!product || Number(product.stock) <= 0) return;
  let cart=JSON.parse(localStorage.getItem('reelmartCart') || '[]');
  const existing=cart.find(item=>item._id===product._id);
  if(existing) existing.quantity=(existing.quantity||1)+1;
  else cart.push({_id:product._id,name:product.name,price:Number(product.price),image:product.image||'',category:product.category||'Product',quantity:1});
  localStorage.setItem('reelmartCart',JSON.stringify(cart));
  updateCartCount();
  showToast(`${product.name} added to cart`);
}

function showToast(msg){
  const toast=document.getElementById('toast');
  if(!toast) return;
  toast.textContent=msg; toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>toast.classList.remove('show'),2200);
}

function renderCategoryChips(products){
  const wrap=document.getElementById('category-chips');
  if(!wrap) return;
  const cats=['All',...new Set(products.map(p=>p.category).filter(Boolean))].slice(0,8);
  wrap.innerHTML=cats.map(cat=>`<button class="chip ${cat===activeCategory?'active':''}" data-cat="${esc(cat)}">${esc(cat)}</button>`).join('');
  wrap.querySelectorAll('.chip').forEach(btn=>btn.onclick=()=>{
    activeCategory=btn.dataset.cat;
    renderCategoryChips(allProducts);
    renderProducts();
  });
}

function renderProducts(){
  const container=document.getElementById('products-container');
  if(!container) return;
  const filtered=activeCategory==='All' ? allProducts : allProducts.filter(p=>p.category===activeCategory);
  if(!filtered.length){
    container.innerHTML='<div class="empty">No products in this category yet.</div>';
    return;
  }
  container.innerHTML=filtered.slice(0,12).map(p=>{
    const img=imageUrl(p);
    const stock=Number(p.stock||0);
    return `<article class="product-card" data-id="${esc(p._id)}">
      <div class="product-media">
        ${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : ''}
        <div class="media-fallback" style="${img?'display:none':''}">✦</div>
        <div class="media-shine"></div>
        <span class="badge">${esc(p.category||'Product')}</span>
        ${p.reelVideo ? '<span class="badge reel-badge">● Reel</span>' : ''}
      </div>
      <div class="product-info">
        <div class="product-name" title="${esc(p.name)}">${esc(p.name)}</div>
        <div class="product-category">${esc(p.category||'General')}</div>
        <div class="product-bottom">
          <div><div class="price">₦${Number(p.price||0).toLocaleString()}</div><div class="stock ${stock<=0?'out':''}">${stock>0?`${stock} in stock`:'Out of stock'}</div></div>
          <button class="add-btn" ${stock<=0?'disabled':''} aria-label="Add ${esc(p.name)} to cart">+</button>
        </div>
      </div>
    </article>`;
  }).join('');
  container.querySelectorAll('.product-card').forEach(card=>{
    const p=allProducts.find(item=>item._id===card.dataset.id);
    card.onclick=()=>location.href=`/product.html?id=${encodeURIComponent(p._id)}`;
    const btn=card.querySelector('.add-btn');
    if(btn) btn.onclick=e=>{e.stopPropagation();addToCart(p)};
  });
}

function updateHeroCards(products){
  // Turn the first four real products into the featured visual reel strip when the section exists.
  const cards=document.querySelectorAll('.reel-card');
  cards.forEach((card,i)=>{
    if(!products[i]) {card.style.display='none';return;}
    const p=products[i], img=imageUrl(p);
    const bg=card.querySelector('.reel-bg');
    if(bg){
      bg.style.background=img ? `url("${img}") center/cover` : '';
      const emoji=bg.querySelector('.emoji-icon');
      if(emoji) emoji.style.display=img?'none':'block';
    }
    const name=card.querySelector('.product-name'), price=card.querySelector('.product-price');
    if(name) name.textContent=p.name;
    if(price) price.textContent=`₦${Number(p.price||0).toLocaleString()}`;
    card.onclick=()=>location.href=`/product.html?id=${encodeURIComponent(p._id)}`;
  });
}

function updateFeaturedReels(products){
  const track=document.getElementById('reels-container');
  if(!track) return;
  const list=(products.filter(p=>p.reelVideo).length ? products.filter(p=>p.reelVideo) : products).slice(0,8);
  if(!list.length){track.innerHTML='<div class="empty">No products available yet.</div>';return;}
  track.innerHTML=list.map(p=>{
    const img=imageUrl(p);
    const video=p.reelVideo ? (p.reelVideo.startsWith('http')?p.reelVideo:MEDIA_BASE+p.reelVideo) : '';
    return `<article class="reel-item" data-id="${esc(p._id)}">
      ${video ? `<video src="${esc(video)}" muted loop playsinline preload="metadata"></video>` : img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">` : '<div style="height:100%;display:grid;place-items:center;font-size:50px;color:#F5A623">✦</div>'}
      <div class="reel-item-play">▶</div>
      <div class="reel-item-label">${esc(p.name)}<span class="r-price">₦${Number(p.price||0).toLocaleString()}</span></div>
    </article>`;
  }).join('');
  track.querySelectorAll('.reel-item').forEach(item=>{
    const p=allProducts.find(x=>x._id===item.dataset.id);
    item.onclick=()=>location.href=`/product.html?id=${encodeURIComponent(p._id)}`;
    const v=item.querySelector('video');
    if(v){item.addEventListener('mouseenter',()=>v.play().catch(()=>{}));item.addEventListener('mouseleave',()=>{v.pause();v.currentTime=0})}
  });
}

async function loadProducts(){
  const container=document.getElementById('products-container');
  try{
    const res=await fetch(API);
    if(!res.ok) throw new Error('API request failed');
    allProducts=await res.json();
    if(!Array.isArray(allProducts)) throw new Error('Invalid product response');
    if(!allProducts.length){
      container.innerHTML='<div class="empty">Your store is ready. Add products from the <a href="/seller_dashboard.html" style="color:#F5A623">seller dashboard</a>.</div>';
      document.getElementById('reels-container').innerHTML='';
      return;
    }
    renderCategoryChips(allProducts);
    renderProducts();
    updateFeaturedReels(allProducts);
  }catch(err){
    console.error(err);
    if(container) container.innerHTML='<div class="empty">Could not load products. Start the Node.js server and refresh.</div>';
  }
}

updateNav();
updateCartCount();
loadProducts();
