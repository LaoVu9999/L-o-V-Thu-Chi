const BOOKS={personal:'Cá nhân',shop:'Quán',company:'Doanh nghiệp'};
const CATS={personal:{income:['Lương','Forex','Trading','Phụ thu'],expense:['Sinh hoạt','Mua sắm','Quà cáp','Đi lại']},shop:{income:['Doanh thu','Thu khác'],expense:['Nguyên liệu','Lương nhân viên','Thuê mặt bằng','Điện nước','Marketing','Vận chuyển','Thiết bị','Khác']},company:{income:['Doanh thu','Thu công nợ','Thu khác'],expense:['Nhập hàng','Lương','Thuế','Kho vận','Văn phòng','Marketing','Công nợ','Khác']}};
const COLORS={'Lương':'#2563eb','Forex':'#7c3aed','Trading':'#0891b2','Phụ thu':'#0ea5e9','Sinh hoạt':'#f59e0b','Mua sắm':'#f97316','Quà cáp':'#ec4899','Đi lại':'#10b981','Doanh thu':'#2563eb','Thu khác':'#0ea5e9','Nguyên liệu':'#f97316','Lương nhân viên':'#8b5cf6','Thuê mặt bằng':'#ef4444','Điện nước':'#eab308','Marketing':'#06b6d4','Vận chuyển':'#14b8a6','Thiết bị':'#64748b','Thu công nợ':'#16a34a','Nhập hàng':'#f97316','Lương':'#8b5cf6','Thuế':'#dc2626','Kho vận':'#0f766e','Văn phòng':'#6366f1','Công nợ':'#0891b2','Khác':'#94a3b8'};
const ICONS={'Lương':'↙','Forex':'✣','Trading':'▟','Phụ thu':'＋','Sinh hoạt':'⌂','Mua sắm':'▣','Quà cáp':'♢','Đi lại':'▰'};
let book='personal',mode='expense',selectedDate=new Date(),calDate=new Date(),filter='all';
let data=JSON.parse(localStorage.getItem('vtc_v7')||localStorage.getItem('vtc_v6')||'[]');
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n);
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmt=d=>`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function allRows(){return data.filter(x=>x.book===book)}
function currentMonthRows(){const k=monthKey(new Date());return allRows().filter(x=>x.date.startsWith(k))}
function setupCats(){const modeCats=mode==='income'?CATS[book].income:mode==='expense'?CATS[book].expense:[];$('category').innerHTML=modeCats.map(x=>`<option>${esc(x)}</option>`).join('');}
function itemHTML(x){
 const c=COLORS[x.category]||'#64748b', bg=c+'18', sign=x.type==='income'?'+':'−', arrow=x.type==='transfer'?'⇄':x.type==='income'?'↓':'↑';
 return `<div class="item"><div class="cat-icon" style="background:${bg};color:${c}">${ICONS[x.category]||arrow}</div><div class="info"><b>${esc(x.category)}</b><small>${esc(x.date)}${x.note?' · '+esc(x.note):''}</small></div><div class="money ${x.type==='income'?'plus':'minus'}">${sign}${money(x.amount)}</div></div>`;
}
function drawChart(canvas,rows){
 const rect=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;if(!rect.width)return;
 canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
 const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);const now=new Date(),days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(),vals=[];
 for(let day=1;day<=days;day++){const k=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,r=rows.filter(x=>x.date===k);vals.push({i:r.filter(x=>x.type==='income').reduce((a,x)=>a+x.amount,0),o:r.filter(x=>x.type==='expense').reduce((a,x)=>a+x.amount,0)})}
 const max=Math.max(1,...vals.flatMap(v=>[v.i,v.o])),p=8,top=10,bottom=8,pw=w-p*2,ph=h-top-bottom;
 ctx.strokeStyle='#edf1f5';ctx.lineWidth=1;for(let i=0;i<4;i++){const y=top+ph*i/3;ctx.beginPath();ctx.moveTo(p,y);ctx.lineTo(w-p,y);ctx.stroke()}
 const line=(key,color)=>{ctx.beginPath();vals.forEach((v,i)=>{const x=p+i/(days-1)*pw,y=top+ph-(v[key]/max)*ph;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=2.8;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke()};
 line('i','#16a34a');line('o','#e11d48');
}
function categorySummary(rows){
 const expenses=rows.filter(x=>x.type==='expense'), map={};expenses.forEach(x=>map[x.category]=(map[x.category]||0)+x.amount);
 const arr=Object.entries(map).sort((a,b)=>b[1]-a[1]),max=arr[0]?.[1]||1;
 $('categorySummary').innerHTML=arr.length?arr.slice(0,8).map(([cat,val])=>`<div class="cat-row"><b style="color:${COLORS[cat]||'#64748b'}">${esc(cat)}</b><em>${money(val)}</em><div class="bar"><i style="width:${val/max*100}%;background:${COLORS[cat]||'#64748b'}"></i></div></div>`).join(''):'<div class="empty">Chưa có khoản chi trong tháng.</div>';
}
function render(){
 const rows=allRows(),mr=currentMonthRows(),inc=rows.filter(x=>x.type==='income').reduce((a,x)=>a+x.amount,0),out=rows.filter(x=>x.type==='expense').reduce((a,x)=>a+x.amount,0),mi=mr.filter(x=>x.type==='income').reduce((a,x)=>a+x.amount,0),mo=mr.filter(x=>x.type==='expense').reduce((a,x)=>a+x.amount,0);
 $('balance').textContent=money(inc-out);$('income').textContent=money(mi);$('expense').textContent=money(mo);$('mIncome').textContent=money(mi);$('mExpense').textContent=money(mo);$('rIncome').textContent=money(mi);$('rExpense').textContent=money(mo);
 const recent=rows.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);$('recentList').innerHTML=recent.length?recent.map(itemHTML).join(''):'<div class="empty">Chưa có giao dịch.</div>';
 let shown=rows.slice().sort((a,b)=>b.date.localeCompare(a.date));const q=($('search')?.value||'').toLowerCase();shown=shown.filter(x=>(filter==='all'||x.type===filter)&&(!q||`${x.category} ${x.note||''} ${x.amount}`.toLowerCase().includes(q)));$('list').innerHTML=shown.length?shown.map(itemHTML).join(''):'<div class="empty">Không tìm thấy giao dịch.</div>';
 drawChart($('cashChart'),mr);drawChart($('reportChart'),mr);categorySummary(mr);localStorage.setItem('vtc_v7',JSON.stringify(data));
}
function openForm(m='expense'){mode=m;$('modalTitle').textContent=m==='income'?'Thêm khoản thu':m==='expense'?'Thêm khoản chi':'Chuyển tiền giữa các sổ';document.querySelectorAll('.segmented button').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));$('transferFields').classList.toggle('hidden',m!=='transfer');$('category').disabled=m==='transfer';if(m==='transfer')$('category').innerHTML='<option>Chuyển nội bộ</option>';else setupCats();selectedDate=new Date();$('dateText').textContent=fmt(selectedDate);$('amount').value='';$('note').value='';$('modal').classList.remove('hidden');setTimeout(()=>$('amount').focus(),150)}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id));window.scrollTo({top:0,behavior:'smooth'});render()}
function renderCal(){const y=calDate.getFullYear(),m=calDate.getMonth();$('calTitle').textContent=`Tháng ${m+1}, ${y}`;const first=new Date(y,m,1),start=(first.getDay()+6)%7,last=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate();let h='';for(let i=0;i<42;i++){let n=i-start+1,d=n<1?new Date(y,m-1,prev+n):n>last?new Date(y,m+1,n-last):new Date(y,m,n);h+=`<button class="${d.getMonth()!==m?'muted ':''}${iso(d)===iso(new Date())?'today ':''}${iso(d)===iso(selectedDate)?'selected':''}" data-date="${iso(d)}">${d.getDate()}</button>`}$('days').innerHTML=h;document.querySelectorAll('#days button').forEach(b=>b.onclick=()=>{const p=b.dataset.date.split('-').map(Number);selectedDate=new Date(p[0],p[1]-1,p[2]);$('dateText').textContent=fmt(selectedDate);renderCal()})}
document.querySelectorAll('.book').forEach(b=>b.onclick=()=>{book=b.dataset.book;document.querySelectorAll('.book').forEach(x=>x.classList.toggle('active',x===b));setupCats();render()});
document.querySelectorAll('.nav').forEach(n=>n.onclick=()=>showPage(n.dataset.page));
$('mainAdd').onclick=()=>openForm('expense');$('addIncome').onclick=()=>openForm('income');$('addExpense').onclick=()=>openForm('expense');$('addTransfer').onclick=()=>openForm('transfer');$('close').onclick=()=>$('modal').classList.add('hidden');$('refresh').onclick=render;
document.querySelectorAll('.segmented button').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;$('modalTitle').textContent=mode==='income'?'Thêm khoản thu':mode==='expense'?'Thêm khoản chi':'Chuyển tiền giữa các sổ';$('transferFields').classList.toggle('hidden',mode!=='transfer');$('category').disabled=mode==='transfer';if(mode==='transfer')$('category').innerHTML='<option>Chuyển nội bộ</option>';else setupCats();document.querySelectorAll('.segmented button').forEach(x=>x.classList.toggle('active',x===b))});
$('save').onclick=()=>{const amount=Number($('amount').value);if(!amount)return alert('Nhập số tiền nhé!');const note=$('note').value.trim(),date=iso(selectedDate);if(mode==='transfer'){const to=$('toBook').value;if(to===book)return alert('Chọn sổ khác để chuyển!');data.push({book,type:'expense',amount,category:'Chuyển nội bộ',note,date,toBook:to});data.push({book:to,type:'income',amount,category:'Chuyển nội bộ',note,date,fromBook:book})}else data.push({book,type:mode,amount,category:$('category').value,note,date});$('modal').classList.add('hidden');render()};
$('dateBtn').onclick=()=>{$('calendarModal').classList.remove('hidden');calDate=new Date(selectedDate);renderCal()};$('prevMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCal()};$('nextMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCal()};$('calDone').onclick=()=>$('calendarModal').classList.add('hidden');
$('openTransactions').onclick=()=>showPage('transactionsPage');$('openReports').onclick=()=>showPage('reportsPage');$('search').oninput=render;document.querySelectorAll('#filters button').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('#filters button').forEach(x=>x.classList.toggle('active',x===b));render()});
$('monthBtn').onclick=()=>{selectedDate=new Date();$('calendarModal').classList.remove('hidden');calDate=new Date();renderCal()};
$('clearData').onclick=()=>{if(confirm('Xóa toàn bộ dữ liệu trên thiết bị?')){data=[];render()}}; $('manageCats').onclick=()=>alert('Danh mục hiện được thiết lập theo từng sổ. Phiên bản tiếp theo có thể cho phép tự thêm/sửa danh mục.');
function csv(filterBook){let rows=data.filter(x=>!filterBook||x.book===filterBook),out=[['Sổ','Ngày','Loại','Danh mục','Số tiền','Ghi chú']];rows.forEach(x=>out.push([BOOKS[x.book],x.date,x.type==='income'?'Thu':x.type==='expense'?'Chi':'Chuyển',x.category,x.amount,x.note||'']));return '\ufeff'+out.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n')}
function dl(text,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('exportBook').onclick=()=>dl(csv(book),'Vu_Thu_Chi_'+book+'.csv');$('exportAll').onclick=()=>dl(csv(),'Vu_Thu_Chi_tat_ca.csv');
$('monthBtn').textContent=`Tháng ${new Date().getMonth()+1}, ${new Date().getFullYear()}⌄`;$('dateText').textContent=fmt(selectedDate);setupCats();render();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
