import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Play, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react-native';
import { CertificatePreview } from '../../components/CertificatePreview';
import { MOCK_MODULES } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export default function CourseViewerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { courses, colors } = useApp();

  const [activeTab, setActiveTab] = useState<'content' | 'certificate'>('content');
  const [expandedModules, setExpandedModules] = useState<string[]>(['m1', 'm2']);

  const course = courses.find((c) => c.id === id) || courses[5];
  const progressPercent = course.progress || 0;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

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
                <TouchableOpacity style={[styles.reviewBtn, { backgroundColor: colors.surfaceLight }]}>
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
                  params: { lessonId: 'l1' },
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
            {MOCK_MODULES.map((module) => {
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
                        {module.lecturesCount} Lectures | {module.durationMinutes} Minutes
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
                              params: { lessonId: lesson.id },
                            })
                          }
                        >
                          <Play size={14} color={colors.primary} />
                          <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
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
});
