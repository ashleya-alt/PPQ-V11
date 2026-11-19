import { CAMPAIGNS } from '../src/data/campaigns';
import * as C from '../src/data/constants';
const bad=[/Managed Payments/i,/Managed Services/i,/\bSMP\b/,/SaaS [123]\.0/,/payments_lead/,/Training Grounds/i,/\bHead of Payments joins/i];
const hits:string[]=[];
for(const [pid,encs] of Object.entries(CAMPAIGNS)) for(const e of encs){const t=JSON.stringify(e);bad.forEach(b=>{if(b.test(t))hits.push(pid+':'+e.id+' '+b)});}
const ct=JSON.stringify(C);bad.forEach(b=>{if(b.test(ct))hits.push('constants '+b)});
console.log(hits.length?hits.join('\n'):'campaign+constants clean');
