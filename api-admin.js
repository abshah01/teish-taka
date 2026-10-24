const {r,tok,auth,settings,mail}=require('./lib');
const MSG={Paid:['পেমেন্ট পেয়েছি ✅','তোমার পেমেন্ট যাচাই হয়েছে। এবার চিঠি লেখা শুরু হবে।'],Written:['চিঠি লেখা হয়েছে ✍️','তোমার চিঠি হাতে লেখা হয়ে গেছে। এবার ডেলিভারির অপেক্ষা।'],Delivered:['চিঠি পৌঁছে গেছে 💌','চিঠি প্রাপকের হাতে পৌঁছে গেছে। প্রমাণ তোমার WhatsApp-এ পাঠানো হবে।'],Cancelled:['অর্ডার বাতিল','দুঃখিত, এই অর্ডারটি বাতিল করা হয়েছে। প্রশ্ন থাকলে আমাদের জানাও।']};
module.exports=async(q,s)=>{
 const b=q.body||{},a=q.query.a;
 if(a==='login'){const L=(process.env.ADMINS||'').split(',');for(const x of L){const i=x.indexOf(':');if(b.u===x.slice(0,i)&&b.p===x.slice(i+1))return s.json({token:tok(b.u,b.p),user:b.u})}return s.status(401).json({error:'ভুল ID বা Password'})}
 const me=auth(q);if(!me)return s.status(401).json({error:'login লাগবে'});
 if(a==='data'){
  const h=await r('HGETALL','orders')||[],orders=[];for(let i=1;i<h.length;i+=2)orders.push(JSON.parse(h[i]));
  orders.sort((x,y)=>y.at.localeCompare(x.at));
  const v=await r('HGETALL','visits')||[],visits={};for(let i=0;i<v.length;i+=2)visits[v[i]]=+v[i+1];
  return s.json({orders,visits,settings:await settings(),me});
 }
 if(a==='update'){const o=JSON.parse(await r('HGET','orders',b.id));const old=o.status;if(b.status)o.status=b.status;if(b.adminNote!==undefined)o.adminNote=String(b.adminNote).slice(0,1000);await r('HSET','orders',b.id,JSON.stringify(o));
  if(b.status&&b.status!==old&&MSG[b.status]&&o.email){try{await mail(o.email,`অর্ডার ${o.id}: ${MSG[b.status][0]}`,`<div style="font-family:sans-serif;max-width:480px;margin:auto;border:6px double #D8382F;padding:20px;background:#FFF6E5"><h2 style="color:#D8382F">তেইশ টাকা ✉️</h2><p><b>${MSG[b.status][0]}</b></p><p>${MSG[b.status][1]}</p><p>অর্ডার আইডি: ${o.id}<br><a href="https://${q.headers.host}/track">অর্ডারের অবস্থা দেখো</a></p></div>`)}catch(e){console.log('mail',e.message)}}
  return s.json({ok:1})}
 if(a==='delete'){await r('HDEL','orders',b.id);return s.json({ok:1})}
 if(a==='settings'){const t=x=>String(x||'').slice(0,200);await r('SET','settings',JSON.stringify({methods:(Array.isArray(b.methods)?b.methods:[]).slice(0,10).map(m=>({name:t(m.name).slice(0,20),number:t(m.number).slice(0,30),on:!!m.on})).filter(m=>m.name),fb:t(b.fb),ig:t(b.ig),wa:t(b.wa),notice:t(b.notice),base:+b.base||23,note:+b.note||2}));return s.json({ok:1})}
 s.status(400).json({error:'?'});
};
