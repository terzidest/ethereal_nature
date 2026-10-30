import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type pg from 'pg'

/**
 * Minimal Flyway-compatible migrator: runs the existing V*__*.sql files and
 * records them in flyway_schema_history, baselining against whatever Flyway
 * already applied. On the live database (migrated by Flyway up to cutover)
 * this applies nothing until a V9+ file appears; on a fresh database it
 * applies everything. One advisory lock guards concurrent boots.
 */
const MIGRATION_LOCK_KEY = 752026

interface MigrationFile {
  version: number
  description: string
  script: string
  sql: string
}

export async function loadMigrations(dir: string): Promise<MigrationFile[]> {
  const files = (await readdir(dir)).filter((f) => /^V\d+__.+\.sql$/.test(f))
  const migrations = await Promise.all(
    files.map(async (script) => {
      const match = script.match(/^V(\d+)__(.+)\.sql$/)!
      return {
        version: Number(match[1]),
        description: match[2]!.replace(/_/g, ' '),
        script,
        sql: await readFile(join(dir, script), 'utf8'),
      }
    }),
  )
  return migrations.sort((a, b) => a.version - b.version)
}

export async function migrate(pool: pg.Pool, dir: string): Promise<number> {
  const client = await pool.connect()
  let applied = 0
  try {
    await client.query('select pg_advisory_lock($1)', [MIGRATION_LOCK_KEY])
    await client.query(`
      create table if not exists flyway_schema_history (
        installed_rank integer primary key,
        version varchar(50),
        description varchar(200) not null,
        type varchar(20) not null,
        script varchar(1000) not null,
        checksum integer,
        installed_by varchar(100) not null,
        installed_on timestamp not null default now(),
        execution_time integer not null,
        success boolean not null
      )`)
    const { rows } = await client.query<{ version: string | null; installed_rank: number }>(
      'select version, installed_rank from flyway_schema_history where success',
    )
    const appliedVersions = new Set(rows.map((r) => Number(r.version)).filter((v) => !Number.isNaN(v)))
    let rank = rows.reduce((max, r) => Math.max(max, r.installed_rank), 0)

    for (const migration of await loadMigrations(dir)) {
      if (appliedVersions.has(migration.version)) continue
      const started = Date.now()
      await client.query('begin')
      try {
        await client.query(migration.sql)
        await client.query(
          `insert into flyway_schema_history
             (installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
           values ($1, $2, $3, 'SQL', $4, null, current_user, $5, true)`,
          [++rank, String(migration.version), migration.description, migration.script, Date.now() - started],
        )
        await client.query('commit')
        applied++
      } catch (error) {
        await client.query('rollback')
        throw new Error(`Migration ${migration.script} failed: ${(error as Error).message}`)
      }
    }
    return applied
  } finally {
    await client.query('select pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]).catch(() => undefined)
    client.release()
  }
}
