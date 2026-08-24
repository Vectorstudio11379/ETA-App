import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  FavouriteIcon,
  UserGroupIcon,
  StarIcon,
} from '@hugeicons/core-free-icons';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { useApp } from '../../context/AppContext';

export default function WishlistScreen() {
  const router = useRouter();
  const { courses, wishlistIds, toggleWishlist, formatPrice, colors } = useApp();

  const wishlistedCourses = courses.filter((c) => wishlistIds.includes(c.id) || c.isWishlisted);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showCurrency={false} title="My WishList" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SearchBar />

        {wishlistedCourses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <HugeiconsIcon icon={FavouriteIcon} size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Wishlist is Empty</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Explore courses and tap the heart icon to save them for later.
            </Text>
          </View>
        ) : (
          wishlistedCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.88}
              onPress={() =>
                router.push({
                  pathname: '/course/[id]',
                  params: { id: course.id },
                })
              }
            >
              <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />

              <View style={styles.contentCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <TouchableOpacity
                    style={[styles.heartBtn, { backgroundColor: 'rgba(0, 102, 255, 0.12)' }]}
                    onPress={() => toggleWishlist(course.id)}
                  >
                    <HugeiconsIcon icon={FavouriteIcon} size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.author, { color: colors.textSecondary }]}>By: {course.instructor}</Text>

                <View style={styles.statsRow}>
                  <View style={[styles.statPill, { backgroundColor: colors.surfaceLight }]}>
                    <HugeiconsIcon icon={UserGroupIcon} size={11} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      {course.studentsCount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.statPill, { backgroundColor: colors.surfaceLight }]}>
                    <HugeiconsIcon icon={StarIcon} size={11} color={colors.secondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      {course.rating} ({course.reviewsCount})
                    </Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <View>
                    <Text style={[styles.discountText, { color: colors.textSecondary }]}>
                      {course.discount}% Disc.{' '}
                      <Text style={styles.strikePrice}>{formatPrice(course.originalPrice)}</Text>
                    </Text>
                    <Text style={[styles.priceText, { color: colors.text }]}>{formatPrice(course.price)}</Text>
                  </View>
                  <Text style={[styles.daysLeftText, { color: colors.error }]}>{course.daysLeft} days left</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  thumbnail: {
    width: 95,
    height: 95,
    borderRadius: 12,
  },
  contentCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 17,
  },
  heartBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  author: {
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountText: {
    fontSize: 10,
  },
  strikePrice: {
    textDecorationLine: 'line-through',
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  daysLeftText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
