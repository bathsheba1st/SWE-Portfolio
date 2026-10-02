import test from 'node:test';
import assert from 'node:assert/strict';
import { canDelete, canEdit, nextStatuses } from '../server/lib/permissions.js';

const reporter = { id: 1, role: 'reporter' };
const otherReporter = { id: 2, role: 'reporter' };
const editor = { id: 3, role: 'editor' };

const story = (status) => ({ author_id: reporter.id, status });

test('a reporter can edit their own draft', () => {
  assert.equal(canEdit(reporter, story('draft')), true);
});

test('a reporter cannot edit their story once it is in review or published', () => {
  assert.equal(canEdit(reporter, story('in_review')), false);
  assert.equal(canEdit(reporter, story('published')), false);
});

test('a reporter cannot edit or delete someone else\'s draft', () => {
  assert.equal(canEdit(otherReporter, story('draft')), false);
  assert.equal(canDelete(otherReporter, story('draft')), false);
});

test('an editor can edit and delete any story in any status', () => {
  for (const status of ['draft', 'in_review', 'published']) {
    assert.equal(canEdit(editor, story(status)), true);
    assert.equal(canDelete(editor, story(status)), true);
  }
});

test('the author can send a draft for review and take it back', () => {
  assert.deepEqual(nextStatuses(reporter, story('draft')), ['in_review']);
  assert.deepEqual(nextStatuses(reporter, story('in_review')), ['draft']);
});

test('only an editor can publish or unpublish', () => {
  assert.deepEqual(nextStatuses(editor, story('in_review')), ['published', 'draft']);
  assert.deepEqual(nextStatuses(editor, story('published')), ['draft']);
  assert.deepEqual(nextStatuses(reporter, story('published')), []);
});

test('a reporter cannot move someone else\'s story at all', () => {
  for (const status of ['draft', 'in_review', 'published']) {
    assert.deepEqual(nextStatuses(otherReporter, story(status)), []);
  }
});
