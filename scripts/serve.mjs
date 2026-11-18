import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.woff':'font/woff','.png':'image/png','.xml':'application/xml','.txt':'text/plain'};
const args=process.argv.slice(2);
const port=Number(args.includes('--port')?args[args.indexOf('--port')+1]:(process.env.PORT||3000));
const host=args.includes('--host')?args[args.indexOf('--host')+1]:'0.0.0.0';
http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root,pathname.startsWith('/qa/')?'.':'docs','.'+pathname);
  const allowed=pathname.startsWith('/qa/')?path.join(root,'qa'):path.join(root,'docs');
  if(!target.startsWith(allowed+path.sep)&&target!==allowed)throw new Error('Invalid path');
  const info=await stat(target);const file=info.isDirectory()?path.join(target,'index.html'):target;
  const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(port,host,()=>console.log(`Portfolio preview listening on ${port}`));
