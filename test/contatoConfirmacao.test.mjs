import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

// Transpile the actual utility without a second test-only implementation.
const source = await readFile(new URL('../src/utils/contatoConfirmacao.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { situacaoAutorizacao } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const now = new Date('2026-11-04T12:00:00Z')
const grant = (overrides = {}) => ({
  revokedAt: null, validFrom: '2026-11-01T00:00:00Z', expiresAt: '2026-11-05T00:00:00Z', ...overrides,
})

test('expired authorization stays pending instead of being called revoked', () => {
  assert.equal(situacaoAutorizacao([grant({ expiresAt: '2026-11-03T00:00:00Z' })], now), 'pendente')
})
test('future, invalid and missing authorization stay pending', () => {
  for (const rows of [[], [grant({ validFrom: '2026-11-05T00:00:00Z' })], [grant({ expiresAt: 'invalid' })]]) {
    assert.equal(situacaoAutorizacao(rows, now), 'pendente')
  }
})
test('expiry instant is excluded from validity', () => {
  assert.equal(situacaoAutorizacao([grant({ expiresAt: now.toISOString() })], now), 'pendente')
})
test('actual revocation is shown; a separate active grant can still be valid', () => {
  const revoked = grant({ revokedAt: '2026-11-03T00:00:00Z' })
  assert.equal(situacaoAutorizacao([revoked], now), 'revogada')
  assert.equal(situacaoAutorizacao([revoked, grant()], now), 'vigente')
})
