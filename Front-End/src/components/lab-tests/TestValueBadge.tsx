interface Props {
  status: 'low' | 'normal' | 'high' | null;
}

export function TestValueBadge({ status }: Props) {
  const map = {
    low:    { bg: 'bg-red-100 text-red-700',      icon: '↓', label: 'منخفض' },
    high:   { bg: 'bg-orange-100 text-orange-700', icon: '↑', label: 'مرتفع' },
    normal: { bg: 'bg-green-100 text-green-700',   icon: '✓', label: 'طبيعي' },
  };

  if (!status || status.toLowerCase() === 'unknown') {
    return null;
  }

  const normalizedStatus = status.toLowerCase() as keyof typeof map;
  const match = map[normalizedStatus];

  if (!match) {
    return null;
  }

  const { bg, icon, label } = match;

  return (
    <span className={`${bg} text-xs font-semibold px-2 py-1 rounded-full flex items-center justify-center gap-1`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
