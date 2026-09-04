'use client';
/* eslint-disable @next/next/no-img-element -- Imported images remain local data URLs. */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { readReference, type ReferenceDeck } from '@/lib/reference-deck';
export function ReferenceUpload({
  reference,
  onReference,
  onUseText,
  onLogo,
}: {
  reference: ReferenceDeck | null;
  onReference: (value: ReferenceDeck | null) => void;
  onUseText: (text: string) => void;
  onLogo: (image: { name: string; data: string }) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <section className="rounded-2xl border border-[#6246ea]/20 bg-[#f8f6ff] p-4">
      <label htmlFor="reference-pptx" className="text-sm font-semibold">
        Match a reference PowerPoint
      </label>
      <p className="mt-1 text-xs leading-5 text-black/55">
        Read its colors, font, slide text, and embedded pictures. Use them with
        editable Decksmith layouts. Original positioning and animations are not
        copied exactly.
      </p>
      <input
        id="reference-pptx"
        className="mt-3 w-full text-xs"
        type="file"
        accept=".pptx"
        disabled={busy}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          setBusy(true);
          setError('');
          try {
            onReference(await readReference(file));
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : 'Could not read that PowerPoint.',
            );
          } finally {
            setBusy(false);
          }
        }}
      />
      <p className="mt-2 text-[11px] text-black/45">
        .pptx up to 12 MB. Read locally; extracted text is sent to the AI only
        if you choose to use it as your information.
      </p>
      {busy && (
        <output className="mt-2 block text-xs">Reading the reference…</output>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {reference && (
        <div className="mt-4 border-t border-black/10 pt-3">
          <p className="text-sm font-semibold">{reference.name}</p>
          <p className="mt-1 text-xs text-black/50">
            {reference.titles.length} slides read · Font: {reference.font}{' '}
            (local fallback if unavailable)
          </p>
          <div className="mt-2 flex gap-2">
            {[reference.bg, reference.ink, reference.accent].map((color, i) => (
              <span
                key={i}
                className="size-6 rounded-full border border-black/20"
                style={{ backgroundColor: `#${color}` }}
                title={`#${color}`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => onUseText(reference.content)}
            >
              Use extracted slide text
            </Button>
            <Button variant="ghost" onClick={() => onReference(null)}>
              Remove reference
            </Button>
          </div>
          {reference.images.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold">
                Choose a logo from its pictures
              </summary>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {reference.images.map((image) => (
                  <button
                    key={image.name}
                    type="button"
                    onClick={() => onLogo(image)}
                    className="rounded-lg border border-black/10 bg-white p-2"
                    aria-label={`Use ${image.name} as logo`}
                  >
                    <img
                      src={image.data}
                      alt={image.name}
                      className="h-14 w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
