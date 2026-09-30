export function formatDateIndo(dateStrOrObj: string | Date | undefined | null): string {
  if (!dateStrOrObj) return '-';
  const d = new Date(dateStrOrObj);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(dateStrOrObj: string | Date): string {
  const d = new Date(dateStrOrObj);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatRelativeTime(dateStrOrObj: string | Date): string {
  const d = new Date(dateStrOrObj);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return 'Baru saja';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} hari lalu`;
  return formatDateIndo(d);
}
