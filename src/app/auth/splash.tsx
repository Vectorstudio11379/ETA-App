import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoadingAuth } = useApp();

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
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [isLoadingAuth, isAuthenticated]);

  return (
    <View style={[styles.container, { paddingTop: statusBarPadding, paddingBottom: bottomPadding }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Ambient Glow Effect */}
      <View style={styles.glowContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255, 69, 0, 0.45)', 'rgba(235, 45, 0, 0.2)', 'transparent']}
          style={styles.radialGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.75 }}
        />
      </View>

      <View style={styles.centerBox}>
        {/* 3D Glowing Card Badge */}
        <View style={styles.badgeWrapper}>
          <View style={styles.auraGlow} />
          <Image
            source={require('../../../assets/images/eta_glowing_card_badge.jpg')}
            style={styles.badgeImage}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.brandTitle}>
          ETA <Text style={{ color: '#FF5500' }}>Learning</Text>
        </Text>
        <Text style={styles.brandSub}>
          Your Destination for High-Income Tech & Digital Skills
        </Text>
      </View>

      {/* Ambient Loading Indicator */}
      <View style={styles.footerBox}>
        <ActivityIndicator size="small" color="#FF5500" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090C',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  auraGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 85, 0, 0.3)',
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  badgeImage: {
    width: 136,
    height: 136,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 120, 40, 0.4)',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  brandSub: {
    color: '#8A8A96',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
  footerBox: {
    marginBottom: 16,
  },
});
