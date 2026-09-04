const groups = [
  [
    'linux',
    'ubuntu',
    'debian',
    'fedora',
    'arch linux',
    'unix',
    'bash',
    'kernel',
    'terminal',
    'open source',
    'operating system',
    'software',
    'computing',
    'coding',
    'code',
    'computer science',
    'technology',
  ],
  [
    'cybersecurity',
    'cyber security',
    'cyber',
    'security',
    'encryption',
    'forensics',
    'network',
    'zero trust',
  ],
  [
    'ai',
    'artificial intelligence',
    'machine learning',
    'neural',
    'deep learning',
    'data science',
  ],
  [
    'school',
    'classroom',
    'teacher',
    'students',
    'lesson',
    'education',
    'books',
  ],
  ['university', 'college', 'academic', 'thesis', 'graduation'],
  [
    'science',
    'chemistry',
    'biology',
    'physics',
    'stem',
    'laboratory',
    'research',
  ],
  ['space', 'astronomy', 'planet', 'planets', 'universe', 'solar system'],
  ['ocean', 'marine', 'sea', 'coral', 'underwater'],
  ['medicine', 'medical', 'health', 'healthcare', 'dna', 'wellness'],
  ['business', 'startup', 'corporate', 'pitch', 'executive'],
  ['finance', 'banking', 'investment', 'market', 'financial'],
  ['nature', 'environment', 'sustainability', 'climate', 'green'],
  ['sports', 'sport', 'fitness', 'athletics', 'running'],
  ['history', 'historical', 'archive', 'civilization'],
];
const stop = new Set(
  'the a an on about of for and with this my create presentation slide slides template background theme introduction conclusion title to is in how what should want need information'.split(
    ' ',
  ),
);
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#]+/gu, ' ')
    .trim();
const includes = (text: string, term: string) =>
  ` ${text} `.includes(` ${term} `);
export type ThemeMatchInput = {
  name: string;
  note?: string;
  category?: string;
  tags?: string;
  artwork?: string;
};
export function matchTheme(theme: ThemeMatchInput, topic: string) {
  const source = normalize(topic);
  const name = normalize(theme.name);
  const searchable = normalize(
    `${theme.name} ${theme.note ?? ''} ${theme.category ?? ''} ${theme.tags ?? ''}`,
  );
  const words = [
    ...new Set(
      source.split(' ').filter((word) => word.length > 1 && !stop.has(word)),
    ),
  ];
  const direct = words.reduce(
    (score, word) =>
      score + (includes(name, word) ? 20 : includes(searchable, word) ? 7 : 0),
    0,
  );
  const related = groups
    .filter((group) => group.some((term) => includes(source, term)))
    .reduce(
      (score, group) =>
        score + (group.some((term) => includes(searchable, term)) ? 5 : 0),
      0,
    );
  return {
    score: direct + related,
    reason: direct ? 'Topic match' : related ? 'Related subject' : '',
  };
}
export function rankThemes<T extends ThemeMatchInput>(
  themes: T[],
  topic: string,
) {
  return themes
    .map((theme, index) => ({ theme, index, ...matchTheme(theme, topic) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(Boolean(b.theme.artwork)) - Number(Boolean(a.theme.artwork)) ||
        a.index - b.index,
    );
}
