// Roles:
//   reporter  writes stories and sends them for review
//   editor    can edit anything, and decides what gets published

function isEditor(user) {
  return user.role === 'editor';
}

function isAuthor(user, story) {
  return story.author_id === user.id;
}

/** Reporters may edit their own drafts. Editors may edit any story. */
export function canEdit(user, story) {
  if (isEditor(user)) return true;
  return isAuthor(user, story) && story.status === 'draft';
}

/** Reporters may delete their own drafts. Editors may delete any story. */
export function canDelete(user, story) {
  if (isEditor(user)) return true;
  return isAuthor(user, story) && story.status === 'draft';
}

/**
 * The statuses this user may move this story to.
 *
 *   draft      -> in_review   (author or editor)
 *   in_review  -> draft       (author takes it back, or editor sends it back)
 *   in_review  -> published   (editor only)
 *   published  -> draft       (editor only, to unpublish)
 */
export function nextStatuses(user, story) {
  const editor = isEditor(user);
  const author = isAuthor(user, story);

  if (story.status === 'draft') {
    return editor || author ? ['in_review'] : [];
  }
  if (story.status === 'in_review') {
    if (editor) return ['published', 'draft'];
    return author ? ['draft'] : [];
  }
  if (story.status === 'published') {
    return editor ? ['draft'] : [];
  }
  return [];
}
