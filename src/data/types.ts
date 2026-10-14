export interface Course {
  id: string;
  product_id?: string;
  title: string;
  instructor: string;
  category: string;
  originalPrice: number;
  price: number;
  discount: number;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  daysLeft: number;
  thumbnail: string;
  progress?: number;
  isWishlisted?: boolean;
  isEnrolled?: boolean;
  isNew?: boolean;
  isBundle?: boolean;
  bundleBadge?: string;
  packages?: string[];
  outcomes?: string[];
  description?: string;
  requirements?: string[];
  certificateIssued?: boolean;
  slug?: string;
  sectionsCount?: number;
  lessonsCount?: number;
  duration?: string;
  modules?: ModuleItem[];
}

export interface HeroBanner {
  id: string;
  title: string;
  highlightText: string;
  subtitle: string;
  ctaText: string;
  image: string;
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  role: string;
  joinedYear: string;
  bio?: string;
}

export interface LessonItem {
  id: string;
  title: string;
  duration: string;
  type?: 'video' | 'quiz' | 'assignment';
  isCompleted?: boolean;
  videoUrl?: string;
  url?: string;
  summary?: string;
  quizData?: {
    passingScore: number;
    questions: {
      q: string;
      options: string[];
      answer: number;
    }[];
  };
  assignmentData?: {
    title: string;
    description: string;
    rubric: string;
  };
}

export interface ModuleItem {
  id: string;
  title: string;
  lecturesCount?: number;
  durationMinutes?: number;
  lessons?: LessonItem[];
}

export interface NotificationItem {
  id: string;
  dateGroup: string;
  title: string;
  message: string;
  timeAgo: string;
  exactTime: string;
  targetScreen?: string;
}

export interface CountryItem {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const SUPPORTED_COUNTRIES: CountryItem[] = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93' },
  { code: 'AX', name: 'Åland Islands', flag: '🇦🇽', dialCode: '+358' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', dialCode: '+355' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dialCode: '+213' },
  { code: 'AS', name: 'American Samoa', flag: '🇦🇸', dialCode: '+1684' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', dialCode: '+376' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244' },
  { code: 'AI', name: 'Anguilla', flag: '🇦🇮', dialCode: '+1264' },
  { code: 'AQ', name: 'Antarctica', flag: '🇦🇶', dialCode: '+672' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬', dialCode: '+1268' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
];

export const HERO_BANNERS: HeroBanner[] = [
  {
    id: 'h1',
    title: 'Limited Time Offer — ',
    highlightText: 'Up to 70% Off',
    subtitle: 'Build practical skills with expert-led learning paths on Express Tech Academy.',
    ctaText: 'Explore Courses',
    image: 'https://expressteck.tech/wp-content/uploads/2025/10/Getting-Started-with-Masteriyo-LMS-1.jpg',
  },
  {
    id: 'h2',
    title: 'From Innovation To ',
    highlightText: 'Transformation.',
    subtitle: 'Watch lessons and build practical skills from any device at your own pace.',
    ctaText: 'Start Learning',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'h3',
    title: 'Master In-Demand Tech & ',
    highlightText: 'Digital Skills.',
    subtitle: 'Gain practical experience with industry professionals and earn verified certificates.',
    ctaText: 'View Academy',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop',
  },
];
