import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { useApp } from '../../context/AppContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useApp();
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ETA Header Brand Row */}
      <View style={styles.topHeader}>
        <Image
          source={require('../../../assets/eta_logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={[styles.headerBrandText, { color: colors.text }]}>
          ETA <Text style={{ color: colors.primary }}>Learning</Text>
        </Text>
      </View>

      {/* Phone App Preview Artwork Container */}
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop' }}
          style={styles.previewImage}
        />
      </View>

      {/* Flags Row */}
      <View style={styles.flagsRow}>
        <Text style={styles.flagItem}>🇲🇦</Text>
        <Text style={styles.flagItem}>🇳🇬</Text>
        <Text style={styles.flagItem}>🇩🇿</Text>
        <Text style={styles.flagItem}>🇸🇴</Text>
        <Text style={styles.flagItem}>🇿🇦</Text>
        <Text style={styles.flagItem}>🇿🇲</Text>
        <Text style={styles.flagItem}>🇬🇭</Text>
      </View>

      {/* Text Info Box */}
      <View style={styles.textContainer}>
        <Text style={[styles.headline, { color: colors.text }]}>The Best Place to Learn in Africa</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          An online learning hub where Africans gain practical, future-ready skills through clear lessons and real-world examples—anytime, anywhere.
        </Text>
      </View>

      {/* Main Get Started Button */}
      <TouchableOpacity
        style={[styles.getStartedBtn, { backgroundColor: colors.primary }]}
        activeOpacity={0.88}
        onPress={() => setShowAuthSheet(true)}
      >
        <Text style={styles.getStartedText}>Get Started</Text>
      </TouchableOpacity>

      {/* Auth Modal Bottom Sheet */}
      <Modal
        visible={showAuthSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAuthSheet(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowAuthSheet(false)}
        >
          <TouchableOpacity
            style={[styles.sheetContent, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={1}
          >
            <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />

            <Text style={[styles.sheetTitle, { color: colors.text }]}>Acquire tech skills in a fascinating way</Text>
            <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
              Learn practical, hands-on tech skills through short, project-based lessons designed to get you job-ready.
            </Text>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowAuthSheet(false);
                router.push('/auth/signup');
              }}
            >
              <Text style={styles.primaryActionText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
              onPress={() => {
                setShowAuthSheet(false);
                router.push('/auth/login');
              }}
            >
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>Login Account</Text>
            </TouchableOpacity>

            <Text style={[styles.otherOptionText, { color: colors.textSecondary }]}>Sign in other option</Text>

            <View style={styles.socialRow}>
              <TouchableOpacity style={[styles.socialCircle, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#EA4335' }}>G</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.socialCircle, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}></Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => {
                setShowAuthSheet(false);
                router.replace('/(tabs)');
              }}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>Continue without Login</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerBrandText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewContainer: {
    height: '38%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  flagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 6,
  },
  flagItem: {
    fontSize: 22,
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  getStartedBtn: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 10,
  },
  getStartedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  sheetSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  primaryActionBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryActionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryActionBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  otherOptionText: {
    fontSize: 12,
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  socialCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
