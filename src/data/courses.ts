import type { Course } from '../types';

export const mockCourses: Course[] = [
  {
    id: "varmakalai-foundation-free-starter-course",
    slug: "varmakalai-foundation-free-starter-course",
    title: "Free Varmakalai Foundation Course Online | JADMAA Varmakalai",
    subtitle: "The introductory masterclass into the ancient 1000+ year old Tamil martial science",
    description: "Learn fundamental Varma energy points, vital pressure anatomy, self-defense posture alignment, and daily bio-energetic wellness exercises.",
    longDescription: "The Varma Foundation course introduces students to the ancient Tamil art of Varmakalai — the science of vital energy points. Passed down through centuries of Siddha tradition, this program teaches fundamental pressure techniques, body mechanics, defensive positioning, and physical conditioning designed to promote vitality while mastering practical self-defense principles.",
    thumbnail: "/images/course-basic.jpg",
    category: "Varmakalai",
    level: "Beginner",
    duration: "1 Week",
    totalLessons: 18,
    rating: 4.9,
    reviewCount: 142,
    price: 0,
    originalPrice: 1999,
    isPopular: true,
    instructor: {
      name: "Aasan Bojagarajan",
      title: "Founder & Chief Instructor, JADMAA Varmakalai",
      avatar: "/images/logo-1.png",
      bio: "With over 15+ years of dedicated practice and teaching across Tamil Nadu, Aasan Bojagarajan has trained thousands of students in traditional Varmakalai, Siddha healing, and defensive martial arts."
    },
    whatYouWillLearn: [
      "Anatomy and location of primary Varma pressure points",
      "Essential defensive stances and movement footwork",
      "Varma stimulation for energy flow and pain alleviation",
      "Practical self-defense escapes and wrist releases",
      "Daily breathing (Pranayama) and stamina building techniques",
      "Ethical usage and traditional martial philosophy"
    ],
    requirements: [
      "No prior martial arts experience required",
      "Comfortable athletic clothing for practical movements",
      "Open mind and dedication to regular practice"
    ],
    targetAudience: [
      "Beginners wanting to learn traditional Indian martial arts",
      "Fitness enthusiasts seeking mind-body discipline",
      "Anyone interested in Tamil cultural heritage and holistic wellness"
    ],
    modules: [
      {
        id: "m1",
        title: "Module 01: Introduction to Varmakalai & History",
        description: "Explore the lineage, Siddha roots, and basic philosophy of Tamil martial sciences.",
        lessons: [
          { id: "l1", title: "Lesson 01: Welcome to JADMAA & Lineage Overview", duration: "12 min", isFreePreview: true },
          { id: "l2", title: "Lesson 02: What is Varmakalai? Vital Energy Principles", duration: "18 min", isFreePreview: true },
          { id: "l3", title: "Lesson 03: The Code of Ethics & Martial Discipline", duration: "15 min" }
        ]
      },
      {
        id: "m2",
        title: "Module 02: Stances, Footwork & Balance",
        description: "Master foundational physical postures essential for defensive maneuvers.",
        lessons: [
          { id: "l4", title: "Lesson 01: Chuvadu (Footwork Pattern 1 - Linear Alignment)", duration: "25 min" },
          { id: "l5", title: "Lesson 02: Body Weight Distribution & Guard Stances", duration: "20 min" },
          { id: "l6", title: "Lesson 03: Evasion & Pivoting Techniques", duration: "22 min" }
        ]
      },
      {
        id: "m3",
        title: "Module 03: Key Varma Points & Defensive Applications",
        description: "Practical strike-and-release techniques targeting non-lethal vital points.",
        lessons: [
          { id: "l7", title: "Lesson 01: Upper Body Varma Points (Shoulders & Arms)", duration: "30 min" },
          { id: "l8", title: "Lesson 02: Wrist Escapes & Counter-Stakes", duration: "28 min" },
          { id: "l9", title: "Lesson 03: Lower Body Lock Escapes", duration: "32 min" }
        ]
      }
    ]
  },
  {
    id: "7-weight-loss-training",
    slug: "7-weight-loss-training",
    title: "Weight Loss Training through Varmakalai | JADMAA Varmakalai",
    subtitle: "Traditional Varmakalai-based movement for fitness and fat loss",
    description: "Lose weight the traditional way — Varmakalai-based movement, breathing and conditioning that builds strength and stamina alongside fat loss.",
    longDescription: "Varmakalai is equally a profound healing science. This course focuses on self-administered Varma massage protocols, joint mobilization, lymphatic drainage, metabolic activation for healthy weight loss, and chronic pain alleviation.",
    thumbnail: "/images/course-weightloss-career.jpg",
    category: "Fitness",
    level: "All Levels",
    duration: "8 Weeks",
    totalLessons: 16,
    rating: 4.8,
    reviewCount: 96,
    price: 2499,
    originalPrice: 3999,
    instructor: {
      name: "Aasan Bojagarajan",
      title: "Founder & Chief Instructor, JADMAA Varmakalai",
      avatar: "/images/logo-1.png",
      bio: "With over 15+ years of dedicated practice and teaching across Tamil Nadu, Aasan Bojagarajan specializes in authentic Adimurai and traditional Varma health conditioning."
    },
    whatYouWillLearn: [
      "Therapeutic Varma pressure points for spinal & neck relief",
      "Metabolic activation exercises for weight control",
      "Traditional detoxification and herbal lifestyle guidance",
      "Stress relief and deep relaxation techniques"
    ],
    requirements: [
      "Suitable for all fitness levels"
    ],
    targetAudience: [
      "Individuals seeking sustainable weight loss and metabolic vitality",
      "Wellness seekers interested in ancient Tamil natural healing"
    ],
    modules: [
      {
        id: "wel1",
        title: "Module 01: Spine & Joint Health Varma Points",
        lessons: [
          { id: "well1", title: "Lesson 01: Cervical & Upper Back Relief", duration: "20 min", isFreePreview: true }
        ]
      }
    ]
  }
];
