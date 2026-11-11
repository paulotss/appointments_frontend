// Isolated UI fixture: no login, clinical API, patient data or sending capability.
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')

const root = resolve(import.meta.dirname, '..')
const directory = await mkdtemp(join(tmpdir(), 'higia-authorization-ui-'))
const origin = 'http://127.0.0.1:5186'
let server, browser
const patientRef = 'patient:v1:fixture:' + 'ab'.repeat(32)
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
    const context = await browser.newContext({ timezoneId: 'America/Sao_Paulo' })
    let posts = [], grants = options.existing || [], refreshFails = false, authorizationReads = 0
    const external = [], pageErrors = []
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url())
      if (url.origin !== origin) { external.push(url.origin); return route.abort() }
      if (!url.pathname.startsWith('/api/')) return route.continue()
      const path = url.pathname, method = request.method()
      const ok = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) })
      if (path.endsWith('/patient-search')) return ok({ state: 'ready', truncated: false, people: [{ patientRef, displayName: 'Fixture Example', phoneStatus: 'missing' }] })
      if (path.endsWith('/verifications')) return ok([{ id: 'fixture-verification', patientRef, recipientRef,
        informedPhoneRef: 'phone:v1:fixture:' + 'ef'.repeat(32), status: options.informed ? 'INFORMED' : 'VERIFIED',
        role: 'PATIENT', origin: 'IN_PERSON', revokedAt: null, legalGuardianVerified: false }])
      if (path.endsWith('/authorizations')) {
        if (method === 'POST') {
          posts.push(request.postDataJSON())
          if (options.unknown) return route.abort('failed')
          if (options.denied) return ok({ message: 'Acesso recusado.' }, 403)
          const row = { ...posts.at(-1), id: 'fixture-authorization', recordedAt: new Date().toISOString(),
            revokedAt: null, recordedBy: { name: 'Fixture Staff' }, grantsOwnership: false }
          grants = [...grants, row]
          if (options.refreshFailure) refreshFails = true
          return ok(row, 201)
        }
        authorizationReads++
        if (refreshFails || options.lookupFailure || (options.preflightFailure && authorizationReads > 1)) return ok({ message: 'Consulta indisponível.' }, 503)
        return ok(grants)
      }
      if (path.endsWith('/associations') || path.endsWith('/audit')) return ok([])
      throw Error('Unexpected fixture API route: ' + path)
    })
    const page = await context.newPage()
    page.on('pageerror', e => pageErrors.push(e.message))
    await page.goto(origin)
    await page.getByLabel('Nome do paciente').fill('Fixture')
    await page.getByRole('button', { name: 'Pesquisar', exact: true }).click()
    await page.getByRole('button', { name: 'Selecionar', exact: true }).click()
    if (!options.informed && !options.lookupFailure) {
      await page.getByRole('button', { name: 'Registrar autorização', exact: true }).click()
      await page.getByRole('dialog').waitFor()
    }
    return { page, posts, context, external, pageErrors, recover: () => { refreshFails = false } }
  }
  async function fill(page) {
    await page.getByLabel('Referência do fundamento adotado pela clínica').fill('fixture-policy')
    await page.getByLabel('Referência da evidência da autorização').fill('fixture-evidence')
    await page.getByLabel('Início da validade').fill('2099-01-01T10:00')
    await page.getByLabel('Fim da validade').fill('2099-01-02T10:00')
  }
  async function close(f) {
    assert.deepEqual(f.external, [])
    assert.deepEqual(f.pageErrors, [])
    await f.context.close()
  }
  let f = await scenario()
  assert.equal(await f.page.getByLabel('Referência do fundamento adotado pela clínica').inputValue(), '')
  await f.page.getByRole('dialog').getByRole('button', { name: 'Registrar autorização', exact: true }).click()
  await f.page.getByText('Informe as referências', { exact: false }).waitFor()
  assert.equal(f.posts.length, 0)
  await fill(f.page)
  await f.page.getByLabel('Fim da validade').fill('2098-01-01T10:00')
  await f.page.getByRole('dialog').getByRole('button', { name: 'Registrar autorização', exact: true }).click()
  await f.page.getByText('O fim precisa ser posterior', { exact: false }).waitFor()
  assert.equal(f.posts.length, 0)
  await fill(f.page)
  await f.page.getByRole('dialog').getByRole('button', { name: 'Registrar autorização', exact: true }).evaluate(button => { button.click(); button.click() })
  await f.page.getByText('Autorização registrada. A elegibilidade será reavaliada', { exact: false }).waitFor()
  assert.equal(f.posts.length, 1)
  assert.deepEqual(f.posts[0], { patientRef, recipientRef, purpose: 'appointment_contact', channel: 'whatsapp',
    legalBasis: 'fixture-policy', evidenceRef: 'fixture-evidence', validFrom: '2099-01-01T13:00:00.000Z', expiresAt: '2099-01-02T13:00:00.000Z' })
  passed('explicit evidence, bound recipient, validity and local timezone; one POST without dispatch')
  await close(f)

  f = await scenario({ existing: [{ id: 'fixture-existing-authorization', recipientRef, evidenceRef: 'fixture-evidence', revokedAt: '2026-01-01T00:00:00Z', recordedBy: { name: 'Fixture Staff' }, recordedAt: '2026-01-01T00:00:00Z' }] })
  await fill(f.page)
  await f.page.getByRole('dialog').getByRole('button', { name: 'Registrar autorização', exact: true }).click()
  await f.page.getByText('Esta evidência já tem autorização', { exact: false }).waitFor()
  assert.equal(f.posts.length, 0)
  passed('existing evidence, including revoked grants, is not silently recreated')
  await close(f)

  f = await scenario({ refreshFailure: true })
  await fill(f.page)
  await f.page.getByRole('dialog').getByRole('button', { name: 'Registrar autorização', exact: true }).click()
  await f.page.getByRole('button', { name: 'Atualizar consulta', exact: true }).waitFor()
  assert.equal(f.posts.length, 1)
  f.recover()
  await f.page.getByRole('button', { name: 'Atualizar consulta', exact: true }).click()
  await f.page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(f.posts.length, 1)
  passed('successful write plus refresh failure retries only reads')
  await close(f)

  f = await scenario({ unknown: true })
  await fill(f.page)
  await f.page.getByRole('dialog').getByRole('button', { name: 'Registrar autorização', exact: true }).click()
  await f.page.getByText('Não foi possível comprovar se o registro', { exact: false }).waitFor()
  assert.equal(await f.page.getByRole('dialog').getByRole('button', { name: 'Registrar autorização', exact: true }).isDisabled(), true)
  assert.equal(f.posts.length, 1)
  passed('unknown write outcome blocks repetition')
  await close(f)

  f = await scenario({ preflightFailure: true })
  await fill(f.page)
  await f.page.getByRole('dialog').getByRole('button', { name: 'Registrar autorização', exact: true }).click()
  await f.page.getByText('Consulta indisponível.', { exact: false }).waitFor()
  assert.equal(f.posts.length, 0)
  passed('failed independent lookup blocks the write')
  await close(f)

  f = await scenario({ denied: true })
  await fill(f.page)
  await f.page.getByRole('dialog').getByRole('button', { name: 'Registrar autorização', exact: true }).click()
  await f.page.getByText('Acesso recusado.', { exact: false }).waitFor()
  assert.equal(f.posts.length, 1)
  assert.equal(await f.page.getByRole('dialog').count(), 1)
  passed('backend permission refusal is preserved without a success state')
  await close(f)

  f = await scenario({ informed: true })
  assert.equal(await f.page.getByRole('button', { name: 'Registrar autorização', exact: true }).count(), 0)
  passed('no recipient entry from an unverified contact')
  await close(f)
  console.log(JSON.stringify({ checks: checks.length, passed: true, realPatientWrites: 0, realMessagesSent: 0 }))
} finally {
  await browser?.close()
  await server?.close()
  await rm(directory, { recursive: true, force: true })
}
