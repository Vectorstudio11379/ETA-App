import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { SparklesIcon, Tick01Icon } from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

export default function PremiumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, formatPrice } = useApp();

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const perks = [
    'Unlimited Access to 80+ Premium Tech Courses',
    'Download Lessons for Offline Playback',
    'Official Verified AQskill Certificates',
    'Direct Mentorship from Top Instructors',
    'Exclusive Datathon & Hackathon Entry Pass',
  ];

  const handleSubscribe = () => {
    Alert.alert('Subscribed!', 'Welcome to ETA Premium All-Access!');
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ETA Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 102, 255, 0.12)' }]}>
            <HugeiconsIcon icon={SparklesIcon} size={32} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Unlock Unlimited Learning</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Get full access to every single course, bundle, project file, and certified mentorship track on ETA.
          </Text>

          <Text style={[styles.priceTag, { color: colors.primary }]}>{formatPrice(15000)} / Month</Text>
        </View>

        <Text style={[styles.perksHeader, { color: colors.text }]}>What's Included in Premium</Text>

        {perks.map((perk, idx) => (
          <View key={idx} style={[styles.perkRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
              <HugeiconsIcon icon={Tick01Icon} size={12} color="#FFF" />
            </View>
            <Text style={[styles.perkText, { color: colors.text }]}>{perk}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.subscribeBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.88}
          onPress={handleSubscribe}
        >
          <Text style={styles.subscribeText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  heroCard: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 2,
    padding: 24,
    marginBottom: 20,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  priceTag: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  perksHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  subscribeBtn: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 20,
  },
  subscribeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
