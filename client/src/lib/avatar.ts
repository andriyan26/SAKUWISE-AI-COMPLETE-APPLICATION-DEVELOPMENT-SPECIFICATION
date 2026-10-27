/**
 * SAKUWISE AI — Avatar Utility Helper
 * Memastikan URL avatar selalu valid, tahan banting, dan tidak pernah rusak (broken image)
 * baik saat offline, saat migrasi database, atau saat data URL terpotong.
 */

export const getSafeAvatarUrl = (url?: string | null, name?: string | null): string => {
  const fallback = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'Andrian')}`;

  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }

  const trimmed = url.trim();

  // Deteksi Base64 data URL yang rusak atau terpotong oleh limit kolom varchar MySQL
  if (trimmed.startsWith('data:image/')) {
    // Foto base64 yang valid umumnya berukuran ribuan karakter.
    // Jika <= 300 karakter, itu dipastikan string terpotong (misal varchar 191) yang pasti corrupt.
    if (trimmed.length <= 300 || !trimmed.includes(';base64,')) {
      return fallback;
    }
    const parts = trimmed.split(';base64,');
    if (!parts[1] || parts[1].length < 100) {
      return fallback;
    }
    return trimmed;
  }

  // Jika URL berupa path relatif uploads, biarkan browser me-resolve dengan origin saat ini
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // Jika URL HTTP/HTTPS standar
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return fallback;
};

export const handleAvatarError = (
  e: React.SyntheticEvent<HTMLImageElement>,
  name?: string | null
): void => {
  const target = e.currentTarget;
  target.onerror = null; // Mencegah infinite loop
  target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'Andrian')}`;
};
