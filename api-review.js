const {r,rt}=require('./lib');
module.exports=async(q,s)=>{
 const b=q.body||{},id=String(b.id||''),bad=m=>s.status(400).json({error:m});
 if(q.method!=='POST'||!id||b.t!==rt(id))return bad('লিংকটা ঠিক নেই');
 const v=await r('HGET','orders',id);if(!v)return bad('অর্ডার পাওয়া যায়নি');
 const o=JSON.parse(v);if(o.status!=='Delivered')return bad('চিঠি পৌঁছানোর পর রিভিউ দেওয়া যাবে');
 const text=String(b.text||'').trim().slice(0,400);if(text.length<3)return bad('দু-এক লাইন লেখো');
 const rating=Math.min(5,Math.max(1,+b.rating||5)),name=b.anon?'একজন বন্ধু':(String(b.name||o.senderName||'').trim().slice(0,40)||'একজন বন্ধু');
 if(!(await r('HSETNX','reviews',id,JSON.stringify({id,at:new Date().toISOString(),rating,text,name,ok:false}))))return bad('এই অর্ডারের রিভিউ আগেই দেওয়া হয়েছে');
 s.json({ok:true})};
