const {r}=require('./lib');
module.exports=async(q,s)=>{const id=String(q.query.id||'').trim().toUpperCase(),em=String(q.query.email||'').trim().toLowerCase();
 const v=id&&await r('HGET','orders',id),nf=()=>s.status(404).json({error:'অর্ডার পাওয়া যায়নি। আইডি আর ইমেইল ঠিক আছে কিনা দেখো।'});
 if(!v)return nf();const o=JSON.parse(v);if(String(o.email).toLowerCase()!==em)return nf();
 const out={id:o.id,status:o.status,kind:o.kind||'letter',recName:o.recName||(o.letter&&o.letter.recName)||'',at:o.at,custMsg:o.custMsg||''};
 if(o.kind==='shop'){out.lines=(o.lines||[]).map(l=>({name:l.name,qty:l.qty,price:l.price,ok:l.ok!==false}));out.hasLetter=!!(o.letter&&!o.letter.off);out.delivery=o.delivery;out.total=o.total;out.paidOnline=o.paidOnline;out.due=o.due;out.refundDue=o.refundDue;out.refundDone=!!o.refundDone}
 s.json(out)};
