// Real response component, fictitious same-origin API; no production services.
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright')
const root=resolve(import.meta.dirname,'..'),directory=await mkdtemp(join(tmpdir(),'higia-revalidation-ui-')),origin='http://127.0.0.1:5188'
let server,browser
const external=[],writes=[],errors=[]
const reasons=['source_timeout','shared_phone','patient_changed','transport_blocked','fixture-unknown-private-value']
try{
 await symlink(join(root,'node_modules'),join(directory,'node_modules'),'dir')
 await writeFile(join(directory,'index.html'),'<div id="root"></div><script type="module" src="/main.tsx"></script>')
 await writeFile(join(directory,'main.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import {ConfirmacaoRespostas} from '/@fs/${root}/src/pages/ConfirmacaoRespostas.tsx';createRoot(document.getElementById('root')).render(<ConfirmacaoRespostas campaignId={1}/>);`)
 server=await createServer({root:directory,configFile:false,envDir:false,plugins:[react()],define:{'import.meta.env.VITE_API_URL':JSON.stringify('/api')},server:{host:'127.0.0.1',port:5188,strictPort:true,fs:{allow:[root,directory]}}})
 await server.listen();browser=await chromium.launch({headless:true});const context=await browser.newContext();const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
 await context.route('**/*',route=>{
  const r=route.request(),u=new URL(r.url());if(u.origin!==origin){external.push(true);return route.abort()}
  if(!u.pathname.startsWith('/api/'))return route.continue()
  if(r.method()!=='GET'){writes.push(true);return route.abort()}
  assert.equal(u.pathname,'/api/confirmation-campaigns/1/responses')
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({dispatchEnabled:false,responses:reasons.map((reason,index)=>({executionKey:'fixture-'+index,itemId:index+1,appointmentTime:'09:00',transportStatus:'blocked',deliveryStatus:null,responseStatus:'needs_review',appointmentStatus:'not_requested',reason,updatedAt:'2099-03-05T12:00:00.000Z',responseDeadlineAt:'2099-03-05T18:00:00.000Z',conversationUrl:null})),pending:reasons.map((reason,index)=>({id:'fixture-pending-'+index,executionKey:'fixture-'+index,reason,status:'OPEN',version:0,assignedUserId:null,resolution:null,createdAt:'2099-03-05T12:00:00.000Z'})),events:[],actions:[],users:[]})})
 })
 await page.goto(origin)
 for(const label of ['Consulta da agenda excedeu o tempo de espera','Telefone vinculado a mais de um agendamento','Paciente diferente do aprovado — revisão necessária','Tentativa bloqueada — análise interna','Situação indisponível'])await page.getByText(label+' · Aberta',{exact:true}).waitFor()
 const body=await page.locator('body').innerText()
 for(const reason of reasons)assert.ok(!body.includes(reason))
 assert.deepEqual(external,[]);assert.deepEqual(writes,[]);assert.deepEqual(errors,[])
 console.log(JSON.stringify({passed:true,checks:5,messagesSent:0,patientWrites:0}))
}finally{await browser?.close();await server?.close();await rm(directory,{recursive:true,force:true})}
