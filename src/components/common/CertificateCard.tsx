import React from 'react';
import { Award, ShieldCheck, Download, ExternalLink } from 'lucide-react';

interface CertificateCardProps {
  courseTitle: string;
  certificateId: string;
  issueDate: string;
  studentName: string;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  courseTitle,
  certificateId = "JADMAA-2026-0001",
  issueDate = "August 15, 2026",
  studentName = "Valued Student"
}) => {
  return (
    <div className="bg-white border-2 border-jadmaa-border rounded-2xl p-6 shadow-jadmaa space-y-5 relative overflow-hidden group">
      {/* Decorative Gold Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-jadmaa-red via-amber-500 to-jadmaa-red"></div>

      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-extrabold tracking-widest text-amber-600 uppercase bg-amber-100 px-2 py-0.5 rounded">
              OFFICIAL CERTIFICATION
            </span>
            <h4 className="font-heading font-extrabold text-lg text-jadmaa-charcoal mt-1">
              {courseTitle}
            </h4>
          </div>
        </div>

        <ShieldCheck className="w-6 h-6 text-emerald-600" />
      </div>

      <div className="bg-jadmaa-cream/80 p-4 rounded-xl border border-jadmaa-border space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Certified Practitioner:</span>
          <span className="font-bold text-jadmaa-charcoal">{studentName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Certificate ID:</span>
          <span className="font-mono font-bold text-jadmaa-red">{certificateId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Issue Date:</span>
          <span className="font-semibold text-jadmaa-charcoal">{issueDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Issuing Body:</span>
          <span className="font-semibold text-jadmaa-charcoal">JADMAA Varmakalai Academy</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 pt-2">
        <a 
          href={`/api/v1/certificates/${encodeURIComponent(certificateId)}/view?print=true`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-jadmaa-red hover:bg-jadmaa-redDark text-white text-sm font-bold rounded-lg shadow transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Certificate</span>
        </a>
        <a 
          href={`/verify/${encodeURIComponent(certificateId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 bg-white border border-jadmaa-border hover:bg-jadmaa-cream text-jadmaa-charcoal text-sm font-bold rounded-lg transition-colors flex items-center justify-center"
          title="Verify Credential"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
