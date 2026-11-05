import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const fixture = JSON.parse(
  await readFile('/tmp/higia-replies-fixture/session.json', 'utf8'),
)
assert.equal(fixture.base, 'http://127.0.0.1:3111/api')
const origin = 'http://127.0.0.1:5181'
const output = '/tmp/higia-replies-browser'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  executablePath: chromium.executablePath(),
})
const context = await browser.newContext({
  viewport: { width: 1500, height: 1100 },
  timezoneId: 'UTC',
})
const external = [],
  errors = []
await context.route('**/*', (route) => {
  if (new URL(route.request().url()).origin !== origin) {
    external.push(true)
    return route.abort()
  }
  return route.continue()
})
await context.addInitScript(
  ({ token, user }) => {
    localStorage.setItem('appointments_auth_token', token)
    localStorage.setItem('appointments_auth_user', JSON.stringify(user))
  },
  { token: fixture.tokens.staff, user: fixture.user },
)
const page = await context.newPage()
page.setDefaultTimeout(15000)
page.on('pageerror', (error) => errors.push(error.message))
let checks = 0
try {
  await page.goto(`${origin}/confirmacao/campanhas/${fixture.campaignId}`)
  await page.getByRole('heading', { name: 'Respostas e pendências' }).waitFor()
  await page
    .getByText('Confirmação recebida', { exact: true })
    .first()
    .waitFor()
  checks++
  const deadline = new Date(fixture.deadline)
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(deadline)
    .replace(' ', 'T')
  await page.getByLabel('Novo prazo em São Paulo').fill(parts)
  const saving = page.waitForResponse(
    (r) =>
      r.url().endsWith('/response-deadline') && r.request().method() === 'PUT',
  )
  await page.getByRole('button', { name: 'Salvar prazo', exact: true }).click()
  assert.equal((await saving).status(), 200)
  checks++
  const approving = page.waitForResponse((r) => r.url().endsWith('/approve'))
  await page
    .getByRole('button', { name: 'Aprovar administrativamente' })
    .click()
  assert.equal((await approving).status(), 201)
  await page.getByLabel('Novo prazo em São Paulo').waitFor({ state: 'hidden' })
  checks++
  const pending = page
    .getByRole('button', { name: 'Assumir pendência', exact: true })
    .first()
  const cardId = await pending.locator('..').getAttribute('data-testid')
  const card = page.getByTestId(cardId)
  const assigning = page.waitForResponse((r) => r.url().endsWith('/assign'))
  await pending.click()
  assert.equal((await assigning).status(), 201)
  const completing = card.getByRole('button', {
    name: 'Concluir pendência',
    exact: true,
  })
  assert.equal(await completing.isDisabled(), true)
  checks++
  await card.getByLabel('Resultado administrativo').click()
  await page
    .getByRole('option', { name: 'Contato tratado pela recepção', exact: true })
    .click()
  const done = page.waitForResponse((r) => r.url().endsWith('/complete'))
  await completing.click()
  assert.equal((await done).status(), 201)
  await page
    .getByText('Contato tratado pela recepção', { exact: true })
    .first()
    .waitFor()
  checks++
  await page.getByLabel('Filtrar respostas').click()
  await page
    .getByRole('option', { name: 'Pendências concluídas', exact: true })
    .click()
  checks++
  assert.doesNotMatch(
    await page.locator('body').innerText(),
    /phone:v1:|recipient:v1:|execution_key|fixture-replies-integration-only/,
  )
  assert.deepEqual(external, [])
  assert.deepEqual(errors, [])
  checks++
  await page.screenshot({ path: `${output}/responses.png`, fullPage: true })
  await writeFile(
    `${output}/result.json`,
    JSON.stringify(
      {
        passed: checks,
        realBackend: true,
        realWhatsApp: false,
        legacyWrites: false,
      },
      null,
      2,
    ),
  )
  console.log(`${checks} replies browser checks passed`)
} catch (error) {
  await page
    .screenshot({ path: `${output}/failure.png`, fullPage: true })
    .catch(() => {})
  throw error
} finally {
  await context.close()
  await browser.close()
}
