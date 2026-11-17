// Real UI, synthetic same-origin API, no clinic services or credentials.
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const root = resolve(import.meta.dirname, '..')
const directory = await mkdtemp(join(tmpdir(), 'higia-send-release-ui-'))
const origin = 'http://127.0.0.1:5188'
let server, browser
try {
  await symlink(join(root,'node_modules'),join(directory,'node_modules'),'dir')
  await writeFile(join(directory,'index.html'),'<html><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>')
  await writeFile(join(directory,'main.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import {ConfirmacaoEnvios} from '/@fs/${root}/src/pages/ConfirmacaoEnvios.tsx';const campaign={id:1,status:'APPROVED',items:[{id:101,appointmentTime:'09:00',displayName:'Paciente Fictício',professionalName:'Profissional Fictício'},{id:102,displayName:'Paciente Bloqueado'}]};createRoot(document.getElementById('root')).render(<ConfirmacaoEnvios campanha={campaign}/>);`)
  server=await createServer({root:directory,configFile:false,envDir:false,plugins:[react()],define:{'import.meta.env.VITE_API_URL':JSON.stringify('/api')},server:{host:'127.0.0.1',port:5188,strictPort:true,fs:{allow:[root,directory]}}})
  await server.listen()
  browser=await chromium.launch({headless:true})
  const context=await browser.newContext()
  let state={revision:'a'.repeat(64),version:0,active:false,itemIds:[],eligibleItemIds:[101],updatedAt:null}
  const writes=[],external=[]
  let conflict=false
  await context.route('**/*', async route=>{
    const request=route.request(),url=new URL(request.url())
    if(url.origin!==origin){external.push(url.origin);return route.abort()}
    if(!url.pathname.startsWith('/api/'))return route.continue()
    const reply=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)})
    if(request.method()==='GET')return reply(state)
    const body=request.postDataJSON();writes.push({path:url.pathname,body})
    if(conflict)return reply({message:'A campanha ou a liberação mudou. Atualize antes de continuar.'},409)
    assert.equal(body.revision,state.revision);assert.equal(body.version,state.version)
    const paused=url.pathname.endsWith('/pause')
    state={...state,version:state.version+1,active:!paused,itemIds:paused?state.itemIds:body.itemIds}
    return reply(state)
  })
  const page=await context.newPage()
  await page.goto(origin)
  await page.getByText('09:00 · Paciente Fictício · Profissional Fictício').waitFor()
  assert.equal(await page.getByText('Paciente Bloqueado').count(),0)
  assert.equal(writes.length,0)
  assert.equal(await page.getByRole('button',{name:'Liberar envios',exact:true}).isDisabled(),true)
  await page.getByRole('checkbox').check()
  await page.getByRole('button',{name:'Liberar envios',exact:true}).click()
  await page.getByRole('dialog').waitFor()
  assert.equal(writes.length,0)
  await page.getByRole('button',{name:'Voltar',exact:true}).click()
  assert.equal(writes.length,0)
  await page.getByRole('button',{name:'Liberar envios',exact:true}).click()
  await page.getByRole('button',{name:'Autorizar envios selecionados'}).click()
  await page.getByText('Envios liberados para a seleção abaixo.',{exact:false}).waitFor()
  assert.deepEqual(writes[0].body.itemIds,[101])
  assert.equal(await page.getByRole('checkbox').isDisabled(),true)
  await page.getByRole('button',{name:'Pausar novos envios'}).click()
  await page.getByText('Novos envios não estão liberados.',{exact:false}).waitFor()
  assert.equal(writes.length,2)
  assert.equal(writes[1].path.endsWith('/pause'),true)
  conflict=true
  await page.getByRole('button',{name:'Liberar envios',exact:true}).click()
  await page.getByRole('button',{name:'Autorizar envios selecionados'}).click()
  await page.getByText('A campanha ou a liberação mudou. Atualize antes de continuar.',{exact:true}).waitFor()
  assert.equal(state.active,false)
  assert.deepEqual(external,[])
  console.log('PASS: eligible selection, explicit authorization, cancel, release, pause and concurrent conflict; zero external requests')
  await context.close()
} finally { await browser?.close();await server?.close();await rm(directory,{recursive:true,force:true}) }
