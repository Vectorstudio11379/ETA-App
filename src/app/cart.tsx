import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Notification01Icon,
  Cancel01Icon,
  ShoppingBag01Icon,
  CreditCardIcon,
} from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { courses, cartIds, removeFromCart, formatPrice, clearCart, colors } = useApp();

  const cartCourses = courses.filter((c) => cartIds.includes(c.id));
  const totalAmount = cartCourses.reduce((sum, item) => sum + item.price, 0);

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const handleCheckout = (provider: string) => {
    Alert.alert(
      'Checkout Success',
      `Proceeding with ${provider} for ${formatPrice(totalAmount)}!`,
      [
        {
          text: 'OK',
          onPress: () => {
            clearCart();
            router.push('/(tabs)/my-courses');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Safe Area Top Padding */}
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Cart({cartCourses.length})</Text>

        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <HugeiconsIcon icon={Notification01Icon} size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {cartCourses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <HugeiconsIcon icon={ShoppingBag01Icon} size={54} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Cart is Empty</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Add courses to your cart to begin learning!</Text>
          </View>
        ) : (
          cartCourses.map((course) => (
            <View key={course.id} style={[styles.cartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />

              <View style={styles.contentCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <TouchableOpacity
                    style={[styles.removeBtn, { backgroundColor: colors.error }]}
                    onPress={() => removeFromCart(course.id)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.author, { color: colors.textSecondary }]}>By: {course.instructor}</Text>

                <View style={styles.priceRow}>
                  <Text style={[styles.discountText, { color: colors.textSecondary }]}>
                    {course.discount}% Disc.{' '}
                    <Text style={styles.strikePrice}>{formatPrice(course.originalPrice)}</Text>
                  </Text>
                  <Text style={[styles.daysLeftText, { color: colors.error }]}>{course.daysLeft} days left</Text>
                </View>

                <Text style={[styles.priceText, { color: colors.text }]}>{formatPrice(course.price)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Payment Options Sheet */}
      {cartCourses.length > 0 && (
        <View style={[styles.paymentSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Payment Options</Text>

          <View style={[styles.totalBox, { backgroundColor: colors.surfaceLight }]}>
            <HugeiconsIcon icon={CreditCardIcon} size={22} color={colors.primary} />
            <View style={styles.totalTextCol}>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>{formatPrice(totalAmount)}</Text>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Payable Sum</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryPayBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleCheckout('Local Payment (Paystack / Flutterwave)')}
          >
            <Text style={styles.primaryPayText}>Use Local Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryPayBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
            onPress={() => handleCheckout('Google Pay')}
          >
            <Text style={[styles.secondaryPayText, { color: colors.text }]}>Use Google Pay</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: 12,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
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
  cartCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  thumbnail: {
    width: 90,
    height: 90,
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
  removeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  author: {
    fontSize: 11,
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
  daysLeftText: {
    fontSize: 10,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
  },
  totalTextCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalLabel: {
    fontSize: 12,
  },
  primaryPayBtn: {
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryPayText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryPayBtn: {
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryPayText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
