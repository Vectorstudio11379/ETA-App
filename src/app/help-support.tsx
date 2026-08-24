import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { HelpCircleIcon, Mail01Icon, CallIcon, WhatsappIcon } from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useApp();

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const faqs = [
    { q: 'How do I download course certificates?', a: 'Once you reach 100% completion on all video lessons in a course, your certificate will automatically generate under My Courses → Certificate tab.' },
    { q: 'Can I access courses offline?', a: 'Yes! Tap the download icon next to any lesson video to save it for offline playback inside the ETA app.' },
    { q: 'What payment options are supported?', a: 'We accept local debit cards, bank transfers (Paystack / Flutterwave), and Google Pay.' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Support Channels */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Contact Support</Text>

        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => Linking.openURL('https://wa.me/2348000000000?text=Hello%20AQskill%20Support')}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 211, 102, 0.12)' }]}>
            <HugeiconsIcon icon={WhatsappIcon} size={22} color="#25D366" />
          </View>
          <View style={styles.contactTextCol}>
            <Text style={[styles.contactName, { color: colors.text }]}>WhatsApp Live Chat</Text>
            <Text style={[styles.contactSub, { color: colors.textSecondary }]}>Chat with our support team 24/7</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => Linking.openURL('mailto:support@aqskill.com')}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceLight }]}>
            <HugeiconsIcon icon={Mail01Icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.contactTextCol}>
            <Text style={[styles.contactName, { color: colors.text }]}>Email Support</Text>
            <Text style={[styles.contactSub, { color: colors.textSecondary }]}>support@aqskill.com</Text>
          </View>
        </TouchableOpacity>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>Frequently Asked Questions</Text>
        {faqs.map((faq, idx) => (
          <View key={idx} style={[styles.faqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.q}</Text>
            <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.a}</Text>
          </View>
        ))}
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextCol: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  contactSub: {
    fontSize: 11,
    marginTop: 2,
  },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 17,
  },
});
