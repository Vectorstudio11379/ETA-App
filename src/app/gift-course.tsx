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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { GiftIcon, Mail01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

export default function GiftCourseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useApp();

  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [personalNote, setPersonalNote] = useState<string>('');

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const handleSendGift = () => {
    Alert.alert('Gift Sent!', `Course gift invitation sent to ${recipientEmail}!`);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gift a Course</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.giftBox, { backgroundColor: 'rgba(0, 102, 255, 0.12)' }]}>
            <HugeiconsIcon icon={GiftIcon} size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Share Knowledge with Friends</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Gift any course to your friends, family, or colleagues and help them build career-ready tech skills.
          </Text>
        </View>

        <Text style={[styles.inputLabel, { color: colors.text }]}>Recipient Name</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={UserIcon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter friend's full name"
            placeholderTextColor={colors.textMuted}
            value={recipientName}
            onChangeText={setRecipientName}
          />
        </View>

        <Text style={[styles.inputLabel, { color: colors.text }]}>Recipient Email Address</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <HugeiconsIcon icon={Mail01Icon} size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter friend's email address"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            value={recipientEmail}
            onChangeText={setRecipientEmail}
          />
        </View>

        <Text style={[styles.inputLabel, { color: colors.text }]}>Personal Note (Optional)</Text>
        <View style={[styles.textAreaBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            placeholder="Write a warm note..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            value={personalNote}
            onChangeText={setPersonalNote}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.88}
          onPress={handleSendGift}
        >
          <Text style={styles.sendText}>Send Course Gift</Text>
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  giftBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  sub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
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
  textAreaBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    height: 100,
  },
  textArea: {
    fontSize: 14,
    textAlignVertical: 'top',
  },
  sendBtn: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 24,
  },
  sendText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
