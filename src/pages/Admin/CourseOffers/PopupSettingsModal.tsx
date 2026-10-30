import React, { useState, useEffect } from 'react';
import { offerApi } from '../../../lib/api/offerApi';
import { X, Sparkles, Check, Clock, Eye, Tag, ArrowRight, ShieldCheck } from 'lucide-react';

interface PopupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const PopupSettingsModal: React.FC<PopupSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [popupDelaySeconds, setPopupDelaySeconds] = useState(3);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await offerApi.getOfferSettings();
        if (res.success && res.data) {
          setPopupEnabled(res.data.popupEnabled);
          setPopupDelaySeconds(res.data.popupDelaySeconds || 3);
        }
      } catch (err) {
        console.error('Failed to fetch offer settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await offerApi.updateOfferSettings({
        popupEnabled,
        popupDelaySeconds: Number(popupDelaySeconds) || 3
      });
      setMessage('Offer sticker settings saved successfully!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 900);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 via-neutral-900 to-black text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-white">
                Website Offer Sticker Settings
              </h2>
              <p className="text-xs text-gray-400">
                Configure the floating promotional notification badge on the public site
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {message && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>{message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading settings...</div>
          ) : (
            <>
              {/* Master Toggle */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Global Offer Sticker</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Enable or disable the floating offer sticker across public website pages.
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    (Direct offer landing page links remain accessible via URL)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={popupEnabled}
                    onChange={(e) => setPopupEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-jadmaa-red"></div>
                </label>
              </div>

              {/* Delay Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-jadmaa-red" />
                    Display Delay After Page Load
                  </label>
                  <span className="text-xs font-mono font-bold text-jadmaa-red px-2 py-0.5 bg-jadmaa-red/10 rounded-md">
                    {popupDelaySeconds} Seconds
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={popupDelaySeconds}
                  onChange={(e) => setPopupDelaySeconds(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-jadmaa-red"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Fast (1s)</span>
                  <span>Recommended (3s)</span>
                  <span>Delayed (20s)</span>
                </div>
              </div>

              {/* Live Visual Preview of Sticker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-jadmaa-red" />
                  Live Sticker Preview (As seen by website visitors)
                </label>
                <div className="p-4 rounded-xl bg-gray-100/90 border border-gray-200 flex items-center justify-center">
                  
                  {/* Miniature rendered sticker */}
                  <div className={`w-[260px] rounded-xl bg-[#141416] border border-red-900/50 p-3 shadow-xl relative transition-opacity ${popupEnabled ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-700 via-amber-500 to-red-600 rounded-t-xl" />
                    
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider uppercase bg-red-950/90 text-red-300 border border-red-800/50">
                          <Sparkles className="w-2 h-2 text-amber-400" />
                          SPECIAL OFFER
                        </span>
                        <span className="text-[9px] font-bold text-amber-300 bg-amber-950/60 px-1 py-0.2 rounded">
                          40% OFF
                        </span>
                      </div>
                      <span className="text-gray-500 text-[11px] leading-none">×</span>
                    </div>

                    <div className="text-left mt-1">
                      <div className="text-[11px] font-bold text-white line-clamp-1">
                        Basic Varma Training Course
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Limited-time campaign offer
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-extrabold text-red-400 font-heading">₹1,199</span>
                        <span className="text-[10px] text-gray-500 line-through">₹1,999</span>
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white">
                        <span>View Offer</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>

                </div>
                {!popupEnabled && (
                  <p className="text-[11px] text-amber-700 text-center font-medium">
                    ⚠️ The offer sticker is currently disabled globally.
                  </p>
                )}
              </div>

              {/* Priority Info Banner */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600 leading-relaxed">
                <span className="font-bold text-gray-800">Multi-Offer Priority: </span>
                When multiple published offers have "Show as Offer Sticker" enabled, the system displays the offer with the highest <strong>Priority number</strong>.
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-5 py-2 rounded-xl bg-jadmaa-red hover:bg-[#8C1E1E] text-white text-xs font-bold shadow-md shadow-jadmaa-red/20 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
