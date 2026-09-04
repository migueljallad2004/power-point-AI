import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import { rankThemes, matchTheme } from '../lib/template-match.ts';
import { extractSlidePlan } from '../lib/slide-plan.ts';
import {
  createSlideScene,
  chooseLayout,
  layouts,
  qualityIssues,
  contrastRatio,
  readableTheme,
} from '../lib/slide-design.ts';
import { checkZipSize } from '../lib/reference-deck.ts';

const themes = [
  {
    name: 'Ocean Discovery',
    tags: 'marine science ocean',
    artwork: 'ocean.png',
  },
  {
    name: 'Linux Systems',
    tags: 'linux open source kernel terminal operating system',
    artwork: 'linux.png',
  },
  {
    name: 'Neural Blueprint',
    tags: 'ai artificial intelligence neural machine learning',
  },
  {
    name: 'STEM Workshop',
    tags: 'school classroom coding software computer science',
    artwork: 'stem.png',
  },
  {
    name: 'Chemistry Lab',
    tags: 'chemistry science laboratory',
    artwork: 'chem.png',
  },
];
test('Linux, Ubuntu and Bash recommend operating-system themes before unrelated artwork', () => {
  for (const prompt of [
    'Linux',
    'Explain Linux for my class',
    'Ubuntu',
    'Bash',
  ])
    assert.equal(rankThemes(themes, prompt)[0].theme.name, 'Linux Systems');
  assert.equal(rankThemes(themes, 'Linux').length, themes.length);
});
test('science and school recommendations also work', () => {
  assert.equal(rankThemes(themes, 'Chemistry')[0].theme.name, 'Chemistry Lab');
  assert.equal(rankThemes(themes, 'School')[0].theme.name, 'STEM Workshop');
});
test('AI does not match incidental letters in other words', () => {
  assert.equal(
    matchTheme({ name: 'Mountain trails', tags: 'outdoors' }, 'AI').score,
    0,
  );
  assert.equal(rankThemes(themes, 'AI')[0].theme.name, 'Neural Blueprint');
});
test('numbered instructions retain multiline facts and exact headings', () => {
  const plan = extractSlidePlan(
    'Linux\nSlide one: Title: Linux Systems\nPrepared by Miguel\nSlide 2: Introduction\nUse only my notes.\nSlide 4: Security',
  );
  assert.deepEqual(
    plan.map((item) => item.number),
    [1, 2, 4],
  );
  assert.equal(plan[0].title, 'Linux Systems');
  assert.match(plan[0].instruction, /Prepared by Miguel/);
  assert.equal(plan[1].title, 'Introduction');
});
test('inline instructions and plain numbered outlines preserve positions', () => {
  assert.deepEqual(
    extractSlidePlan(
      'Slide 1: Linux; Slide 2: Introduction; Slide 3: Architecture',
    ).map((item) => item.title),
    ['Linux', 'Introduction', 'Architecture'],
  );
  assert.deepEqual(
    extractSlidePlan('1. Linux\n2. Introduction').map((item) => item.number),
    [1, 2],
  );
  assert.throws(
    () => extractSlidePlan('Slide 1: Linux\nSlide 1: Intro'),
    /twice/,
  );
});
const slide = {
  title: 'Linux architecture',
  body: 'Four layers connect applications to hardware.',
  bullets: ['Applications', 'Libraries', 'Kernel', 'Hardware'],
  type: 'content',
};
const theme = { bg: '07101F', bg2: '294674', ink: 'FFFFFF', accent: 'FFC477' };
test('layout selection follows meaning and manual overrides', () => {
  assert.equal(chooseLayout(slide), 'diagram');
  assert.equal(
    chooseLayout({ ...slide, title: 'Linux vs Windows' }),
    'comparison',
  );
  assert.equal(chooseLayout({ ...slide, title: 'Linux history' }), 'timeline');
  assert.equal(chooseLayout({ ...slide, layout: 'cards' }), 'cards');
});
for (const layout of layouts)
  test(`${layout}: keeps all content and elements within slide bounds`, () => {
    const before = JSON.stringify(slide);
    for (const logo of [
      null,
      { position: 'top-left', size: 22 },
      { position: 'bottom-right', size: 22 },
    ]) {
      const scene = createSlideScene({ ...slide, layout }, theme, 0, logo);
      const text = scene.map((item) => item.text ?? '').join('\n');
      for (const value of [slide.title, slide.body, ...slide.bullets])
        assert.ok(text.includes(value), value);
      for (const node of scene) {
        assert.ok(
          node.x >= 0 &&
            node.y >= 0 &&
            node.x + node.w <= 13.334 &&
            node.y + node.h <= 7.501,
        );
      }
      const boxes = scene.filter((node) => node.kind === 'text');
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i],
            b = boxes[j];
          assert.ok(
            !(
              a.x < b.x + b.w - 0.01 &&
              a.x + a.w > b.x + 0.01 &&
              a.y < b.y + b.h - 0.01 &&
              a.y + a.h > b.y + 0.01
            ),
            `Overlapping text in ${layout}`,
          );
        }
    }
    assert.equal(JSON.stringify(slide), before);
  });
