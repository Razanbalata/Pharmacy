import { ean13Modules } from '@/shared/lib/barcode'
import { cn } from '@/shared/lib/cn'

interface BarcodeProps {
  /** 13 digits. Anything else prints as the number only. */
  code: string
  className?: string
}

/**
 * An EAN-13 barcode as SVG: sharp at any size and on any printer. Always black on white,
 * whatever the theme, because that is what a scanner reads.
 */
export function Barcode({ code, className }: BarcodeProps) {
  const readable = /^\d{13}$/.test(code)
  return (
    <span className={cn('flex flex-col items-center bg-white text-black', className)}>
      {readable && (
        <svg
          aria-hidden
          viewBox="0 0 95 30"
          preserveAspectRatio="none"
          className="h-8 w-full"
          shapeRendering="crispEdges"
        >
          {ean13Modules(code).map((black, index) =>
            black ? (
              // A module's position is its identity; the list never reorders.
              // oxlint-disable-next-line react/no-array-index-key
              <rect key={index} x={index} y={0} width={1} height={30} fill="#000" />
            ) : null,
          )}
        </svg>
      )}
      <span dir="ltr" className="font-mono text-[9px] leading-tight tracking-wider">
        {code}
      </span>
    </span>
  )
}
