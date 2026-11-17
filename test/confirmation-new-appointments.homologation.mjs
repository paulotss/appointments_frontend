// Real campaign page with only synthetic APIs and an external-network deny.
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const root=resolve(import.meta.dirname,'..'),directory=await mkdtemp(join(tmpdir(),'higia-new-appointments-ui-')),origin='http://127.0.0.1:5189'
const ref=byte=>'appt:v1:fixture:'+byte.repeat(64)
const old={id:101,appointmentRef:ref('a'),patientRef:'patient:v1:fixture:'+'a'.repeat(64),recipientRef:'recipient:v1:fixture:'+'a'.repeat(64),informedPhoneRef:'phone:v1:fixture:'+'a'.repeat(64),appointmentTime:'09:00',recipientState:'ELIGIBLE',reasonCode:'contact_ready',displayName:'Fixture Existing',professionalName:'Fixture Professional',maskedPhone:'(00) *****-0000',identityStatus:'ready'}
const own={...old,appointmentRef:ref('b'),appointmentTime:'18:30',displayName:'Fixture Own Test'};delete own.id
const other={...own,appointmentRef:ref('c'),appointmentTime:'16:00',displayName:'Fixture Other',professionalName:'Other Professional'}
const revision='d'.repeat(64),sourceRevision='e'.repeat(64)
let server,browser
const checks=[]
const passed=label=>{checks.push(label);console.log('PASS '+label)}
try{
 await symlink(join(root,'node_modules'),join(directory,'node_modules'),'dir')
 await writeFile(join(directory,'index.html'),'<html><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>')
 await writeFile(join(directory,'main.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter,Routes,Route,Link,useNavigate} from 'react-router-dom';import {ConfirmacaoCampanhaPage} from '/@fs/${root}/src/pages/ConfirmacaoCampanhaPage.tsx';function Navigation(){const navigate=useNavigate();globalThis.fixtureNavigate=()=>navigate('/confirmacao/campanhas/2');return <Link to="/confirmacao/campanhas/2">Campanha fictícia 2</Link>}createRoot(document.getElementById('root')).render(<BrowserRouter><Navigation/><Routes><Route path="/confirmacao/campanhas/:id" element={<ConfirmacaoCampanhaPage/>}/></Routes></BrowserRouter>);`)
 server=await createServer({root:directory,configFile:false,envDir:false,plugins:[react()],define:{'import.meta.env.VITE_API_URL':JSON.stringify('/api')},server:{host:'127.0.0.1',port:5189,strictPort:true,fs:{allow:[root,directory]}}});await server.listen();browser=await chromium.launch({headless:true})
 async function scenario(options={}){
  const context=await browser.newContext();const external=[],writes=[],errors=[];let previews=0
  let campaign={id:1,campaignDate:'2099-03-06',source:'SAUDEVIANET',sourceLabel:'Fixture',status:options.approved?'APPROVED':'IN_REVIEW',approvedAt:options.approved?'2099-03-05T12:00:00Z':null,responseDeadlineAt:'2099-03-05T18:00:00Z',consultationState:'READY',consultationReason:null,appointmentsAnalyzed:1,eligibleRecipients:1,pendingVerifications:0,unavailableRecipients:0,technicalFailures:0,dispatchEnabled:false,events:[],items:[old]}
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method()
   if(url.origin!==origin){external.push(url.origin);return route.abort()}
   if(!path.startsWith('/api/'))return route.continue()
   const ok=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)})
   if(method!=='GET')writes.push({path,body:req.postDataJSON()})
   if(/\/confirmation-campaigns\/\d+$/.test(path)&&method==='GET')return ok(path.includes('/2')?{...campaign,id:2,campaignDate:'2099-03-07',items:[{...old,displayName:'Fixture Campaign Two'}]}:campaign)
   if(path.endsWith('/send-release'))return ok({revision,version:0,active:false,itemIds:[],eligibleItemIds:[],updatedAt:null})
   if(path.endsWith('/responses'))return ok({dispatchEnabled:false,responses:[],pending:[],events:[],actions:[],users:[]})
   if(path.endsWith('/simulations'))return ok([])
   if(path.endsWith('/reopen')){campaign={...campaign,status:'IN_REVIEW',approvedAt:null};return ok(campaign,201)}
   if(path.endsWith('/new-appointments')){
    previews++;if(options.previewDelay)await new Promise(r=>setTimeout(r,350))
    if(options.previewFailure)return ok({message:'Fixture source unavailable'},503)
    return ok({revision,sourceRevision,dispatchEnabled:false,identityStatus:'ready',items:[own,other].filter(i=>!campaign.items.some(c=>c.appointmentRef===i.appointmentRef))})
   }
   if(path.endsWith('/include-appointments')){
    const body=req.postDataJSON();assert.deepEqual(body,{revision,sourceRevision,appointmentRefs:[own.appointmentRef]})
    if(options.includeDelay)await new Promise(r=>setTimeout(r,350))
    if(options.conflict)return ok({message:'A agenda mudou desde a conferência. Consulte os novos agendamentos novamente.'},409)
    campaign={...campaign,appointmentsAnalyzed:2,eligibleRecipients:2,items:[old,{...own,id:102}]}
    if(options.unknown)return route.abort('failed')
    return ok(campaign,201)
   }
   throw Error('Unexpected synthetic endpoint: '+path)
  })
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/confirmacao/campanhas/1');await page.getByRole('heading',{name:'Campanha 2099-03-06',exact:true}).waitFor()
  return {context,page,writes,external,errors,getPreviews:()=>previews,getCampaign:()=>campaign,close:async()=>{assert.deepEqual(external,[]);assert.deepEqual(errors,[]);await context.close()}}
 }
 async function choose(f){await f.page.getByRole('button',{name:'Consultar novos agendamentos',exact:true}).click();await f.page.getByRole('dialog').getByText(/Fixture Own Test/).waitFor();await f.page.getByRole('checkbox',{name:/Fixture Own Test/}).check()}
 {
  const f=await scenario({approved:true});assert.equal(await f.page.getByRole('button',{name:'Consultar novos agendamentos',exact:true}).isDisabled(),true)
  await f.page.getByRole('button',{name:'Reabrir revisão',exact:true}).click();await f.page.getByRole('button',{name:'Consultar novos agendamentos',exact:true}).waitFor();await choose(f)
  assert.equal(f.writes.length,1);assert.equal(f.getPreviews(),1)
  await f.page.getByRole('button',{name:'Incluir selecionados',exact:true}).click();await f.page.getByRole('dialog').waitFor({state:'hidden'});await f.page.getByRole('row').filter({hasText:'Fixture Own Test'}).waitFor()
  assert.equal(await f.page.getByRole('row').filter({hasText:'Fixture Existing'}).count(),1);assert.equal(await f.page.getByRole('row').filter({hasText:'Fixture Other'}).count(),0)
  assert.equal(f.writes.filter(w=>w.path.endsWith('/include-appointments')).length,1);assert.deepEqual(f.getCampaign().items.map(i=>i.id),[101,102])
  assert.doesNotMatch(await f.page.locator('body').innerText(),/appt:v1:|patient:v1:|phone:v1:/)
  await f.close();passed('approved campaign requires reopening; preview is read-only; only selected new item is appended and old row stays')
 }
 {
  const f=await scenario({unknown:true});await choose(f);await f.page.getByRole('button',{name:'Incluir selecionados',exact:true}).click();await f.page.getByRole('button',{name:'Conferir campanha',exact:true}).waitFor()
  assert.equal(await f.page.getByRole('button',{name:'Incluir selecionados',exact:true}).count(),0)
  await f.page.getByRole('button',{name:'Conferir campanha',exact:true}).click();await f.page.getByRole('dialog').waitFor({state:'hidden'});await f.page.getByRole('row').filter({hasText:'Fixture Own Test'}).waitFor()
  assert.equal(f.writes.length,1);await f.close();passed('unknown write result is checked through GET and never resubmitted')
 }
 {
  const f=await scenario({conflict:true});await choose(f);await f.page.getByRole('button',{name:'Incluir selecionados',exact:true}).click();await f.page.getByText('A agenda mudou desde a conferência. Consulte os novos agendamentos novamente.',{exact:true}).waitFor()
  assert.equal(f.getCampaign().items.length,1);assert.equal(f.writes.length,1);await f.close();passed('concurrent source change remains a visible rejection without adding an item')
 }
 {
  const f=await scenario({previewFailure:true});await f.page.getByRole('button',{name:'Consultar novos agendamentos',exact:true}).click();await f.page.getByText('Fixture source unavailable',{exact:true}).waitFor()
  assert.equal(f.writes.length,0);assert.equal(f.getPreviews(),1);assert.equal(await f.page.getByRole('button',{name:'Incluir selecionados',exact:true}).isDisabled(),true);await f.close();passed('source failure performs no write and no automatic retry')
 }
 {
  const f=await scenario({previewDelay:true});await f.page.getByRole('button',{name:'Consultar novos agendamentos',exact:true}).click();await f.page.evaluate(()=>globalThis.fixtureNavigate());await f.page.getByRole('heading',{name:'Campanha 2099-03-07',exact:true}).waitFor();await new Promise(r=>setTimeout(r,500))
  assert.equal(await f.page.getByRole('dialog').count(),0);assert.equal(f.writes.length,0);await f.close();passed('late preview cannot replace another campaign after navigation')
 }
 {
  const f=await scenario({includeDelay:true});await choose(f);await f.page.getByRole('button',{name:'Incluir selecionados',exact:true}).evaluate(el=>{el.click();el.click()});await f.page.evaluate(()=>globalThis.fixtureNavigate());await f.page.getByRole('heading',{name:'Campanha 2099-03-07',exact:true}).waitFor();await new Promise(r=>setTimeout(r,500))
  assert.equal(f.writes.length,1);assert.equal(await f.page.getByRole('row').filter({hasText:'Fixture Own Test'}).count(),0);assert.equal(f.getCampaign().items.length,2);await f.close();passed('repeated click creates one request and late mutation cannot replace the next campaign')
 }
 console.log(JSON.stringify({passed:true,checks:checks.length,realPatientWrites:0,messagesSent:0}))
}finally{await browser?.close();await server?.close();await rm(directory,{recursive:true,force:true})}