test('missing and excessive content is flagged and low contrast corrected', () => {
  assert.ok(qualityIssues([{ ...slide, title: '' }], theme).length);
  assert.ok(
    qualityIssues([{ ...slide, body: 'Very long text '.repeat(100) }], theme)
      .length,
  );
  const corrected = readableTheme({ ...theme, bg: 'FFFFFF', ink: 'EEEEEE' });
  assert.ok(contrastRatio(corrected.bg, corrected.ink) >= 4.5);
});
test('all eight designs can be exported as editable PowerPoint text', async () => {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  for (const layout of layouts) {
    const page = pptx.addSlide();
    for (const node of createSlideScene({ ...slide, layout }, theme, 0)) {
      if (node.kind === 'text')
        page.addText(node.text, {
          x: node.x,
          y: node.y,
          w: node.w,
          h: node.h,
          fontSize: node.size,
          margin: 0,
          fit: 'shrink',
        });
      else
        page.addShape(pptx.ShapeType.rect, {
          x: node.x,
          y: node.y,
          w: node.w,
          h: node.h,
          fill: { color: node.fill },
        });
    }
  }
  const output = await pptx.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(output);
  assert.equal(zip.file(/^ppt\/slides\/slide\d+\.xml$/).length, 8);
  for (let i = 1; i <= 8; i++) {
    const xml = await zip.file(`ppt/slides/slide${i}.xml`).async('string');
    for (const value of [slide.title, slide.body, ...slide.bullets])
      assert.ok(xml.includes(value));
  }
  checkZipSize(
    output.buffer.slice(
      output.byteOffset,
      output.byteOffset + output.byteLength,
    ),
  );
});
test('unsafe or non-zip references are rejected before decompression', () => {
  assert.throws(() => checkZipSize(new ArrayBuffer(10)), /valid/);
  const buffer = new ArrayBuffer(46),
    view = new DataView(buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint32(24, 100 * 1024 * 1024, true);
  assert.throws(() => checkZipSize(buffer), /large/);
});
const route = ts.transpileModule(
  readFileSync(
    new URL('../app/api/generate/route.ts', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function api(fetchMock) {
  const exports = {};
  vm.runInNewContext(route, {
    exports,
    require: (id) =>
      id === 'next/server'
        ? {
            NextResponse: {
              json: (value, options) => Response.json(value, options),
            },
          }
        : id.endsWith('slide-plan')
          ? { extractSlidePlan }
          : { layouts },
    process: { env: { OLLAMA_API_KEY: 'test-only' } },
    fetch: fetchMock,
    AbortSignal,
    Response,
    Request,
  });
  return exports.POST;
}
const draft = Array.from({ length: 4 }, (_, i) => ({
  slideNumber: i + 1,
  title: `Generated ${i + 1}`,
  body: 'Supplied content.',
  bullets: ['One fact'],
  type: i === 0 ? 'cover' : 'content',
  layout: 'editorial',
}));
test('provided mode never searches; exact user headings and shuffled slide numbers are respected', async () => {
  let calls = 0;
  const post = api(async (url) => {
    calls++;
    assert.equal(url, 'https://ollama.com/api/chat');
    return Response.json({
      message: { content: JSON.stringify({ slides: [...draft].reverse() }) },
    });
  });
  const response = await post(
    new Request('http://test/api', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'provided',
        topic: 'Slide 1: Linux\nSlide 2: Introduction',
        count: 4,
      }),
    }),
  );
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  assert.equal(data.slides[0].title, 'Linux');
  assert.equal(data.slides[1].title, 'Introduction');
  assert.equal(calls, 1);
  assert.deepEqual(data.sources, []);
});
test('hybrid mode searches its explicit subject and retains the supplied plan', async () => {
  const calls = [];
  const post = api(async (url, options) => {
    calls.push(url);
    if (url.endsWith('web_search')) {
      assert.equal(JSON.parse(options.body).query, 'Linux security');
      return Response.json({
        results: [
          {
            title: 'Linux docs',
            url: 'https://kernel.org',
            content: 'Evidence',
          },
        ],
      });
    }
    const prompt = JSON.parse(options.body).messages[1].content;
    assert.match(prompt, /MANDATORY SLIDE PLAN/);
    return Response.json({
      message: { content: JSON.stringify({ slides: draft }) },
    });
  });
  const response = await post(
    new Request('http://test/api', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'hybrid',
        researchTopic: 'Linux security',
        topic: 'Slide 1: Linux\nSlide 2: Introduction',
        count: 4,
      }),
    }),
  );
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.sources.length, 1);
  assert.equal(calls.length, 2);
});
test('wrong count and duplicate positions fail visibly after bounded automatic retries', async () => {
  for (const slides of [
    draft.slice(0, 3),
    draft.map((item) => ({ ...item, slideNumber: 1 })),
  ]) {
    let calls = 0;
    const post = api(async () => {
      calls++;
      return Response.json({
        message: { content: JSON.stringify({ slides }) },
      });
    });
    const response = await post(
      new Request('http://test/api', {
        method: 'POST',
        body: JSON.stringify({ mode: 'provided', topic: 'Linux', count: 4 }),
      }),
    );
    assert.equal(response.status, 502);
    assert.equal(calls, 3);
    assert.match((await response.json()).error, /Your topic is fine/);
  }
});

