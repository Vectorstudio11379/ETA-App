import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  PlayIcon,
  StarIcon,
  UserGroupIcon,
  Award01Icon,
  BookOpen01Icon,
} from '@hugeicons/core-free-icons';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { useApp } from '../../context/AppContext';
import { courseService } from '../../services/courseService';
import { Course } from '../../data/mockData';
import { Animated, useScreenMotion } from '../../hooks/use-screen-motion';
import { deduplicateCourses } from '../../services/courseService';
import { FadeInDown, useReducedMotion } from 'react-native-reanimated';

export default function MyCoursesScreen() {
  const router = useRouter();
  const { courses, wishlistIds, colors, isRefreshing, refreshLiveData, userProfile: user, showToast } = useApp();

  // Certificate links are signed and expire after 7 days, so fetch a fresh one on tap.
  const openCertificate = async (courseId: string, cachedUrl?: string) => {
    try {
      const res = await courseService.fetchMyCertificates();
      const fresh = res.success
        ? res.data?.certificates?.find((cert) => String(cert.course_id) === String(courseId))?.download_url
        : undefined;
      const url = fresh || cachedUrl;
      if (url) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      if (cachedUrl) {
        await Linking.openURL(cachedUrl);
        return;
      }
    }
    showToast('Your certificate is not ready yet. Please try again shortly.');
  };
  const screenMotionStyle = useScreenMotion();
  const reducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'all' | 'favourite' | 'certificate'>('all');
  const [liveEnrolled, setLiveEnrolled] = useState<Course[]>([]);

  const loadEnrolled = useCallback(async () => {
    try {
      console.log('[MyCourses] Calling fetchEnrolledCourses...');
      const res = await courseService.fetchEnrolledCourses();
      console.log('[MyCourses] fetchEnrolledCourses result:', JSON.stringify(res));
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setLiveEnrolled(deduplicateCourses(res.data));
      }
    } catch (e) {
      console.warn('[MyCourses] Error fetching enrolled:', e);
    }
  }, []);

  useEffect(() => {
    loadEnrolled();
    refreshLiveData();
  }, [loadEnrolled, refreshLiveData]);

  const enrolledFromCourses = deduplicateCourses(
    courses.filter((c) => c.isEnrolled || (c.progress !== undefined && c.progress > 0))
  );
  const enrolledCourses = deduplicateCourses(liveEnrolled.length > 0 ? liveEnrolled : enrolledFromCourses);
  console.log('[MyCourses] RENDER enrolledCourses count:', enrolledCourses.length, 'liveEnrolled:', liveEnrolled.length);
  const favouriteCourses = deduplicateCourses(courses.filter((c) => wishlistIds.includes(c.id)));

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background }, screenMotionStyle]}>
      <Header showCurrency={false} title="My Courses" />

      {/* Segment Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'all' && { backgroundColor: colors.accent }]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'all' ? '#FFF' : colors.textSecondary },
            ]}
          >
            All Courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'favourite' && { backgroundColor: colors.accent }]}
          onPress={() => setActiveTab('favourite')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'favourite' ? '#FFF' : colors.textSecondary },
            ]}
          >
            My Favourite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'certificate' && { backgroundColor: colors.accent }]}
          onPress={() => setActiveTab('certificate')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'certificate' ? '#FFF' : colors.textSecondary },
            ]}
          >
            Certificate
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              loadEnrolled();
              refreshLiveData();
            }}
            colors={[colors.primary, colors.secondary]}
            tintColor={colors.primary}
          />
        }
      >
        <SearchBar />

        {/* Tab 1: All Enrolled Courses */}
        {activeTab === 'all' && (
          enrolledCourses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <HugeiconsIcon icon={BookOpen01Icon} size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Enrolled Courses Yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Enroll in any of our production-ready courses or bundles to begin learning!
              </Text>
              <TouchableOpacity
                style={[styles.emptyCtaBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Text style={styles.emptyCtaText}>Browse Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
          enrolledCourses.map((course, index) => {
            const progressPercent = course.progress || 0;
            return (
              <Animated.View
                key={course.id}
                entering={FadeInDown.duration(reducedMotion ? 0 : 280).delay(
                  reducedMotion ? 0 : Math.min(index, 5) * 50
                )}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: '/course-viewer/[id]',
                      params: { id: course.id },
                    })
                  }
                  style={[styles.courseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                <View style={styles.topRow}>
                  <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />

                  <View style={styles.detailsCol}>
                    <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
                      {course.title}
                    </Text>
                    <Text style={[styles.instructorText, { color: colors.textSecondary }]}>
                      {course.instructor}
                    </Text>

                    <View style={styles.statsRow}>
                      <View style={[styles.statPill, { backgroundColor: colors.surfaceLight }]}>
                        <HugeiconsIcon icon={UserGroupIcon} size={11} color={colors.textSecondary} />
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>
                          {(course.studentsCount || 120).toLocaleString()}
                        </Text>
                      </View>
                      <View style={[styles.statPill, { backgroundColor: colors.surfaceLight }]}>
                        <HugeiconsIcon icon={StarIcon} size={11} color={colors.secondary} />
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>
                          {course.rating} ({course.reviewsCount})
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity style={[styles.favBtn, { backgroundColor: colors.surfaceLight }]}>
                      <HugeiconsIcon icon={StarIcon} size={12} color={colors.textSecondary} />
                      <Text style={[styles.favText, { color: colors.textSecondary }]}>Save as favourite</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress Bar & Play Button */}
                <View style={styles.progressRow}>
                  <TouchableOpacity
                    style={[styles.playCircleBtn, { backgroundColor: colors.accent }]}
                    onPress={() =>
                      router.push({
                        pathname: '/course-viewer/[id]',
                        params: { id: course.id },
                      })
                    }
                  >
                    <HugeiconsIcon icon={PlayIcon} size={18} color="#FFF" />
                  </TouchableOpacity>

                  <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceLight }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progressPercent}%`, backgroundColor: colors.accent },
                      ]}
                    />
                  </View>

                  <Text style={[styles.progressPercentText, { color: colors.text }]}>{progressPercent}%</Text>
                </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        ))}

        {/* Tab 2: My Favourite */}
        {activeTab === 'favourite' && (
          favouriteCourses.length > 0 ? (
            favouriteCourses.map((course) => (
              <Animated.View
                key={course.id}
                entering={FadeInDown.duration(reducedMotion ? 0 : 280)}
                style={[styles.courseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.topRow}>
                  <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
                  <View style={styles.detailsCol}>
                    <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
                      {course.title}
                    </Text>
                    <Text style={[styles.instructorText, { color: colors.textSecondary }]}>
                      {course.instructor}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop' }}
                style={styles.emptyIllustration}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No favourite courses found</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                You can add courses to your favourites by tapping favourite icon.
              </Text>
              <TouchableOpacity
                style={[styles.emptyCtaBtn, { backgroundColor: colors.primary }]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={styles.emptyCtaText}>My Courses</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {/* Tab 3: Certificate */}
        {activeTab === 'certificate' && (() => {
          const certCourses = enrolledCourses.filter(
            (c) => (c.progress || 0) >= 100 || c.certificate?.is_issued || c.certificateIssued
          );
          if (certCourses.length === 0) {
            return (
              <View style={styles.emptyContainer}>
                <View style={[styles.certCircleBox, { backgroundColor: colors.surfaceLight }]}>
                  <HugeiconsIcon icon={Award01Icon} size={64} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Certificate Available Yet</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Once you've completed 100% of a course, your official verified certificate will be issued here instantly.
                </Text>
              </View>
            );
          }
          return (
            <View style={{ paddingHorizontal: 16 }}>
              {certCourses.map((c) => {
                const code = c.certificate?.verification_code || `${c.id}-1070-${user?.id || 1}`;
                const downloadUrl = c.certificate?.download_url;
                const verifyUrl = c.certificate?.verification_url || `https://expressteck.tech/certificate-verification/?code=${code}`;
                return (
                  <View
                    key={c.id}
                    style={[
                      styles.courseCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderLeftWidth: 4,
                        borderLeftColor: '#D97706',
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <HugeiconsIcon icon={Award01Icon} size={28} color="#D97706" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Official Certificate • Issued
                        </Text>
                        <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
                          {c.title}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                      Credential ID: <Text style={{ fontFamily: 'monospace', fontWeight: 'bold', color: colors.text }}>{code}</Text>
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: colors.primary,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: 'center',
                        }}
                        onPress={() => openCertificate(String(c.id), downloadUrl)}
                      >
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Download PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: colors.surfaceLight,
                          borderWidth: 1,
                          borderColor: colors.border,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: 'center',
                        }}
                        onPress={() => Linking.openURL(verifyUrl)}
                      >
                        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>Verify Online</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })()}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 25,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 4,
    borderWidth: 1,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  courseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  detailsCol: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 17,
  },
  instructorText: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  statText: {
    fontSize: 10,
  },
  favBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  favText: {
    fontSize: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  playCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    marginTop: 20,
  },
  emptyIllustration: {
    width: 220,
    height: 140,
    borderRadius: 16,
    marginBottom: 20,
  },
  certCircleBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  emptyCtaBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyCtaText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
