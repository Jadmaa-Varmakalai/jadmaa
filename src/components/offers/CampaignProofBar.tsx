import React from 'react';
import { Users, Award, BookOpen, HeartPulse, ShieldCheck, MapPin, Flame } from 'lucide-react';

export interface CampaignStatsData {
  bookingLimit?: number | null;
  currentBookings?: number;
  category?: string;
  benefits?: string[];
}

export interface CampaignProofBarProps {
  stats?: CampaignStatsData;
}

export const CampaignProofBar: React.FC<CampaignProofBarProps> = ({ stats }) => {
  const category = stats?.category || 'ONLINE_COURSE';
  const hasLimitedSeats = Boolean(stats?.bookingLimit && stats.bookingLimit > 0);
  const bookingLimit = stats?.bookingLimit || 0;
  const currentBookings = stats?.currentBookings || 0;
  const remainingSeats = Math.max(0, bookingLimit - currentBookings);

  // Dynamic Proof Bar Features Based on Campaign Category
  const getFeatures = () => {
    switch (category) {
      case 'VARMA_TREATMENT':
        return {
          feature1: {
            icon: <HeartPulse className="w-5 h-5" />,
            title: 'Traditional Varma Healing',
            subtitle: 'Authentic Siddha-Varma therapeutic vital point stimulation',
          },
          feature2: {
            icon: <ShieldCheck className="w-5 h-5" />,
            title: 'Certified Varma Experts',
            subtitle: 'Personalized clinical therapy guided by lineage masters',
          },
          seats: {
            title: remainingSeats > 0 ? `Only ${remainingSeats} Sessions Available` : 'Daily Sessions Full',
            subtitle: `Treatment appointments strictly capped at ${bookingLimit} for personalized care`,
          },
        };
      case 'OFFLINE_CLASS':
        return {
          feature1: {
            icon: <MapPin className="w-5 h-5" />,
            title: 'Direct Gurukulam Training',
            subtitle: 'In-person hands-on practice & physical corrections at branch',
          },
          feature2: {
            icon: <Award className="w-5 h-5" />,
            title: 'Lineage Syllabus',
            subtitle: 'Structured curriculum guided by certified Varma instructors',
          },
          seats: {
            title: remainingSeats > 0 ? `Only ${remainingSeats} Seats Left` : 'Batch Capacity Reached',
            subtitle: `In-person batch strictly capped at ${bookingLimit} students`,
          },
        };
      case 'SPECIAL_CAMP':
        return {
          feature1: {
            icon: <Flame className="w-5 h-5" />,
            title: 'Intensive Residential Camp',
            subtitle: 'Complete immersion in traditional martial science & wellness',
          },
          feature2: {
            icon: <Award className="w-5 h-5" />,
            title: 'Official Camp Recognition',
            subtitle: 'Academy certificate of completion upon camp conclusion',
          },
          seats: {
            title: remainingSeats > 0 ? `Only ${remainingSeats} Camp Slots Left` : 'Camp Fully Booked',
            subtitle: `Camp registrations capped at ${bookingLimit} participants`,
          },
        };
      case 'WORKSHOP':
      case 'SEMINAR':
      case 'SPECIAL_EVENT':
        return {
          feature1: {
            icon: <BookOpen className="w-5 h-5" />,
            title: 'Hands-On Point Anatomy',
            subtitle: 'Direct practical vital point science & clinical applications',
          },
          feature2: {
            icon: <Award className="w-5 h-5" />,
            title: 'Verified Participation',
            subtitle: 'Verifiable certificate upon completion of workshop',
          },
          seats: {
            title: remainingSeats > 0 ? `Only ${remainingSeats} Seats Left` : 'Seats Fully Booked',
            subtitle: `Strictly capped at ${bookingLimit} attendees`,
          },
        };
      case 'ONLINE_COURSE':
      default:
        return {
          feature1: {
            icon: <BookOpen className="w-5 h-5" />,
            title: 'Authentic Curriculum',
            subtitle: 'Direct systematic training guided by Aasan Bojagarajan',
          },
          feature2: {
            icon: <Award className="w-5 h-5" />,
            title: 'Official Certification',
            subtitle: 'Verifiable digital certificate upon programme completion',
          },
          seats: {
            title: remainingSeats > 0 ? `Only ${remainingSeats} Seats Left` : 'Batch Capacity Reached',
            subtitle: `Limited batch strictly capped at ${bookingLimit} practitioners`,
          },
        };
    }
  };

  const { feature1, feature2, seats } = getFeatures();

  return (
    <section className="bg-gradient-to-b from-[#0D0A09] via-[#14100E] to-[#1C1614] py-6 sm:py-8 px-4 sm:px-6 lg:px-12 select-none border-y border-[#29201C]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#221B18]/70 backdrop-blur-md border border-[#3E322B]/60 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className={`grid grid-cols-1 ${hasLimitedSeats ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-6 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#3E322B]/60 items-center`}>
            
            {/* Feature 1 */}
            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                {feature1.icon}
              </div>
              <div>
                <span className="font-bold text-white text-sm sm:text-base tracking-wide block">
                  {feature1.title}
                </span>
                <p className="text-xs text-[#A6958B] mt-0.5 font-medium">
                  {feature1.subtitle}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                {feature2.icon}
              </div>
              <div>
                <span className="font-bold text-white text-sm sm:text-base tracking-wide block">
                  {feature2.title}
                </span>
                <p className="text-xs text-[#A6958B] mt-0.5 font-medium">
                  {feature2.subtitle}
                </p>
              </div>
            </div>

            {/* Feature 3: Limited Capacity / Seats / Slots (Only if applicable) */}
            {hasLimitedSeats && (
              <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-4">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-amber-300 text-sm sm:text-base tracking-wide block">
                    {seats.title}
                  </span>
                  <p className="text-xs text-[#A6958B] mt-0.5 font-medium">
                    {seats.subtitle}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
};
