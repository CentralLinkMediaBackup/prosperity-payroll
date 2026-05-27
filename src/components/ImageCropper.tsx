import { useState, useRef, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react'

interface Props {
  src: string
  onDone: (croppedDataUrl: string) => void
  onCancel: () => void
}

const CIRCLE = 240

export default function ImageCropper({ src, onDone, onCancel }: Props) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    setNaturalSize({ w, h })
    setScale(Math.max(CIRCLE / w, CIRCLE / h) * 1.05)
    setOffset({ x: 0, y: 0 })
  }

  const startDrag = (clientX: number, clientY: number) => {
    dragging.current = true
    dragStart.current = { x: clientX, y: clientY, ox: offset.x, oy: offset.y }
  }
  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current) return
    setOffset({
      x: dragStart.current.ox + clientX - dragStart.current.x,
      y: dragStart.current.oy + clientY - dragStart.current.y,
    })
  }, [])
  const endDrag = useCallback(() => { dragging.current = false }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => { if (e.touches[0]) moveDrag(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', endDrag)
    window.addEventListener('touchmove', onTouch, { passive: false })
    window.addEventListener('touchend', endDrag)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', endDrag)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', endDrag)
    }
  }, [moveDrag, endDrag])

  const zoomIn  = () => setScale(s => Math.min(s * 1.15, 10))
  const zoomOut = () => setScale(s => Math.max(s * (1 / 1.15), Math.max(CIRCLE / naturalSize.w, CIRCLE / naturalSize.h)))

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.deltaY < 0 ? zoomIn() : zoomOut()
  }

  const handleDone = () => {
    if (!imgRef.current || naturalSize.w === 0) return
    const OUT = 300
    const canvas = document.createElement('canvas')
    canvas.width = OUT; canvas.height = OUT
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2)
    ctx.clip()
    const ratio = OUT / CIRCLE
    const dispW = naturalSize.w * scale
    const dispH = naturalSize.h * scale
    ctx.drawImage(
      imgRef.current,
      (CIRCLE / 2 - dispW / 2 + offset.x) * ratio,
      (CIRCLE / 2 - dispH / 2 + offset.y) * ratio,
      dispW * ratio,
      dispH * ratio,
    )
    onDone(canvas.toDataURL('image/jpeg', 0.88))
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs text-slate-400">Drag to reposition · scroll or +/− to zoom</p>

      {/* Circular crop viewport */}
      <div
        className="relative select-none cursor-grab active:cursor-grabbing"
        style={{
          width: CIRCLE, height: CIRCLE,
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#cbd5e1',
          border: '3px solid #1B3A5C',
          boxShadow: '0 0 0 4px rgba(27,58,92,0.15)',
        }}
        onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onTouchStart={(e) => { if (e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY) }}
        onWheel={handleWheel}
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={onImgLoad}
          style={{
            position: 'absolute',
            width: naturalSize.w ? naturalSize.w * scale : '100%',
            height: naturalSize.h ? naturalSize.h * scale : 'auto',
            maxWidth: 'none',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      </div>

      {/* Zoom bar */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={zoomOut}
          className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors">
          <ZoomOut className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-xs text-slate-400 w-10 text-center">{Math.round(scale * 100)}%</span>
        <button type="button" onClick={zoomIn}
          className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors">
          <ZoomIn className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="flex gap-3 w-full pt-1">
        <button type="button" onClick={handleDone}
          className="flex-1 flex items-center justify-center gap-2 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          style={{ background: '#1B3A5C' }}>
          <Check className="w-4 h-4" /> Done
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 border border-slate-200 hover:bg-slate-50 rounded-lg py-2 text-sm text-slate-600 transition-colors">
          <span className="flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5" /> Cancel</span>
        </button>
      </div>
    </div>
  )
}
