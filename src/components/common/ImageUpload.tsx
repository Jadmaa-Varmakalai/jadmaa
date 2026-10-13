import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, X, Loader2 } from 'lucide-react';
import { uploadApi } from '../../lib/api/uploadApi';

interface ImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helperText?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
}

/**
 * Compresses an image client-side via canvas before uploading.
 * Keeps output under ~300KB while preserving high visual quality.
 */
const compressImage = (file: File, maxDimension = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If it's an SVG, don't rasterize it to canvas
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
  placeholder = 'https://example.com/image.jpg',
  helperText,
  className = '',
  aspectRatio = 'auto',
}) => {
  const [activeTab, setActiveTab] = useState<'device' | 'url'>('device');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }
    setError(null);
    setIsProcessing(true);

    try {
      const compressedDataUrl = await compressImage(file);
      // Attempt backend upload to store file in public/uploads/
      const finalUrl = await uploadApi.uploadImage(compressedDataUrl, file.name);
      onChange(finalUrl);
    } catch (err: any) {
      console.error('Image processing failed:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

      {/* Mode Switch Tabs */}
      <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-lg w-fit border border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('device')}
          className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'device'
              ? 'bg-white text-jadmaa-red shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload from Device</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'url'
              ? 'bg-white text-jadmaa-red shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Image URL</span>
        </button>
      </div>

      {/* Upload From Device View */}
      {activeTab === 'device' && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
              isDragging
                ? 'border-jadmaa-red bg-red-50/50 scale-[1.01]'
                : 'border-gray-300 hover:border-jadmaa-red/70 hover:bg-gray-50/70 bg-white'
            } ${isProcessing ? 'opacity-60 cursor-wait' : ''}`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center py-2 space-y-2">
                <Loader2 className="w-8 h-8 text-jadmaa-red animate-spin" />
                <p className="text-xs font-semibold text-gray-700">Optimizing & Uploading Image...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-1 space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-red-50 text-jadmaa-red flex items-center justify-center mb-1">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-gray-800">
                  <span className="text-jadmaa-red hover:underline">Click to browse</span> or drag and drop image here
                </div>
                <p className="text-[11px] text-gray-500">
                  Supports PNG, JPG, WEBP, GIF, SVG (up to 15MB)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* URL Input View */}
      {activeTab === 'url' && (
        <div className="relative">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-jadmaa-red focus:ring-1 focus:ring-jadmaa-red bg-white"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
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
              {value.startsWith('data:') ? 'Image selected from device' : value}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <span>✓ Image loaded</span>
              {value.startsWith('/uploads/') && <span className="text-gray-400 font-normal">(stored on server)</span>}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClear}
            title="Remove image"
            className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
