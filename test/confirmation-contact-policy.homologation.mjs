// Isolated UI fixture: no login, clinical API, patient data or sending capability.
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')

const root = resolve(import.meta.dirname, '..')
const directory = await mkdtemp(join(tmpdir(), 'higia-contact-policy-ui-'))
const origin = 'http://127.0.0.1:5186'
let server, browser
const patientRef = 'patient:v1:fixture:' + 'ab'.repeat(32)
const anotherPatientRef = 'patient:v1:fixture:' + 'ef'.repeat(32)
const recipientRef = 'recipient:v1:fixture:' + 'cd'.repeat(32)
const checks = []
const passed = name => { checks.push(name); console.log('PASS ' + name) }
try {
  await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir')
  await writeFile(join(directory, 'index.html'), '<html><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>')
  await writeFile(join(directory, 'main.tsx'), `import React from 'react';import {createRoot} from 'react-dom/client';import {ConfirmacaoContatosPage} from '/@fs/${root}/src/pages/ConfirmacaoContatosPage.tsx';createRoot(document.getElementById('root')).render(<ConfirmacaoContatosPage/>);`)
  server = await createServer({ root: directory, configFile: false, envDir: false, plugins: [react()],
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api') },
    server: { host: '127.0.0.1', port: 5186, strictPort: true, fs: { allow: [root, directory] } } })
  await server.listen()
  browser = await chromium.launch({ headless: true })
  async function scenario(options = {}) {
    const context = await browser.newContext()
    const writes = [], external = [], pageErrors = []
    const grants = options.revoked ? [{ id: 'fixture-revoked', purpose: 'appointment_contact', channel: 'whatsapp',
      recipientRef, revokedAt: '2026-01-01T00:00:00Z', recordedAt: '2026-01-01T00:00:00Z', recordedBy: { name: 'Fixture Staff' } }] : []
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url())
      if (url.origin !== origin) { external.push(url.origin); return route.abort() }
      if (!url.pathname.startsWith('/api/')) return route.continue()
      const path = url.pathname
      const ok = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) })
      if (request.method() !== 'GET') {
        writes.push({ path, body: request.postDataJSON() })
        if (path.endsWith('/patient-search')) return ok({ state: 'ready', truncated: false, people: [{ patientRef, displayName: 'Fixture Example', phoneStatus: 'missing' }, ...(options.race ? [{ patientRef: anotherPatientRef, displayName: 'Fixture Second', phoneStatus: 'missing' }] : [])] })
        if (path.endsWith('/reclassify')) return options.fail ? ok({ message: 'Reavaliação indisponível.' }, 503) : ok({ reclassified: true, dispatchEnabled: false }, 201)
        throw Error('Unexpected write: ' + path)
      }
      if (path.endsWith('/verifications')) {
        const selected = url.searchParams.get('patientRef')
        if (options.race && selected === patientRef) await new Promise(resolve => setTimeout(resolve, 250))
        return ok([{ id: 'fixture-verification', patientRef: selected, recipientRef,
        informedPhoneRef: 'phone:v1:fixture:' + 'ef'.repeat(32), status: 'VERIFIED', role: 'PATIENT', origin: 'IN_PERSON', revokedAt: null }])
      }
      if (path.endsWith('/authorizations')) return ok(grants)
      if (path.endsWith('/associations') || path.endsWith('/audit')) return ok([])
      throw Error('Unexpected fixture API: ' + path)
    })
    const page = await context.newPage()
    page.on('pageerror', e => pageErrors.push(e.message))
    await page.goto(origin)
    await page.getByLabel('Nome do paciente').fill('Fixture')
    await page.getByRole('button', { name: 'Pesquisar', exact: true }).click()
    await page.getByRole('button', { name: 'Selecionar', exact: true }).first().click()
    await page.getByRole('button', { name: 'Reavaliar contato', exact: true }).waitFor()
    return { page, writes, context, external, pageErrors }
  }
  async function close(f) {
    assert.deepEqual(f.external, []); assert.deepEqual(f.pageErrors, [])
    assert.equal(f.writes.some(x => x.path.endsWith('/authorizations')), false)
    await f.context.close()
  }
  let f = await scenario()
  assert.equal(await f.page.getByText('Autorização pendente', { exact: true }).count(), 0)
  assert.equal(await f.page.getByRole('button', { name: 'Registrar autorização', exact: true }).count(), 0)
  assert.equal(f.writes.length, 1) // Only search; selection never reclassifies implicitly.
  await f.page.getByRole('button', { name: 'Reavaliar contato', exact: true }).click()
  await f.page.getByText('Contato reavaliado.', { exact: false }).waitFor()
  assert.deepEqual(f.writes.at(-1), { path: '/api/contact-registry/reclassify', body: { patientRef } })
  passed('no authorization form; reclassification is explicit, scoped and never sends')
  await close(f)
  f = await scenario({ revoked: true })
  await f.page.getByText('Há revogações de contato no histórico.', { exact: false }).waitFor()
  await f.page.getByText('Revogação registrada', { exact: true }).waitFor()
  assert.equal(await f.page.getByRole('button', { name: 'Registrar autorização', exact: true }).count(), 0)
  passed('revocations and historical records remain visible')
  await close(f)
  f = await scenario({ fail: true })
  await f.page.getByRole('button', { name: 'Reavaliar contato', exact: true }).click()
  await f.page.getByText('Reavaliação indisponível.', { exact: true }).waitFor()
  assert.equal(await f.page.getByText('Contato reavaliado.', { exact: false }).count(), 0)
  assert.equal(f.writes.filter(x => x.path.endsWith('/reclassify')).length, 1)
  passed('technical failure is shown without promoting eligibility or repeating writes')
  await close(f)
  f = await scenario({ race: true })
  const oldResponse = f.page.waitForResponse(response => response.url().includes('/verifications?') && new URL(response.url()).searchParams.get('patientRef') === patientRef)
  await f.page.getByRole('row').filter({ hasText: 'Fixture Example' }).getByRole('button', { name: 'Selecionar', exact: true }).click()
  await f.page.getByRole('row').filter({ hasText: 'Fixture Second' }).getByRole('button', { name: 'Selecionar', exact: true }).click()
  await (await oldResponse).finished()
  await f.page.getByRole('button', { name: 'Reavaliar contato', exact: true }).click()
  await f.page.getByText('Contato reavaliado.', { exact: false }).waitFor()
  assert.equal(f.writes.at(-1).body.patientRef, anotherPatientRef)
  passed('late response for another selected patient cannot change the reclassification target')
  await close(f)
  console.log(JSON.stringify({ checks: checks.length, passed: true, realPatientWrites: 0, realMessagesSent: 0 }))
} finally {
  await browser?.close(); await server?.close()
  await rm(directory, { recursive: true, force: true })
}
