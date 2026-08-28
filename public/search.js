const API = '/api/products';
const MEDIA_BASE = '/uploads/';
let products = [];
let state = { query:'', category:'All', min:null, max:null, reelOnly:false, inStock:false, sort:'featured' };

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mediaUrl = value => value ? (String(value).startsWith('http') ? value : MEDIA_BASE + value) : '';
const money = value => `₦${Number(value || 0).toLocaleString()}`;

function cart(){ return JSON.parse(localStorage.getItem('reelmartCart') || '[]'); }
function updateCart(){
  const count = cart().reduce((sum,item)=>sum + Number(item.quantity || 1),0);
  const btn = document.getElementById('cart-btn'); if(btn) btn.textContent = `🛒 Cart (${count})`;
}
function toast(message){
  const el=document.getElementById('toast'); if(!el) return;
  el.textContent=message; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),2200);
}
function addToCart(product){
  if(Number(product.stock||0)<=0) return;
  const items=cart(); const existing=items.find(i=>i._id===product._id);
  if(existing) existing.quantity=(existing.quantity||1)+1;
  else items.push({_id:product._id,name:product.name,price:Number(product.price||0),image:product.image||'',category:product.category||'Product',quantity:1});
  localStorage.setItem('reelmartCart',JSON.stringify(items)); updateCart(); toast(`${product.name} added to cart`);
}
function categories(){
  return ['All', ...new Set(products.map(p=>p.category).filter(Boolean).map(String))];
}
function renderCategoryControls(){
  const cats=categories();
  const list=document.getElementById('category-list');
  list.innerHTML=cats.map(c=>`<button class="cat-btn ${state.category===c?'active':''}" data-category="${esc(c)}">${esc(c)} <span style="float:right">${c==='All'?products.length:products.filter(p=>String(p.category)===c).length}</span></button>`).join('');
  list.querySelectorAll('.cat-btn').forEach(b=>b.onclick=()=>{state.category=b.dataset.category; renderCategoryControls(); renderChips(); render();});
  renderChips();
}
function renderChips(){
  const wrap=document.getElementById('chips');
  wrap.innerHTML=categories().map(c=>`<button class="chip ${state.category===c?'active':''}" data-category="${esc(c)}">${esc(c)}</button>`).join('');
  wrap.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{state.category=b.dataset.category; renderCategoryControls(); render();});
}
function filtered(){
  let list=products.filter(p=>{
    const hay=[p.name,p.category,p.description, ...(p.attributes ? Object.entries(p.attributes).flat() : [])].join(' ').toLowerCase();
    if(state.query && !hay.includes(state.query.toLowerCase())) return false;
    if(state.category!=='All' && String(p.category)!==state.category) return false;
    const price=Number(p.price||0);
    if(state.min!==null && price<state.min) return false;
    if(state.max!==null && price>state.max) return false;
    if(state.reelOnly && !p.reelVideo) return false;
    if(state.inStock && Number(p.stock||0)<=0) return false;
    return true;
  });
  if(state.sort==='newest') list.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  if(state.sort==='price-low') list.sort((a,b)=>Number(a.price||0)-Number(b.price||0));
  if(state.sort==='price-high') list.sort((a,b)=>Number(b.price||0)-Number(a.price||0));
  if(state.sort==='name') list.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  return list;
}
function card(p){
  const img=mediaUrl(p.image), stock=Number(p.stock||0);
  return `<article class="product-card" data-id="${esc(p._id)}">
    <div class="media">${img?`<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`:''}<div class="fallback" style="${img?'display:none':''}">✦</div><span class="badge">${esc(p.category||'Product')}</span>${p.reelVideo?'<span class="badge reel">● Reel</span>':''}</div>
    <div class="card-info"><div class="category">${esc(p.category||'General')}</div><div class="name" title="${esc(p.name)}">${esc(p.name)}</div><div class="desc">${esc(p.description||'Explore this product on ReelMart.')}</div><div class="bottom"><div><div class="price">${money(p.price)}</div><div class="stock ${stock<=0?'out':''}">${stock>0?`${stock} in stock`:'Out of stock'}</div></div><button class="add" ${stock<=0?'disabled':''} aria-label="Add ${esc(p.name)} to cart">+</button></div></div>
  </article>`;
}
function render(){
  const list=filtered(), grid=document.getElementById('products-grid');
  document.getElementById('result-count').textContent=`Showing ${list.length} of ${products.length} products`;
  if(!list.length){grid.innerHTML='<div class="empty"><b>No products found</b>Try a different search, category or price range.<br><button id="reset-empty">Reset filters</button></div>';document.getElementById('reset-empty').onclick=clearFilters;return;}
  grid.innerHTML=list.map(card).join('');
  grid.querySelectorAll('.product-card').forEach(el=>{
    const p=list.find(x=>x._id===el.dataset.id); el.onclick=()=>location.href=`/product.html?id=${encodeURIComponent(p._id)}`;
    const add=el.querySelector('.add'); if(add) add.onclick=e=>{e.stopPropagation();addToCart(p)};
  });
}
function clearFilters(){
  state={query:'',category:'All',min:null,max:null,reelOnly:false,inStock:false,sort:'featured'};
  document.getElementById('search-input').value=''; document.getElementById('min-price').value=''; document.getElementById('max-price').value=''; document.getElementById('reel-only').checked=false; document.getElementById('in-stock').checked=false; document.getElementById('sort').value='featured';
  renderCategoryControls(); render();
}
async function load(){
  try{
    const res=await fetch(API); if(!res.ok) throw new Error('Failed to load products');
    products=await res.json(); if(!Array.isArray(products)) products=[];
    document.getElementById('product-count').textContent=products.length;
    const params=new URLSearchParams(location.search); state.query=params.get('q')||''; state.category=params.get('category')||'All';
    if(!categories().includes(state.category)) state.category='All';
    document.getElementById('search-input').value=state.query;
    renderCategoryControls(); render();
  }catch(err){
    console.error(err); document.getElementById('products-grid').innerHTML='<div class="empty"><b>Could not load the shop</b>Make sure your Node.js server and MongoDB connection are running, then refresh the page.</div>';
  }
}
document.getElementById('search-form').onsubmit=e=>{e.preventDefault();state.query=document.getElementById('search-input').value.trim();render();history.replaceState(null,'',state.query?`/search.html?q=${encodeURIComponent(state.query)}`:'/search.html');};
document.getElementById('search-input').oninput=e=>{state.query=e.target.value.trim();render();};
document.getElementById('sort').onchange=e=>{state.sort=e.target.value;render();};
document.getElementById('min-price').oninput=e=>{state.min=e.target.value===''?null:Number(e.target.value);render();};
document.getElementById('max-price').oninput=e=>{state.max=e.target.value===''?null:Number(e.target.value);render();};
document.getElementById('reel-only').onchange=e=>{state.reelOnly=e.target.checked;render();};
document.getElementById('in-stock').onchange=e=>{state.inStock=e.target.checked;render();};
document.getElementById('clear-filters').onclick=clearFilters;
document.getElementById('mobile-filter').onclick=()=>document.getElementById('filters').classList.toggle('open');
updateCart(); load();
