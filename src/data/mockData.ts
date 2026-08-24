export interface Course {
  id: string;
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
  description?: string;
  requirements?: string[];
  certificateIssued?: boolean;
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

export interface ModuleItem {
  id: string;
  title: string;
  lecturesCount: number;
  durationMinutes: number;
  lessons?: {
    id: string;
    title: string;
    duration: string;
    isCompleted?: boolean;
    videoUrl?: string;
  }[];
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

export const MOCK_COUNTRIES: CountryItem[] = [
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

export const MOCK_HERO_BANNERS: HeroBanner[] = [
  {
    id: 'h1',
    title: 'Nigeria Biggest Data Challenge is ',
    highlightText: 'Here',
    subtitle: 'AQSkill Datathon 2026 has officially begun.',
    ctaText: 'Join Datathon',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'h2',
    title: 'Turn Financial Knowledge into ',
    highlightText: 'Real Value.',
    subtitle: 'Help businesses grow, improve financial performance, and make informed decisions.',
    ctaText: 'Explore Courses',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'h3',
    title: 'Master In-Demand Tech & ',
    highlightText: 'Digital Skills.',
    subtitle: 'Gain practical experience with industry professionals and earn verified certificates.',
    ctaText: 'Start Learning',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop',
  },
];

export const MOCK_CATEGORIES = [
  { id: '1', name: 'Digital Marketing', icon: 'megaphone' },
  { id: '2', name: 'Graphic Design', icon: 'palette' },
  { id: '3', name: 'Data Analysis', icon: 'bar-chart-2' },
  { id: '4', name: 'Application Development', icon: 'code' },
  { id: '5', name: 'Virtual Assistance', icon: 'user-check' },
  { id: '6', name: 'Finance & Accounting', icon: 'dollar-sign' },
];

export const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: 'inst1',
    name: 'Awesome Emmanuel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    role: 'Data Analyst',
    joinedYear: '2024',
    bio: "My name is Awesome Emmanuel. I'm a British Council certified instructor based in Lagos, Nigeria. A data analyst/database administrator with over 5 years of active industrial work experience. A seasoned and resourceful ICT Tech-skill instructor, Data analyst consultant, Edu-Tech consultant and a web developer with great flair for providing soft and digital ICT skills.",
  },
  {
    id: 'inst2',
    name: 'TA Digital',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    role: 'Digital skills',
    joinedYear: '2024',
    bio: 'TA Digital is an innovative tech consultancy and learning agency focused on transforming creative minds into world-class digital marketers and developers.',
  },
  {
    id: 'inst3',
    name: 'Ogheneruno joy Adaware',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    role: 'Social Media Management',
    joinedYear: '2024',
    bio: 'Passionate social media strategist with over 6 years of experience helping corporate brands scale organic reach and engineer viral campaigns.',
  },
  {
    id: 'inst4',
    name: 'Fibi Justus',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=300&auto=format&fit=crop',
    role: 'People, Products & Growth | HR Professional | Product Marketer',
    joinedYear: '2024',
    bio: 'Senior HR and Growth Lead building scalable tech teams and driving product adoption across emerging markets in Africa.',
  },
  {
    id: 'inst5',
    name: 'Jameel Bin Abdullahi',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    role: 'Data Analysis, Motion Design',
    joinedYear: '2024',
    bio: 'Multidisciplinary data scientist and 3D motion graphics artist specializing in visual storytelling and Excel modelling.',
  },
  {
    id: 'inst6',
    name: 'Uzoka Precious',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    role: 'Digital Marketing, Web and Software Development',
    joinedYear: '2024',
    bio: 'Full-stack software architect and digital growth strategist with expertise in React Native, Node.js, and high-converting marketing funnels.',
  },
  {
    id: 'inst7',
    name: 'Michael Ndefo',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&auto=format&fit=crop',
    role: 'AQskill Instructor',
    joinedYear: '2024',
    bio: 'Creative media producer and graphic design instructor dedicated to mentoring young African talents in visual design mastery.',
  },
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Mastering Social Media Management(From Basics to Pro)',
    instructor: 'Adaware Ogheneruno joy',
    category: 'Digital Marketing',
    originalPrice: 15000,
    price: 4500,
    discount: 70,
    studentsCount: 4333,
    rating: 4.7,
    reviewsCount: 403,
    daysLeft: 1,
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop',
    description: 'Learn how to handle brand identity, content scheduling, viral copy, and paid ads like a professional social media strategist.',
  },
  {
    id: 'c2',
    title: 'Microsoft Excel for Financial Analysis, Modelling & Accounting',
    instructor: 'Muhammad Jamilu Abdullahi',
    category: 'Finance & Accounting',
    originalPrice: 26500,
    price: 8000,
    discount: 70,
    studentsCount: 7993,
    rating: 4.8,
    reviewsCount: 318,
    daysLeft: 1,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
    description: 'Turn financial knowledge into real value. Build comprehensive financial models, balance sheets, and real-world accounting sheets.',
    requirements: ['Access to a computer/laptop.', 'Basic understanding of math.'],
    certificateIssued: true,
  },
  {
    id: 'c3',
    title: 'Data Analytics and Visualization with Google Data Studio',
    instructor: 'Awesome Emmanuel',
    category: 'Data Analysis',
    originalPrice: 15000,
    price: 4500,
    discount: 70,
    studentsCount: 868,
    rating: 4.7,
    reviewsCount: 23,
    daysLeft: 1,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'c4',
    title: 'Data Analytics & Visualization with Tableau and PowerBI',
    instructor: 'Awesome Emmanuel',
    category: 'Data Analysis',
    originalPrice: 26500,
    price: 8000,
    discount: 70,
    studentsCount: 8072,
    rating: 4.8,
    reviewsCount: 97,
    daysLeft: 1,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'c5',
    title: 'End-to-End Data Analysis Projects with Microsoft Excel',
    instructor: 'Awesome Emmanuel',
    category: 'Data Analysis',
    originalPrice: 33000,
    price: 10000,
    discount: 70,
    studentsCount: 724,
    rating: 4.9,
    reviewsCount: 22,
    daysLeft: 1,
    thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'c6',
    title: 'Statistical & Research Analysis with Microsoft Excel',
    instructor: 'Awesome Emmanuel',
    category: 'Data Analysis',
    originalPrice: 16670,
    price: 5000,
    discount: 71,
    studentsCount: 714,
    rating: 5.0,
    reviewsCount: 23,
    daysLeft: 1,
    thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'c7',
    title: 'Data Analytics & Visualization with Google Sheet',
    instructor: 'Awesome Emmanuel',
    category: 'Data Analysis',
    originalPrice: 22000,
    price: 6500,
    discount: 71,
    studentsCount: 551,
    rating: 4.8,
    reviewsCount: 18,
    daysLeft: 1,
    thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'c8',
    title: 'Training on Excel VBA & Applications',
    instructor: 'Awesome Emmanuel',
    category: 'Data Analysis',
    originalPrice: 26500,
    price: 8000,
    discount: 70,
    studentsCount: 519,
    rating: 4.7,
    reviewsCount: 20,
    daysLeft: 1,
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
  },
];

