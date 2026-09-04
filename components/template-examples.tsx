import { useState } from 'react';
import { SlideScene } from '@/components/slide-scene';
import { Button } from '@/components/ui/button';
import type { DesignedSlide, DesignTheme } from '@/lib/slide-design';
type Example = {
  index: number;
  theme: DesignTheme & { name: string; canvas: string };
};
export function TemplateExamples({
  examples,
  slides,
  onChoose,
}: {
  examples: Example[];
  slides: DesignedSlide[];
  onChoose: (index: number) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);
  const selected = Math.min(previewSlide, Math.max(0, slides.length - 1));
  if (!slides.length) return null;
  return (
    <section
      className="mt-6 rounded-2xl border border-[#6246ea]/15 bg-[#f4f1ff] p-4 sm:p-5"
      aria-labelledby="template-examples-heading"
    >
      <h2 id="template-examples-heading" className="text-lg font-semibold">
        Your idea, different designs
      </h2>
      <p className="mt-1 text-sm text-black/55">
        These examples use your actual “{slides[0].title}” draft. Compare
        complete slide designs, then pick the one you want.
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          disabled={selected === 0}
          onClick={() => setPreviewSlide(selected - 1)}
          aria-label="Preview previous slide in all templates"
        >
          Previous slide
        </Button>
        <span className="text-xs font-semibold" aria-live="polite">
          Preview slide {selected + 1} of {slides.length}
        </span>
        <Button
          variant="outline"
          disabled={selected === slides.length - 1}
          onClick={() => setPreviewSlide(selected + 1)}
          aria-label="Preview next slide in all templates"
        >
          Next slide
        </Button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {examples.slice(0, showMore ? 6 : 3).map(({ theme, index }) => (
          <article
            key={index}
            className="min-w-0 rounded-xl border border-black/10 bg-white p-2 shadow-sm"
          >
            <SlideScene
              slide={slides[selected]}
              theme={theme}
              index={selected}
              background={theme.canvas}
            />
            <div className="mt-2 grid grid-cols-3 gap-1">
              {slides.slice(0, 3).map((slide, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setPreviewSlide(i)}
                  aria-label={`Preview slide ${i + 1}: ${slide.title}`}
                  className={`rounded border p-0.5 ${selected === i ? 'border-[#6246ea]' : 'border-transparent'}`}
                >
                  <div className="pointer-events-none" aria-hidden="true">
                    <SlideScene
                      slide={slide}
                      theme={theme}
                      index={i}
                      background={theme.canvas}
                    />
                  </div>
                </button>
              ))}
            </div>
            <h3 className="mt-3 px-1 text-sm font-semibold">{theme.name}</h3>
            <p className="mt-1 px-1 text-[11px] text-black/50">
              Your content · matching slide layouts
            </p>
            <Button
              onClick={() => onChoose(index)}
              className="mt-3 w-full bg-[#6246ea]"
            >
              Use this template
            </Button>
          </article>
        ))}
      </div>
      {examples.length > 3 && (
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Show fewer examples' : 'Show more examples for my idea'}
        </Button>
      )}
    </section>
  );
}
