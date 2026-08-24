import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Download01Icon, PlayIcon, Delete02Icon } from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

export default function DownloadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useApp();

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const downloadedLessons = [
    { id: 'dl1', title: 'Module 1: What is a Virtual Assistant', duration: '12:04 MB', size: '45.2 MB' },
    { id: 'dl2', title: 'Module 2: Calendar & Inbox Zero Management', duration: '18:15 MB', size: '68.4 MB' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Offline Downloads</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {downloadedLessons.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceLight }]}>
              <HugeiconsIcon icon={Download01Icon} size={22} color={colors.primary} />
            </View>

            <View style={styles.infoCol}>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.sizeText, { color: colors.textSecondary }]}>{item.size}</Text>
            </View>

            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/player/l1')}
            >
              <HugeiconsIcon icon={PlayIcon} size={16} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn}>
              <HugeiconsIcon icon={Delete02Icon} size={18} color={colors.error} />
            </TouchableOpacity>
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
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  sizeText: {
    fontSize: 11,
    marginTop: 2,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: 4,
  },
});