export const MOCK_NEW_COURSES: Course[] = [
  {
    id: 'nc1',
    title: 'Fiverr Mastery: Build, Grow & Scale a Profitable Freelance Business',
    instructor: 'Aderogba Segun',
    category: 'Freelancing & Marketing',
    originalPrice: 20000,
    price: 6000,
    discount: 70,
    studentsCount: 0,
    rating: 5.0,
    reviewsCount: 0,
    daysLeft: 1,
    isNew: true,
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'nc2',
    title: 'Airtable for Business Automation & Workspace Management',
    instructor: 'Chidi Nnamdi',
    category: 'Business & Tech',
    originalPrice: 17500,
    price: 5000,
    discount: 71,
    studentsCount: 0,
    rating: 5.0,
    reviewsCount: 0,
    daysLeft: 1,
    isNew: true,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
  },
];

export const MOCK_BUNDLES: Course[] = [
  {
    id: 'b1',
    title: 'AQskill Datathon 2026',
    instructor: 'Muhammad Jamilu Abdullahi, +1 Others',
    category: 'Data Science & Analytics',
    originalPrice: 91670,
    price: 20000,
    discount: 79,
    studentsCount: 1540,
    rating: 4.9,
    reviewsCount: 88,
    daysLeft: 1,
    isBundle: true,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'b2',
    title: 'Remote Work & Monetization',
    instructor: 'Hammed Oladipo Oyekunle, +3 Others',
    category: 'Career Bundle',
    originalPrice: 78340,
    price: 17300,
    discount: 78,
    studentsCount: 2310,
    rating: 4.8,
    reviewsCount: 112,
    daysLeft: 1,
    isBundle: true,
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'b3',
    title: 'Data Analysis Travel Bundle',
    instructor: 'Muhammad Jamilu Abdullahi, +2 Others',
    category: 'Data Analytics',
    originalPrice: 103340,
    price: 15300,
    discount: 86,
    studentsCount: 1820,
    rating: 4.9,
    reviewsCount: 94,
    daysLeft: 1,
    isBundle: true,
    thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'b4',
    title: 'Ultimate Graphic Design Bundle',
    instructor: 'Onoja Michael, +3 Others',
    category: 'Design Bundle',
    originalPrice: 78340,
    price: 13000,
    discount: 84,
    studentsCount: 3105,
    rating: 4.8,
    reviewsCount: 150,
    daysLeft: 1,
    isBundle: true,
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'b5',
    title: 'Ultimate Video Editing Bundle',
    instructor: 'Abubakar Abdul Aziz, +2 Others',
    category: 'Media Production',
    originalPrice: 48340,
    price: 9800,
    discount: 80,
    studentsCount: 2450,
    rating: 4.7,
    reviewsCount: 120,
    daysLeft: 1,
    isBundle: true,
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'b6',
    title: 'Data Analysis Cooperate Bundle',
    instructor: 'Muhammad Jamilu Abdullahi, +1 Others',
    category: 'Corporate Analytics',
    originalPrice: 85500,
    price: 13000,
    discount: 85,
    studentsCount: 1980,
    rating: 4.9,
    reviewsCount: 89,
    daysLeft: 1,
    isBundle: true,
    thumbnail: 'https://images.unsplash.com/photo-1542744094-3a3172720249?q=80&w=800&auto=format&fit=crop',
  },
];

