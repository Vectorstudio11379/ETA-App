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
  const { colors, siteInfo } = useApp();

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const contactEmail = siteInfo?.contactEmail || 'support@expressteck.tech';
  const faqs = (siteInfo?.faqs && siteInfo.faqs.length > 0) ? siteInfo.faqs : [
    { q: 'After payment is confirmed, how do I begin?', a: 'Sign in to your account and open My Learning to begin immediately.' },
    { q: 'What format are the courses?', a: 'Courses are self-paced video classes. Any live-session information is shared inside the relevant course.' },
    { q: 'When does my certificate become available?', a: 'After completing all required lessons and activities, your certificate becomes available from your learning dashboard.' },
    { q: 'How do Course Bundles work?', a: 'Course Bundles combine related masterclasses at a huge discount (up to 57% off) with immediate access to all courses.' },
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
        {/* Support SLA Banner */}
        <View style={[styles.slaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.slaTitle, { color: colors.primary }]}>Dedicated Student Support</Text>
          <Text style={[styles.slaSub, { color: colors.textSecondary }]}>
            Average Response Time: {'< 24 Hours'} • 1-on-1 Academic & Technical Mentorship
          </Text>
        </View>

        {/* Support Channels */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Contact Support</Text>

        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => Linking.openURL('https://wa.me/2348000000000?text=Hello%20Express%20Tech%20Academy%20Support')}
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
          onPress={() => Linking.openURL(`mailto:${contactEmail}`)}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceLight }]}>
            <HugeiconsIcon icon={Mail01Icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.contactTextCol}>
            <Text style={[styles.contactName, { color: colors.text }]}>Email Support</Text>
            <Text style={[styles.contactSub, { color: colors.textSecondary }]}>{contactEmail}</Text>
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
  slaCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 6,
  },
  slaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  slaSub: {
    fontSize: 12,
    lineHeight: 16,
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
