import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const fixture = JSON.parse(await readFile('/tmp/higia-simulation-fixture/session.json', 'utf8'))
assert.equal(fixture.base, 'http://127.0.0.1:3106/api')
const origin = 'http://127.0.0.1:5179'
const output = '/tmp/higia-simulation-browser'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: chromium.executablePath() })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const external = []
const errors = []
await context.route('**/*', (route) => {
  const url = new URL(route.request().url())
  if (url.origin !== origin) { external.push(url.origin); return route.abort() }
  return route.continue()
})
await context.addInitScript(({ token }) => {
  localStorage.setItem('appointments_auth_token', token)
  localStorage.setItem('appointments_auth_user', JSON.stringify({ id: 1, name: 'Fixture Admin', usernameLogin: 'fixture-admin', role: 'ADMIN' }))
}, { token: fixture.tokens.staff })
const page = await context.newPage()
page.setDefaultTimeout(15000)
page.on('pageerror', (error) => errors.push(error.message))
const region = page.getByRole('region', { name: 'Simulações sem envio', exact: true })
let sample
let checks = 0
async function mockHistory(payload, status = 200) {
  await page.unroute('**/api/confirmation-campaigns/*/simulations')
  await page.route('**/api/confirmation-campaigns/*/simulations', (route) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) }))
  await region.getByRole('button', { name: 'Atualizar simulações' }).click()
  await region.getByText('Consultando simulações.', { exact: true }).waitFor({ state: 'hidden' })
}
try {
  const response = page.waitForResponse((r) => r.url().endsWith('/simulations'))
  await page.goto(`${origin}/confirmacao/campanhas/${fixture.campaignId}`)
  const history = await (await response).json()
  assert.equal(history.length, 1)
  sample = history[0]
  await region.getByText('Concluída', { exact: true }).waitFor()
  await region.getByText('Aprovação não vigente', { exact: true }).waitFor()
  await region.getByText('1 item simulado · 1 item bloqueado, retido ou com falha.', { exact: true }).waitFor()
  assert.doesNotMatch(await region.innerText(), /phone:v1:|recipient:v1:|claimHash|claimToken/)
  await page.screenshot({ path: `${output}/simulation-history.png`, fullPage: true })
  checks++
  await mockHistory([{ ...sample, status: 'RUNNING', report: null, leaseExpired: false, currentApproval: true }])
  await region.getByText('Em andamento', { exact: true }).waitFor(); checks++
  await mockHistory([{ ...sample, status: 'RUNNING', report: null, leaseExpired: true }])
  await region.getByText('Interrompida', { exact: true }).waitFor(); checks++
  await mockHistory([{ ...sample, status: 'INVALIDATED' }])
  await region.getByText('Invalidada', { exact: true }).waitFor(); checks++
  await mockHistory([{ ...sample, report: { blocked: 'after_hours', items: [] } }])
  await region.getByText('Simulação bloqueada: Após o horário de operação.', { exact: true }).waitFor(); checks++
  await mockHistory([])
  await region.getByText('Nenhuma simulação registrada.', { exact: true }).waitFor(); checks++
  for (const [payload, status] of [[{}, 503], [[{ ...sample, mode: 'real', dispatchEnabled: true }], 200]]) {
    await mockHistory(payload, status)
    await region.getByText('Não foi possível consultar as simulações.', { exact: true }).waitFor()
    await page.getByRole('heading', { name: 'Campanha 2026-11-05', exact: true }).waitFor()
    checks++
  }
  assert.deepEqual(external, []); assert.deepEqual(errors, []); checks++
  await writeFile(`${output}/result.json`, JSON.stringify({ passed: checks, realHistory: true, realTransport: false }, null, 2))
  console.log(`${checks} simulation-history browser checks passed`)
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {})
  throw error
} finally { await context.close(); await browser.close() }
