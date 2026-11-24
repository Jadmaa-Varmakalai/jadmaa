import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { ShieldCheck, ShieldAlert, Award, Search, ArrowRight, ExternalLink, Printer } from 'lucide-react';

export const VerifyCertificate: React.FC = () => {
  const { code: urlCode } = useParams<{ code?: string }>();
  const [searchInput, setSearchInput] = useState(urlCode || '');
  const [certData, setCertData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVerification = async (queryCode: string) => {
    if (!queryCode.trim()) return;
    setLoading(true);
    setError(null);
    setCertData(null);

    try {
      const res = await fetch(`/api/v1/certificates/verify/${encodeURIComponent(queryCode.trim())}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCertData(data.data);
      } else {
        setError(data.error?.message || 'Certificate record could not be verified on the official registry.');
      }
    } catch (err: any) {
      setError('Unable to reach the verification service. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlCode) {
      fetchVerification(urlCode);
    }
  }, [urlCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchVerification(searchInput);
    }
  };

  return (
    <>
      <SEO 
        title="Verify Certificate Authenticity | JADMAA Varmakalai Academy"
        description="Verify official JADMAA Varmakalai certificates, digital credentials, and student practitioner completions online."
      />

      <div className="min-h-screen bg-[#FAF6F0] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Official Registry
            </div>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-jadmaa-charcoal">
              Verify JADMAA Credential
            </h1>
            <p className="text-sm text-gray-600 max-w-xl mx-auto">
              Scan the QR code on a physical certificate or enter the unique Certificate ID / Verification Code below to authenticate credential validity.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-[#E8DDD0]">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. V-7A8B9C or JADMAA-2026-0001"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-jadmaa-red focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchInput.trim()}
                className="px-6 py-3 bg-jadmaa-red hover:bg-jadmaa-redDark disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify Credential'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Verification Results */}
          {loading && (
            <div className="bg-white p-12 rounded-2xl border border-[#E8DDD0] text-center space-y-3">
              <div className="w-10 h-10 border-4 border-jadmaa-red border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-gray-700">Checking JADMAA Registry records...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50/80 border border-red-200 p-6 sm:p-8 rounded-2xl text-center space-y-3">
              <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
              <h3 className="font-heading font-bold text-lg text-red-900">Credential Not Verified</h3>
              <p className="text-sm text-red-700 max-w-md mx-auto">{error}</p>
              <div className="pt-2 text-xs text-gray-500">
                Please double-check the characters or contact <a href="mailto:support@jadmaa.com" className="underline font-semibold">support@jadmaa.com</a> for assistance.
              </div>
            </div>
          )}

          {certData && !loading && (
            <div className="bg-white rounded-2xl border-2 border-emerald-500/30 overflow-hidden shadow-lg transition-all">
              {/* Status Header */}
              <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-emerald-100" />
                  <span className="font-heading font-extrabold text-sm uppercase tracking-wider">
                    Authentic Verified Credential
                  </span>
                </div>
                <span className="text-xs bg-emerald-700/80 px-3 py-1 rounded-full font-mono font-bold">
                  {certData.status}
                </span>
              </div>

              {/* Certificate Details */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Certified Student Practitioner</span>
                  <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-jadmaa-charcoal mt-1">
                    {certData.studentName}
                  </h2>
                </div>

                <div className="p-4 bg-[#FAF6F0] rounded-xl border border-[#E8DDD0] space-y-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Course Program:</span>
                    <span className="font-bold text-jadmaa-charcoal">{certData.courseTitle}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Certificate ID:</span>
                    <span className="font-mono font-bold text-jadmaa-red">{certData.certificateNumber}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Verification Code:</span>
                    <span className="font-mono font-bold text-gray-800">{certData.verificationCode}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500">Issue Date:</span>
                    <span className="font-semibold text-jadmaa-charcoal">
                      {new Date(certData.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                    <span className="text-gray-500">Issuing Body:</span>
                    <span className="font-semibold text-jadmaa-charcoal">{certData.issuingAuthority}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href={`/api/v1/certificates/${encodeURIComponent(certData.certificateNumber)}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4" /> View Full Certificate
                  </a>
                  <a
                    href={`/api/v1/certificates/${encodeURIComponent(certData.certificateNumber)}/view?print=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 bg-jadmaa-red hover:bg-jadmaa-redDark text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Printer className="w-4 h-4" /> Print / Save as PDF
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Policy Note */}
          <div className="bg-amber-50/60 border border-amber-200/70 p-4 rounded-xl text-center text-xs text-amber-900">
            <strong>Academy Certification Policy:</strong> Official JADMAA certificates are granted strictly upon full completion of certified paid curricula and verified proficiency evaluation. Free introductory courses do not issue verifiable certificates.
          </div>

        </div>
      </div>
    </>
  );
};
