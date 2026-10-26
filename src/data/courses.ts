import type { Course } from '../types';

export const mockCourses: Course[] = [
  {
    id: "varma-foundation",
    slug: "varma-foundation",
    title: "Varma Foundation & Vital Points Science",
    subtitle: "The introductory masterclass into the ancient 1000+ year old Tamil martial science",
    description: "Learn fundamental Varma energy points, vital pressure anatomy, self-defense posture alignment, and daily bio-energetic wellness exercises.",
    longDescription: "The Varma Foundation course introduces students to the ancient Tamil art of Varmakalai — the science of vital energy points. Passed down through centuries of Siddha tradition, this program teaches fundamental pressure techniques, body mechanics, defensive positioning, and physical conditioning designed to promote vitality while mastering practical self-defense principles.",
    thumbnail: "/images/course-basic.jpg",
    category: "Varmakalai",
    level: "Beginner",
    duration: "6 Weeks (24 Hours)",
    totalLessons: 18,
    rating: 4.9,
    reviewCount: 142,
    price: 1999,
    originalPrice: 2999,
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
    id: "intermediate-varma",
    slug: "intermediate-varma",
    title: "Intermediate Varma Striking & Lock Mastery",
    subtitle: "Advanced joint locks, counter-strikes, and tactical combat applications",
    description: "Deepen your understanding of Varma combatives, joint locks (Pootu), weapon disarms, and tactical self-defence positioning.",
    longDescription: "Building upon foundational principles, this intermediate course delves into complex joint manipulation, precise point-striking vectors, defensive counter-attacks, and traditional Adimurai integration. Suitable for students who completed the Foundation course or experienced martial artists.",
    thumbnail: "/images/course-intermediate.jpg",
    category: "Varmakalai",
    level: "Intermediate",
    duration: "8 Weeks (32 Hours)",
    totalLessons: 24,
    rating: 5.0,
    reviewCount: 88,
    price: 3499,
    originalPrice: 4999,
    instructor: {
      name: "Aasan Bojagarajan",
      title: "Founder & Chief Instructor, JADMAA Varmakalai",
      avatar: "/images/logo-1.png",
      bio: "Aasan Bojagarajan specializes in authentic Adimurai striking combinations and precise Varma therapeutic counters."
    },
    whatYouWillLearn: [
      "Advanced joint-locking mechanisms (Pootu & Thattu)",
      "Counter-striking angles using vital organ nerve points",
      "Defensive maneuvers against multiple attackers",
      "Traditional weapon awareness and disarming concepts",
      "Therapeutic recovery points after physical strain"
    ],
    requirements: [
      "Completion of Varma Foundation or equivalent martial background",
      "Good physical fitness level"
    ],
    targetAudience: [
      "Intermediate martial arts practitioners",
      "Students progressing in the JADMAA curriculum"
    ],
    modules: [
      {
        id: "im1",
        title: "Module 01: Advanced Pootu (Joint Manipulation)",
        lessons: [
          { id: "il1", title: "Lesson 01: Finger & Wrist Control Mechanics", duration: "22 min" },
          { id: "il2", title: "Lesson 02: Elbow & Shoulder Reversals", duration: "26 min" }
        ]
      },
      {
        id: "im2",
        title: "Module 02: Varma Striking Vectors",
        lessons: [
          { id: "il3", title: "Lesson 01: Nerve Cluster Targeting in Close Combat", duration: "35 min" },
          { id: "il4", title: "Lesson 02: Deflection & Rapid Counter-Strikes", duration: "30 min" }
        ]
      }
    ]
  },
  {
    id: "kids-varmakalai",
    slug: "kids-varmakalai",
    title: "Kids Varmakalai, Discipline & Fitness",
    subtitle: "Character building, physical agility, focus, and age-appropriate self-defence",
    description: "Fun, safe, and empowering training designed specifically for children (ages 6–14) to enhance concentration, discipline, and physical fitness.",
    longDescription: "Our specialized children's program blends traditional Tamil martial values with modern physical agility drills. Children build confidence, motor coordination, respect, emotional regulation, and non-violent conflict resolution skills under certified instruction.",
    thumbnail: "/images/course-kids.jpg",
    category: "Kids",
    level: "Beginner",
    duration: "12 Weeks (Ongoing)",
    totalLessons: 20,
    rating: 4.9,
    reviewCount: 210,
    price: 1499,
    originalPrice: 2499,
    isPopular: true,
    instructor: {
      name: "Instructor R. Kavitha",
      title: "Senior Youth Trainer, JADMAA Academy",
      avatar: "/images/logo-1.png",
      bio: "Certified child fitness and self-defense instructor dedicated to nurturing discipline and posture in young practitioners."
    },
    whatYouWillLearn: [
      "Physical flexibility, core strength, and coordination",
      "Focus, mental clarity, and classroom discipline",
      "Basic self-protection awareness and anti-bullying strategies",
      "Traditional salute and respect values"
    ],
    requirements: [
      "Ages 6 to 14",
      "Parental consent"
    ],
    targetAudience: [
      "Kids wanting to build strength and mental focus",
      "Parents looking for authentic traditional martial discipline"
    ],
    modules: [
      {
        id: "km1",
        title: "Module 01: Agility & Flexibility Foundations",
        lessons: [
          { id: "kl1", title: "Lesson 01: Animal Stances & Warmup Drills", duration: "20 min", isFreePreview: true },
          { id: "kl2", title: "Lesson 02: Building Core Balance & Posture", duration: "18 min" }
        ]
      }
    ]
  },
  {
    id: "womens-self-defence",
    slug: "womens-self-defence",
    title: "Women's Tactical Varma Self-Defence",
    subtitle: "Empowerment, situational awareness, and instinctive self-protection techniques",
    description: "Practical tactical self-defence using leverage and quick Varma pressure targets, engineered for real-world personal protection.",
    longDescription: "Designed specifically for women of all ages, this empowerment course teaches fast, high-impact defense techniques that leverage body mechanics rather than brute strength. Learn situational threat assessment, vocal boundary setting, and disabling pressure point escapes.",
    thumbnail: "/images/course-womens.jpg",
    category: "Self Defence",
    level: "All Levels",
    duration: "4 Weeks (16 Hours)",
    totalLessons: 12,
    rating: 5.0,
    reviewCount: 315,
    price: 1799,
    originalPrice: 2999,
    instructor: {
      name: "Aasan Bojagarajan",
      title: "Founder & Chief Instructor, JADMAA Varmakalai",
      avatar: "/images/logo-1.png",
      bio: "Pioneer of women's tactical self-defence programs across educational institutions in Tamil Nadu."
    },
    whatYouWillLearn: [
      "Instant threat recognition and spatial management",
      "Vulnerable target zones requiring minimal striking force",
      "Escaping wrist grabs, chokeholds, and rear surprise attacks",
      "Using everyday items (pens, keys, bags) for defense",
      "Confidence building and de-escalation psychology"
    ],
    requirements: [
      "No prior experience needed",
      "Open to women of all ages (13+)"
    ],
    targetAudience: [
      "College students, working women, homemakers",
      "Anyone seeking effective practical self-defense skills"
    ],
    modules: [
      {
        id: "wm1",
        title: "Module 01: Awareness & Basic Defensive Strikes",
        lessons: [
          { id: "wl1", title: "Lesson 01: Mindset & Threat Evaluation", duration: "15 min", isFreePreview: true },
          { id: "wl2", title: "Lesson 02: High Impact Striking Targets", duration: "25 min" }
        ]
      }
    ]
  },
  {
    id: "varma-wellness-weightloss",
    slug: "varma-wellness-weightloss",
    title: "Varma Healing, Weight Management & Wellness",
    subtitle: "Traditional Siddha Varma stimulation for metabolism, joint pain, and stress release",
    description: "Holistic self-care program utilizing therapeutic Varma pressure point activation, organic Siddha routines, and metabolic rejuvenation.",
    longDescription: "Varmakalai is equally a profound healing science. This course focuses on self-administered Varma massage protocols, joint mobilization, lymphatic drainage, metabolic activation for healthy weight loss, and chronic pain alleviation.",
    thumbnail: "/images/course-weightloss-career.jpg",
    category: "Wellness",
    level: "All Levels",
    duration: "6 Weeks",
    totalLessons: 16,
    rating: 4.8,
    reviewCount: 96,
    price: 2499,
    originalPrice: 3999,
    instructor: {
      name: "Dr. S. Ramanathan",
      title: "Siddha & Varma Medical Consultant",
      avatar: "/images/logo-1.png",
      bio: "Siddha physician and Varma therapeutic expert with over 18 years of clinical experience."
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
      "Individuals suffering from chronic back/neck stiffness",
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
  },
  {
    id: "all-in-one-selfdefence",
    slug: "all-in-one-selfdefence",
    title: "Complete Varma Self-Defence Master Program",
    subtitle: "Comprehensive training covering unarmed combat, weapons defense, and mastery",
    description: "The ultimate end-to-end Varmakalai defense system for individuals seeking complete proficiency and certification.",
    longDescription: "An all-inclusive masterclass combining foundational stances, intermediate combatives, weapons defense, and advanced Varma theory into a structured multi-month certification course.",
    thumbnail: "/images/course-selfdefence-all.jpg",
    category: "Self Defence",
    level: "Advanced",
    duration: "16 Weeks",
    totalLessons: 40,
    rating: 5.0,
    reviewCount: 75,
    price: 5999,
    originalPrice: 8999,
    instructor: {
      name: "Aasan Bojagarajan",
      title: "Founder & Chief Instructor, JADMAA Varmakalai",
      avatar: "/images/logo-1.png",
      bio: "Master Instructor overseeing complete JADMAA certification standards."
    },
    whatYouWillLearn: [
      "Full spectrum Varmakalai combative methodology",
      "Advanced lock breaking and immobilization",
      "Tactical weapons defense and counter-manipulation",
      "Certification eligibility upon practical examination"
    ],
    requirements: [
      "High commitment and consistent practice schedule"
    ],
    targetAudience: [
      "Dedicated martial artists and future instructor candidates"
    ],
    modules: [
      {
        id: "cm1",
        title: "Module 01: Complete Defensive Syllabus Overview",
        lessons: [
          { id: "cl1", title: "Lesson 01: Syllabi & Tactical Roadmap", duration: "25 min" }
        ]
      }
    ]
  }
];
