import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Notification01Icon,
  ShoppingCart01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  title?: string;
  showCurrency?: boolean;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showCurrency = true, showBack = false }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cartIds, currency, setCurrency, notifications, colors } = useApp();

  const statusBarPadding = Platform.OS === 'android' 
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6 
    : Math.max(insets.top, 12);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: statusBarPadding }]}>
      {showCurrency ? (
        <TouchableOpacity
          style={[styles.currencyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setCurrency(currency === 'NGN' ? 'USD' : 'NGN')}
        >
          <Text style={styles.flagText}>🇳🇬</Text>
          <Text style={[styles.currencyText, { color: colors.text }]}>{currency}</Text>
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
            </TouchableOpacity>
          )}
          {title && <Text style={[styles.titleText, { color: colors.text }]}>{title}</Text>}
        </View>
      )}

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => router.push('/notifications')}
        >
          <HugeiconsIcon icon={Notification01Icon} size={22} color={colors.text} />
          {notifications.length > 0 && <View style={[styles.redBadge, { backgroundColor: colors.error }]} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => router.push('/cart')}
        >
          <HugeiconsIcon icon={ShoppingCart01Icon} size={22} color={colors.text} />
          {cartIds.length > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.cartBadgeText}>{cartIds.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  currencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  flagText: {
    fontSize: 16,
  },
  currencyText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionIconBtn: {
    position: 'relative',
    padding: 6,
  },
  redBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
