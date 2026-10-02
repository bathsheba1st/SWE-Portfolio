export const STATUS_LABELS = {
  draft: 'Draft',
  in_review: 'In review',
  published: 'Published',
};

export const TOPICS = ['politics', 'business', 'technology', 'science', 'world'];

export function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

/** "2026-10-02T14:05:00.000Z" -> "Oct 2, 9:05 AM" in the reader's time zone. */
export function formatDate(isoString) {
  return dateFormat.format(new Date(isoString));
}
