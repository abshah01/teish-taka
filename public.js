const {r,settings}=require('./_lib');
module.exports=async(q,s)=>{
 if(q.query.v){try{await r('HINCRBY','visits',new Date().toISOString().slice(0,10),1)}catch{}}
 s.json(await settings());
};
