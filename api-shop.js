const {r,settings,letterPrice,recalc}=require('./lib');const nm=require('nodemailer');
const c=(v,n)=>String(v==null?'':v).slice(0,n||300),esc=v=>c(v,3000).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
module.exports=async(q,s)=>{
 if(q.method==='GET'){
  if(q.query.img){const d=await r('HGET','pimgs',String(q.query.img)),m=d&&/^data:(image\/[\w+.-]+);base64,(.*)$/.exec(d);if(!m)return s.status(404).end();s.setHeader('Content-Type',m[1]);s.setHeader('Cache-Control','public,max-age=31536000,immutable');return s.end(Buffer.from(m[2],'base64'))}
  const h=await r('HGETALL','products')||[],st=await r('HGETALL','stock')||[],S={};for(let i=0;i<st.length;i+=2)S[st[i]]=+st[i+1];
  const L=[];for(let i=1;i<h.length;i+=2){const p=JSON.parse(h[i]);if(p.active===false)continue;L.push({id:p.id,name:p.name,price:p.price,desc:p.desc,v:p.v,img:!!p.img,left:Math.max(0,Math.min(99,S[p.id]||0))})}
  L.sort((x,y)=>(y.v||0)-(x.v||0));const g=await settings();
  s.setHeader('Cache-Control','no-store');return s.json({items:L,methods:g.methods,delivery:g.delivery,halfMin:g.halfMin,base:g.base,note:g.note,freeWords:g.freeWords,blockWords:g.blockWords,blockPrice:g.blockPrice,shopOpen:g.shopOpen!==false,open:g.open!==false,closedMsg:g.closedMsg,notice:g.notice})}
 if(q.method!=='POST')return s.status(405).end();
 const b=q.body||{};if(b.website)return s.json({ok:true,id:'S0'});
 const st=await settings();if(st.shopOpen===false)return s.status(403).json({error:'দোকান এখন বন্ধ আছে। একটু পরে আবার চেষ্টা করো।'});
 try{const ip=String(q.headers['x-forwarded-for']||'x').split(',')[0].trim(),k='rl:'+ip,n=await r('INCR',k);if(n==1)await r('EXPIRE',k,3600);if(n>8)return s.status(429).json({error:'অনেকবার চেষ্টা হয়েছে। এক ঘণ্টা পরে আবার চেষ্টা করো।'})}catch{}
 if(!b.agree)return s.status(400).json({error:'নিয়মে সম্মতি দিতে হবে'});
 if(!b.name||!b.phone||!b.email||!b.addr||!b.trxId)return s.status(400).json({error:'সব দরকারি ঘর পূরণ করুন'});
 if(!st.methods.some(m=>m.on&&m.number&&m.name===b.pay))return s.status(400).json({error:'পেমেন্ট মেথড ঠিক নেই'});
 const cart=(Array.isArray(b.cart)?b.cart:[]).slice(0,30).map(x=>({pid:c(x.pid,40),qty:Math.max(1,Math.min(20,parseInt(x.qty)||1))}));
 if(!cart.length)return s.status(400).json({error:'কার্ট খালি'});
 const ids=[...new Set(cart.map(x=>x.pid))],raw=await r('HMGET','products',...ids),P={};ids.forEach((id,i)=>{try{if(raw[i])P[id]=JSON.parse(raw[i])}catch{}});
 const lines=[],taken=[];
 const undo=async()=>{for(const t of taken)try{await r('HINCRBY','stock',t[0],t[1])}catch{}};
 for(const x of cart){const p=P[x.pid];if(!p||p.active===false){await undo();return s.status(400).json({error:'একটা জিনিস আর পাওয়া যাচ্ছে না। কার্ট ঠিক করে আবার চেষ্টা করো।'})}
  const left=await r('HINCRBY','stock',p.id,-x.qty);taken.push([p.id,x.qty]);
  if(left<0){await undo();return s.status(400).json({error:'“'+p.name+'” এর স্টক এখন যথেষ্ট নেই। সংখ্যা কমাও বা অন্য জিনিস নাও।'})}
  lines.push({pid:p.id,name:p.name,price:p.price,qty:x.qty,ok:true})}
 const id='S'+Date.now().toString(36).toUpperCase();
 const o={id,kind:'shop',at:new Date().toISOString(),status:'Pending',name:c(b.name,120),phone:c(b.phone,40),email:c(b.email,120),addr:c(b.addr,500),lines,letter:null,letterTotal:0,pay:c(b.pay,20),trxId:c(b.trxId,60),src:c(b.src,40),adminNote:'',custMsg:''};
 if(b.letter&&b.letterOn){const L=b.letter;if(st.open===false){await undo();return s.status(403).json({error:st.closedMsg||'চিঠির অর্ডার এখন বন্ধ আছে।'})}
  if(!L.recName||!L.recAddr||!L.recContact||!L.message){await undo();return s.status(400).json({error:'চিঠির সব দরকারি ঘর পূরণ করুন'})}
  const lp=letterPrice(L.message,st);o.letter={recName:c(L.recName,120),recAddr:c(L.recAddr,300),recContact:c(L.recContact,150),message:c(L.message,6000),extra:c(L.extra,300),senderName:c(L.senderName,120),anon:!!L.anon,words:lp.wc,extraCharge:lp.xc};o.letterTotal=lp.total}
 recalc(o,st);
 o.payMode=(b.mode==='half'&&o.total>=st.halfMin)?'half':'full';o.paidOnline=o.payMode==='half'?Math.ceil(o.total/2):o.total;recalc(o,st);
 try{if((await r('HSETNX','trx',o.trxId.toUpperCase().replace(/\s/g,''),id))==0)o.dup=true}catch{}
 await r('HSET','orders',id,JSON.stringify(o));
 try{const t=nm.createTransport({service:'gmail',auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASS}});
  const ll=lines.map(l=>`${esc(l.name)} × ${l.qty} = ${l.price*l.qty}৳`).join('<br>');
  await Promise.all([t.sendMail({from:`তেইশ টাকা <${process.env.GMAIL_USER}>`,to:process.env.GMAIL_USER,subject:`নতুন দোকানের অর্ডার ${id}`,html:`<p><b>${esc(o.name)}</b> · ${esc(o.phone)} · ${esc(o.email)}<br>${esc(o.addr)}</p><p>${ll}</p>${o.letter?'<p>+ চিঠি আছে</p>':''}<p>মোট ${o.total}৳ (ডেলিভারি ${o.delivery}৳)<br>অনলাইনে দিয়েছে ${o.paidOnline}৳ · ${esc(o.pay)} · TrxID ${esc(o.trxId)}<br>ডেলিভারিতে বাকি ${o.due}৳</p>`}),
  t.sendMail({from:`তেইশ টাকা <${process.env.GMAIL_USER}>`,to:o.email,subject:`অর্ডার কনফার্মেশন ${id} — তেইশ টাকা`,html:`<div style="font-family:sans-serif;max-width:480px;margin:auto;border:6px double #B8322A;padding:20px;background:#F3E3C0"><h2 style="color:#B8322A">তেইশ টাকা 🎁</h2><p>তোমার অর্ডার পেয়েছি।</p><p>${ll}${o.letter?'<br>+ হাতে লেখা চিঠি':''}</p><p><b>ডেলিভারি চার্জ:</b> ${o.delivery} টাকা<br><b>মোট:</b> ${o.total} টাকা<br><b>অনলাইনে দিয়েছ:</b> ${o.paidOnline} টাকা (TrxID: ${esc(o.trxId)})${o.due?`<br><b>ডেলিভারির সময় ডেলিভারি ম্যানকে দিতে হবে:</b> ${o.due} টাকা`:''}</p><p>পেমেন্ট যাচাই হলে জানাব। অর্ডার আইডি: <b>${id}</b><br><a href="https://${q.headers.host}/track">অর্ডারের অবস্থা দেখো</a></p></div>`})])}catch(e){console.log('mail',e.message)}
 s.json({ok:true,id,total:o.total,due:o.due});
};
