import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Play, MessageSquare, ChevronDown, ChevronUp, HelpCircle, FileText, CheckCircle } from 'lucide-react-native';
import { CertificatePreview } from '../../components/CertificatePreview';
import { useApp } from '../../context/AppContext';
import { Course } from '../../data/mockData';
import { INITIAL_COURSES } from '../../data/initialCourses';
import { INITIAL_BUNDLES } from '../../data/initialBundles';
import { courseService } from '../../services/courseService';

const BUNDLE_ALIASES: Record<string, string[]> = {
  'bundle_1': ['bundle_1', '668', 'ai-automation-power-suite'],
  '668': ['bundle_1', '668', 'ai-automation-power-suite'],
  'ai-automation-power-suite': ['bundle_1', '668', 'ai-automation-power-suite'],

  'bundle_2': ['bundle_2', '669', 'digital-creator-social-media-launchpad'],
  '669': ['bundle_2', '669', 'digital-creator-social-media-launchpad'],
  'digital-creator-social-media-launchpad': ['bundle_2', '669', 'digital-creator-social-media-launchpad'],

  'bundle_3': ['bundle_3', '670', 'global-remote-career-virtual-assistant-bundle'],
  '670': ['bundle_3', '670', 'global-remote-career-virtual-assistant-bundle'],
  'global-remote-career-virtual-assistant-bundle': ['bundle_3', '670', 'global-remote-career-virtual-assistant-bundle'],

  'bundle_4': ['bundle_4', '671', 'financial-freedom-global-trading-mastery'],
  '671': ['bundle_4', '671', 'financial-freedom-global-trading-mastery'],
  'financial-freedom-global-trading-mastery': ['bundle_4', '671', 'financial-freedom-global-trading-mastery'],
};

const COURSE_ALIASES: Record<string, string[]> = {
  '680': ['680', '704', 'paid-online-survey-masterclass'],
  '704': ['680', '704', 'paid-online-survey-masterclass'],
  'paid-online-survey-masterclass': ['680', '704', 'paid-online-survey-masterclass'],

  '660': ['660', '666', 'prompt-engineering-masterclass'],
  '666': ['660', '666', 'prompt-engineering-masterclass'],
  'prompt-engineering-masterclass': ['660', '666', 'prompt-engineering-masterclass'],

  '628': ['628', '659', 'youtube-masterclass'],
  '659': ['628', '659', 'youtube-masterclass'],
  'youtube-masterclass': ['628', '659', 'youtube-masterclass'],

  '585': ['585', '627', '30-day-ai-automation-course'],
  '627': ['585', '627', '30-day-ai-automation-course'],
  '30-day-ai-automation-course': ['585', '627', '30-day-ai-automation-course'],

  '572': ['572', '584', 'complete-social-media-management-course'],
  '584': ['572', '584', 'complete-social-media-management-course'],
  'complete-social-media-management-course': ['572', '584', 'complete-social-media-management-course'],

  '470': ['470', '496', 'paypal-mastery-course'],
  '496': ['470', '496', 'paypal-mastery-course'],
  'paypal-mastery-course': ['470', '496', 'paypal-mastery-course'],

  '373': ['373', '467', 'complete-forex-trading-course'],
  '467': ['373', '467', 'complete-forex-trading-course'],
  'complete-forex-trading-course': ['373', '467', 'complete-forex-trading-course'],

  '343': ['343', '466', 'virtual-assistant'],
  '466': ['343', '466', 'virtual-assistant'],
  'virtual-assistant': ['343', '466', 'virtual-assistant'],

  '979': ['979', '1007', 'graphic-design-masterclass'],
  '1007': ['979', '1007', 'graphic-design-masterclass'],
  'graphic-design-masterclass': ['979', '1007', 'graphic-design-masterclass'],

  '955': ['955', '977', 'content-writing-masterclass'],
  '977': ['955', '977', 'content-writing-masterclass'],
  'content-writing-masterclass': ['955', '977', 'content-writing-masterclass'],

  '954': ['954', '976', 'copywriting-masterclass'],
  '976': ['954', '976', 'copywriting-masterclass'],
  'copywriting-masterclass': ['954', '976', 'copywriting-masterclass'],
};

const matchCourse = (item: Course, targetId: string): boolean => {
  if (!targetId) return false;
  const clean = String(targetId).trim().toLowerCase();
  const itemId = String(item.id || '').trim().toLowerCase();
  const itemProdId = String(item.product_id || '').trim().toLowerCase();
  const itemSlug = String(item.slug || '').trim().toLowerCase();

  const aliases = BUNDLE_ALIASES[clean] || COURSE_ALIASES[clean] || [clean];

  return aliases.some(
    (a) => a === itemId || (itemProdId && a === itemProdId) || (itemSlug && a === itemSlug)
  );
};

