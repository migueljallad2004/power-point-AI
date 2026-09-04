const words = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
];
export type SlideInstruction = {
  number: number;
  instruction: string;
  title?: string;
};
export function extractSlidePlan(text: string): SlideInstruction[] {
  const pattern = new RegExp(
    `\\b(?:slide|page)\\s*(\\d{1,2}|${words.join('|')})\\b\\s*[:.)\\-–—]?\\s*`,
    'gi',
  );
  const markers = [...text.matchAll(pattern)];
  // A plain numbered outline must start each item on a new line.
  const numbered = markers.length
    ? markers
    : [...text.matchAll(/^\s*(\d{1,2})[.)]\s+/gm)];
  const plan = numbered
    .map((marker, i) => {
      const number = /^\d+$/.test(marker[1])
        ? Number(marker[1])
        : words.indexOf(marker[1].toLowerCase()) + 1;
      const instruction = text
        .slice(
          (marker.index ?? 0) + marker[0].length,
          numbered[i + 1]?.index ?? text.length,
        )
        .trim()
        .replace(/[;\s]+$/, '');
      const firstLine = instruction.split(/\n/)[0].trim();
      const explicit = /^(?:title|heading)\s*[:=]\s*["“]?(.+?)["”]?\.?$/i.exec(
        firstLine,
      );
      const simple =
        firstLine.length <= 80 &&
        !/\b(want|write|explain|include|talk|should|need|show|discuss|add)\b/i.test(
          firstLine,
        );
      return {
        number,
        instruction,
        title:
          explicit?.[1] ??
          (simple ? firstLine.replace(/[.;]$/, '') : undefined),
      };
    })
    .filter(
      (item) => item.number >= 1 && item.number <= 15 && item.instruction,
    );
  if (new Set(plan.map((item) => item.number)).size !== plan.length)
    throw new Error(
      'A slide number appears twice. Please give each slide one instruction block.',
    );
  return plan.sort((a, b) => a.number - b.number);
}
