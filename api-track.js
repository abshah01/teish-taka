const {r}=require('./lib');
module.exports=async(q,s)=>{const id=String(q.query.id||'').trim().toUpperCase(),em=String(q.query.email||'').trim().toLowerCase();
 const nf=()=>s.status(404).json({error:'পাওয়া যায়নি। আইডি আর ইমেইল ঠিক আছে কিনা দেখো।'});
 if(id[0]==='Q'){const v=await r('HGET','posts',id);if(!v)return nf();const p=JSON.parse(v);if(String(p.seller&&p.seller.email).toLowerCase()!==em)return nf();
  const cl=await r('HGET','claims',id);let state=p.status==='Live'?'live':p.status.toLowerCase();if(p.status==='Live'&&cl&&p.type!=='food')state=p.type==='borrow'?'booked':'sold';
  return s.json({id:p.id,kind:'post',title:p.title,type:p.type,state,adminMsg:p.adminMsg||''})}
 const v=id&&await r('HGET','orders',id);
 if(!v)return nf();const o=JSON.parse(v);if(String(o.email).toLowerCase()!==em)return nf();
 const out={id:o.id,status:o.status,kind:o.kind||'letter',recName:o.recName||(o.letter&&o.letter.recName)||'',at:o.at,custMsg:o.custMsg||'',bumps:(o.bumps||[]).map(x=>({name:x.name,price:x.price,ok:x.ok!==false}))};
 if(o.kind==='shop'){out.lines=(o.lines||[]).map(l=>({name:l.name,qty:l.qty,price:l.price,ok:l.ok!==false,kind:l.kind||'shop',ret:l.ret?{days:l.ret.days,rent:l.ret.rent,refund:l.ret.refund,refunded:!!l.ret.refunded}:null}));out.hasLetter=!!(o.letter&&!o.letter.off);out.delivery=o.delivery;out.total=o.total;out.paidOnline=o.paidOnline;out.due=o.due;out.refundDue=o.refundDue;out.refundDone=!!o.refundDone}
 s.json(out)};
