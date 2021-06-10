import assert from 'assert';

describe('complex-todos-svelte', function()
{
  it('package.json has correct name', async function()
  {
    const {name} = await import('../package.json');
    assert.strictEqual(name, 'complex-todos-svelte');
  });
});