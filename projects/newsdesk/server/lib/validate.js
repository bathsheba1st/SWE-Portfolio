export const TOPICS = ['politics', 'business', 'technology', 'science', 'world'];

const LIMITS = {
  title: { min: 5, max: 120 },
  summary: { min: 10, max: 200 },
  body: { min: 50, max: 20000 },
};

/**
 * Checks the fields of a story sent by the browser.
 *
 * Returns { values, errors }. `errors` has one message per invalid field,
 * for example { title: 'Title must be at least 5 characters.' }.
 * When `errors` is empty, `values` is safe to save.
 */
export function validateStory(input) {
  const data = input ?? {};
  const values = {};
  const errors = {};

  for (const field of ['title', 'summary', 'body']) {
    // Anything that is not a string (a number, an object, missing) becomes ''.
    const text = typeof data[field] === 'string' ? data[field].trim() : '';
    const { min, max } = LIMITS[field];
    const label = field[0].toUpperCase() + field.slice(1);

    if (text.length < min) {
      errors[field] = `${label} must be at least ${min} characters.`;
    } else if (text.length > max) {
      errors[field] = `${label} must be at most ${max} characters.`;
    }
    values[field] = text;
  }

  if (TOPICS.includes(data.topic)) {
    values.topic = data.topic;
  } else {
    errors.topic = 'Choose a topic from the list.';
  }

  return { values, errors };
}

/** Turns "Council Approves New Budget!" into "council-approves-new-budget". */
export function slugify(title) {
  const slug = title
    .toLowerCase()
    .normalize('NFKD') // split "é" into "e" + accent
    .replace(/[̀-ͯ]/g, '') // drop the accents
    .replace(/[^a-z0-9]+/g, '-') // everything else becomes a dash
    .replace(/^-+|-+$/g, '') // no dash at the start or end
    .slice(0, 80)
    .replace(/-+$/g, '');
  return slug || 'story';
}
