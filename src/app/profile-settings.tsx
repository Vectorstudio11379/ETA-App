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
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  UserIcon,
  Mail01Icon,
  CallIcon,
  Globe02Icon,
  LockKeyIcon,
  Camera01Icon,
  EyeIcon,
  EyeOffIcon,
} from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProfile, colors, updateUserProfile, isAuthenticated } = useApp();

  const [name, setName] = useState<string>(userProfile.name || '');
  const [email, setEmail] = useState<string>(userProfile.email || '');
  const [phone, setPhone] = useState<string>(userProfile.phone || '');
  const [country, setCountry] = useState<string>(userProfile.country || 'Nigeria');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [avatarUri, setAvatarUri] = useState<string>(userProfile.avatar || '');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const statusBarPadding =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
      : Math.max(insets.top, 12);

  // Pick Avatar from Gallery
  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to choose a profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAvatarUri(asset.uri);
        if (asset.base64) {
          const mime = asset.mimeType || 'image/jpeg';
          setAvatarBase64(`data:${mime};base64,${asset.base64}`);
        }
      }
    } catch (err: any) {
      console.warn('ImagePicker Error:', err);
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    if (password && password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateUserProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        password: password.trim() ? password.trim() : undefined,
        avatarBase64: avatarBase64 || undefined,
        avatar: !avatarBase64 && avatarUri ? avatarUri : undefined,
      });

      if (res.success) {
        Alert.alert('Profile Saved', 'Your profile changes have been updated and synced to Express Tech Academy.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Update Failed', res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} disabled={isSaving}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Picker Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri:
                  avatarUri ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
              }}
              style={[styles.avatarImage, { borderColor: colors.primary }]}
            />
            <TouchableOpacity
              style={[styles.cameraBadge, { backgroundColor: colors.primary }]}
              onPress={handlePickAvatar}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              <HugeiconsIcon icon={Camera01Icon} size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handlePickAvatar} disabled={isSaving} style={styles.changePhotoBtn}>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={UserIcon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Your Full Name"
            placeholderTextColor={colors.textMuted}
            editable={!isSaving}
          />
        </View>

        {/* Email Address */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={Mail01Icon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="student@expressteck.tech"
            placeholderTextColor={colors.textMuted}
            editable={!isSaving}
          />
        </View>

        {/* Phone Number */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={CallIcon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+234 810 000 0000"
            placeholderTextColor={colors.textMuted}
            editable={!isSaving}
          />
        </View>

        {/* Country */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>Country</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={Globe02Icon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={country}
            onChangeText={setCountry}
            placeholder="Country"
            placeholderTextColor={colors.textMuted}
            editable={!isSaving}
          />
        </View>

        {/* Optional New Password */}
        <Text style={[styles.inputLabel, { color: colors.text }]}>New Password (Optional)</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={LockKeyIcon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Leave blank to keep unchanged"
            placeholderTextColor={colors.textMuted}
            editable={!isSaving}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <HugeiconsIcon
              icon={showPassword ? EyeOffIcon : EyeIcon}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: isSaving ? colors.primary + '99' : colors.primary },
          ]}
          activeOpacity={0.88}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  changePhotoBtn: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 14,
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
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 32,
  },
  saveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
