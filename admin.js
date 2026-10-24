const {r,tok,auth,settings}=require('./_lib');
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
 if(a==='update'){const o=JSON.parse(await r('HGET','orders',b.id));if(b.status)o.status=b.status;if(b.adminNote!==undefined)o.adminNote=String(b.adminNote).slice(0,1000);await r('HSET','orders',b.id,JSON.stringify(o));return s.json({ok:1})}
 if(a==='delete'){await r('HDEL','orders',b.id);return s.json({ok:1})}
 if(a==='settings'){await r('SET','settings',JSON.stringify({bkash:String(b.bkash),nagad:String(b.nagad),notice:String(b.notice).slice(0,300),base:+b.base||23,note:+b.note||2}));return s.json({ok:1})}
 s.status(400).json({error:'?'});
};
