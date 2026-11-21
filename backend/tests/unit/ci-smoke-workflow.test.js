const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..', '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/testnet-smoke.yml'),
  'utf8'
);

function topLevelBlock(name) {
  const lines = workflow.split(/\r?\n/);
  const start = lines.indexOf(`${name}:`);
  if (start < 0) throw new Error(`Missing top-level block ${name}`);

  const keys = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line && !line.startsWith(' ')) break;
    const match = line.match(/^\s+([a-zA-Z][\w-]*):/);
    if (match) keys.push(match[1]);
  }
  return keys;
}

describe('Testnet smoke workflow notifications', () => {
  test('declares each permission once', () => {
    const permissions = topLevelBlock('permissions');

    expect(permissions).toContain('contents');
    expect(permissions.filter((key) => key === 'issues')).toHaveLength(1);
    expect(new Set(permissions).size).toBe(permissions.length);
  });

  test('has exactly one failure and one recovery notification path', () => {
    expect(workflow.match(/name: Open or update smoke failure issue/g)).toHaveLength(1);
    expect(workflow.match(/name: Close recovered smoke failure issue/g)).toHaveLength(1);
    expect(workflow.match(/github\.rest\.issues\.create\(/g)).toHaveLength(1);
    expect(workflow.match(/github\.rest\.issues\.update\(/g)).toHaveLength(1);
  });
});
