/* eslint-disable @next/next/no-img-element -- User-supplied data URLs must stay local. */
import {
  createSlideScene,
  type DesignedSlide,
  type DesignTheme,
} from '@/lib/slide-design';
export function SlideScene({
  slide,
  theme,
  index,
  background,
  logo,
}: {
  slide: DesignedSlide;
  theme: DesignTheme;
  index: number;
  background: string;
  logo?: { data: string; position: string; size: number } | null;
}) {
  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg"
      style={{ background, containerType: 'inline-size' }}
      aria-label={`Slide ${index + 1}: ${slide.title}`}
    >
      {createSlideScene(slide, theme, index, logo).map((node, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${(node.x / 13.333) * 100}%`,
            top: `${(node.y / 7.5) * 100}%`,
            width: `${(node.w / 13.333) * 100}%`,
            height: `${(node.h / 7.5) * 100}%`,
            background: node.kind === 'rect' ? `#${node.fill}` : undefined,
            opacity: node.opacity,
            color: `#${node.color}`,
            fontSize: `${(node.size ?? 12) / 9.6}cqw`,
            fontWeight: node.bold ? 700 : 400,
            fontFamily: node.font
              ? `"${node.font}", Arial, sans-serif`
              : 'Arial, sans-serif',
            lineHeight: 1.22,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {node.text}
        </div>
      ))}
      {logo && (
        <div
          className="absolute z-10 rounded bg-white/95 p-1"
          style={{
            width: `${logo.size}%`,
            height: `${(logo.size * 0.55 * 13.333) / 7.5}%`,
            [logo.position.endsWith('left') ? 'left' : 'right']: '5%',
            [logo.position.startsWith('top') ? 'top' : 'bottom']: '4%',
          }}
        >
          <img
            src={logo.data}
            alt="Organization logo"
            className="h-full w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
