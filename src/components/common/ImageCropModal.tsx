import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move, 
  Crop, 
  ArrowUp, 
  Sliders,
  Check
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (croppedUrl: string) => Promise<void> | void;
  title?: string;
  aspectRatioPreset?: '16:9' | '3:2' | '4:3' | '1:1' | 'contain';
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onSave,
  title = 'Adjust & Crop Image',
  aspectRatioPreset = '16:9'
}) => {
  const [aspectPreset, setAspectPreset] = useState<'16:9' | '3:2' | '4:3' | '1:1' | 'contain'>(aspectRatioPreset);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [detectedBg, setDetectedBg] = useState('#FAF6F0');

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startDragRef = useRef({ x: 0, y: 0 });

  // Ratio mapping
  const targetRatio = aspectPreset === '16:9' ? 16 / 9
    : aspectPreset === '3:2' ? 3 / 2
    : aspectPreset === '4:3' ? 4 / 3
    : aspectPreset === '1:1' ? 1
    : 16 / 9; // 'contain' fits inside standard 16:9 banner container

  // Load image safely without CORS taint
  useEffect(() => {
    if (!imageUrl) return;
    setImgLoaded(false);

    // If remote URL, route through same-origin optimizer endpoint to eliminate canvas CORS taint
    let loadUrl = imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      loadUrl = `/api/v1/blogs/optimized-image?url=${encodeURIComponent(imageUrl)}&w=1600&format=webp&q=95`;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = loadUrl;
    img.onload = () => {
      setImgElement(img);
      setImgLoaded(true);
      try {
        const sc = document.createElement('canvas');
        sc.width = 1;
        sc.height = 1;
        const sctx = sc.getContext('2d');
        if (sctx) {
          sctx.drawImage(img, 2, 2, 1, 1, 0, 0, 1, 1);
          const p = sctx.getImageData(0, 0, 1, 1).data;
          if (p[3] > 0) {
            setDetectedBg(`rgb(${p[0]}, ${p[1]}, ${p[2]})`);
          }
        }
      } catch (_) {}
      // Reset position
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
    img.onerror = () => {
      console.warn('Proxy image load failed, trying direct source:', imageUrl);
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      fallbackImg.src = imageUrl;
      fallbackImg.onload = () => {
        setImgElement(fallbackImg);
        setImgLoaded(true);
      };
    };
  }, [imageUrl]);

  // Quick preset alignments
  const alignTo = (pos: 'top' | 'center' | 'bottom') => {
    if (!imgElement || !containerRef.current) return;
    const ch = containerRef.current.clientHeight || 300;
    if (pos === 'top') {
      setPan((prev) => ({ ...prev, y: Math.round(ch * 0.25) }));
    } else if (pos === 'bottom') {
      setPan((prev) => ({ ...prev, y: -Math.round(ch * 0.25) }));
    } else {
      setPan((prev) => ({ ...prev, y: 0 }));
    }
  };

  // Mouse & touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startDragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - startDragRef.current.x,
      y: e.clientY - startDragRef.current.y
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      startDragRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - startDragRef.current.x,
      y: e.touches[0].clientY - startDragRef.current.y
    });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Perform canvas export
  const handleApplyCrop = async () => {
    if (!imgElement) return;
    setIsSaving(true);

    try {
      // Create high-res offscreen canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      let exportWidth = 1200;
      let exportHeight = targetRatio ? Math.round(1200 / targetRatio) : 675;

      canvas.width = exportWidth;
      canvas.height = exportHeight;

      ctx.fillStyle = detectedBg;
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      const cw = containerRef.current?.clientWidth || 600;
      const ch = containerRef.current?.clientHeight || Math.round(600 / (targetRatio || (16 / 9)));

      const scaleX = exportWidth / cw;
      const scaleY = exportHeight / ch;

      if (aspectPreset === 'contain') {
        // Draw soft ambient backdrop to seamlessly blend letterbox edges
        try {
          ctx.save();
          ctx.filter = 'blur(25px)';
          ctx.globalAlpha = 0.35;
          const bgScale = Math.max(exportWidth / imgElement.width, exportHeight / imgElement.height) * 1.1;
          const bgW = imgElement.width * bgScale;
          const bgH = imgElement.height * bgScale;
          ctx.drawImage(imgElement, (exportWidth - bgW) / 2, (exportHeight - bgH) / 2, bgW, bgH);
          ctx.restore();
        } catch (_) {}

        // Fit the full image inside the 16:9 canvas with letterbox padding matching the image background
        const fitScale = Math.min(exportWidth / imgElement.width, exportHeight / imgElement.height) * zoom;
        const drawW = imgElement.width * fitScale;
        const drawH = imgElement.height * fitScale;

        ctx.save();
        ctx.translate(exportWidth / 2 + pan.x * scaleX, exportHeight / 2 + pan.y * scaleY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      } else {
        // Cover scale taking zoom, pan, and rotation into account
        ctx.save();
        ctx.translate(exportWidth / 2 + pan.x * scaleX, exportHeight / 2 + pan.y * scaleY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const coverScale = Math.max(exportWidth / imgElement.width, exportHeight / imgElement.height);
        const drawW = imgElement.width * coverScale;
        const drawH = imgElement.height * coverScale;

        ctx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // Convert to WebP dataUrl
      const dataUrl = canvas.toDataURL('image/webp', 0.92);

      // Save directly via onSave handler which persists to backend
      await onSave(dataUrl);

      onClose();
    } catch (err: any) {
      console.error('Crop application failed:', err);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in text-left">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E8DDD0] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-[#2B2521]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8DDD0] flex items-center justify-between bg-[#FAF6F0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B12B2B] text-white flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#2B2521] leading-tight">
                {title}
              </h2>
              <p className="text-[11px] text-[#5C5148]">
                Drag, zoom, and select aspect ratio to fit the container perfectly without cutting off heads or faces.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5C5148] hover:text-[#2B2521] hover:bg-black/5 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-5">
          {/* Aspect Ratio Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF6F0] p-3 rounded-xl border border-[#E8DDD0]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5C5148]">
              <Sliders className="w-3.5 h-3.5 text-[#B12B2B]" />
              <span>Aspect Ratio:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'contain', label: 'Fit Full Image (No Crop)' },
                  { id: '16:9', label: '16:9 (Article Header)' },
                  { id: '3:2', label: '3:2 (Blog Card)' },
                  { id: '4:3', label: '4:3 (Classic)' },
                  { id: '1:1', label: '1:1 (Square)' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAspectPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    aspectPreset === preset.id
                      ? 'bg-[#B12B2B] text-white shadow-xs'
                      : 'bg-white text-[#5C5148] hover:text-[#2B2521] border border-[#E8DDD0]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Crop Canvas Viewport */}
          <div className="flex flex-col items-center">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ backgroundColor: detectedBg }}
              className={`
                relative w-full max-w-[640px] rounded-xl overflow-hidden border-2 border-dashed border-[#B12B2B] 
                cursor-grab active:cursor-grabbing select-none shadow-inner flex items-center justify-center
                ${aspectPreset === '16:9' || aspectPreset === 'contain' ? 'aspect-video' : aspectPreset === '3:2' ? 'aspect-[3/2]' : aspectPreset === '4:3' ? 'aspect-[4/3]' : 'aspect-square'}
              `}
            >
              {imgLoaded && imgElement ? (
                aspectPreset === 'contain' ? (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none transition-transform"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                      }}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover transition-transform origin-center"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                        objectPosition: 'center',
                      }}
                    />
                  </div>
                )
              ) : (
                <div className="text-white/60 text-xs flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                  <span>Loading original image...</span>
                </div>
              )}

              {/* Grid overlay for alignment guides */}
              {aspectPreset !== 'contain' && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-white/15" />
                  <div className="border-r border-white/15" />
                  <div />
                </div>
              )}

              {/* Pan tip badge */}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded pointer-events-none flex items-center gap-1">
                <Move className="w-3 h-3" />
                <span>Drag to reposition image</span>
              </div>
            </div>
          </div>

          {/* Alignment & Zoom Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF6F0] p-4 rounded-xl border border-[#E8DDD0]">
            {/* Quick Position Alignments */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5C5148] block">
                Quick Vertical Alignment:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alignTo('top')}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-gray-50 border border-[#E8DDD0] rounded-lg text-xs font-semibold text-[#2B2521] flex items-center justify-center gap-1 cursor-pointer"
                  title="Shift view to show top of image (faces/heads)"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-[#B12B2B]" />
                  <span>Focus Top</span>
                </button>
                <button
                  type="button"
                  onClick={() => alignTo('center')}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-gray-50 border border-[#E8DDD0] rounded-lg text-xs font-semibold text-[#2B2521] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Center</span>
                </button>
                <button
                  type="button"
                  onClick={() => alignTo('bottom')}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-gray-50 border border-[#E8DDD0] rounded-lg text-xs font-semibold text-[#2B2521] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Focus Bottom</span>
                </button>
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5C5148]">
                <span>Zoom Scale:</span>
                <span>{zoom.toFixed(1)}x</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                  className="p-1 rounded bg-white border border-[#E8DDD0] hover:bg-gray-50 text-[#5C5148] cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[#B12B2B] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                  className="p-1 rounded bg-white border border-[#E8DDD0] hover:bg-gray-50 text-[#5C5148] cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded bg-white border border-[#E8DDD0] hover:bg-gray-50 text-[#5C5148] cursor-pointer"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#E8DDD0] bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#5C5148] hover:text-[#2B2521] rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleApplyCrop}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B12B2B] hover:bg-[#8F2020] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Applying & Optimizing...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save &amp; Apply Image</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

