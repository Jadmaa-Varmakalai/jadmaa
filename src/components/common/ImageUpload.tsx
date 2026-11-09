import React, { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, AlertTriangle, Crop } from 'lucide-react';
import { uploadApi } from '../../lib/api/uploadApi';
import { ImageCropModal } from './ImageCropModal';

export interface RequiredRatio {
  width: number;
  height: number;
  label: string;
}

interface ImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
  requiredRatio?: RequiredRatio;
}

/**
 * Compresses an image client-side via canvas before uploading.
 * Keeps output under ~300KB while preserving high visual quality.
 */
const compressImage = (file: File, maxDimension = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  onChange,
  helperText,
  className = '',
  aspectRatio = 'auto',
  requiredRatio,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratioWarning, setRatioWarning] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }
    setError(null);
    setIsProcessing(true);

    try {
      // Check aspect ratio if required
      if (requiredRatio) {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const w = img.width;
          const h = img.height;
          const target = requiredRatio.width / requiredRatio.height;
          const actual = w / h;
          if (Math.abs(actual - target) > 0.08) {
            setRatioWarning(
              `Uploaded image is ${w}×${h} (${actual.toFixed(2)}:1). Required is ${requiredRatio.label} (${target.toFixed(2)}:1). You can crop it below to fit.`
            );
          } else {
            setRatioWarning(null);
          }
          URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
      }

      // Try uploading to server
      try {
        const uploadRes = await uploadApi.uploadImage(file);
        if (uploadRes && uploadRes.url) {
          onChange(uploadRes.url);
          setIsProcessing(false);
          return;
        }
      } catch (uploadErr) {
        console.warn('Backend upload failed, falling back to compressed local preview:', uploadErr);
      }

      // Fallback: client-side compression
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch (err: any) {
      console.error('Image compression failed:', err);
      setError('Failed to process image. Please try a different file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    onChange('');
    setError(null);
    setRatioWarning(null);
  };

  const aspectClass = 
    aspectRatio === 'video' ? 'aspect-video' :
    aspectRatio === 'square' ? 'aspect-square' :
    'max-h-56';

  return (
    <div className={`space-y-2 text-left ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-jadmaa-charcoal">
          {label}
        </label>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Upload From Device / Drag & Drop View */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-[#B12B2B] bg-red-50/50 scale-[1.01]'
            : 'border-gray-300 hover:border-[#B12B2B]/70 hover:bg-gray-50/70 bg-white'
        } ${isProcessing ? 'opacity-60 cursor-wait' : ''}`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center py-2 space-y-2">
            <Loader2 className="w-8 h-8 text-[#B12B2B] animate-spin" />
            <p className="text-xs font-semibold text-gray-700">Optimizing & Uploading Image...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1 space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#B12B2B] flex items-center justify-center mb-1">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-gray-800">
              <span className="text-[#B12B2B] hover:underline font-bold">Upload from device</span> or drag and drop image here
            </div>
            <p className="text-[11px] text-gray-500">
              Supports PNG, JPG, WEBP, GIF, SVG from your device
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}

      {/* Ratio Warning Alert */}
      {ratioWarning && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-left flex-1">
            <span className="font-bold">Image Aspect Ratio Alert:</span>
            <p>{ratioWarning}</p>
            {value && (
              <button
                type="button"
                onClick={() => setIsCropModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B12B2B] hover:bg-[#8F2020] text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer mt-1"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Adjust / Crop Image to Fit</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Image Preview (if value exists) */}
      {value && (
        <div className="relative mt-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-3 group">
          <div className={`w-20 h-14 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-gray-300 ${aspectClass}`}>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {value.startsWith('data:') ? 'Image uploaded from device' : value}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span>✓ Ready</span>
              </p>
              <button
                type="button"
                onClick={() => setIsCropModalOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-[#FAF6F0] border border-[#B12B2B] text-[#B12B2B] rounded text-[11px] font-bold transition cursor-pointer"
                title="Crop or adjust framing to fit container"
              >
                <Crop className="w-3 h-3" />
                <span>Crop / Adjust Fit</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded text-[11px] font-semibold transition cursor-pointer"
              >
                Change Image
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            title="Remove image"
            className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Interactive Crop & Adjust Modal */}
      {isCropModalOpen && value && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageUrl={value}
          aspectRatioPreset={aspectRatio === 'video' ? '16:9' : aspectRatio === 'square' ? '1:1' : 'contain'}
          onClose={() => setIsCropModalOpen(false)}
          onSave={(croppedUrl) => {
            onChange(croppedUrl);
            setRatioWarning(null);
          }}
        />
      )}

      {helperText && (
        <p className="text-[11px] text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
