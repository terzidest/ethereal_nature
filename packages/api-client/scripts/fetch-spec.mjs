/**
 * Fetches openapi.json from the running backend and writes it next to the
 * codegen config. The spec file is committed so frontend builds never need a
 * running backend; regenerate whenever the contract changes.
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const specUrl = process.env.OPENAPI_URL ?? 'http://localhost:8080/openapi.json'
const target = fileURLToPath(new URL('../openapi.json', import.meta.url))

try {
  const res = await fetch(specUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const spec = await res.json()
  await writeFile(target, JSON.stringify(spec, null, 2) + '\n')
  console.log(`openapi.json updated from ${specUrl}`)
} catch (err) {
  console.error(
    `Could not fetch ${specUrl} (${err.message}). ` +
      'Start the backend (./gradlew run in apps/backend) or set OPENAPI_URL.',
  )
  process.exit(1)
}
