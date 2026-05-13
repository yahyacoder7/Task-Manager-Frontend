export const formatDateShort = (iso: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
};

export const formatDateFull = (iso: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
};

export const formatDateOnly = (iso: string) => {
  if (!iso) return '';
  try {
    const [datePart] = iso.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
};

export const formatDateArabic = (iso: string) => {
  if (!iso) return 'غير معروف';
  try {
    const [datePart] = iso.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
};

export const isSameDay = (isoA: string, isoB: string): boolean => {
  try {
    const [dateA] = isoA.split('T');
    const [dateB] = isoB.split('T');
    return dateA === dateB;
  } catch { return false; }
};

export const isToday = (iso: string): boolean => {
  if (!iso) return false;
  try {
    const [datePart] = iso.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const today = new Date();
    return d === today.getDate() && m === today.getMonth() + 1 && y === today.getFullYear();
  } catch { return false; }
};
