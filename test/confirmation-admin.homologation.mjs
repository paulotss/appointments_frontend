import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'

// Explicit fixture endpoints: this suite cannot be pointed at a real installation.
const origin = 'http://127.0.0.1:5178'
const api = 'http://127.0.0.1:3105/api'
const classifier = 'http://127.0.0.1:8877'
const { chromium, request } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const fixture = JSON.parse(await readFile('/tmp/higia-admin-homolog-fixture/session.json', 'utf8'))
assert.equal(fixture.subjects.length, 6)
assert.ok(fixture.subjects.every((person) => person.patientRef.startsWith('patient:v1:fixture:')))
const output = '/tmp/higia-admin-homologation'
await mkdir(output, { recursive: true })
const http = await request.newContext()
const checks = []
function passed(name) { checks.push(name); console.log(`PASS ${name}`) }
async function call(path, { token, method = 'GET', data, status = 200 } = {}) {
  const response = await http.fetch(api + path, {
    method, data, headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  assert.equal(response.status(), status, `${method} ${path} returned ${response.status()}`)
  return response.json()
}
async function login(role) {
  return call('/auth/login', { method: 'POST', status: 201, data: {
    usernameLogin: `fixture-${role}`, password: 'fixture-only-password',
  } })
}
const reception = (await login('receptionist')).accessToken
const professional = (await login('professional')).accessToken
await call('/confirmation-campaigns', { status: 401 })
await call('/confirmation-campaigns', { token: professional, status: 403 })
await call('/contact-registry/authorizations', { token: fixture.registryToken, method: 'POST', data: {}, status: 403 })
passed('authentication and staff/service boundaries')
const browser = await chromium.launch({ headless: true, executablePath: chromium.executablePath() })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const external = []
const pageErrors = []
await context.route('**/*', (route) => {
  const url = new URL(route.request().url())
  if (url.origin !== origin) { external.push(url.origin); return route.abort() }
  return route.continue()
})
const page = await context.newPage()
page.on('pageerror', (error) => pageErrors.push(error.message))
page.setDefaultTimeout(15000)
const person = (key) => fixture.subjects.find((item) => item.key === key)
const row = (key) => page.getByRole('row').filter({ hasText: `Fixture ${key}` })
let id
async function detail() { return call(`/confirmation-campaigns/${id}`, { token: reception }) }
async function assertPersonState(key, state, reason) {
  const campaign = await detail()
  const entries = campaign.items.filter((item) => item.patientRef === person(key).patientRef)
  assert.ok(entries.length)
  for (const item of entries) {
    assert.equal(item.recipientState, state, key)
    if (reason) assert.equal(item.reasonCode, reason, key)
  }
  assert.equal(campaign.dispatchEnabled, false)
}
async function reloadCampaign() {
  await page.goto(`${origin}/confirmacao/campanhas/${id}`)
  await page.getByRole('heading', { name: 'Campanha 2099-03-06', exact: true }).waitFor()
}
async function select(label, option) {
  await page.getByRole('combobox', { name: new RegExp(label) }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}
async function openContact(key) {
  await row(key).first().getByRole('button', { name: 'Resolver pendência' }).click()
  await page.getByRole('dialog').waitFor()
  assert.equal(await page.getByRole('dialog').getByRole('textbox').count(), 0, 'No manual technical references or phone fields')
}
async function saveContact() {
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
}
try {
  await page.goto(`${origin}/confirmacao/campanhas`)
  await page.getByLabel('Nome de usuario').fill('fixture-receptionist')
  await page.getByLabel('Senha', { exact: true }).fill('fixture-only-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL((url) => url.pathname !== '/login')
  await page.goto(`${origin}/confirmacao/campanhas`)
  await page.getByRole('button', { name: 'Abrir campanha', exact: true }).click()
  await page.getByLabel('Data', { exact: true }).fill('2099-03-06')
  const created = page.waitForResponse((response) => response.url().endsWith('/api/confirmation-campaigns') && response.request().method() === 'POST')
  await page.getByRole('dialog').getByRole('button', { name: 'Abrir', exact: true }).click()
  const response = await created
  assert.equal(response.status(), 201)
  const campaign = await response.json()
  id = campaign.id
  assert.equal(campaign.appointmentsAnalyzed, 7)
  assert.equal(campaign.technicalFailures, 1)
  assert.equal(campaign.dispatchEnabled, false)
  await call('/confirmation-campaigns', { token: reception, method: 'POST', status: 409, data: { campaignDate: '2099-03-06', source: 'SAUDEVIANET', items: [] } })
  await call(`/confirmation-campaigns/${id}/approve`, { token: reception, method: 'POST', status: 400 })
  await reloadCampaign()
  assert.equal(await row('adult').count(), 2)
  await page.getByRole('heading', { name: 'Falhas técnicas da consulta', exact: true }).waitFor()
  assert.equal(await page.getByRole('table').first().getByRole('row').count(), 8)
  assert.doesNotMatch(await page.locator('body').innerText(), /(?:patient|recipient|phone):v1:|política/i)
  passed('UI login, creation, duplicate protection and technical failures separated')

  await openContact('adult')
  await saveContact()
  await assertPersonState('adult', 'PENDING', 'verification_missing')
  passed('informed phone does not prove ownership')
  await openContact('adult')
  await select('Verificação do número', 'Verificação realizada neste atendimento')
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click()
  await page.getByText('Escolha o procedimento realizado.', { exact: false }).waitFor()
  await select('Procedimento realizado', 'Confirmação presencial')
  await saveContact()
  await assertPersonState('adult', 'ELIGIBLE', 'contact_ready')
  await reloadCampaign()
  assert.equal(await row('adult').filter({ hasText: 'Apto' }).count(), 2)
  passed('procedure required; one verification reclassifies both distinct appointments')

  await openContact('noauth')
  await select('Verificação do número', 'Verificação realizada neste atendimento')
  await select('Procedimento realizado', 'Confirmação presencial')
  await saveContact()
  await assertPersonState('noauth', 'PENDING', 'authorization_missing')
  await assertPersonState('expired', 'PENDING', 'authorization_missing')
  await assertPersonState('revoked', 'PENDING', 'authorization_revoked')
  await assertPersonState('wrongphone', 'PENDING', 'verification_missing')
  passed('missing, expired, revoked authorization and mismatched phone remain blocked')

  await openContact('minor')
  await select('De quem é o número', 'Responsável legal')
  await select('Verificação do número', 'Verificação realizada neste atendimento')
  await select('Procedimento realizado', 'Responsável presente')
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click()
  await page.getByText('Responsável legal só fica verificado', { exact: false }).waitFor()
  await assertPersonState('minor', 'PENDING', 'minor_guardian_missing')
  await select('Vínculo do responsável legal', 'Verificado neste atendimento')
  await saveContact()
  await assertPersonState('minor', 'ELIGIBLE', 'contact_ready')
  passed('minor requires independently verified legal guardian')

  // Force registry failure only in the dedicated Python fixture, then trigger real reclassification.
  await http.post(`${classifier}/fixture/registry-failure`, { headers: { Authorization: 'Bearer fixture-only' }, data: { unavailable: true } })
  const grants = await call('/contact-registry/authorizations', { token: reception, method: 'POST', status: 201, data: {
    patientRef: person('adult').patientRef, recipientRef: person('adult').recipientRef,
    purpose: 'appointment_contact', channel: 'whatsapp', legalBasis: 'fixture-only', evidenceRef: 'fixture-only',
    validFrom: new Date(Date.now() - 60000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    expiresAt: new Date(Date.now() + 3600000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
  } })
  await assertPersonState('adult', 'UNAVAILABLE', 'registry_unavailable')
  await reloadCampaign()
  await page.getByText('O registro de contatos está indisponível.', { exact: false }).waitFor()
  assert.equal(await row('adult').first().getByRole('button', { name: 'Resolver pendência' }).count(), 0)
  await http.post(`${classifier}/fixture/registry-failure`, { headers: { Authorization: 'Bearer fixture-only' }, data: { unavailable: false } })
  await call(`/contact-registry/authorizations/${grants.id}/revoke`, { token: reception, method: 'POST', status: 201 })
  await assertPersonState('adult', 'ELIGIBLE') // Original fixture grant remains valid.
  passed('registry failure removes eligibility and blocks reception action')

  await reloadCampaign()
  await page.getByRole('button', { name: 'Colocar em revisão', exact: true }).click()
  await page.getByRole('button', { name: 'Aprovar administrativamente', exact: true }).click()
  await page.getByRole('button', { name: 'Reabrir revisão', exact: true }).waitFor()
  const approved = await detail()
  assert.equal(approved.status, 'APPROVED')
  assert.equal(approved.dispatchEnabled, false)
  assert.equal(approved.appointmentsAnalyzed, 7)
  assert.ok(approved.items.some((item) => item.recipientState === 'PENDING'))
  assert.ok(approved.events.some((event) => event.action === 'CAMPAIGN_APPROVED'))
  await call(`/confirmation-campaigns/${id}/items`, { token: reception, method: 'PUT', data: { items: [] }, status: 400 })
  await page.screenshot({ path: `${output}/approved.png`, fullPage: true })
  passed('review and approval preserve individual blocks, history and dispatch disabled')

  await page.goto(`${origin}/confirmacao/contatos`)
  await page.getByLabel('Nome do paciente', { exact: true }).fill('Fixture expired')
  await page.getByRole('button', { name: 'Pesquisar', exact: true }).click()
  await page.getByRole('button', { name: 'Selecionar', exact: true }).click()
  await page.getByText('Autorização pendente', { exact: true }).waitFor()
  assert.equal(await page.getByText('A autorização foi revogada', { exact: false }).count(), 0)
  passed('expired authorization is pending rather than described as revoked')

  await page.goto(`${origin}/confirmacao/contatos`)
  await page.getByLabel('Nome do paciente', { exact: true }).fill('Fixture adult')
  await page.getByRole('button', { name: 'Pesquisar', exact: true }).click()
  await page.getByRole('button', { name: 'Selecionar', exact: true }).click()
  const verificationRow = page.getByRole('row').filter({ hasText: 'Procedimento registrado' }).first()
  await verificationRow.getByRole('button', { name: 'Revogar', exact: true }).click()
  await page.getByText('Verificação revogada. O contato deixa', { exact: false }).waitFor()
  await assertPersonState('adult', 'PENDING', 'ownership_revoked')
  const audit = await call(`/contact-registry/audit?patientRef=${encodeURIComponent(person('adult').patientRef)}`, { token: reception })
  assert.ok(audit.some((event) => event.action === 'CONTACT_VERIFIED'))
  assert.ok(audit.some((event) => event.action === 'CONTACT_REVOKED'))
  await reloadCampaign()
  assert.equal((await detail()).status, 'APPROVED')
  await page.getByRole('button', { name: 'Reabrir revisão', exact: true }).click()
  await page.getByRole('button', { name: 'Aprovar administrativamente', exact: true }).waitFor()
  assert.equal((await detail()).status, 'IN_REVIEW')
  passed('contact search, revocation, audit and reopening approved campaign')
  assert.deepEqual(external, [], 'No external browser requests')
  assert.deepEqual(pageErrors, [], 'No browser runtime errors')
  passed('no external requests or browser runtime errors')
  await writeFile(`${output}/result.json`, JSON.stringify({ passed: checks.length, checks, campaignId: id }, null, 2))
  console.log(`${checks.length} administrative homologation checks passed`)
} catch (error) {
  await writeFile(`${output}/failure-accessibility.yml`, await page.locator('body').ariaSnapshot()).catch(() => {})
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {})
  throw error
} finally {
  await context.close()
  await browser.close()
  await http.dispose()
}