export default function CourseViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : (params.id || '');
  const { courses, bundles, colors, refreshLiveData } = useApp();

  const allCourses = useMemo(() => {
    return [...courses, ...(bundles || []), ...INITIAL_BUNDLES, ...INITIAL_COURSES];
  }, [courses, bundles]);

  const [fetchedCourse, setFetchedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const resolvedCourse = useMemo(() => {
    return allCourses.find((c) => matchCourse(c, rawId));
  }, [allCourses, rawId]);

  useEffect(() => {
    if (!resolvedCourse && rawId) {
      let isMounted = true;
      setIsLoading(true);
      courseService
        .fetchCourseDetails(rawId)
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setFetchedCourse(res.data);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [resolvedCourse, rawId]);

  const course = resolvedCourse || fetchedCourse;

  const courseModules = course?.modules || [];
  const [activeTab, setActiveTab] = useState<'content' | 'certificate'>('content');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const progressPercent = course?.progress || 0;

  useEffect(() => {
    if (courseModules.length > 0 && expandedModules.length === 0) {
      setExpandedModules([courseModules[0].id]);
    }
  }, [courseModules, expandedModules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  const firstLessonId = courseModules[0]?.lessons?.[0]?.id || '683';

  if (!course) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 15 }}>Loading course content...</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>‹ Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Course Card Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.topRow}>
            <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />

            <View style={styles.rightCol}>
              <View style={styles.titleRow}>
                <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
                  {course.title}
                </Text>
                <TouchableOpacity
                  style={[styles.reviewBtn, { backgroundColor: colors.surfaceLight }]}
                  onPress={() => router.push({ pathname: '/course/[id]', params: { id: String(course.id), tab: 'review' } })}
                >
                  <MessageSquare size={12} color={colors.text} />
                  <Text style={[styles.reviewBtnText, { color: colors.text }]}>Drop Review</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.instructorText, { color: colors.textSecondary }]}>{course.instructor}</Text>
            </View>
          </View>

          {/* Progress Row */}
          <View style={styles.progressRow}>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              onPress={() =>
                router.push({
                  pathname: '/player/[lessonId]',
                  params: { lessonId: firstLessonId, courseId: course.id },
                })
              }
            >
              <Play size={18} color="#FFF" fill="#FFF" />
            </TouchableOpacity>

            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceLight }]}>
              <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: colors.secondary }]} />
            </View>

            <Text style={[styles.percentText, { color: colors.text }]}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'content' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('content')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'content' ? '#FFF' : colors.textSecondary }]}>
              Content
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'certificate' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('certificate')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'certificate' ? '#FFF' : colors.textSecondary }]}>
              Certificate
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'content' ? (
          <View style={styles.modulesContainer}>
            {courseModules.map((module) => {
              const isExpanded = expandedModules.includes(module.id);
              return (
                <View key={module.id} style={[styles.moduleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.moduleHeader}
                    onPress={() => toggleModule(module.id)}
                  >
                    <View style={styles.moduleHeaderLeft}>
                      <Text style={[styles.moduleTitle, { color: colors.text }]}>{module.title}</Text>
                      <Text style={[styles.moduleSub, { color: colors.textSecondary }]}>
                        {module.lessons?.length ?? module.lecturesCount ?? 0} items
                        {module.durationMinutes ? ` | ${module.durationMinutes} minutes` : ''}
                      </Text>
                    </View>

                    {isExpanded ? (
                      <ChevronUp size={20} color={colors.secondary} />
                    ) : (
                      <ChevronDown size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && module.lessons && (
                    <View style={[styles.lessonsList, { borderTopColor: colors.border }]}>
                      {module.lessons.map((lesson) => (
                        <TouchableOpacity
                          key={lesson.id}
                          style={styles.lessonRow}
                          onPress={() =>
                            router.push({
                              pathname: '/player/[lessonId]',
                              params: { lessonId: lesson.id, courseId: course.id },
                            })
                          }
                        >
                          {lesson.isCompleted ? (
                            <CheckCircle size={14} color={colors.success || '#10B981'} />
                          ) : lesson.type === 'quiz' ? (
                            <HelpCircle size={14} color={colors.secondary} />
                          ) : lesson.type === 'assignment' ? (
                            <FileText size={14} color={colors.secondary} />
                          ) : (
                            <Play size={14} color={colors.primary} />
                          )}
                          <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                          {lesson.isCompleted ? (
                            <Text style={[styles.lessonType, { color: colors.success || '#10B981', fontWeight: 'bold' }]}>
                              Done
                            </Text>
                          ) : lesson.type && lesson.type !== 'video' ? (
                            <Text style={[styles.lessonType, { color: colors.secondary }]}>
                              {lesson.type === 'quiz' ? 'Quiz' : 'Assignment'}
                            </Text>
                          ) : null}
                          <Text style={[styles.lessonDuration, { color: colors.textMuted }]}>{lesson.duration}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            <CertificatePreview courseTitle={course.title} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 75,
    height: 75,
    borderRadius: 12,
  },
  rightCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  courseTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 17,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reviewBtnText: {
    fontSize: 10,
    fontWeight: '600',
  },
  instructorText: {
    fontSize: 11,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 22,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 4,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  modulesContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  moduleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleHeaderLeft: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  moduleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  lessonsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 12,
  },
  lessonDuration: {
    fontSize: 11,
  },
  lessonType: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
