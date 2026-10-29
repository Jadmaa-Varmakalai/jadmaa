import React, { useState, useEffect } from 'react';
import { offerApi } from '../../../lib/api/offerApi';
import type { OfferSettings } from '../../../lib/api/offerApi';
import { X, Sparkles, Check, Clock, Eye, AlertCircle } from 'lucide-react';

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
  const [popupDelaySeconds, setPopupDelaySeconds] = useState(4);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await offerApi.getOfferSettings();
        if (res.success && res.data) {
          setPopupEnabled(res.data.popupEnabled);
          setPopupDelaySeconds(res.data.popupDelaySeconds);
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
        popupDelaySeconds: Number(popupDelaySeconds) || 4
      });
      setMessage('Popup settings saved successfully!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-jadmaa-cream to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jadmaa-red/10 text-jadmaa-red flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-jadmaa-charcoal">
                Website Offer Popup Settings
              </h2>
              <p className="text-xs text-jadmaa-textMuted">
                Control the non-intrusive promotional popup on the public website
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
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
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Global Offer Popup Master Switch</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    When disabled, no promotional popups appear on the website (direct landing page links will still work).
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
                  max="30"
                  step="1"
                  value={popupDelaySeconds}
                  onChange={(e) => setPopupDelaySeconds(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-jadmaa-red"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Fast (1s)</span>
                  <span>Recommended (4s)</span>
                  <span>Delayed (30s)</span>
                </div>
              </div>

              {/* Note about priority */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                <p className="font-semibold flex items-center gap-1 mb-1">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  How multi-offer priority works:
                </p>
                If multiple offers have "Show in Website Popup" enabled, the system automatically selects the published offer with the highest <strong>Popup Priority</strong> number.
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
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
              className="px-5 py-2 rounded-xl bg-jadmaa-red hover:bg-jadmaa-red/90 text-white text-xs font-bold shadow-md shadow-jadmaa-red/20 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