for (const [name, patch] of [
  ['title', { title: 'Animals and their extraordinary habitats '.repeat(5) }],
  ['body', { body: 'Animals need food and shelter. '.repeat(20) }],
  [
    'bullet count',
    { bullets: ['Mammals', 'Birds', 'Fish', 'Reptiles', 'Amphibians'] },
  ],
  ['bullet length', { bullets: ['Animals live in many habitats. '.repeat(9)] }],
])
  test(`one-word animal topic with 10 slides repairs oversized ${name} automatically`, async () => {
    const complete = Array.from({ length: 10 }, (_, i) => ({
      ...draft[i % 4],
      slideNumber: i + 1,
      title: i === 1 ? 'Outline' : `Animals ${i + 1}`,
    }));
    let searches = 0,
      generations = 0;
    const post = api(async (url, options) => {
      const request = JSON.parse(options.body);
      if (url.endsWith('web_search')) {
        searches++;
        assert.equal(request.query, 'animal');
        return Response.json({
          results: [
            {
              title: 'Animal evidence',
              url: 'https://example.org/animals',
              content: 'Animals live in many habitats.',
            },
          ],
        });
      }
      generations++;
      assert.match(
        request.messages[0].content,
        /single word or short idea is a COMPLETE brief/,
      );
      if (generations === 2) {
        assert.match(
          request.messages.at(-1).content,
          /Repair the previous draft/,
        );
        assert.match(request.messages.at(-1).content, /exactly 10 slides/);
        assert.match(request.messages.at(-1).content, /Slide 4 exceeds/);
      }
      const slides = complete.map((item, i) =>
        generations === 1 && i === 3 ? { ...item, ...patch } : item,
      );
      return Response.json({
        message: { content: JSON.stringify({ slides }) },
      });
    });
    const response = await post(
      new Request('http://test/api', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'research',
          topic: 'animal',
          researchTopic: 'stale Linux topic',
          count: 10,
          audience: 'Students',
          tone: 'Friendly and simple',
        }),
      }),
    );
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.equal(result.slides.length, 10);
    assert.equal(searches, 1);
    assert.equal(generations, 2);
    assert.equal(result.sources.length, 1);
    assert.equal(result.slides[3].title, complete[3].title);
    assert.ok(
      result.slides.every(
        (s) =>
          s.title.length <= 120 &&
          s.body.length <= 420 &&
          s.bullets.length <= 4 &&
          s.bullets.every((b) => b.length <= 180),
      ),
    );
  });

