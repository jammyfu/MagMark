const assert = require('node:assert/strict');
module.exports = async function run(inline, cjk) {
  let count = 0;
  const failures = [];
  async function check(name, fn) {
    try { await fn(); count++; console.log(`PASS ${name}`); }
    catch (error) { failures.push(name); console.error(`FAIL ${name}: ${error.message}`); }
  }
  const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function render(s, resolve) {
    const tokens = inline.protectInlineContent(s, code => `<code>${escape(code)}</code>`, resolve);
    return tokens.restore(tokens.text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_([^_]+)_/g, '<em>$1</em>'));
  }
  const cases = [
    ['single ticks', '使用`foo_bar`接口', '使用<code>foo_bar</code>接口'],
    ['double ticks', '使用``foo`bar``接口', '使用<code>foo`bar</code>接口'],
    ['triple ticks', '```foo``bar```', '<code>foo``bar</code>'],
    ['literal CJK code', '命令``中文_key与**API**``不变', '命令<code>中文_key与**API**</code>不变'],
    ['edge padding', '`` `中文API` ``', '<code>`中文API`</code>'],
    ['newline', '`中文\nAPI`', '<code>中文 API</code>'],
    ['CRLF', '`中文\r\nAPI`', '<code>中文 API</code>'],
    ['all spaces', '`  `', '<code>  </code>'],
    ['trim one', '`  中英API  `', '<code> 中英API </code>'],
    ['one edge', '` 中英API`', '<code> 中英API</code>'],
    ['mismatched ticks', '``中文`', '``中文`'],
    ['unclosed ticks and emphasis', '``中文**AI**', '``中文<strong>AI</strong>'],
    ['escaped asterisk', '\\*\\*中文AI\\*\\*', '**中文AI**'],
    ['escaped underscore', '\\_中文AI\\_', '_中文AI_'],
    ['escaped tick', '\\`中文`', '`中文`'],
    ['escaped less-than', '\\<img>', '&lt;img>'],
    ['literal escape in code', '`a\\*b`', '<code>a\\*b</code>'],
    ['HTML in code', '`<img src="a_b">`', '<code>&lt;img src="a_b"&gt;</code>'],
    ['raw attributes', '<img alt="**AI**" src="a_b.png">', '<img alt="**AI**" src="a_b.png">'],
    ['comment', '<!-- **中文API** -->', '<!-- **中文API** -->'],
    ['adjacent spans', '`中`和``API``', '<code>中</code>和<code>API</code>'],
    ['token prefix collision', '\uE000MM0\uE001`中英`', '\uE000MM0\uE001<code>中英</code>'],
    ['Unicode code unchanged', '`𠀀API 👩🏽‍💻 cafe\u0301`', '<code>𠀀API 👩🏽‍💻 cafe\u0301</code>'],
  ];
  for (const [name, input, expected] of cases) await check(name, () => assert.equal(render(input), expected));
  await check('code never resolves images', () => {
    let calls = 0; render('`<img src="a_b">`', s => { calls++; return s; }); assert.equal(calls, 0);
  });
  await check('image resolver retains attribute escaping', () => {
    assert.equal(render('<img src="mm-img://a_b">', () => 'https://x.test/a_b?a=1&b="2"'), '<img src="https://x.test/a_b?a=1&amp;b=&quot;2&quot;">');
  });
  await check('dynamic protect and unknown tokens', () => {
    const t = inline.protectInlineContent('x', x => x);
    assert.equal(t.restore(t.protect('<strong>OK</strong>')), '<strong>OK</strong>');
    assert.equal(t.restore('\uE000MM999\uE001'), '\uE000MM999\uE001');
  });
  await check('nested link-label token restoration', () => {
    const t = inline.protectInlineContent('标签\\_中文', x => x);
    assert.equal(t.restore(t.protect(`<a href="/a_b">${t.text}</a>`)), '<a href="/a_b">标签_中文</a>');
  });
  if (cjk) {
    for (const [name, input, expected] of [
      ['basic mixed prose', '使用API处理3个请求', '使用 API 处理 3 个请求'],
      ['supplementary Han', '𠀀API𠮷', '𠀀 API 𠮷'],
      ['accented Latin', '用é测试', '用 é 测试'],
      ['decomposed Latin', '用e\u0301测试', '用 e\u0301 测试'],
      ['Han variation selector', '漢\u{E0100}API', '漢\u{E0100} API'],
      ['bare URL unchanged', '见https://example.test/中文API?q=词3', '见https://example.test/中文API?q=词3'],
      ['email unchanged', '联系中文API@example.com', '联系中文API@example.com'],
      ['custom-scheme URL unchanged', '引用mm-img://中文API', '引用mm-img://中文API'],
      ['emoji untouched', '中文👩🏽‍💻API', '中文👩🏽‍💻API'],
      ['spaces untouched', '中文  API\n换行\t3', '中文  API\n换行\t3'],
      ['fullwidth Latin untouched', '中文ＡＢＣ１２３', '中文ＡＢＣ１２３'],
    ]) await check(name, () => assert.equal(cjk.addCJKSpacing(input), expected));
    await check('custom spacing character', () => assert.equal(cjk.addCJKSpacing('中文API', '\u2009'), '中文\u2009API'));
    await check('spacing idempotent', () => {
      const once = cjk.addCJKSpacing('中文API与𠀀3'); assert.equal(cjk.addCJKSpacing(once), once);
    });
    await check('contains supplementary Han', () => assert.equal(cjk.containsCJK('𠀀'), true));
    await check('explicit normalization preserves newline and NBSP', () => {
      assert.equal(cjk.normalizeCJKSpacing('𠀀 字\n中\u00a0文'), '𠀀字\n中\u00a0文');
    });
    const protectedTypes = ['inlineCode', 'code', 'math', 'inlineMath', 'html', 'link', 'linkReference', 'image', 'imageReference', 'definition', 'yaml', 'toml'];
    for (const type of protectedTypes) await check(`AST protects ${type}`, async () => {
      const protectedNode = { type, value: '中文API', url: 'https://x.test/中文API', children: [{ type: 'text', value: '中文API' }] };
      const saved = structuredClone(protectedNode);
      const tree = { type: 'root', children: [protectedNode] };
      await cjk.cjkSpacer()(tree); assert.deepEqual(protectedNode, saved);
    });
    await check('AST spaces ordinary text exactly once', async () => {
      const tree = { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'strong', children: [{ type: 'text', value: '中文API' }] }] }] };
      assert.equal(await cjk.cjkSpacer({ space: '\u2009' })(tree), tree);
      assert.equal(tree.children[0].children[0].children[0].value, '中文\u2009API');
    });
    await check('AST disabled preserves document', async () => {
      const tree = { type: 'root', children: [{ type: 'text', value: '中文API' }] };
      const original = structuredClone(tree); await cjk.cjkSpacer({ enabled: false })(tree); assert.deepEqual(tree, original);
    });
  }
  console.log(`\n${count} passed; ${failures.length} failed. Scope: isolated production modules, not full editor integration.`);
  if (failures.length) throw new Error(`Failed cases: ${failures.join(', ')}`);
  return count;
};
