import React, { useEffect } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isAuthenticated, isLoadingAuth } = useApp();

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 16
    : Math.max(insets.top, 20);

  const bottomPadding = Math.max(insets.bottom, 24) + 20;

  useEffect(() => {
    // Wait until persistent authentication initialization finishes
    if (!isLoadingAuth) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/auth/onboarding');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAuth, isAuthenticated]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: statusBarPadding, paddingBottom: bottomPadding }]}>
      <View style={styles.centerBox}>
        {/* Official ETA Logo with Blue Accent Ring */}
        <View style={styles.logoRingWrapper}>
          <View style={[styles.blueAccentRing, { borderColor: colors.primary, shadowColor: colors.secondary }]}>
            <Image
              source={require('../../../assets/eta_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={[styles.brandTitle, { color: colors.text }]}>
          ETA <Text style={{ color: colors.primary }}>Learning</Text>
        </Text>
        <Text style={[styles.brandSub, { color: colors.textSecondary }]}>
          Empowering Africa through Technology & Skills
        </Text>
      </View>

      {/* Smooth Loading Spinner */}
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRingWrapper: {
    marginBottom: 20,
  },
  blueAccentRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1117',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
});
