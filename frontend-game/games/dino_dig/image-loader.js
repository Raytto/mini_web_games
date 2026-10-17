// Keep successful pictures; only retry the missing picture. A round owns its
// pending work so restarting or leaving cannot resurrect an older round.
export function createImageLoader({images,url,paused,onReady=()=>{}}){
 const pending=new Map();let closed=false;
 // Some browsers report "offline" even while ordinary requests succeed.
 // Actual image requests decide availability; the online event only wakes us.
 const available=()=>!closed&&!paused();
 function clear(job,abort=false){
  clearTimeout(job.timer);clearTimeout(job.retry);
  if(job.image){job.image.onload=job.image.onerror=null;if(abort)job.image.removeAttribute('src');}
  job.running=false;
 }
 function finish(job,image){
  if(job.done)return;job.done=true;clear(job,!image);pending.delete(job.name);
  if(image){images.set(job.name,image);onReady(job.name,image);}
  job.resolve(image);
 }
 function attempt(job){
  if(job.done||job.running||!available())return;
  clearTimeout(job.retry);job.running=true;job.tries++;
  const image=new Image();job.image=image;image.decoding='async';image.fetchPriority=/^(site-|dino-)/.test(job.name)?'low':'high';
  const fail=()=>{
   if(job.done||job.image!==image)return;
   clear(job,true);
   // Quick recovery for a single dropped request; bounded traffic during a
   // sustained outage. Returning online/foreground wakes pending work sooner.
   const delay=[400,1200,3000,8000,15000][Math.min(job.tries-1,4)];
   job.retry=setTimeout(()=>attempt(job),delay);
  };
  image.onload=()=>{if(image.naturalWidth>0)finish(job,image);else fail();};
  image.onerror=fail;
  // Do not discard an ordinary slow download after 6.5 seconds. A truly stuck
  // request is retried, with a larger window for slower connections.
  job.timer=setTimeout(fail,Math.min(60000,15000*2**Math.min(job.tries-1,2)));
  image.src=url(job.name)+(job.refresh||job.tries>1?'&retry='+Date.now()+'-'+job.tries:'');
 }
 function load(name,refresh=false){
  if(closed)return Promise.resolve(null);
  if(pending.has(name))return pending.get(name).promise;
  if(!refresh&&images.has(name))return Promise.resolve(images.get(name));
  const job={name,refresh,tries:0,running:false,done:false,image:null,timer:null,retry:null};
  job.promise=new Promise(resolve=>{job.resolve=resolve;});pending.set(name,job);attempt(job);return job.promise;
 }
 function resume(){if(available())for(const job of pending.values())if(!job.running)attempt(job);}
 function cancel(){for(const job of [...pending.values()])finish(job,null);}
 function close(){closed=true;cancel();window.removeEventListener('online',resume);window.removeEventListener('pageshow',resume);document.removeEventListener('visibilitychange',resume);}
 window.addEventListener('online',resume);window.addEventListener('pageshow',resume);document.addEventListener('visibilitychange',resume);window.addEventListener('beforeunload',close,{once:true});
 return {load,cancel,resume};
}
