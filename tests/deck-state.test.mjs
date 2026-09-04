import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileSlides, canVisitStage } from '../lib/deck-state.ts';

test('all workflow steps are available after deck creation', () => {
  for (let i = 0; i < 4; i++) assert.equal(canVisitStage(i, true, true), true);
});
test('uncreated stages remain unavailable', () => {
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => canVisitStage(i, false, false)),
    [true, false, false, false],
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => canVisitStage(i, true, false)),
    [true, true, true, false],
  );
});
test('returning from themes preserves body and bullet edits', () => {
  const slides = [
    { title: 'Edited', body: 'My custom text', bullets: ['My point'] },
  ];
  const result = reconcileSlides(slides, ['Edited']);
  assert.deepEqual(result, slides);
  assert.notEqual(result[0], slides[0]);
});
test('outline edits update titles without resetting slide content', () => {
  const slides = [{ title: 'Old', body: 'Keep', bullets: ['Keep too'] }];
  assert.deepEqual(reconcileSlides(slides, ['New']), [
    { title: 'New', body: 'Keep', bullets: ['Keep too'] },
  ]);
  assert.equal(slides[0].title, 'Old');
});
