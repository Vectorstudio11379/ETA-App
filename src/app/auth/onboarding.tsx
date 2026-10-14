import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 8
    : Math.max(insets.top, 14);

  const bottomPadding = Math.max(insets.bottom, 20) + 12;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Ambient Glow Effect */}
      <View style={styles.glowContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255, 69, 0, 0.45)', 'rgba(235, 45, 0, 0.25)', 'transparent']}
          style={styles.radialGlow}
          start={{ x: 0.65, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
        />
      </View>

      {/* Background Floating Glassmorphic Cards (Whop Screen 1 Look) */}
      <View style={[styles.cardsBackdrop, { paddingTop: statusBarPadding }]}>
        {/* Row 1: Top-Left Mini Bar Chart & Top-Right Student Leaders */}
        <View style={styles.cardsRow}>
          {/* Card A: Left Bar Chart Widget */}
          <View style={styles.miniChartCard}>
            <View style={styles.chartBars}>
              <View style={[styles.bar, { height: 26 }]} />
              <View style={[styles.bar, { height: 44, opacity: 0.9 }]} />
            </View>
            <Text style={styles.cardMutedLabel}>Dec 4th</Text>
          </View>

          {/* Card B: Right Student Earnings / Certification Stream */}
          <View style={styles.studentLeaderCard}>
            <View style={styles.studentRow}>
              <View style={[styles.avatarCircle, { backgroundColor: '#FF6B00' }]}>
                <Text style={styles.avatarLetter}>S</Text>
              </View>
              <Text style={styles.studentName} numberOfLines={1}>Stephanie#408</Text>
              <Text style={styles.studentAmt}>$2,020.00</Text>
            </View>

            <View style={styles.studentRow}>
              <View style={[styles.avatarCircle, { backgroundColor: '#E11D48' }]}>
                <Text style={styles.avatarLetter}>J</Text>
              </View>
              <Text style={styles.studentName} numberOfLines={1}>Julia#2401</Text>
              <Text style={styles.studentAmt}>$25,400.00</Text>
            </View>

            <View style={styles.studentRow}>
              <View style={[styles.avatarCircle, { backgroundColor: '#F97316' }]}>
                <Text style={styles.avatarLetter}>E</Text>
              </View>
              <Text style={styles.studentName} numberOfLines={1}>Emma#4409</Text>
              <Text style={styles.studentAmt}>$19,835.45</Text>
            </View>

            <View style={styles.studentRow}>
              <View style={[styles.avatarCircle, { backgroundColor: '#EA580C' }]}>
                <Text style={styles.avatarLetter}>J</Text>
              </View>
              <Text style={styles.studentName} numberOfLines={1}>Jon#0093</Text>
              <Text style={styles.studentAmt}>$12,450.00</Text>
            </View>
          </View>
        </View>

        {/* Row 2: Hero Metrics Card (Active Learners & Revenue Growth) */}
        <View style={styles.heroMetricCard}>
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroSubLabel}>Active Learners & Earnings</Text>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>i</Text>
            </View>
          </View>

          <View style={styles.heroValueRow}>
            <Text style={styles.heroValueText}>$52,402.55</Text>
            <View style={styles.growthPill}>
              <Text style={styles.growthPillText}>+68%</Text>
            </View>
          </View>

          <Text style={styles.heroSecondaryStat}>5,240+ students enrolled</Text>

          {/* Glowing Sparkline Chart Vector */}
          <View style={styles.sparklineContainer}>
            <Svg height="36" width={SCREEN_WIDTH - 80}>
              <Path
                d="M0,28 Q30,22 60,25 T120,16 T180,20 T240,8 T300,4"
                fill="none"
                stroke="#FF5500"
                strokeWidth="2.5"
              />
              <Path
                d="M0,28 Q30,22 60,25 T120,16 T180,20 T240,8 T300,4 L300,36 L0,36 Z"
                fill="rgba(255, 85, 0, 0.08)"
              />
            </Svg>
          </View>

          <View style={styles.heroFooterRow}>
            <View style={styles.miniStatBadge}>
              <Text style={styles.miniStatBadgeText}>481 (22%)</Text>
            </View>
            <Text style={styles.heroUpdateText}>Verified payouts</Text>
          </View>
        </View>
      </View>

      {/* Lower Third: Whop-Style Brand Copy & Action Buttons */}
      <View style={[styles.bottomSection, { paddingBottom: bottomPadding }]}>
        {/* Brand Wing Logo */}
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/eta_logo.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
        </View>

        {/* Headline Copy */}
        <View style={styles.typographyBox}>
          <Text style={styles.headlineTitle}>
            ETA <Text style={styles.dashText}>—</Text>
          </Text>
          <Text style={styles.headlineSub}>
            your destination for discovering, creating and mastering high-income digital skills.
          </Text>
        </View>

        {/* Buttons: Screen 1 Whop Layout */}
        <View style={styles.buttonsContainer}>
          {/* Top Button: Sign up (Solid White Pill) */}
          <TouchableOpacity
            style={styles.signUpBtn}
            activeOpacity={0.88}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={styles.signUpBtnText}>Sign up</Text>
          </TouchableOpacity>

          {/* Bottom Button: I have an account (Dark Translucent Pill) */}
          <TouchableOpacity
            style={styles.haveAccountBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.haveAccountBtnText}>I have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090C',
    justifyContent: 'space-between',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    overflow: 'hidden',
  },
  radialGlow: {
    width: '100%',
    height: '100%',
  },
  cardsBackdrop: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    opacity: 0.92,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  miniChartCard: {
    width: '32%',
    backgroundColor: 'rgba(28, 12, 10, 0.75)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 60, 20, 0.2)',
    justifyContent: 'space-between',
    minHeight: 110,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 50,
  },
  bar: {
    width: 14,
    backgroundColor: '#FF5722',
    borderRadius: 4,
  },
  cardMutedLabel: {
    color: '#8C5648',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  studentLeaderCard: {
    flex: 1,
    backgroundColor: 'rgba(28, 12, 10, 0.75)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 60, 20, 0.2)',
    justifyContent: 'space-between',
    gap: 7,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarLetter: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  studentName: {
    flex: 1,
    color: '#E0A899',
    fontSize: 12,
    fontWeight: '500',
  },
  studentAmt: {
    color: '#D87A65',
    fontSize: 12,
    fontWeight: '600',
  },
  heroMetricCard: {
    backgroundColor: 'rgba(28, 12, 10, 0.8)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 20, 0.28)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  heroSubLabel: {
    color: '#9E6252',
    fontSize: 13,
    fontWeight: '500',
  },
  infoBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#9E6252',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadgeText: {
    color: '#9E6252',
    fontSize: 9,
    fontWeight: 'bold',
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroValueText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  growthPill: {
    backgroundColor: 'rgba(255, 85, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  growthPillText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '700',
  },
  heroSecondaryStat: {
    color: '#8C5648',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  sparklineContainer: {
    height: 38,
    marginVertical: 4,
    overflow: 'hidden',
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  miniStatBadge: {
    backgroundColor: 'rgba(255, 60, 20, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniStatBadgeText: {
    color: '#FF7347',
    fontSize: 11,
    fontWeight: '600',
  },
  heroUpdateText: {
    color: '#8C5648',
    fontSize: 11,
  },
  bottomSection: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  logoRow: {
    marginBottom: 16,
  },
  logoIcon: {
    width: 44,
    height: 44,
  },
  typographyBox: {
    marginBottom: 24,
  },
  headlineTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  dashText: {
    color: '#888892',
    fontWeight: '400',
  },
  headlineSub: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  buttonsContainer: {
    gap: 12,
  },
  signUpBtn: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  signUpBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  haveAccountBtn: {
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haveAccountBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
