export const layouts = [
  'cover',
  'editorial',
  'split',
  'cards',
  'comparison',
  'timeline',
  'diagram',
  'closing',
] as const;
export type SlideLayout = (typeof layouts)[number];
export type DesignedSlide = {
  title: string;
  body: string;
  bullets: string[];
  type: 'cover' | 'content' | 'closing';
  layout?: SlideLayout;
};
export type DesignTheme = {
  bg: string;
  bg2: string;
  ink: string;
  accent: string;
  font?: string;
};
export type SceneLogo = { position: string; size: number };
export function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => {
    const values = [0, 2, 4]
      .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const first = luminance(a),
    second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
export function readableTheme(theme: DesignTheme): DesignTheme {
  const fallback =
    contrastRatio(theme.bg, 'FFFFFF') >= contrastRatio(theme.bg, '111111')
      ? 'FFFFFF'
      : '111111';
  return {
    ...theme,
    ink: contrastRatio(theme.bg, theme.ink) < 4.5 ? fallback : theme.ink,
  };
}
export type Element = {
  kind: 'text' | 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  size?: number;
  color: string;
  bold?: boolean;
  fill?: string;
  font?: string;
  opacity?: number;
};
export function chooseLayout(slide: DesignedSlide): SlideLayout {
  if (slide.layout && layouts.includes(slide.layout)) return slide.layout;
  if (slide.type === 'cover') return 'cover';
  const title = slide.title.toLowerCase();
  if (/compar|versus|\bvs\b|advantages|pros and cons/.test(title))
    return 'comparison';
  if (/timeline|history|roadmap|steps|process|workflow/.test(title))
    return 'timeline';
  if (/architecture|components|structure|how.+works|system design/.test(title))
    return 'diagram';
  if (slide.type === 'closing' || /conclusion|summary|takeaway/.test(title))
    return 'closing';
  if (/agenda|outline|introduction|overview/.test(title)) return 'editorial';
  return slide.bullets.filter(Boolean).length >= 3 ? 'cards' : 'split';
}
function estimatedLines(text: string, width: number, size: number) {
  const capacity = Math.max(1, Math.floor((width * 72) / (size * 0.55)));
  return text.split('\n').reduce((total, line) => {
    let lines = 1,
      used = 0;
    for (const word of line.split(/\s+/)) {
      if (used && used + word.length + 1 > capacity) {
        lines++;
        used = 0;
      }
      lines += Math.max(0, Math.ceil(word.length / capacity) - 1);
      used += word.length + 1;
    }
    return total + lines;
  }, 0);
}
export function fittedSize(
  text: string,
  w: number,
  h: number,
  desired: number,
) {
  let size = desired;
  while (size > 12 && (estimatedLines(text, w, size) * size * 1.22) / 72 > h)
    size--;
  return size;
}
export function createSlideScene(
  slide: DesignedSlide,
  theme: DesignTheme,
  index: number,
  logo?: SceneLogo | null,
): Element[] {
  theme = readableTheme(theme);
  const nodes: Element[] = [];
  const text = (
    value: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    bold = false,
    color = theme.ink,
  ) => {
    if (value.trim())
      nodes.push({
        kind: 'text',
        text: value,
        x,
        y,
        w,
        h,
        size: fittedSize(value, w, h, size),
        bold,
        color,
        font: theme.font,
      });
  };
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill = theme.bg,
    opacity = 0.94,
  ) => nodes.push({ kind: 'rect', x, y, w, h, color: fill, fill, opacity });
  const layout = chooseLayout(slide);
  const points = slide.bullets.filter(Boolean);
  // All packs share safe margins and type hierarchy; each slide has a content-specific composition.
  rect(0.55, 1.2, layout === 'cover' ? 8.8 : 12.2, 5.7, theme.bg, 0.94);
  rect(0.75, 1.45, 0.08, 0.65, theme.accent, 1);
  text(
    `${String(index + 1).padStart(2, '0')} / ${layout.toUpperCase()}`,
    4.0,
    0.55,
    4.2,
    0.3,
    10,
    true,
    theme.ink,
  );
  if (layout === 'cover') {
    text(slide.title, 0.95, 1.8, 7.9, 1.65, 38, true);
    text(slide.body, 0.98, 3.75, 7.9, 0.85, 20);
    text(points.join('\n'), 0.98, 4.95, 7.9, 1.45, 17);
  } else {
    text(slide.title, 0.98, 1.42, 10.9, 1.05, 29, true);
    text(slide.body, 0.98, 2.62, 10.9, 0.85, 17);
    if (layout === 'cards' || layout === 'comparison') {
      const columns =
        layout === 'comparison' ? 2 : Math.max(1, Math.min(4, points.length));
      const width = (11.3 - (columns - 1) * 0.25) / columns;
      for (let column = 0; column < columns; column++) {
        const start = Math.floor((column * points.length) / columns),
          end = Math.floor(((column + 1) * points.length) / columns);
        const content = points.slice(start, end).join('\n\n');
        if (!content) continue;
        const x = 0.98 + column * (width + 0.25);
        rect(x, 3.85, width, 2.55, theme.bg2, 0.22);
        rect(x, 3.85, width, 0.06, theme.accent, 1);
        text(content, x + 0.2, 4.15, width - 0.4, 1.95, 19);
      }
    } else if (layout === 'timeline') {
      const width = 11.2 / Math.max(1, points.length);
      rect(1.05, 3.95, 10.9, 0.035, theme.accent, 1);
      points.forEach((point, i) => {
        const x = 1.05 + i * width;
        rect(x, 3.8, 0.36, 0.36, theme.accent, 1);
        text(String(i + 1), x, 4.32, 0.45, 0.38, 17, true);
        text(point, x, 4.85, width - 0.3, 1.5, 18);
      });
    } else if (layout === 'diagram') {
      const width = 11.3 / Math.max(1, points.length);
      points.forEach((point, i) => {
        const x = 0.98 + i * width;
        rect(x, 4.05, width - 0.25, 2.15, theme.bg2, 0.24);
        text(point, x + 0.16, 4.3, width - 0.58, 1.6, 18);
        if (i < points.length - 1)
          text('→', x + width - 0.28, 4.7, 0.3, 0.45, 17, true, theme.accent);
      });
    } else if (layout === 'split') {
      const half = Math.ceil(points.length / 2);
      text(
        points
          .slice(0, half)
          .map((point) => `• ${point}`)
          .join('\n\n'),
        1.05,
        3.85,
        5.15,
        2.4,
        20,
      );
      rect(6.62, 3.85, 0.025, 2.4, theme.accent, 0.8);
      text(
        points
          .slice(half)
          .map((point) => `• ${point}`)
          .join('\n\n'),
        7.0,
        3.85,
        5.05,
        2.4,
        20,
      );
    } else {
      points.forEach((point, i) => {
        const y = 3.75 + i * 0.66;
        text(
          layout === 'closing' ? '✓' : String(i + 1).padStart(2, '0'),
          1.02,
          y,
          0.5,
          0.51,
          17,
          true,
          theme.accent,
        );
        text(point, 1.7, y, 10.1, 0.54, 18);
      });
    }
  }
  if (logo) {
    const height = ((13.333 * logo.size) / 100) * 0.55;
    const top = logo.position.startsWith('top')
      ? Math.max(1.2, 0.3 + height + 0.15)
      : 1.2;
    const bottom = logo.position.startsWith('bottom')
      ? Math.min(6.9, 7.2 - height - 0.15)
      : 6.9;
    const factor = (bottom - top) / 5.7;
    for (const node of nodes)
      if (node.y >= 1.2) {
        node.y = top + (node.y - 1.2) * factor;
        node.h *= factor;
        if (node.kind === 'text')
          node.size = fittedSize(
            node.text ?? '',
            node.w,
            node.h,
            node.size ?? 12,
          );
      }
  }
  return nodes;
}
export function qualityIssues(
  slides: DesignedSlide[],
  theme: DesignTheme,
  logo?: SceneLogo | null,
) {
  const issues: { slide: number; message: string }[] = [];
  slides.forEach((slide, index) => {
    if (!slide.title.trim())
      issues.push({ slide: index, message: 'Add a slide title.' });
    if (!slide.body.trim() && !slide.bullets.some(Boolean))
      issues.push({
        slide: index,
        message: 'This slide has no supporting content.',
      });
    for (const node of createSlideScene(slide, theme, index, logo)) {
      if (
        node.kind === 'text' &&
        (estimatedLines(node.text ?? '', node.w, node.size ?? 12) *
          (node.size ?? 12) *
          1.22) /
          72 >
          node.h + 0.02
      ) {
        issues.push({
          slide: index,
          message:
            'Text may be too dense. Shorten it or choose a wider layout.',
        });
        break;
      }
    }
  });
  return issues;
}
