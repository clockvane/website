type Group = { [key: string]: unknown };

export function tokenName(path: string): string {
  return path
    .replaceAll('.', '-')
    .replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** Serialize the DTCG types used by the approved design system, including aliases. */
export function tokenValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.startsWith('{')
      ? `var(--${tokenName(value.slice(1, -1))})`
      : value;
  }
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return typeof value[0] === 'number'
      ? `cubic-bezier(${value.join(', ')})`
      : value
          .map((family) =>
            ['serif', 'sans-serif', 'monospace', 'system-ui'].includes(
              String(family),
            )
              ? String(family)
              : JSON.stringify(family),
          )
          .join(', ');
  }
  if (value && typeof value === 'object') {
    const v = value as Group;
    if ('hex' in v) return String(v.hex);
    if ('unit' in v) return `${v.value}${v.unit}`;
    if ('offsetX' in v) {
      return ['offsetX', 'offsetY', 'blur', 'spread', 'color']
        .map((key) => tokenValue(v[key]))
        .join(' ');
    }
  }
  throw new Error('Unsupported design token value');
}

export function tokenProperties(group: Group, path = ''): string[] {
  return Object.entries(group).flatMap(([key, value]) => {
    if (key.startsWith('$')) return [];
    const next = path ? `${path}.${key}` : key;
    const node = value as Group;
    return '$value' in node
      ? [`--${tokenName(next)}: ${tokenValue(node.$value)};`]
      : tokenProperties(node, next);
  });
}

/** Media queries require literal thresholds; custom properties cannot be used there. */
export function tokenMedia(css: string, tokens: Group): string {
  return css.replace(/token\(([\w.]+)\)/g, (_, path: string) => {
    const node = path.split('.').reduce<unknown>((group, key) => {
      return (group as Group)?.[key];
    }, tokens) as Group | undefined;
    if (!node || !('$value' in node)) throw new Error(`Unknown token: ${path}`);
    return tokenValue(node.$value);
  });
}
