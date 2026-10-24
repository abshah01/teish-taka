const crypto=require('crypto');
const U=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL,T=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
exports.r=async(...c)=>{const x=await fetch(U,{method:'POST',headers:{Authorization:'Bearer '+T},body:JSON.stringify(c)});return (await x.json()).result};
const tok=(u,p)=>crypto.createHmac('sha256',process.env.SECRET||'change-me').update(u+':'+p).digest('hex');
exports.tok=tok;
exports.auth=q=>{const t=q.headers['x-token'];for(const a of (process.env.ADMINS||'').split(',')){const i=a.indexOf(':');const u=a.slice(0,i),p=a.slice(i+1);if(u&&t===tok(u,p))return u}return null};
exports.DEF={bkash:'01552326923',nagad:'01342162933',base:23,note:2,notice:'অর্ডারের পর ২৪–৭২ ঘণ্টার মধ্যে চিঠি পৌঁছে যাবে।'};
exports.settings=async()=>{try{return{...exports.DEF,...JSON.parse(await exports.r('GET','settings')||'{}')}}catch{return exports.DEF}};
