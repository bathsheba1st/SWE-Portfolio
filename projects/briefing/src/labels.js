export function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
});

export function formatDate(isoString) {
  return dateFormat.format(new Date(isoString));
}
