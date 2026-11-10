import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
assert.equal(process.env.CONFIRMATION_LEGACY_FIXTURE, 'fixture-only')
const directory = process.env.CONFIRMATION_LEGACY_DIRECTORY
assert.match(directory, /^\/tmp\/confirmation-legacy-[a-zA-Z0-9_-]+$/)
const fixture = JSON.parse(await readFile(`${directory}/session.json`, 'utf8'))
const origin = 'http://127.0.0.1:5183'
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ timezoneId: 'UTC' })
  const external = []
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(true)
      return route.abort()
    }
    return route.continue()
  })
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('appointments_auth_token', token)
    localStorage.setItem('appointments_auth_user', JSON.stringify(user))
  }, { token: fixture.tokens.staff, user: fixture.user })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${origin}/confirmacao/campanhas/${fixture.campaignId}`)
  await page.getByRole('columnheader', { name: 'Saúde Vianet', exact: true }).waitFor()
  await page.getByText('Confirmação recebida', { exact: true }).first().waitFor()
  await page.getByRole('cell', { name: 'Confirmado no Saúde Vianet', exact: true }).waitFor()
  assert.equal(await page.getByRole('cell', { name: 'Resultado desconhecido — análise necessária', exact: true }).count(), 0)
  assert.deepEqual(errors, [])
  assert.deepEqual(external, [])
  await context.close()
  console.log('PASS: response and legacy result are separate, no external requests or browser errors')
} finally {
  await browser.close()
}
