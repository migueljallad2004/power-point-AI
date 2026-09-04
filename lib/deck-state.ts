export function reconcileSlides<T extends { title: string }>(
  slides: T[],
  outline: string[],
): T[] {
  return slides.map((slide, index) => ({
    ...slide,
    title: outline[index] ?? slide.title,
  }));
}

export function canVisitStage(
  index: number,
  hasDraft: boolean,
  hasDeck: boolean,
) {
  return index === 0 || (index === 3 ? hasDeck : hasDraft || hasDeck);
}
