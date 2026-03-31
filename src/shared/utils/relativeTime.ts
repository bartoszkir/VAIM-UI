export function relativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) {
    return "unknown";
  }

  const diffMs = Date.now() - timestamp;
  const days = Math.max(0, Math.floor(diffMs / 86_400_000));

  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}
