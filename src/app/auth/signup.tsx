import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  UserIcon,
  Mail01Icon,
  CallIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from '@hugeicons/core-free-icons';
import { useApp } from '../../context/AppContext';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useApp();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const handleNextStep = () => {
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setErrorMsg(null);
    router.push({
      pathname: '/auth/choose-country',
      params: {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Safe Area Top Padding */}
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topSkipBtn, { backgroundColor: colors.accentLight, borderColor: colors.accentBorder }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={[styles.topSkipText, { color: colors.accent }]}>Skip to Courses</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Create an account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign up to access all courses, track your progress, and start learning anytime.
        </Text>

        {errorMsg ? (
          <View style={[styles.errorBanner, { backgroundColor: '#FF4D4D20', borderColor: '#FF4D4D' }]}>
            <Text style={[styles.errorText, { color: '#FF4D4D' }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Input 1: Full Name */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={UserIcon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={(t) => { setFullName(t); setErrorMsg(null); }}
          />
        </View>

        {/* Input 2: Email Address */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={Mail01Icon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter your email address"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrorMsg(null); }}
          />
        </View>

        {/* Input 3: Phone Number */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={CallIcon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Input 4: Password */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={LockIcon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(t) => { setPassword(t); setErrorMsg(null); }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <HugeiconsIcon icon={showPassword ? EyeOffIcon : EyeIcon} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Input 5: Confirm Password */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={LockIcon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Re-enter password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setErrorMsg(null); }}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <HugeiconsIcon icon={showConfirmPassword ? EyeOffIcon : EyeIcon} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Create Account CTA */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.accent }]}
          activeOpacity={0.88}
          onPress={handleNextStep}
        >
          <Text style={styles.submitText}>Continue</Text>
        </TouchableOpacity>

        {/* Switch to Login */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={[styles.signupText, { color: colors.accent }]}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Social Sign-in Options */}
        <Text style={[styles.otherOptionText, { color: colors.textSecondary }]}>Sign in other option</Text>
        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#EA4335' }}>G</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}></Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topSkipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  topSkipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  backBtn: {
    paddingVertical: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
  },
  signupText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  otherOptionText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
