export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "PROFESSIONAL" | "ADVANCED";

export type Specialization = {
  id: string;
  label: string;
  icon: string;
  emoji?: string;
  color: string;
  bgLight: string;
};

export type Course = {
  id: string;
  title: string;
  instructor: string;
  level: CourseLevel;
  duration: string;
  students: string;
  rating: number;
  originalPrice: number;
  price: number;
  image: string;
  specialization: string;
  overview: string;
  highlights: string[];
};

export const LEVEL_COLORS: Record<CourseLevel, string> = {
  BEGINNER: "#0b6b09",
  INTERMEDIATE: "#b45309",
  PROFESSIONAL: "#0f766e",
  ADVANCED: "#1d4ed8",
};

export const SPECIALIZATIONS: Specialization[] = [
  { id: "all", label: "All Courses", icon: "school", color: "#055103", bgLight: "#055103" },
  { id: "breeds", label: "Pig Breeds", icon: "paw", color: "#d6336c", bgLight: "#fbd7e2" },
  { id: "feed", label: "Feed Mgmt", icon: "restaurant", color: "#c2660a", bgLight: "#fdead0" },
  { id: "health", label: "Pig Health", icon: "medkit", color: "#0f9d78", bgLight: "#d7f3e9" },
  { id: "design", label: "Farm Design", icon: "home", color: "#7c3aed", bgLight: "#eae0fc" },
  { id: "marketing", label: "Marketing", icon: "trending-up", color: "#2563eb", bgLight: "#dbe7fd" },
];

export const COURSES: Course[] = [
  {
    id: "course-1",
    title: "Modern Pig Farming Masterclass",
    instructor: "Dr. Rajesh Patidar",
    level: "BEGINNER",
    duration: "4 weeks",
    students: "1,250 students",
    rating: 4.9,
    originalPrice: 5999,
    price: 2999,
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&q=80",
    specialization: "all",
    overview:
      "Complete guide to starting a profitable pig farm from scratch. Learn modern farming techniques, housing design, nutrition management, health care and marketing strategies for maximum profit.",
    highlights: [
      "Scientific pig farming techniques",
      "Low-cost feed formulation",
      "Disease prevention & treatment",
      "Business growth strategies",
    ],
  },
  {
    id: "course-2",
    title: "Advanced Pig Nutrition & Feed",
    instructor: "Er. Ishika Patel",
    level: "PROFESSIONAL",
    duration: "5 weeks",
    students: "840 students",
    rating: 4.8,
    originalPrice: 7999,
    price: 4499,
    image: "https://images.unsplash.com/photo-1591536425976-c2596bf2b3f2?w=600&q=80",
    specialization: "feed",
    overview:
      "Master balanced, low-cost feed formulation for every growth stage. Covers piglet starter feed, grower rations, breeding stock nutrition, and locally-sourced ingredient substitution to cut costs without hurting yield.",
    highlights: [
      "Stage-wise feed formulation charts",
      "Low-cost local ingredient substitution",
      "Feed conversion ratio optimization",
      "Common nutrition deficiency signs",
    ],
  },
  {
    id: "course-3",
    title: "Swine Disease Management",
    instructor: "Dr. Amit Verma",
    level: "INTERMEDIATE",
    duration: "3 weeks",
    students: "620 students",
    rating: 4.7,
    originalPrice: 3999,
    price: 1999,
    image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&q=80",
    specialization: "health",
    overview:
      "Identify, prevent, and treat the most common diseases affecting pig herds. Covers vaccination schedules, biosecurity protocols, first-aid procedures, and when to call a veterinarian.",
    highlights: [
      "Vaccination schedule planning",
      "Early symptom identification",
      "Biosecurity & quarantine practices",
      "Emergency first-aid procedures",
    ],
  },
  {
    id: "course-4",
    title: "Commercial Farm Construction",
    instructor: "Mr. Sunil Sharma",
    level: "ADVANCED",
    duration: "4 weeks",
    students: "450 students",
    rating: 4.6,
    originalPrice: 6499,
    price: 3499,
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80",
    specialization: "design",
    overview:
      "Design and build a commercial-scale pig housing structure from the ground up. Covers site selection, ventilation planning, drainage, pen layout, and budget-friendly construction materials.",
    highlights: [
      "Site selection & layout planning",
      "Ventilation & drainage design",
      "Budget-friendly material choices",
      "Scaling from small to commercial",
    ],
  },
];
