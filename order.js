const {r,settings}=require('./_lib');const nm=require('nodemailer');
const c=v=>String(v||'').slice(0,3000),esc=v=>c(v).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
module.exports=async(q,s)=>{
 if(q.method!=='POST')return s.status(405).end();
 const b=q.body||{};
 if(!b.recName||!b.recAddr||!b.recContact||!b.message||!b.trxId||!b.email)return s.status(400).json({error:'সব দরকারি ঘর পূরণ করুন'});
 const st=await settings();
 const id='T'+Date.now().toString(36).toUpperCase();
 const o={id,at:new Date().toISOString(),status:'Pending',senderName:c(b.senderName),anon:!!b.anon,email:c(b.email),wa:c(b.wa),
  recName:c(b.recName),recAddr:c(b.recAddr),recContact:c(b.recContact),message:c(b.message),extra:c(b.extra),
  pay:c(b.pay),trxId:c(b.trxId),total:st.base+st.note,adminNote:''};
 await r('HSET','orders',id,JSON.stringify(o));
 try{
  const t=nm.createTransport({service:'gmail',auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASS}});
  const rows=Object.entries(o).map(([k,v])=>`<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('');
  await Promise.all([
   t.sendMail({from:`তেইশ টাকা <${process.env.GMAIL_USER}>`,to:process.env.GMAIL_USER,subject:`নতুন চিঠির অর্ডার ${id}`,html:`<table border=1 cellpadding=6>${rows}</table>`}),
   t.sendMail({from:`তেইশ টাকা <${process.env.GMAIL_USER}>`,to:o.email,subject:`অর্ডার কনফার্মেশন ${id} — তেইশ টাকা`,
    html:`<div style="font-family:sans-serif;max-width:480px;margin:auto;border:6px double #B8322A;padding:20px;background:#F3E3C0"><h2 style="color:#B8322A">তেইশ টাকা ✉️</h2><p>আপনার চিঠির অর্ডার পেয়েছি।</p><p><b>অর্ডার আইডি:</b> ${id}<br><b>প্রাপক:</b> ${esc(o.recName)}<br><b>পেমেন্ট:</b> ${esc(o.pay)} (TrxID: ${esc(o.trxId)})<br><b>মোট:</b> ${o.total} টাকা</p><p>পেমেন্ট যাচাই হলেই চিঠি হাতে লেখা শুরু হবে। চিঠি পৌঁছালে WhatsApp-এ প্রমাণ পাঠানো হবে।</p><p>২৩ টাকা চিঠির, ২ টাকা “তুমি আর আমি”র। 🤍</p></div>`})]);
 }catch(e){console.log('mail',e.message)}
 s.json({ok:true,id});
};
