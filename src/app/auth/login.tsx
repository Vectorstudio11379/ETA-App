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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Mail01Icon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from '@hugeicons/core-free-icons';
import { useApp } from '../../context/AppContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, login, authError } = useApp();

  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const handleLogin = async () => {
    if (!emailOrPhone.trim()) {
      setLocalError('Please enter your email address or username');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    setLocalError(null);
    setIsLoading(true);

    try {
      const success = await login(emailOrPhone.trim(), password);
      if (success) {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Safe Area Top Padding */}
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Log in to continue learning, access your saved courses, and track your certificates across all your devices.
        </Text>

        {displayError ? (
          <View style={[styles.errorBanner, { backgroundColor: '#FF4D4D20', borderColor: '#FF4D4D' }]}>
            <Text style={[styles.errorText, { color: '#FF4D4D' }]}>{displayError}</Text>
          </View>
        ) : null}

        {/* Input 1: Email Address or Phone */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address or Username</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={Mail01Icon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter your email or username"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={emailOrPhone}
            onChangeText={(txt) => {
              setEmailOrPhone(txt);
              if (localError) setLocalError(null);
            }}
          />
        </View>

        {/* Input 2: Password */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={LockIcon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              if (localError) setLocalError(null);
            }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <HugeiconsIcon icon={showPassword ? EyeOffIcon : EyeIcon} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: colors.secondary }]}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login CTA */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
          activeOpacity={0.88}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.submitText}>Login Account</Text>
          )}
        </TouchableOpacity>

        {/* Switch to Sign Up */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={[styles.signupText, { color: colors.primary }]}>Sign Up</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
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
    marginBottom: 8,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 22,
    justifyContent: 'center',
    height: 54,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
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
