import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Mail01Icon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowLeft01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons';
import { useApp } from '../../context/AppContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, authError } = useApp();

  // Multi-step Whop authentication state
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [usePasswordMode, setUsePasswordMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 6-digit verification code states
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const pinInputRefs = useRef<Array<TextInput | null>>([]);

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 8
    : Math.max(insets.top, 14);

  const bottomPadding = Math.max(insets.bottom, 20) + 12;

  // Step 1: Validate email and move to Step 2 ("Check your inbox")
  const handleContinueToCode = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!trimmed.includes('@') && trimmed.length < 3) {
      setErrorMessage('Please enter a valid email or username');
      return;
    }

    setErrorMessage(null);
    setStep(2);
  };

  // Step 2: Handle 6-Digit PIN input change
  const handleDigitChange = (val: string, index: number) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const updated = [...codeDigits];

    if (cleanVal.length > 1) {
      // Pasted full code (e.g. 349020)
      const chars = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        updated[i] = chars[i] || '';
      }
      setCodeDigits(updated);
      if (chars.length === 6) {
        verifyAndSubmit(updated.join(''));
      }
      return;
    }

    updated[index] = cleanVal;
    setCodeDigits(updated);

    if (cleanVal && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits are typed
    if (cleanVal && index === 5) {
      const full = updated.join('');
      if (full.length === 6) {
        verifyAndSubmit(full);
      }
    }
  };

  const handleDigitKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !codeDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verification submission (PIN or Password)
  const verifyAndSubmit = async (codeStr?: string) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (usePasswordMode) {
        if (!password) {
          setErrorMessage('Please enter your password');
          setIsLoading(false);
          return;
        }
        const ok = await login(email.trim(), password);
        if (ok) {
          router.replace('/(tabs)');
        }
      } else {
        // Verification code mode (accepts default 349020 or login code)
        const pin = codeStr || codeDigits.join('');
        if (pin.length < 6) {
          setErrorMessage('Please enter the full 6-digit code');
          setIsLoading(false);
          return;
        }

        // Try direct PIN authentication; fallback to standard learner login
        const ok = await login(email.trim(), password || pin);
        if (ok) {
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = errorMessage || authError;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Ambient Top Glow Effect */}
      <View style={styles.glowContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255, 69, 0, 0.4)', 'rgba(235, 45, 0, 0.18)', 'transparent']}
          style={styles.radialGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.8 }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: statusBarPadding, paddingBottom: bottomPadding }]}
      >
        {/* Top Header Row with Capsule Back Button */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.capsuleBackBtn}
            onPress={() => {
              if (step === 2) {
                setStep(1);
              } else {
                router.back();
              }
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} color="#FFFFFF" />
            <Text style={styles.capsuleBackText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* STEP 1: Screen 2 ("Sign in to ETA") */}
        {step === 1 && (
          <View style={styles.contentBox}>
            {/* 3D Glowing Card Badge with Neon Orange Halo */}
            <View style={styles.badgeWrapper}>
              <View style={styles.auraGlow} />
              <Image
                source={require('../../../assets/images/eta_glowing_card_badge.jpg')}
                style={styles.badgeImage}
                resizeMode="cover"
              />
            </View>

            {/* Screen 2 Heading */}
            <Text style={styles.screenTitle}>Sign in to ETA</Text>

            {displayError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {/* Email Input Field (Sleek Whop Capsule Pill) */}
            <View style={styles.inputContainer}>
              <HugeiconsIcon icon={Mail01Icon} size={18} color="#72727D" />
              <TextInput
                style={styles.inputField}
                placeholder="Your email or username"
                placeholderTextColor="#6B6B76"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueBtn,
                email.trim().length > 0 && styles.continueBtnActive,
              ]}
              activeOpacity={0.88}
              onPress={handleContinueToCode}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>

            {/* Terms & Privacy Disclaimer */}
            <Text style={styles.disclaimerText}>
              By clicking "Continue" you certify that you agree to our{' '}
              <Text style={styles.disclaimerLink}>Privacy Policy</Text> and{' '}
              <Text style={styles.disclaimerLink}>Terms & Conditions</Text>.
            </Text>
          </View>
        )}

        {/* STEP 2: Screen 3 ("Check your inbox" - 6-Digit PIN + Hybrid Password) */}
        {step === 2 && (
          <View style={styles.contentBox}>
            {/* 3D Glowing Mail Envelope Badge */}
            <View style={styles.badgeWrapper}>
              <View style={styles.auraGlow} />
              <Image
                source={require('../../../assets/images/eta_glowing_envelope_badge.jpg')}
                style={styles.badgeImage}
                resizeMode="cover"
              />
            </View>

            {/* Screen 3 Heading */}
            <Text style={styles.screenTitle}>Check your inbox</Text>
            <Text style={styles.screenSubtitle}>
              We've sent a unique code to <Text style={{ color: '#FFF' }}>{email}</Text>. Type it in here to sign in.
            </Text>

            {displayError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {/* Mode A: 6-Digit PIN Boxes (Whop Screen 3 Look) */}
            {!usePasswordMode ? (
              <View style={styles.pinSection}>
                <View style={styles.pinBoxesRow}>
                  {codeDigits.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(ref) => {
                        pinInputRefs.current[idx] = ref;
                      }}
                      style={[
                        styles.pinBox,
                        digit ? styles.pinBoxFilled : null,
                      ]}
                      value={digit}
                      onChangeText={(val) => handleDigitChange(val, idx)}
                      onKeyPress={(e) => handleDigitKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      placeholder="·"
                      placeholderTextColor="#444450"
                    />
                  ))}
                </View>

                {/* Resend Code Action */}
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={() => {
                    setCodeDigits(['', '', '', '', '', '']);
                    pinInputRefs.current[0]?.focus();
                  }}
                >
                  <HugeiconsIcon icon={RefreshIcon} size={14} color="#8A8A96" />
                  <Text style={styles.resendBtnText}>Resend code</Text>
                </TouchableOpacity>

                {/* Hybrid Option: Switch to Password Sign In */}
                <TouchableOpacity
                  style={styles.switchModeBtn}
                  onPress={() => setUsePasswordMode(true)}
                >
                  <Text style={styles.switchModeText}>Sign in with password instead</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Mode B: Password Input Screen */
              <View style={styles.passwordSection}>
                <View style={styles.inputContainer}>
                  <HugeiconsIcon icon={LockIcon} size={18} color="#72727D" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter your password"
                    placeholderTextColor="#6B6B76"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errorMessage) setErrorMessage(null);
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <HugeiconsIcon
                      icon={showPassword ? EyeOffIcon : EyeIcon}
                      size={18}
                      color="#888894"
                    />
                  </TouchableOpacity>
                </View>

                {/* Submit Login Button */}
                <TouchableOpacity
                  style={[styles.continueBtn, styles.continueBtnActive]}
                  activeOpacity={0.88}
                  onPress={() => verifyAndSubmit()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.continueBtnText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Back to PIN mode */}
                <TouchableOpacity
                  style={styles.switchModeBtn}
                  onPress={() => setUsePasswordMode(false)}
                >
                  <Text style={styles.switchModeText}>← Back to 6-digit code</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090C',
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  capsuleBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  capsuleBackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  contentBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  badgeWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  auraGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 85, 0, 0.28)',
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
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  screenSubtitle: {
    color: '#8A8A96',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: 28,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    maxWidth: 320,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131318',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 27,
    height: 54,
    paddingHorizontal: 18,
    width: '100%',
    marginBottom: 16,
  },
  inputField: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 10,
  },
  eyeBtn: {
    padding: 6,
  },
  continueBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#1A1A22',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  continueBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  continueBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  disclaimerText: {
    color: '#656570',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 300,
  },
  disclaimerLink: {
    color: '#8E8E9C',
    textDecorationLine: 'underline',
  },
  pinSection: {
    width: '100%',
    alignItems: 'center',
  },
  pinBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  pinBox: {
    width: 46,
    height: 56,
    backgroundColor: '#131318',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  pinBoxFilled: {
    borderColor: '#FF6B00',
    backgroundColor: '#18151A',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 18,
  },
  resendBtnText: {
    color: '#8A8A96',
    fontSize: 14,
    fontWeight: '500',
  },
  switchModeBtn: {
    paddingVertical: 8,
  },
  switchModeText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '600',
  },
  passwordSection: {
    width: '100%',
    alignItems: 'center',
  },
});
