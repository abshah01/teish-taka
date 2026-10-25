const {r,tok,auth,settings,mail,rt}=require('./lib');
const MSG={Paid:['পেমেন্ট পেয়েছি ✅','তোমার পেমেন্ট যাচাই হয়েছে। এবার চিঠি লেখা শুরু হবে।'],Written:['চিঠি লেখা হয়েছে ✍️','তোমার চিঠি হাতে লেখা হয়ে গেছে। এবার ডেলিভারির অপেক্ষা।'],Delivered:['চিঠি পৌঁছে গেছে 💌','চিঠি প্রাপকের হাতে পৌঁছে গেছে। প্রমাণ তোমার WhatsApp-এ পাঠানো হবে।'],Cancelled:['অর্ডার বাতিল','দুঃখিত, এই অর্ডারটি বাতিল করা হয়েছে। প্রশ্ন থাকলে আমাদের জানাও।']};
module.exports=async(q,s)=>{
 const b=q.body||{},a=q.query.a;
 if(a==='login'){const k='lg:'+String(q.headers['x-forwarded-for']||'x').split(',')[0].trim();try{const n=await r('INCR',k);if(n==1)await r('EXPIRE',k,3600);if(n>10)return s.status(429).json({error:'অনেকবার ভুল হয়েছে। এক ঘণ্টা পরে আবার চেষ্টা করো।'})}catch{}
 const L=(process.env.ADMINS||'').split(',');for(const x of L){const i=x.indexOf(':');if(b.u===x.slice(0,i)&&b.p===x.slice(i+1)){try{await r('DEL',k)}catch{}return s.json({token:tok(b.u,b.p),user:b.u})}}return s.status(401).json({error:'ভুল ID বা Password'})}
 const me=auth(q);if(!me)return s.status(401).json({error:'login লাগবে'});
 if(a==='data'){
  const h=await r('HGETALL','orders')||[],orders=[];for(let i=1;i<h.length;i+=2)orders.push(JSON.parse(h[i]));
  orders.sort((x,y)=>y.at.localeCompare(x.at));
  const v=await r('HGETALL','visits')||[],visits={};for(let i=0;i<v.length;i+=2)visits[v[i]]=+v[i+1];
  return s.json({orders,visits,settings:await settings(),me});
 }
 if(a==='update'){const o=JSON.parse(await r('HGET','orders',b.id)),old=o.status;if(b.status)o.status=b.status;if(b.f)for(const k of['recName','recAddr','recContact','email','wa','message','extra'])if(typeof b.f[k]==='string')o[k]=b.f[k].slice(0,6000);
  if(b.adminNote!==undefined)o.adminNote=String(b.adminNote).slice(0,1000);await r('HSET','orders',b.id,JSON.stringify(o));
  let ml='';if(((b.status&&b.status!==old)||b.resend)&&MSG[o.status]){if(!o.email)ml='no-email';else{try{await mail(o.email,`অর্ডার ${o.id}: ${MSG[o.status][0]}`,`<div style="font-family:sans-serif;max-width:480px;margin:auto;border:6px double #D8382F;padding:20px;background:#FFF6E5"><h2 style="color:#D8382F">তেইশ টাকা ✉️</h2><p><b>${MSG[o.status][0]}</b></p><p>${MSG[o.status][1]}</p>${o.status==='Delivered'?`<p>চিঠিটা কেমন লাগল? <a href="https://${q.headers.host}/review?id=${o.id}&t=${rt(o.id)}">দু-এক লাইনে জানাও</a></p>`:''}<p>অর্ডার আইডি: ${o.id}<br><a href="https://${q.headers.host}/track">অর্ডারের অবস্থা দেখো</a></p></div>`);ml='sent'}catch(e){console.log('mail',e.message);ml='fail: '+e.message}}}
  return s.json({ok:1,mail:ml})}
 if(a==='board'){const h=await r('HGETALL','board')||[],L=[];for(let i=1;i<h.length;i+=2)L.push(JSON.parse(h[i]));L.sort((x,y)=>y.at.localeCompare(x.at));return s.json({items:L})}
 if(a==='badd'){const d=String(b.data||'');if(d.length>900000)return s.status(413).json({error:'ফাইল বড়। ছোট করো বা লিংক দাও'});const id='B'+Date.now().toString(36),c=(v,n)=>String(v||'').slice(0,n);await r('HSET','board',id,JSON.stringify({id,at:new Date().toISOString(),by:me,type:c(b.type,10),title:c(b.title,200),text:c(b.text,5000),name:c(b.name,120),has:!!d}));if(d)await r('HSET','boardfiles',id,d);return s.json({ok:1})}
 if(a==='bfile')return s.json({data:await r('HGET','boardfiles',String(b.id))});
 if(a==='bdel'){await r('HDEL','board',String(b.id));await r('HDEL','boardfiles',String(b.id));return s.json({ok:1})}
 if(a==='reviews'){const h=await r('HGETALL','reviews')||[],L=[];for(let i=1;i<h.length;i+=2)L.push(JSON.parse(h[i]));L.sort((x,y)=>y.at.localeCompare(x.at));return s.json({items:L})}
 if(a==='rvset'){const o=JSON.parse(await r('HGET','reviews',String(b.id)));o.ok=!!b.ok;await r('HSET','reviews',o.id,JSON.stringify(o));return s.json({ok:1})}
 if(a==='rvdel'){await r('HDEL','reviews',String(b.id));return s.json({ok:1})}
 if(a==='gadd'){const d=String(b.data||'');if(!/^data:image\/(jpeg|png|webp);base64,/.test(d)||d.length>400000)return s.status(400).json({error:'ছবি ঠিক নেই বা বেশি বড়'});await r('HSET','gallery','G'+Date.now().toString(36),d);return s.json({ok:1})}
 if(a==='gdel'){await r('HDEL','gallery',String(b.id));return s.json({ok:1})}
 if(a==='delete'){await r('HDEL','orders',b.id);return s.json({ok:1})}
 if(a==='settings'){const t=x=>String(x||'').slice(0,200);await r('SET','settings',JSON.stringify({methods:(Array.isArray(b.methods)?b.methods:[]).slice(0,10).map(m=>({name:t(m.name).slice(0,20),number:t(m.number).slice(0,30),on:!!m.on})).filter(m=>m.name),posts:String(b.posts||'').slice(0,2000),open:b.open!==false,closedMsg:String(b.closedMsg||'').slice(0,200),fb:t(b.fb),ig:t(b.ig),wa:t(b.wa),notice:t(b.notice),base:+b.base||23,note:+b.note||2,freeWords:+b.freeWords||150,blockWords:+b.blockWords||100,blockPrice:(v=>isNaN(v)||v<0?10:v)(parseFloat(b.blockPrice))}));return s.json({ok:1})}
 s.status(400).json({error:'?'});
};
