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
import { Notification01Icon, RefreshIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notifications, colors } = useApp();

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const dateGroups = Array.from(new Set(notifications.map((n) => n.dateGroup)));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Safe Area Top Padding */}
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>

        <TouchableOpacity style={styles.iconBtn}>
          <HugeiconsIcon icon={RefreshIcon} size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {dateGroups.map((dateGroup) => {
          const groupItems = notifications.filter((n) => n.dateGroup === dateGroup);
          return (
            <View key={dateGroup} style={styles.groupSection}>
              <Text style={[styles.groupHeaderTitle, { color: colors.textSecondary }]}>{dateGroup}</Text>

              {groupItems.map((item) => (
                <View
                  key={item.id}
                  style={[styles.notificationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.bellIconBox, { backgroundColor: colors.surfaceLight }]}>
                    <HugeiconsIcon icon={Notification01Icon} size={20} color={colors.primary} />
                  </View>

                  <View style={styles.textCol}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.notifTitle, { color: colors.text }]}>{item.title}</Text>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push('/(tabs)/my-courses')}
                      >
                        <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Goto My Courses</Text>
                        <HugeiconsIcon icon={ArrowRight01Icon} size={12} color={colors.secondary} />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>{item.message}</Text>
                    <Text style={[styles.timestampText, { color: colors.textMuted }]}>
                      {item.timeAgo} | {item.exactTime}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          );
        })}
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
  iconBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  groupSection: {
    marginTop: 10,
  },
  groupHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  bellIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  notifMessage: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 10,
  },
});
