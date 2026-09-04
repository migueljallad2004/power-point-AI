import JSZip from 'jszip';
export type ReferenceDeck = {
  name: string;
  titles: string[];
  content: string;
  bg: string;
  ink: string;
  accent: string;
  font: string;
  images: { name: string; data: string }[];
};
export function checkZipSize(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  let total = 0,
    entries = 0;
  for (let i = 0; i + 46 <= view.byteLength; i++) {
    if (view.getUint32(i, true) !== 0x02014b50) continue;
    const size = view.getUint32(i + 24, true);
    total += size;
    entries++;
    if (size > 24 * 1024 * 1024 || total > 80 * 1024 * 1024 || entries > 2000)
      throw new Error(
        'This reference is too large to read safely. Use a smaller PowerPoint.',
      );
    i +=
      45 +
      view.getUint16(i + 28, true) +
      view.getUint16(i + 30, true) +
      view.getUint16(i + 32, true);
  }
  if (!entries) throw new Error('Choose a valid, unencrypted .pptx file.');
}
const xml = (value: string) =>
  new DOMParser().parseFromString(value, 'application/xml');
const descendants = (node: Document | Element, name: string) =>
  Array.from(node.getElementsByTagNameNS('*', name));
export async function readReference(file: File): Promise<ReferenceDeck> {
  if (
    !file.name.toLowerCase().endsWith('.pptx') ||
    file.size > 12 * 1024 * 1024
  )
    throw new Error('Choose a .pptx file under 12 MB.');
  const buffer = await file.arrayBuffer();
  checkZipSize(buffer);
  const zip = await JSZip.loadAsync(buffer);
  if (!zip.file('ppt/presentation.xml'))
    throw new Error('This file is not a PowerPoint presentation.');
  const presentation = xml(
    await zip.file('ppt/presentation.xml')!.async('string'),
  );
  const relFile = zip.file('ppt/_rels/presentation.xml.rels');
  const rels = relFile
    ? descendants(xml(await relFile.async('string')), 'Relationship')
    : [];
  const ordered = descendants(presentation, 'sldId')
    .map((node) => {
      const id = node.getAttribute('r:id');
      const target =
        rels
          .find((rel) => rel.getAttribute('Id') === id)
          ?.getAttribute('Target') ?? '';
      return target.startsWith('/')
        ? target.slice(1)
        : `ppt/${target.replace(/^\.\//, '')}`;
    })
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .slice(0, 15);
  const slideFiles = ordered.length
    ? ordered
    : zip
        .file(/^ppt\/slides\/slide\d+\.xml$/)
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true }),
        )
        .slice(0, 15)
        .map((item) => item.name);
  const contents = await Promise.all(
    slideFiles.map(async (path) => {
      const file = zip.file(path);
      if (!file) return [];
      return descendants(xml(await file.async('string')), 't')
        .map((node) => node.textContent?.trim() ?? '')
        .filter(Boolean);
    }),
  );
  const themeFile = zip.file('ppt/theme/theme1.xml');
  const theme = xml(themeFile ? await themeFile.async('string') : '<theme/>');
  const color = (key: string, fallback: string) => {
    const node = descendants(theme, key)[0];
    const value = node?.firstElementChild?.getAttribute('val') ?? '';
    const system = node?.firstElementChild?.getAttribute('lastClr') ?? '';
    return /^[a-f\d]{6}$/i.test(value)
      ? value
      : /^[a-f\d]{6}$/i.test(system)
        ? system
        : fallback;
  };
  const major = descendants(theme, 'majorFont')[0];
  const candidate = major
    ? descendants(major, 'latin')[0]?.getAttribute('typeface')
    : null;
  const font =
    candidate && /^[\w .-]{1,64}$/.test(candidate) ? candidate : 'Arial';
  const images = [];
  for (const entry of zip
    .file(/^ppt\/media\/[^/]+\.(?:png|jpe?g|webp)$/i)
    .slice(0, 8)) {
    const data = await entry.async('uint8array');
    if (data.length > 2 * 1024 * 1024) continue;
    const ext = entry.name.split('.').at(-1)?.toLowerCase();
    const mime =
      ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : 'image/jpeg';
    images.push({
      name: entry.name.split('/').at(-1)!,
      data: `data:${mime};base64,${await entry.async('base64')}`,
    });
  }
  return {
    name: file.name,
    titles: contents.map((text, i) => text[0] ?? `Slide ${i + 1}`),
    content: contents
      .map((text, i) => `Slide ${i + 1}: ${text.join('\n')}`)
      .join('\n\n')
      .slice(0, 14000),
    bg: color('lt1', 'F8FAFC'),
    ink: color('dk1', '172033'),
    accent: color('accent1', '6246EA'),
    font,
    images,
  };
}
