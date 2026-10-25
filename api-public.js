const {r,settings}=require('./lib');
module.exports=async(q,s)=>{
 if(q.query.img){const d=await r('HGET','gallery',String(q.query.img)),m=d&&/^data:(image\/[\w+.-]+);base64,(.*)$/.exec(d);if(!m)return s.status(404).end();s.setHeader('Content-Type',m[1]);s.setHeader('Cache-Control','public,max-age=86400');return s.end(Buffer.from(m[2],'base64'))}
 if(q.query.v){try{await r('HINCRBY','visits',new Date().toISOString().slice(0,10),1)}catch{}}
 const out=await settings();
 try{const h=await r('HGETALL','reviews')||[],L=[];for(let i=1;i<h.length;i+=2){const o=JSON.parse(h[i]);if(o.ok)L.push({at:o.at,rating:o.rating,text:o.text,name:o.name})}L.sort((x,y)=>y.at.localeCompare(x.at));out.reviews=L.slice(0,9)}catch{out.reviews=[]}
 try{out.gallery=(await r('HKEYS','gallery')||[]).slice(-9)}catch{out.gallery=[]}
 s.json(out)};
