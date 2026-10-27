const {r,settings,letterPrice,recalc,pickBumps}=require('./lib');const nm=require('nodemailer');
const c=(v,n)=>String(v==null?'':v).slice(0,n||300),esc=v=>c(v,3000).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
const H=async k=>{const h=await r('HGETALL',k)||[],o={};for(let i=0;i<h.length;i+=2)o[h[i]]=h[i+1];return o};
const serve=async(d,s)=>{const m=d&&/^data:(image\/[\w+.-]+);base64,(.*)$/.exec(d);if(!m)return s.status(404).end();s.setHeader('Content-Type',m[1]);s.setHeader('Cache-Control','public,max-age=31536000,immutable');return s.end(Buffer.from(m[2],'base64'))};
module.exports=async(q,s)=>{
 if(q.method==='GET'){
  if(q.query.img)return serve(await r('HGET','pimgs',String(q.query.img)),s);
  if(q.query.pimg)return serve(await r('HGET','pimgs',String(q.query.pimg)+':'+(parseInt(q.query.n)||0)),s);
  const g=await settings(),pr=await H('products'),SK=await H('stock'),CL=await H('claims'),PO=await H('posts'),L=[];
  for(const k in pr){const p=JSON.parse(pr[k]);if(p.active===false)continue;L.push({id:p.id,sid:p.sid||'s2',kind:'shop',name:p.name,price:p.price,desc:p.desc,cat:p.cat||'',inc:p.inc||'',imgUrl:p.imgUrl||'',v:p.v,img:!!p.img,left:p.out?0:Math.max(0,Math.min(99,+SK[p.id]||0))})}
  const P=[];for(const k in PO){try{const p=JSON.parse(PO[k]);if(p.status!=='Live')continue;const sv=(g.services||[]).find(x=>x.id===p.sid);if(!sv)continue;const kind=sv.type,taken=!!CL[p.id]&&kind!=='food',state=taken?(kind==='borrow'?'booked':'sold'):'live';
   P.push({id:p.id,sid:p.sid,kind,name:p.title,price:kind==='food'?Math.ceil(p.price*(1+(g.foodFee||0)/100)):p.price,desc:p.desc,rent:p.rent||0,photos:p.photos||0,v:p.at,state,left:state==='live'?(kind==='food'?20:1):0})}catch{}}
  const all=[...L.sort((x,y)=>(y.v||0)-(x.v||0)),...P.sort((x,y)=>(y.v||0)-(x.v||0)).slice(0,300)];
  s.setHeader('Cache-Control','no-store');return s.json({items:all,methods:g.methods,delivery:g.delivery,halfMin:g.halfMin,base:g.base,note:g.note,freeWords:g.freeWords,blockWords:g.blockWords,blockPrice:g.blockPrice,shopOpen:g.shopOpen!==false,open:g.open!==false,closedMsg:g.closedMsg,notice:g.notice,categories:g.categories||[],listFee:g.listFee,foodFee:g.foodFee,services:(g.services||[]).map(x=>({id:x.id,type:x.type,emoji:x.emoji,title:x.title,text:x.text,status:x.status})),bumps:(g.bumps||[]).filter(x=>x.on&&x.name)})}
 if(q.method!=='POST')return s.status(405).end();
 const b=q.body||{};if(b.website)return s.json({ok:true,id:'S0'});
 const st=await settings();if(st.shopOpen===false)return s.status(403).json({error:'দোকান এখন বন্ধ আছে। একটু পরে আবার চেষ্টা করো।'});
 try{const ip=String(q.headers['x-forwarded-for']||'x').split(',')[0].trim(),k='rl:'+ip,n=await r('INCR',k);if(n==1)await r('EXPIRE',k,3600);if(n>8)return s.status(429).json({error:'অনেকবার চেষ্টা হয়েছে। এক ঘণ্টা পরে আবার চেষ্টা করো।'})}catch{}
 if(!b.agree)return s.status(400).json({error:'নিয়মে সম্মতি দিতে হবে'});
 if(!b.name||!b.phone||!b.email||!b.addr||!b.trxId)return s.status(400).json({error:'সব দরকারি ঘর পূরণ করুন'});
 if(!st.methods.some(m=>m.on&&m.number&&m.name===b.pay))return s.status(400).json({error:'পেমেন্ট মেথড ঠিক নেই'});
 const seen={},cart=(Array.isArray(b.cart)?b.cart:[]).slice(0,30).map(x=>({pid:c(x.pid,60),qty:Math.max(1,Math.min(20,parseInt(x.qty)||1))})).filter(x=>x.pid&&!seen[x.pid]&&(seen[x.pid]=1));
 if(!cart.length)return s.status(400).json({error:'কার্ট খালি'});
 const id='S'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,4).toUpperCase();
 const ids=cart.filter(x=>x.pid[0]!=='Q').map(x=>x.pid),raw=ids.length?await r('HMGET','products',...ids):[],P={};ids.forEach((pid,i)=>{try{if(raw[i])P[pid]=JSON.parse(raw[i])}catch{}});
 const lines=[],taken=[],claimed=[];
 const undo=async()=>{for(const t of taken)try{await r('HINCRBY','stock',t[0],t[1])}catch{};for(const p of claimed)try{await r('HDEL','claims',p)}catch{}};
 const fail=async(m,code)=>{await undo();return s.status(code||400).json({error:m})};
 const svOff=sid=>{const sv=(st.services||[]).find(x=>x.id===sid);return sv&&(sv.status==='off'||sv.status==='soon')};
 for(const x of cart){
  if(x.pid[0]==='Q'){const rw=await r('HGET','posts',x.pid);let p=null;try{p=rw&&JSON.parse(rw)}catch{}const sv=p&&(st.services||[]).find(z=>z.id===p.sid);
   if(!p||p.status!=='Live'||!sv)return fail('একটা জিনিস আর পাওয়া যাচ্ছে না। কার্ট ঠিক করে আবার চেষ্টা করো।');
   if(svOff(p.sid))return fail('“'+p.title+'” যে সেবার, সেটা এখন বন্ধ আছে। কার্ট থেকে বাদ দাও।',403);
   const kind=sv.type;let qty=1;
   if(kind==='food')qty=x.qty;else{if((await r('HSETNX','claims',p.id,id))!=1)return fail('“'+p.title+'” '+(kind==='borrow'?'এখন অন্য কেউ ভাড়া নিয়েছে (Booked)।':'বিক্রি হয়ে গেছে।')+' কার্ট থেকে বাদ দাও।');claimed.push(p.id)}
   const price=kind==='food'?Math.ceil(p.price*(1+(st.foodFee||0)/100)):p.price;
   lines.push({pid:p.id,name:p.title,price,qty,ok:true,kind,sellerAmt:p.price,sellerKey:p.seller.key,sellerName:p.seller.name,sellerPhone:p.seller.phone,rent:kind==='borrow'?p.rent:undefined,deposit:kind==='borrow'?p.price:undefined});continue}
  const p=P[x.pid];if(!p||p.active===false)return fail('একটা জিনিস আর পাওয়া যাচ্ছে না। কার্ট ঠিক করে আবার চেষ্টা করো।');
  if(svOff(p.sid||'s2'))return fail('“'+p.name+'” যে সেবার, সেটা এখন বন্ধ আছে। কার্ট থেকে বাদ দাও।',403);
  if(p.out)return fail('“'+p.name+'” এর স্টক শেষ।');const left=await r('HINCRBY','stock',p.id,-x.qty);taken.push([p.id,x.qty]);
  if(left<0)return fail('“'+p.name+'” এর স্টক এখন যথেষ্ট নেই। সংখ্যা কমাও বা অন্য জিনিস নাও।');
  lines.push({pid:p.id,name:p.name,price:p.price,qty:x.qty,ok:true,kind:'shop'})}
 const o={id,kind:'shop',at:new Date().toISOString(),status:'Pending',name:c(b.name,120),phone:c(b.phone,40),email:c(b.email,120),addr:c(b.addr,500),lines,letter:null,letterTotal:0,pay:c(b.pay,20),trxId:c(b.trxId,60),src:c(b.src,40),adminNote:'',custMsg:'',bumps:pickBumps(b.bumps,st)};
 if(b.letter&&b.letterOn){const L=b.letter;if(st.open===false)return fail(st.closedMsg||'চিঠির অর্ডার এখন বন্ধ আছে।',403);
  if(!L.recName||!L.recAddr||!L.recContact||!L.message)return fail('চিঠির সব দরকারি ঘর পূরণ করুন');
  const lp=letterPrice(L.message,st);o.letter={recName:c(L.recName,120),recAddr:c(L.recAddr,300),recContact:c(L.recContact,150),message:c(L.message,6000),extra:c(L.extra,300),senderName:c(L.senderName,120),anon:!!L.anon,words:lp.wc,extraCharge:lp.xc};o.letterTotal=lp.total}
 recalc(o,st);
 o.payMode=(b.mode==='half'&&o.total>=st.halfMin)?'half':'full';o.paidOnline=o.payMode==='half'?Math.ceil(o.total/2):o.total;recalc(o,st);
 try{if((await r('HSETNX','trx',o.trxId.toUpperCase().replace(/\s/g,''),id))==0)o.dup=true}catch{}
 await r('HSET','orders',id,JSON.stringify(o));
 try{const t=nm.createTransport({service:'gmail',auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASS}});
  const ll=lines.map(l=>`${esc(l.name)}${l.kind==='borrow'?' (ধার, জামানত)':''} × ${l.qty} = ${l.price*l.qty}৳`).join('<br>'),bl=o.bumps.map(x=>'<br>+ '+esc(x.name)+' '+x.price+'৳').join('');
  await Promise.all([t.sendMail({from:`তেইশ টাকা <${process.env.GMAIL_USER}>`,to:process.env.GMAIL_USER,subject:`নতুন দোকানের অর্ডার ${id}`,html:`<p><b>${esc(o.name)}</b> · ${esc(o.phone)} · ${esc(o.email)}<br>${esc(o.addr)}</p><p>${ll}</p>${o.letter?'<p>+ চিঠি আছে</p>':''}<p>মোট ${o.total}৳ (ডেলিভারি ${o.delivery}৳)<br>অনলাইনে দিয়েছে ${o.paidOnline}৳ · ${esc(o.pay)} · TrxID ${esc(o.trxId)}<br>ডেলিভারিতে বাকি ${o.due}৳</p>`}),
  t.sendMail({from:`তেইশ টাকা <${process.env.GMAIL_USER}>`,to:o.email,subject:`অর্ডার কনফার্মেশন ${id} — তেইশ টাকা`,html:`<div style="font-family:sans-serif;max-width:480px;margin:auto;border:6px double #B8322A;padding:20px;background:#F3E3C0"><h2 style="color:#B8322A">তেইশ টাকা 🎁</h2><p>তোমার অর্ডার পেয়েছি।</p><p>${ll}${o.letter?'<br>+ হাতে লেখা চিঠি':''}${bl}</p><p><b>ডেলিভারি চার্জ:</b> ${o.delivery} টাকা<br><b>মোট:</b> ${o.total} টাকা<br><b>অনলাইনে দিয়েছ:</b> ${o.paidOnline} টাকা (TrxID: ${esc(o.trxId)})${o.due?`<br><b>ডেলিভারির সময় ডেলিভারি ম্যানকে দিতে হবে:</b> ${o.due} টাকা`:''}</p>${lines.some(l=>l.kind==='borrow')?'<p>ধারের জিনিসের টাকা জামানত। ফেরত দেওয়ার পর ভাড়া কেটে বাকিটা ফেরত পাবে।</p>':''}<p>পেমেন্ট যাচাই হলে জানাব। অর্ডার আইডি: <b>${id}</b><br><a href="https://${q.headers.host}/track">অর্ডারের অবস্থা দেখো</a></p></div>`})])}catch(e){console.log('mail',e.message)}
 s.json({ok:true,id,total:o.total,due:o.due});
};
