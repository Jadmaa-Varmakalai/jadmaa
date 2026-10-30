import React, { useState, useEffect } from 'react';
import { offerApi } from '../../../lib/api/offerApi';
import { X, Check, Clock, Eye, Tag, ArrowRight } from 'lucide-react';

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
      setMessage('Offer popup settings saved successfully!');
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
                Website Promotional Popup Settings
              </h2>
              <p className="text-xs text-gray-400">
                Configure the promotional modal popup on the public website
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
                  <h4 className="text-sm font-bold text-gray-900">Global Website Popup</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Enable or disable the promotional popup across public website pages.
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    (Direct offer campaign landing pages remain accessible via URL)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={popupEnabled}
                    onChange={(e) => setPopupEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-700"></div>
                </label>
              </div>

              {/* Delay Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-700" />
                    Display Delay After Page Load
                  </label>
                  <span className="text-xs font-mono font-bold text-red-700 px-2 py-0.5 bg-red-50 rounded-md">
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-700"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Fast (1s)</span>
                  <span>Recommended (3s)</span>
                  <span>Delayed (20s)</span>
                </div>
              </div>

              {/* Live Visual Preview of Modal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-red-700" />
                  Live Popup Preview (As seen by website visitors)
                </label>
                <div className="p-4 rounded-xl bg-gray-100/90 border border-gray-200 flex items-center justify-center">
                  
                  {/* Miniature rendered modal */}
                  <div className={`w-[320px] rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden flex transition-opacity ${popupEnabled ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="w-[38%] bg-gray-900 relative">
                      <img
                        src="/images/pose-dab-red-e1785095608624-653x1024.jpg"
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="w-[62%] p-3 flex flex-col justify-between text-left">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                            LIMITED OFFER
                          </span>
                          <span className="text-gray-400 text-xs">×</span>
                        </div>
                        <h5 className="text-[11px] font-bold text-gray-900 mt-1 line-clamp-1">
                          Varma Master Campaign
                        </h5>
                        <p className="text-[10px] text-gray-500 line-clamp-1">
                          Special training session
                        </p>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-xs font-black text-red-700">₹999</span>
                          <span className="text-[10px] text-gray-400 line-through">₹2,499</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-red-700 flex items-center gap-0.5">
                          Claim Offer <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </>
          )}
        </form>

      </div>
    </div>
  );
};
