// Real campaign page and verification dialog, fully synthetic same-origin API.
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const root = resolve(import.meta.dirname, '..')
const directory = await mkdtemp(join(tmpdir(), 'higia-pending-ui-'))
const origin = 'http://127.0.0.1:5187'
const patientRef = 'patient:v1:fixture:' + 'ab'.repeat(32)
const recipientRef = 'recipient:v1:fixture:' + 'cd'.repeat(32)
const phoneRef = 'phone:v1:fixture:' + 'ef'.repeat(32)
const checks = []
const passed = label => { checks.push(label); console.log('PASS ' + label) }
let server, browser
try {
  await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir')
  await writeFile(join(directory, 'index.html'), '<html><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>')
  await writeFile(join(directory, 'main.tsx'), `import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter,Routes,Route,Link} from 'react-router-dom';import {ConfirmacaoCampanhaPage} from '/@fs/${root}/src/pages/ConfirmacaoCampanhaPage.tsx';createRoot(document.getElementById('root')).render(<BrowserRouter><Link to="/confirmacao/campanhas/2">Campanha fictícia 2</Link><Routes><Route path="/confirmacao/campanhas/:id" element={<ConfirmacaoCampanhaPage/>}/></Routes></BrowserRouter>);`)
  server = await createServer({ root: directory, configFile: false, envDir: false, plugins: [react()],
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api') },
    server: { host: '127.0.0.1', port: 5187, strictPort: true, fs: { allow: [root, directory] } } })
  await server.listen()
  browser = await chromium.launch({ headless: true })
  async function scenario(options = {}) {
    const context = await browser.newContext()
    const writes = [], external = [], errors = []
    let records = options.existing ? [{ id: 'fixture-verification', patientRef, recipientRef, informedPhoneRef: phoneRef, role: 'PATIENT', status: 'VERIFIED', revokedAt: null }] : []
    let refreshFailed = false
    let campaign = {
      id: 1, campaignDate: '2099-03-06', source: 'SAUDEVIANET', sourceLabel: 'Fixture', status: options.approved ? 'APPROVED' : 'DRAFT',
      consultationState: 'READY', consultationReason: null, responseDeadlineAt: null,
      appointmentsAnalyzed: 2, eligibleRecipients: 0, pendingVerifications: 2, unavailableRecipients: 0, technicalFailures: 0,
      dispatchEnabled: false, identityStatus: 'ready', events: [],
      items: [
        { id: 101, appointmentRef: 'appt:fixture-a', patientRef, recipientRef,
          informedPhoneRef: options.missing ? null : phoneRef, appointmentTime: '09:00', sourceResolution: 'candidate', isMinor: false,
          recipientState: 'PENDING', reasonCode: 'verification_missing', displayName: 'Fixture Patient', professionalName: 'Fixture Professional',
          maskedPhone: '(00) *****-0000', phoneStatus: 'available', identityStatus: 'ready' },
        { id: 102, appointmentRef: 'appt:fixture-b', patientRef, recipientRef, informedPhoneRef: phoneRef, appointmentTime: '10:00',
          recipientState: 'PENDING', reasonCode: 'authorization_revoked', displayName: 'Fixture Revoked', identityStatus: 'ready' },
      ],
    }
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url()), path = url.pathname
      if (url.origin !== origin) { external.push(url.origin); return route.abort() }
      if (!path.startsWith('/api/')) return route.continue()
      const ok = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      const method = request.method()
      if (method !== 'GET') writes.push({ path, body: request.postDataJSON() })
      if (/\/confirmation-campaigns\/\d+$/.test(path) && method === 'GET') {
        if (options.refreshFailure && records.some(item => item.status === 'VERIFIED') && !refreshFailed) {
          refreshFailed = true;return ok({ message: 'Fixture refresh failed' }, 503)
        }
        const id = Number(path.split('/').at(-1))
        return ok(id === 1 ? campaign : { ...campaign, id: 2, campaignDate: '2099-03-07' })
      }
      if (path.endsWith('/responses')) return ok({ dispatchEnabled: false, responses: [], pending: [], events: [], actions: [], users: [] })
      if (path.endsWith('/simulations')) return ok([])
      if (path.endsWith('/resolve-pending')) {
        if (options.bulkFailure) return ok({ message: 'A agenda está indisponível.' }, 503)
        if (options.delay) await new Promise(resolve => setTimeout(resolve, 250))
        const single = request.postDataJSON().itemId
        campaign = { ...campaign, items: campaign.items.map(item => item.id !== 101 ? item : {
          ...item, informedPhoneRef: phoneRef, recipientState: single ? 'PENDING' : 'ELIGIBLE', reasonCode: single ? 'verification_missing' : 'contact_ready',
        }) }
        return ok({ campaign, summary: { evaluated: single ? 1 : 2, updated: 1, resolved: single ? 0 : 1,
          remaining: 1, referencesRecovered: 1, dispatchEnabled: false } }, 201)
      }
      if (path.endsWith('/verifications') && method === 'GET') return ok(records)
      if (path.endsWith('/verifications') && method === 'POST') {
        const row = { ...request.postDataJSON(), id: 'fixture-verification', status: 'INFORMED', revokedAt: null }
        records = [row]
        if (options.unknownCreate) return route.abort('failed')
        return ok(row, 201)
      }
      if (path.endsWith('/verify')) {
        records = records.map(item => ({ ...item, status: 'VERIFIED' }))
        if (options.unknownVerify) return route.abort('failed')
        return ok(records[0], 201)
      }
      throw Error('Unexpected fixture API: ' + path)
    })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    page.setDefaultTimeout(10000)
    await page.goto(origin + '/confirmacao/campanhas/1')
    await page.getByRole('heading', { name: 'Campanha 2099-03-06', exact: true }).waitFor()
    return { page, writes, external, errors, context }
  }
  async function close(f) {
    assert.deepEqual(f.external, []);assert.deepEqual(f.errors, [])
    assert.equal(f.writes.some(item => /authorizations|dispatch/.test(item.path)), false)
    await f.context.close()
  }
  async function open(f) {
    await f.page.getByRole('button', { name: 'Resolver pendência', exact: true }).click()
    await f.page.getByRole('dialog').waitFor()
  }
  async function select(page, name, option) {
    await page.getByLabel(name, { exact: true }).click()
    await page.getByRole('option', { name: option, exact: true }).click()
  }
  async function verified(page) {
    await select(page, 'Verificação do número', 'Verificação realizada neste atendimento')
    await select(page, 'Procedimento realizado', 'Confirmação presencial')
  }
  let f = await scenario()
  await f.page.getByRole('button', { name: 'Resolver pendências automaticamente', exact: true }).click()
  await f.page.getByText('1 pendência(s) resolvida(s)', { exact: false }).waitFor()
  assert.equal(f.writes.length, 1)
  assert.deepEqual(f.writes[0], { path: '/api/confirmation-campaigns/1/resolve-pending', body: {} })
  await f.page.getByText('Contato revogado', { exact: true }).first().waitFor()
  passed('bulk action is campaign-scoped, preserves blocked entries and never creates verification')
  await close(f)

  f = await scenario({ missing: true })
  await open(f)
  assert.equal(await f.page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).isEnabled(), true)
  await verified(f.page)
  await f.page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click()
  await f.page.getByText('Este agendamento não possui uma referência válida', { exact: false }).waitFor()
  assert.equal(f.writes.length, 0)
  await f.page.getByRole('button', { name: 'Atualizar dados do agendamento', exact: true }).click()
  await f.page.getByRole('dialog').getByText('Falta a referência necessária', { exact: false }).waitFor({ state: 'hidden' })
  assert.equal(f.writes[0].body.itemId, 101)
  await verified(f.page)
  await f.page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click()
  await f.page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(f.writes.find(item => item.path.endsWith('/verifications')).body.informedPhoneRef, phoneRef)
  passed('visible phone with missing reference gives an actionable error and refresh recovers only the authoritative reference')
  await close(f)

  f = await scenario({ refreshFailure: true })
  await open(f);await verified(f.page)
  await f.page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).evaluate(button => { button.click();button.click() })
  await f.page.getByRole('button', { name: 'Atualizar campanha', exact: true }).waitFor()
  assert.equal(f.writes.filter(item => item.path.endsWith('/verifications')).length, 1)
  assert.equal(f.writes.filter(item => item.path.endsWith('/verify')).length, 1)
  await f.page.getByRole('button', { name: 'Atualizar campanha', exact: true }).click()
  await f.page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(f.writes.length, 2)
  passed('double click and refresh failure cannot duplicate a completed verification')
  await close(f)

  for (const kind of ['unknownCreate', 'unknownVerify']) {
    f = await scenario({ [kind]: true })
    await open(f)
    if (kind === 'unknownVerify') await verified(f.page)
    await f.page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click()
    await f.page.getByRole('button', { name: 'Conferir registro', exact: true }).waitFor()
    const count = f.writes.length
    await f.page.getByRole('button', { name: 'Conferir registro', exact: true }).click()
    await f.page.getByRole('dialog').waitFor({ state: 'hidden' })
    assert.equal(f.writes.length, count)
    passed(kind + ' is reconciled by reads without resubmission')
    await close(f)
  }

  f = await scenario({ existing: true })
  await open(f);await verified(f.page)
  await f.page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click()
  await f.page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(f.writes.length, 0)
  passed('existing matching verified contact is reused without another declaration')
  await close(f)

  f = await scenario({ approved: true })
  assert.equal(await f.page.getByRole('button', { name: 'Resolver pendências automaticamente', exact: true }).isDisabled(), true)
  await f.page.getByText('Reabra a revisão para atualizar', { exact: false }).waitFor()
  assert.equal(f.writes.length, 0)
  passed('approved campaign requires reopening before bulk updates')
  await close(f)

  f = await scenario({ bulkFailure: true })
  await f.page.getByRole('button', { name: 'Resolver pendências automaticamente', exact: true }).click()
  await f.page.getByText('A agenda está indisponível.', { exact: true }).waitFor()
  assert.equal(f.writes.length, 1)
  assert.equal(await f.page.getByText('pendência(s) resolvida(s)', { exact: false }).count(), 0)
  passed('technical bulk failure is not shown as success or retried automatically')
  await close(f)

  f = await scenario({ delay: true })
  const pending = f.page.waitForResponse(response => response.url().endsWith('/resolve-pending'))
  await f.page.getByRole('button', { name: 'Resolver pendências automaticamente', exact: true }).click()
  await f.page.getByRole('link', { name: 'Campanha fictícia 2', exact: true }).click()
  await (await pending).finished()
  await f.page.getByRole('heading', { name: 'Campanha 2099-03-07', exact: true }).waitFor()
  assert.equal(await f.page.getByRole('heading', { name: 'Campanha 2099-03-06', exact: true }).count(), 0)
  passed('late bulk result cannot overwrite a different campaign after navigation')
  await close(f)
  console.log(JSON.stringify({ passed: true, checks: checks.length, realPatientWrites: 0, messagesSent: 0 }))
} finally {
  await browser?.close();await server?.close();await rm(directory, { recursive: true, force: true })
}
