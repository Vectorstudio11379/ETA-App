import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { CourseCard } from '../../components/CourseCard';
import { HERO_BANNERS, HeroBanner, Instructor } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_ITEM_STEP = 284;

export default function HomeScreen() {
  const router = useRouter();
  const { courses, newCourses, bundles, instructors, colors, isRefreshing, refreshLiveData } = useApp();

  const [activeHeroIndex, setActiveHeroIndex] = useState<number>(0);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState<number>(0);
  const [activeNewIndex, setActiveNewIndex] = useState<number>(0);
  const [activeBundleIndex, setActiveBundleIndex] = useState<number>(0);

  const featuredCourses = courses.slice(0, 5);

  const handleHeroScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index >= 0 && index < HERO_BANNERS.length) {
      setActiveHeroIndex(index);
    }
  };

  const handleCarouselScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    setIndex: (i: number) => void,
    maxLen: number
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_ITEM_STEP);
    if (index >= 0 && index < maxLen) {
      setIndex(index);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showCurrency={true} />

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
        <SearchBar onFilterPress={() => router.push('/explore')} />

        {/* Hero Banner Swipeable Horizontal Slider */}
        <FlatList
          horizontal
          pagingEnabled
          data={HERO_BANNERS}
          keyExtractor={(item) => item.id}
          onScroll={handleHeroScroll}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={HERO_CARD_WIDTH + 16}
          snapToAlignment="center"
          contentContainerStyle={styles.heroSliderContainer}
          renderItem={({ item }: { item: HeroBanner }) => (
            <View
              style={[
                styles.heroCard,
                { width: HERO_CARD_WIDTH, backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.heroLeft}>
                <Text style={[styles.heroTitle, { color: colors.text }]}>
                  {item.title}
                  <Text style={{ color: colors.accent }}>{item.highlightText}</Text>
                </Text>
                <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                  {item.subtitle}
                </Text>
                <TouchableOpacity
                  style={[styles.heroBtn, { backgroundColor: colors.accent }]}
                  onPress={() => router.push('/explore')}
                >
                  <Text style={styles.heroBtnText}>{item.ctaText}</Text>
                </TouchableOpacity>
              </View>
              <Image source={{ uri: item.image }} style={styles.heroImg} />
            </View>
          )}
        />

        {/* Hero Slider Dots Indicator */}
        <View style={styles.dotsRow}>
          {HERO_BANNERS.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeHeroIndex
                  ? [styles.dotActive, { backgroundColor: colors.accent }]
                  : { backgroundColor: colors.surfaceLight },
              ]}
            />
          ))}
        </View>

        {/* Section 1: Featured Courses Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Courses</Text>
          <TouchableOpacity onPress={() => router.push('/explore')}>
            <Text style={[styles.seeAllText, { color: colors.accent }]}>See all</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={featuredCourses}
          keyExtractor={(item) => item.id}
          onScroll={(e) => handleCarouselScroll(e, setActiveFeaturedIndex, featuredCourses.length)}
          scrollEventThrottle={16}
          renderItem={({ item }) => <CourseCard course={item} horizontal={true} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselList}
        />

        <View style={styles.dotsRow}>
          {featuredCourses.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeFeaturedIndex
                  ? [styles.dotActive, { backgroundColor: colors.accent }]
                  : { backgroundColor: colors.surfaceLight },
              ]}
            />
          ))}
        </View>

        {/* Section 2: New Courses Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>New Courses</Text>
          <TouchableOpacity onPress={() => router.push('/explore')}>
            <Text style={[styles.seeAllText, { color: colors.accent }]}>See all</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={newCourses}
          keyExtractor={(item) => item.id}
          onScroll={(e) => handleCarouselScroll(e, setActiveNewIndex, newCourses.length)}
          scrollEventThrottle={16}
          renderItem={({ item }) => <CourseCard course={item} horizontal={true} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselList}
        />

        <View style={styles.dotsRow}>
          {newCourses.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeNewIndex
                  ? [styles.dotActive, { backgroundColor: colors.accent }]
                  : { backgroundColor: colors.surfaceLight },
              ]}
            />
          ))}
        </View>

        {/* Section 3: Course Bundles Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Course Bundles</Text>
          <TouchableOpacity onPress={() => router.push('/explore')}>
            <Text style={[styles.seeAllText, { color: colors.accent }]}>See all</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={bundles}
          keyExtractor={(item) => item.id}
          onScroll={(e) => handleCarouselScroll(e, setActiveBundleIndex, bundles.length)}
          scrollEventThrottle={16}
          renderItem={({ item }) => <CourseCard course={item} horizontal={true} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselList}
        />

        <View style={styles.dotsRow}>
          {bundles.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeBundleIndex
                  ? [styles.dotActive, { backgroundColor: colors.accent }]
                  : { backgroundColor: colors.surfaceLight },
              ]}
            />
          ))}
        </View>

        {/* Section 4: Top Instructors Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Instructors</Text>
          <TouchableOpacity onPress={() => router.push('/instructors' as any)}>
            <Text style={[styles.seeAllText, { color: colors.accent }]}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.instructorsList}
        >
          {instructors.map((inst: Instructor) => (
            <TouchableOpacity
              key={inst.id}
              style={styles.instructorItem}
              onPress={() =>
                router.push({
                  pathname: '/instructor/[id]',
                  params: { id: inst.id },
                })
              }
            >
              <Image source={{ uri: inst.avatar }} style={styles.instructorAvatar} />
              <Text style={[styles.instructorName, { color: colors.text }]} numberOfLines={1}>
                {inst.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSliderContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 16,
  },
  heroCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  heroSub: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },
  heroBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  heroBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  heroImg: {
    width: 85,
    height: 85,
    borderRadius: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  carouselList: {
    paddingLeft: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  instructorsList: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 16,
    marginBottom: 20,
  },
  instructorItem: {
    alignItems: 'center',
    width: 90,
  },
  instructorAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#0066FF',
    marginBottom: 6,
  },
  instructorName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
