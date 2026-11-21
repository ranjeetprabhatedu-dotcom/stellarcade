const { randomBytes } = require('crypto');
const { Keypair } = require('@stellar/stellar-sdk');
const knex = require('knex');

const User = require('../../src/models/User.model');
const migration = require('../../migrations/add_case_insensitive_username_unique');

const connection = process.env.TEST_DATABASE_URL;
const describePostgres = connection ? describe : describe.skip;

const wallet = () => Keypair.random().publicKey();

describePostgres('profile creation races on PostgreSQL (#1587)', () => {
  let db;
  let schema;

  beforeAll(async () => {
    schema = `qv_profile_race_${randomBytes(6).toString('hex')}`;
    const root = knex({ client: 'pg', connection });
    await root.raw('CREATE SCHEMA ??', [schema]);
    await root.destroy();

    db = knex({ client: 'pg', connection, searchPath: [schema, 'public'] });
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('wallet_address', 56).unique().notNullable();
      table.string('username', 50).nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    await migration.up(db);
  });

  afterEach(async () => {
    await db('users').truncate();
  });

  afterAll(async () => {
    if (db) await db.destroy();
    const root = knex({ client: 'pg', connection });
    await root.raw('DROP SCHEMA IF EXISTS ?? CASCADE', [schema]);
    await root.destroy();
  });

  test('the canonical username index is enforced by PostgreSQL', async () => {
    const { rows } = await db.raw(
      'SELECT to_regclass(\'users_username_lower_unique\') IS NOT NULL AS exists'
    );
    expect(rows[0].exists).toBe(true);
  });

  test('concurrent first logins reserve wallets without extra profiles', async () => {
    const firstWallet = wallet();
    const secondWallet = wallet();

    const results = await Promise.allSettled([
      User.reserveWallet(firstWallet, db),
      User.reserveWallet(secondWallet, db),
    ]);

    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);
    const rows = await db('users').select('*');
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.wallet_address))).toEqual(
      new Set([firstWallet, secondWallet])
    );
    expect(rows.every((row) => row.username === null)).toBe(true);

    const sameWallet = wallet();
    const sameResults = await Promise.allSettled([
      User.reserveWallet(sameWallet, db),
      User.reserveWallet(sameWallet, db),
    ]);

    expect(sameResults.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);
    expect(sameResults[0].value.id).toBe(sameResults[1].value.id);
    expect(await db('users').where({ wallet_address: sameWallet })).toHaveLength(1);
  });

  test('case-insensitive username claims have one winner and a stable conflict', async () => {
    const firstWallet = wallet();
    const secondWallet = wallet();

    const results = await Promise.allSettled([
      User.create({ wallet_address: firstWallet, username: 'Nova' }, db),
      User.create({ wallet_address: secondWallet, username: 'nOvA' }, db),
    ]);

    const winner = results.find((result) => result.status === 'fulfilled');
    const loser = results.find((result) => result.status === 'rejected');
    expect(winner).toBeDefined();
    expect(loser).toBeDefined();
    expect(loser.reason).toMatchObject({ statusCode: 409, code: 'USERNAME_TAKEN' });

    const rows = await db('users').select('*');
    expect(rows).toHaveLength(1);
    expect(rows[0].username).toBe(winner.value.username);
    expect(['Nova', 'nOvA']).toContain(rows[0].username);
  });

  test('username updates cannot take a name held only by different casing', async () => {
    const firstWallet = wallet();
    const secondWallet = wallet();
    await User.create({ wallet_address: firstWallet, username: 'Alpha' }, db);
    await User.reserveWallet(secondWallet, db);

    await expect(
      User.updateByWallet(secondWallet, { username: 'ALPHA' }, db)
    ).rejects.toMatchObject({ statusCode: 409, code: 'USERNAME_TAKEN' });

    const rows = await db('users').whereNotNull('username').select('*');
    expect(rows).toHaveLength(1);
    expect(rows[0].username).toBe('Alpha');
  });
});
