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
import {
  Play,
  Share2,
  Heart,
  ShoppingCart,
  Star,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { CertificatePreview } from '../../components/CertificatePreview';
import { MOCK_MODULES } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { courses, wishlistIds, toggleWishlist, addToCart, formatPrice, colors } = useApp();

  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'review'>('info');
  const [expandedModules, setExpandedModules] = useState<string[]>(['m1']);

  const course = courses.find((c) => c.id === id) || courses[1];
  const isWishlisted = wishlistIds.includes(course.id);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Detail Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.iconCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Share2 size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => toggleWishlist(course.id)}
          >
            <Heart
              size={18}
              color={isWishlisted ? colors.primary : colors.text}
              fill={isWishlisted ? colors.primary : 'none'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/cart')}
          >
            <ShoppingCart size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Course Trailer Video Banner */}
        <View style={styles.videoContainer}>
          <Image source={{ uri: course.thumbnail }} style={styles.videoThumbnail} />
          <TouchableOpacity
            style={styles.playOverlayBtn}
            onPress={() =>
              router.push({
                pathname: '/course-viewer/[id]',
                params: { id: course.id },
              })
            }
          >
            <Play size={28} color="#000" fill="#000" />
          </TouchableOpacity>
        </View>

        {/* Title & Enrolled Stats */}
        <View style={styles.titleSection}>
          <Text style={[styles.courseTitle, { color: colors.text }]}>{course.title}</Text>
          <Text style={[styles.instructorText, { color: colors.textSecondary }]}>By: {course.instructor}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.statPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Users size={12} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{course.studentsCount.toLocaleString()}</Text>
            </View>

            <View style={[styles.statPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Star size={12} color={colors.secondary} fill={colors.secondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {course.rating} ({course.reviewsCount})
              </Text>
            </View>

            <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.categoryBadgeText}>{course.category}</Text>
            </View>
          </View>
        </View>

        {/* Segmented Tabs Switcher */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'info' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'info' ? '#FFF' : colors.textSecondary }]}>
              Information
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'content' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('content')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'content' ? '#FFF' : colors.textSecondary }]}>
              Content
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'review' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('review')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'review' ? '#FFF' : colors.textSecondary }]}>
              Review
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'info' && (
          <View style={styles.tabContent}>
            {/* Other Information Specs Grid */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Other Information</Text>

              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>👍</Text>
                  <Text style={[styles.specText, { color: colors.textSecondary }]}>99% positive review ({course.reviewsCount})</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>🎥</Text>
                  <Text style={[styles.specText, { color: colors.textSecondary }]}>46 Lessons (10 Hours)</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>🌐</Text>
                  <Text style={[styles.specText, { color: colors.textSecondary }]}>Available on the web</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>⌛</Text>
                  <Text style={[styles.specText, { color: colors.textSecondary }]}>3 Years access</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>🗣️</Text>
                  <Text style={[styles.specText, { color: colors.textSecondary }]}>English Language</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>😊</Text>
                  <Text style={[styles.specText, { color: colors.textSecondary }]}>Self-paced online</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>📊</Text>
                  <Text style={[styles.specText, { color: colors.textSecondary }]}>Level: Beginner to Advance</Text>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>📜</Text>
                  <Text style={[styles.specText, { color: colors.textSecondary }]}>Certificate: Yes</Text>
                </View>
              </View>
            </View>

            {/* What will you learn */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>What will you learn in this course?</Text>
              <View style={styles.learnRow}>
                <CheckCircle2 size={18} color={colors.success} />
                <Text style={[styles.learnText, { color: colors.textSecondary }]}>
                  Build and interpret comprehensive financial models, enhancing practical Excel skills.
                </Text>
              </View>
              <View style={styles.learnRow}>
                <CheckCircle2 size={18} color={colors.success} />
                <Text style={[styles.learnText, { color: colors.textSecondary }]}>
                  Apply theoretical knowledge to real-world financial data through case study analysis.
                </Text>
              </View>
            </View>

            {/* Requirements & FAQs */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>What are the course requirements?</Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>Access to a laptop.</Text>

              <Text style={[styles.cardHeaderTitle, { color: colors.text, marginTop: 14 }]}>Will the certificate be issued?</Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                Yes, a certificate of completion will be issued at the end of the course at No charge.
              </Text>
            </View>

            {/* Certifications Preview Section */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Certifications</Text>
              <CertificatePreview courseTitle={course.title} />
            </View>
          </View>
        )}

        {/* Content Tab Accordion */}
        {(activeTab === 'content' || activeTab === 'info') && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: 16 }]}>
            <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Course Content</Text>

            {MOCK_MODULES.map((module) => {
              const isExpanded = expandedModules.includes(module.id);
              return (
                <View key={module.id} style={[styles.moduleBox, { backgroundColor: colors.surfaceLight }]}>
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
                    <View style={[styles.lessonsContainer, { borderTopColor: colors.border }]}>
                      {module.lessons.map((lesson) => (
                        <TouchableOpacity
                          key={lesson.id}
                          style={styles.lessonItem}
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
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.bottomPrice, { color: colors.primary }]}>{formatPrice(course.price)}</Text>
          <Text style={[styles.bottomDiscount, { color: colors.textSecondary }]}>
            {course.discount}% Disc. {formatPrice(course.originalPrice)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            addToCart(course.id);
            router.push('/cart');
          }}
        >
          <Text style={styles.ctaText}>Add to cart →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  videoContainer: {
    position: 'relative',
    height: 200,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlayBtn: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  instructorText: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 4,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  specsGrid: {
    gap: 10,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  specIcon: {
    fontSize: 14,
  },
  specText: {
    fontSize: 13,
  },
  learnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  learnText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  bodyText: {
    fontSize: 13,
  },
  moduleBox: {
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
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
  lessonsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  lessonItem: {
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
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomDiscount: {
    fontSize: 11,
  },
  ctaBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
