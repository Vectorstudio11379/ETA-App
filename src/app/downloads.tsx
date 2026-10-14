import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Download01Icon, PlayIcon, Delete02Icon, BookOpen01Icon } from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';
import { storageService, OfflineDownloadItem } from '../services/storage';

export default function DownloadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useApp();

  const [downloadedLessons, setDownloadedLessons] = useState<OfflineDownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const loadDownloads = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await storageService.getOfflineDownloads();
      setDownloadedLessons(items);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const handleDelete = async (lessonId: string, title: string) => {
    Alert.alert(
      'Remove Download',
      `Remove "${title}" from your offline downloads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await storageService.removeOfflineDownload(lessonId);
            setDownloadedLessons((prev) => prev.filter((x) => x.id !== lessonId));
          },
        },
      ]
    );
  };

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
        {downloadedLessons.length === 0 && !isLoading ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: 'rgba(255, 69, 0, 0.12)' }]}>
              <HugeiconsIcon icon={Download01Icon} size={36} color="#FF5500" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Offline Downloads</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap the download button inside any video lesson to save it for secure offline viewing inside the ETA App.
            </Text>
            <TouchableOpacity
              style={[styles.exploreBtn, { backgroundColor: '#FF5500' }]}
              onPress={() => router.push('/(tabs)')}
            >
              <HugeiconsIcon icon={BookOpen01Icon} size={18} color="#FFF" />
              <Text style={styles.exploreBtnText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        ) : (
          downloadedLessons.map((item) => (
            <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 69, 0, 0.12)' }]}>
                <HugeiconsIcon icon={Download01Icon} size={22} color="#FF5500" />
              </View>

              <View style={styles.infoCol}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                  {item.lessonTitle}
                </Text>
                <Text style={[styles.courseName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.courseTitle || 'Express Tech Academy Track'}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.sizeText, { color: colors.textSecondary }]}>
                    {item.sizeDisplay || 'In-App Offline'}
                  </Text>
                  {item.duration ? (
                    <Text style={[styles.sizeText, { color: colors.textSecondary }]}>
                      {' '}&bull; {item.duration}
                    </Text>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.playBtn, { backgroundColor: '#FF5500' }]}
                onPress={() => router.push(`/player/${item.id}` as any)}
              >
                <HugeiconsIcon icon={PlayIcon} size={16} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.lessonTitle)}
              >
                <HugeiconsIcon icon={Delete02Icon} size={18} color={colors.error || '#EF4444'} />
              </TouchableOpacity>
            </View>
          ))
        )}
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
    lineHeight: 18,
  },
  courseName: {
    fontSize: 11,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  sizeText: {
    fontSize: 11,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    marginTop: 40,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
