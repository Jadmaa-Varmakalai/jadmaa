import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';
import { Award, Download, ExternalLink } from 'lucide-react';
import { progressApi } from '../../lib/api/progressApi';
import { useAuth } from '../../context/AuthContext';

export const CertificatesPage: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const fetchCerts = async () => {
      try {
        const res = await progressApi.getCertificates();
        if (res.success) {
          setCertificates(res.data);
        }
      } catch (err) {
        console.error("Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, [isLoggedIn, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-10 w-10 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="My Certificates | JADMAA LMS" />
      
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading font-extrabold text-3xl text-gray-900">
            My Certificates
          </h1>
          <p className="text-gray-500 mt-2">View and download your earned Varmakalai credentials.</p>
        </div>
      </section>

      <section className="py-12 bg-gray-50 min-h-[600px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {certificates.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center max-w-2xl mx-auto shadow-sm">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No certificates yet</h3>
              <p className="text-gray-500 mb-6">Complete an enrolled course 100% to automatically earn your verified certificate.</p>
              <Link to="/my-courses" className="px-6 py-3 bg-jadmaa-red text-white font-semibold rounded-lg shadow hover:bg-red-800 transition">
                Continue Learning
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group">
                  <div className="h-40 bg-gradient-to-br from-jadmaa-cream to-gray-100 flex flex-col items-center justify-center p-6 text-center border-b border-gray-200 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-jadmaa-red opacity-5 rounded-full"></div>
                    <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-gray-900 opacity-5 rounded-full"></div>
                    
                    <Award className="w-12 h-12 text-jadmaa-red mb-3 relative z-10" />
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-2 relative z-10">{cert.course.title}</h4>
                  </div>
                  
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <p className="text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Issued On</p>
                        <p className="font-bold text-gray-900">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 uppercase tracking-wide font-semibold mb-0.5">ID</p>
                        <p className="font-mono font-bold text-gray-900">{cert.certificateNumber}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                      <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold rounded flex items-center justify-center gap-2 transition">
                        <ExternalLink className="w-4 h-4" /> View
                      </button>
                      <button className="flex-1 py-2 bg-jadmaa-red hover:bg-red-800 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition">
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </section>
    </>
  );
};
