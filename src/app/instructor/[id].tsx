import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseCard } from '../../components/CourseCard';
import { useApp } from '../../context/AppContext';

export default function InstructorDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { courses, instructors, colors } = useApp();
  const [activeTab, setActiveTab] = useState<'about' | 'courses'>('about');

  const instructor = instructors.find((inst) => inst.id === id) || instructors[0];
  const instructorCourses = instructor ? courses.filter(
    (c) => c.instructor.toLowerCase().includes(instructor.name.toLowerCase()) ||
           instructor.name.includes('Express Tech') ||
           courses.length <= 5
  ) : [];

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  if (!instructor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 15 }}>Loading instructor details...</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>‹ Back to Instructors</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: instructor.avatar }} style={styles.avatar} />
          <View style={styles.profileTextCol}>
            <Text style={[styles.name, { color: colors.text }]}>{instructor.name}</Text>
            <Text style={[styles.role, { color: colors.accent }]}>{instructor.role}</Text>
            <Text style={[styles.joinedText, { color: colors.textMuted }]}>
              Joined Since {instructor.joinedYear}
            </Text>
          </View>
        </View>

        {/* Segmented Switcher Tabs */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'about' && { backgroundColor: colors.accent }]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'about' ? '#FFF' : colors.textSecondary }]}>
              About Tutor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'courses' && { backgroundColor: colors.accent }]}
            onPress={() => setActiveTab('courses')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'courses' ? '#FFF' : colors.textSecondary }]}>
              Courses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: About Tutor (Matching Screenshot 3) */}
        {activeTab === 'about' ? (
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>About Instructor</Text>
            <Text style={[styles.bioText, { color: colors.textSecondary }]}>
              {instructor.bio}
            </Text>
          </View>
        ) : (
          /* Tab 2: Courses (Matching Screenshot 4) */
          <View style={styles.coursesContainer}>
            {instructorCourses.map((course) => (
              <CourseCard key={course.id} course={course} horizontal={false} />
            ))}
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
    paddingBottom: 12,
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  profileTextCol: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  role: {
    fontSize: 13,
    marginBottom: 4,
  },
  joinedText: {
    fontSize: 11,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 4,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 20,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  aboutCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginHorizontal: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
  },
  coursesContainer: {
    gap: 4,
  },
});
