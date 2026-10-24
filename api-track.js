const {r}=require('./lib');
module.exports=async(q,s)=>{const id=String(q.query.id||'').trim().toUpperCase(),em=String(q.query.email||'').trim().toLowerCase();
 const v=id&&await r('HGET','orders',id),nf=()=>s.status(404).json({error:'অর্ডার পাওয়া যায়নি। আইডি আর ইমেইল ঠিক আছে কিনা দেখো।'});
 if(!v)return nf();const o=JSON.parse(v);if(String(o.email).toLowerCase()!==em)return nf();
 s.json({id:o.id,status:o.status,recName:o.recName,at:o.at});};
