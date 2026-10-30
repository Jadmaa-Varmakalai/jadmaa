import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, Loader2, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { uploadApi } from '../../../lib/api/uploadApi';

interface CampaignImageUploaderProps {
  label: string;
  sublabel?: string;
  recommendedAspect?: string;
  value: string;
  onChange: (url: string) => void;
  onCopyFrom?: () => void;
  copyFromLabel?: string;
  previewHeightClass?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates and compresses images client-side before sending to server/storage
 */
const prepareImageUpload = (file: File): Promise<{ dataUrl: string; dimensions: { width: number; height: number } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file from your device.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a valid or corrupted image.'));
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // Compress large device camera photos (e.g., 4000x3000) down to max 2000px dimension
        const maxDimension = 2000;
        let targetW = width;
        let targetH = height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            targetH = Math.round((height * maxDimension) / width);
            targetW = maxDimension;
          } else {
            targetW = Math.round((width * maxDimension) / height);
            targetH = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: e.target?.result as string, dimensions: { width, height } });
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.88);
        resolve({ dataUrl, dimensions: { width, height } });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const CampaignImageUploader: React.FC<CampaignImageUploaderProps> = ({
  label,
  sublabel,
  recommendedAspect = '16:9 or 4:5',
  value,
  onChange,
  onCopyFrom,
  copyFromLabel,
  previewHeightClass = 'h-44'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    // 1. MIME Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Unsupported file format (${file.type || 'unknown'}). Please upload JPEG, PNG, WebP, or AVIF.`);
      return;
    }

    // 2. Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed image size is 10MB.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress('Preparing & optimizing image...');

    try {
      const { dataUrl, dimensions: dims } = await prepareImageUpload(file);
      setDimensions(dims);

      setUploadProgress('Uploading to persistent cloud storage...');
      const uploadedUrl = await uploadApi.uploadImage(dataUrl, file.name);

      if (uploadedUrl) {
        onChange(uploadedUrl);
        setUploadProgress(null);
      } else {
        throw new Error('Storage returned an invalid URL.');
      }
    } catch (err: any) {
      console.error('[CampaignImageUploader] Upload failed:', err);
      setError(err.message || 'Image upload failed. Please try a different image.');
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualUrlApply = () => {
    if (!manualUrl.trim()) return;
    onChange(manualUrl.trim());
    setManualUrl('');
    setShowUrlInput(false);
    setError(null);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-gray-800">
            {label}
          </label>
          {sublabel && (
            <p className="text-[11px] text-gray-500">{sublabel}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onCopyFrom && copyFromLabel && !value && (
            <button
              type="button"
              onClick={onCopyFrom}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition cursor-pointer border border-red-200"
            >
              <Copy className="w-3 h-3" />
              <span>{copyFromLabel}</span>
            </button>
          )}
          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            {recommendedAspect}
          </span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main Container */}
      {value ? (
        /* Image Preview State */
        <div className={`relative rounded-xl border border-gray-200 bg-gray-900 overflow-hidden group shadow-sm ${previewHeightClass}`}>
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover"
            onError={() => setError('Could not load image from stored URL. The image might be inaccessible.')}
          />

          {/* Overlay info & actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 text-white">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-green-400 border border-green-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Active Image
              </span>
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1 rounded-lg bg-black/60 hover:bg-red-600/90 text-white/80 hover:text-white transition cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] text-gray-300 truncate font-mono">
                {value.startsWith('data:') ? 'Local preview buffer' : value}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold text-xs backdrop-blur-sm transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-white font-semibold text-xs backdrop-blur-sm transition cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Upload State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-5 text-center cursor-pointer ${
            isDragging
              ? 'border-red-600 bg-red-50/50 scale-[0.99]'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50'
          } ${previewHeightClass}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-600">
              <Loader2 className="w-7 h-7 text-red-600 animate-spin" />
              <p className="text-xs font-bold text-gray-800">{uploadProgress || 'Uploading...'}</p>
              <p className="text-[11px] text-gray-500">Optimizing resolution and securing CDN upload</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">
                  <span className="text-red-700 hover:underline">Click to browse from device</span> or drag and drop
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  JPEG, PNG, WebP, AVIF up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Manual URL toggle fallback */}
      <div className="flex items-center justify-between pt-0.5">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 underline transition cursor-pointer"
        >
          {showUrlInput ? 'Hide manual URL input' : 'Or paste direct image URL'}
        </button>
      </div>

      {showUrlInput && (
        <div className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-gray-100 border border-gray-200">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://... or /images/..."
            className="flex-1 px-3 py-1.5 rounded-md bg-white border border-gray-300 text-xs font-mono focus:outline-none focus:border-red-600"
          />
          <button
            type="button"
            onClick={handleManualUrlApply}
            className="px-3 py-1.5 rounded-md bg-gray-900 text-white font-bold text-xs hover:bg-black transition cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};
