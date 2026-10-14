import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { CourseCard } from '../../components/CourseCard';
import { useApp } from '../../context/AppContext';

export default function ExploreScreen() {
  const { courses, bundles, categories, colors, isRefreshing, refreshLiveData } = useApp();
  const [activeTab, setActiveTab] = useState<'courses' | 'bundles'>('courses');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === 'All' || course.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredBundles = bundles.filter((bundle) => {
    return (
      bundle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bundle.instructor.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showCurrency={false} title="Explore" />

      {/* Top Segment Switcher */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'courses' && { backgroundColor: colors.accent }]}
          onPress={() => setActiveTab('courses')}
        >
          <Text style={[styles.segmentText, { color: activeTab === 'courses' ? '#FFF' : colors.textSecondary }]}>
            Courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'bundles' && { backgroundColor: colors.accent }]}
          onPress={() => setActiveTab('bundles')}
        >
          <Text style={[styles.segmentText, { color: activeTab === 'bundles' ? '#FFF' : colors.textSecondary }]}>
            Bundle Packs
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshLiveData}
            colors={[colors.primary, colors.secondary]}
            tintColor={colors.primary}
          />
        }
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={activeTab === 'bundles' ? 'Search Bundle Courses...' : 'Search for your preferred course'}
        />

        {activeTab === 'courses' ? (
          <>
            {/* Recently Searched Categories */}
            <Text style={[styles.sectionHeaderTitle, { color: colors.textSecondary }]}>Recently Search Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              <TouchableOpacity
                style={[
                  styles.catBadge,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedCategory === 'All' && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
                onPress={() => setSelectedCategory('All')}
              >
                <Text style={[styles.catText, { color: selectedCategory === 'All' ? '#FFF' : colors.text }]}>
                  All
                </Text>
              </TouchableOpacity>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catBadge,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                    onPress={() => setSelectedCategory(isSelected ? 'All' : cat.name)}
                  >
                    <Text style={[styles.catText, { color: isSelected ? '#FFF' : colors.text }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Course List */}
            <View style={styles.listContainer}>
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} horizontal={false} />
              ))}
            </View>
          </>
        ) : (
          /* Bundle Packs Vertical Card List (Matching Screenshot 1) */
          <View style={styles.listContainer}>
            {filteredBundles.map((bundle) => (
              <CourseCard key={bundle.id} course={bundle} horizontal={false} />
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
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 4,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  categoriesContainer: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 8,
    marginBottom: 16,
  },
  catBadge: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 4,
  },
});
