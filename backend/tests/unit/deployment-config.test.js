const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..', '..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const envValue = (relativePath, key) => {
  const match = read(relativePath).match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : undefined;
};

const COIN_FLIP = 'CDP77TELLHACC46EHR3N4ISRWJME446AGK5RM7D4D42YKDCB4LXICKTE';
const RANDOM_GENERATOR = 'CAMYBISVQSSVJ3EPAZQWKPTTPGTYY5XIS2BZAG4TYFWTUKHQNPVXAV4O';
const STALE_IDS = [
  'CD2JPFUCKNDMA3OVYVQOAELTMR5VQPMAA6J6GJYQE2SQFNGKCBSSOKG5',
  'CD3VAX3DZEGWEMMPK35MYPS43HMFTNHZK5SY22JLEHHENXJATWP4HJY5',
];

describe('Testnet deployment configuration', () => {
  const manifest = JSON.parse(read('deployments/testnet.json'));
  const readme = read('README.md');

  test('uses the verified coinFlip and randomGenerator IDs everywhere', () => {
    expect(manifest.contracts.coinFlip).toBe(COIN_FLIP);
    expect(manifest.contracts.randomGenerator).toBe(RANDOM_GENERATOR);
    expect(envValue('backend/.env.example', 'COIN_FLIP_CONTRACT_ID')).toBe(COIN_FLIP);
    expect(envValue('backend/.env.example', 'RANDOM_GENERATOR_CONTRACT_ID')).toBe(RANDOM_GENERATOR);
    expect(envValue('apps/web/.env.example', 'NEXT_PUBLIC_COIN_FLIP_CONTRACT_ID')).toBe(COIN_FLIP);
    expect(envValue('apps/web/.env.example', 'NEXT_PUBLIC_RANDOM_GENERATOR_CONTRACT_ID')).toBe(
      RANDOM_GENERATOR
    );
    expect(readme).toContain(COIN_FLIP);
    expect(readme).toContain(RANDOM_GENERATOR);
  });

  test('leaves diceRoll unset until a live address is verified', () => {
    expect(manifest.contracts.diceRoll).toBe('');
    expect(envValue('backend/.env.example', 'DICE_ROLL_CONTRACT_ID')).toBe('');
    expect(envValue('apps/web/.env.example', 'NEXT_PUBLIC_DICE_ROLL_CONTRACT_ID')).toBeUndefined();
    expect(readme).toContain('Not configured');
  });

  test('does not reintroduce stale deployment IDs', () => {
    const files = [
      'README.md',
      'deployments/testnet.json',
      'backend/.env.example',
      'apps/web/.env.example',
    ];
    for (const file of files) {
      for (const id of STALE_IDS) {
        expect(read(file)).not.toContain(id);
      }
    }
  });
});
