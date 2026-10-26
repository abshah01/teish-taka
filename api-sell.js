const {r,settings,digits}=require('./lib');const nm=require('nodemailer');
const c=(v,n)=>String(v==null?'':v).slice(0,n||300),esc=v=>c(v,3000).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
const SELL=['market','borrow','food'];
module.exports=async(q,s)=>{
 const st=await settings();
 if(q.method==='GET'){s.setHeader('Cache-Control','no-store');return s.json({methods:st.methods,listFee:st.listFee,foodFee:st.foodFee,services:(st.services||[]).filter(x=>SELL.includes(x.type)).map(x=>({id:x.id,type:x.type,emoji:x.emoji,title:x.title,status:x.status}))})}
 if(q.method!=='POST')return s.status(405).end();
 const b=q.body||{};if(b.website)return s.json({ok:true,id:'Q0'});
 const sv=(st.services||[]).find(x=>x.id===b.sid&&SELL.includes(x.type));
 if(!sv)return s.status(400).json({error:'এই সেবা পাওয়া যায়নি'});
 if(sv.status!=='live')return s.status(403).json({error:'এই সেবায় এখন নতুন পোস্ট নেওয়া বন্ধ আছে।'});
 try{const ip=String(q.headers['x-forwarded-for']||'x').split(',')[0].trim(),k='rl:s'+ip,n=await r('INCR',k);if(n==1)await r('EXPIRE',k,3600);if(n>6)return s.status(429).json({error:'অনেকবার চেষ্টা হয়েছে। এক ঘণ্টা পরে আবার চেষ্টা করো।'})}catch{}
 if(!b.agree)return s.status(400).json({error:'নিয়মে সম্মতি দিতে হবে'});
 const price=Math.round(+b.price),rent=Math.round(+b.rent||0);
 if(!c(b.title,100).trim()||!(price>0))return s.status(400).json({error:'জিনিসের নাম আর দাম ঠিকমতো দাও'});
 if(sv.type==='borrow'&&!(rent>0))return s.status(400).json({error:'প্রতিদিনের ভাড়া দিতে হবে'});
 if(!b.name||!b.phone||!b.email||!b.trxId)return s.status(400).json({error:'তোমার নাম, ফোন, ইমেইল আর TrxID দিতে হবে'});
 if(!st.methods.some(m=>m.on&&m.number&&m.name===b.pay))return s.status(400).json({error:'পেমেন্ট মেথড ঠিক নেই'});
 const ph=(Array.isArray(b.photos)?b.photos:[]).slice(0,3);
 for(const d of ph)if(!/^data:image\/(jpeg|png|webp);base64,/.test(String(d))||String(d).length>170000)return s.status(400).json({error:'ছবি ঠিক নেই বা বেশি বড়'});
 if(sv.type!=='food'&&!ph.length)return s.status(400).json({error:'অন্তত একটা ছবি দাও'});
 const id='Q'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,4).toUpperCase();
 const p={id,sid:sv.id,type:sv.type,title:c(b.title,100).trim(),price,rent:sv.type==='borrow'?rent:0,desc:c(b.desc,800),photos:ph.length,status:'Pending',at:Date.now(),
  seller:{name:c(b.name,100),phone:c(b.phone,30),email:c(b.email,120).toLowerCase(),key:digits(b.phone)},pay:c(b.pay,20),trxId:c(b.trxId,60),adminMsg:''};
 try{if((await r('HSETNX','trx',p.trxId.toUpperCase().replace(/\s/g,''),id))==0)p.dup=true}catch{}
 for(let i=0;i<ph.length;i++)await r('HSET','pimgs',id+':'+i,ph[i]);
 await r('HSET','posts',id,JSON.stringify(p));
 try{const t=nm.createTransport({service:'gmail',auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASS}});
  await Promise.all([t.sendMail({from:`তেইশ টাকা <${process.env.GMAIL_USER}>`,to:process.env.GMAIL_USER,subject:`নতুন পোস্ট (${sv.title}) ${id}`,html:`<p><b>${esc(p.title)}</b> · ${p.price}৳${p.rent?' · ভাড়া '+p.rent+'৳/দিন':''}<br>${esc(p.desc)}</p><p>সেলার: ${esc(p.seller.name)} · ${esc(p.seller.phone)} · ${esc(p.seller.email)}<br>ফি: ${esc(p.pay)} · TrxID ${esc(p.trxId)}</p>`}),
  t.sendMail({from:`তেইশ টাকা <${process.env.GMAIL_USER}>`,to:p.seller.email,subject:`পোস্ট জমা হয়েছে ${id} — তেইশ টাকা`,html:`<div style="font-family:sans-serif;max-width:480px;margin:auto;border:6px double #B8322A;padding:20px;background:#F3E3C0"><h2 style="color:#B8322A">তেইশ টাকা</h2><p>তোমার পোস্ট (${esc(p.title)}) জমা হয়েছে। ফি যাচাই করে অ্যাপ্রুভ করলে সাইটে দেখা যাবে।</p><p>পোস্ট আইডি: <b>${id}</b><br>অবস্থা দেখো: <a href="https://${q.headers.host}/track">https://${q.headers.host}/track</a> (পোস্ট আইডি আর ইমেইল লাগবে)</p></div>`})])}catch(e){console.log('mail',e.message)}
 s.json({ok:true,id});
};