export const MOCK_MODULES: ModuleItem[] = [
  {
    id: 'm1',
    title: 'Module 1: Introduction to Virtual Assistant',
    lecturesCount: 2,
    durationMinutes: 25,
    lessons: [
      { id: 'l1', title: 'What is a Virtual Assistant & Career Opportunities', duration: '12:04', isCompleted: true },
      { id: 'l2', title: 'Setting up your Remote Workspace & Tools', duration: '13:00', isCompleted: false },
    ],
  },
  {
    id: 'm2',
    title: 'Module 2: Core Administrative Skills',
    lecturesCount: 8,
    durationMinutes: 122,
    lessons: [
      { id: 'l3', title: 'Calendar & Inbox Zero Management', duration: '18:15', isCompleted: false },
      { id: 'l4', title: 'Travel Booking & Itinerary Planning', duration: '15:30', isCompleted: false },
    ],
  },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    dateGroup: 'Yesterday',
    title: 'Study now',
    message: 'Studying at night helps you learn faster. Use a few minutes of your night to take your course.',
    timeAgo: '13hrs ago',
    exactTime: '8:07PM',
  },
  {
    id: 'n2',
    dateGroup: 'Aug. 10',
    title: 'Tonight is Right',
    message: 'Learning is best in a comfortable environment just like the one you are in tonight. So let\'s take our course.',
    timeAgo: '1d ago',
    exactTime: '8:04PM',
  },
  {
    id: 'n3',
    dateGroup: 'Aug. 10',
    title: 'Keep Showing Up',
    message: 'You don\'t have to be the fastest learner—just the most consistent.',
    timeAgo: '1d ago',
    exactTime: '11:14AM',
  },
  {
    id: 'n4',
    dateGroup: 'Aug. 09',
    title: 'Plan right',
    message: 'The new week has officially begun! Have a timetable, plan how many lessons you will take per day. This week is yours to conquer.',
    timeAgo: '2d ago',
    exactTime: '8:05PM',
  },
  {
    id: 'n5',
    dateGroup: 'Aug. 08',
    title: 'Learn Before you Relax',
    message: 'Give yourself one lesson first. Relaxation feels even better after progress.',
    timeAgo: '3d ago',
    exactTime: '11:16AM',
  },
];