test('repair preserves provided-only mode and exact slide headings', async () => {
  let calls = 0;
  const post = api(async (url, options) => {
    assert.ok(url.endsWith('/chat'));
    calls++;
    const request = JSON.parse(options.body);
    assert.match(request.messages[1].content, /MODE: provided/);
    if (calls === 1) return Response.json({ message: { content: 'not JSON' } });
    return Response.json({
      message: { content: JSON.stringify({ slides: [...draft].reverse() }) },
    });
  });
  const response = await post(
    new Request('http://test/api', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'provided',
        topic: 'Slide 1: My Animals\nSlide 2: Introduction',
        count: 4,
      }),
    }),
  );
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.equal(result.slides[0].title, 'My Animals');
  assert.equal(result.slides[1].title, 'Introduction');
  assert.deepEqual(result.sources, []);
});

test('research mode repairs a missing outline into slide 2', async () => {
  let generations = 0;
  const post = api(async (url, options) => {
    if (url.endsWith('web_search'))
      return Response.json({
        results: [
          {
            title: 'Animals',
            url: 'https://example.org/animals',
            content: 'Animal evidence.',
          },
        ],
      });
    generations++;
    const request = JSON.parse(options.body);
    assert.match(request.messages[0].content, /slide 2 must be titled/);
    const slides = draft.map((item, index) => ({
      ...item,
      title:
        generations === 1
          ? `Animals ${index + 1}`
          : index === 1
            ? 'Outline'
            : `Animals ${index + 1}`,
      bullets:
        index === 1 && generations > 1
          ? ['Habitats', 'Classification', 'Conservation']
          : item.bullets,
    }));
    return Response.json({
      message: { content: JSON.stringify({ slides }) },
    });
  });
  const response = await post(
    new Request('http://test/api', {
      method: 'POST',
      body: JSON.stringify({ mode: 'research', topic: 'animals', count: 4 }),
    }),
  );
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  assert.equal(generations, 2);
  assert.equal(result.slides[1].title, 'Outline');
  assert.deepEqual(result.slides[1].bullets, [
    'Habitats',
    'Classification',
    'Conservation',
  ]);
});

test('provider failures do not trigger repeated generation requests', async () => {
  let calls = 0;
  const post = api(async () => {
    calls++;
    return new Response('', { status: 429 });
  });
  const response = await post(
    new Request('http://test/api', {
      method: 'POST',
      body: JSON.stringify({ mode: 'provided', topic: 'animal', count: 4 }),
    }),
  );
  assert.equal(response.status, 500);
  assert.equal(calls, 1);
});
