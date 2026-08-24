import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  UserCheck01Icon,
  Notification01Icon,
  Download01Icon,
  HelpCircleIcon,
  Award01Icon,
  Logout01Icon,
  Moon01Icon,
  Sun01Icon,
  GiftIcon,
  ArrowRight01Icon,
  PencilEdit01Icon,
  SparklesIcon,
  Globe02Icon,
  Login01Icon,
} from '@hugeicons/core-free-icons';
import { Header } from '../../components/Header';
import { useApp } from '../../context/AppContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, themeMode, toggleThemeMode, colors, isAuthenticated, logout } = useApp();

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const settingsMenuItems = [
    { id: '1', title: 'Profile Settings', icon: UserCheck01Icon, route: '/profile-settings' },
    { id: '2', title: 'Notifications', icon: Notification01Icon, route: '/notifications' },
    { id: '3', title: 'Downloads', icon: Download01Icon, route: '/downloads' },
    { id: '4', title: 'Help & Support', icon: HelpCircleIcon, route: '/help-support' },
    { id: '5', title: 'Premium', icon: SparklesIcon, highlight: true, route: '/premium' },
    { id: '6', title: 'Theme', icon: themeMode === 'dark' ? Moon01Icon : Sun01Icon, isThemeToggle: true, badge: themeMode.toUpperCase() },
    { id: '7', title: 'Certifications', icon: Award01Icon, route: '/my-courses' },
    { id: '8', title: 'Gift Course', icon: GiftIcon, route: '/gift-course' },
    ...(isAuthenticated
      ? [{ id: '9', title: 'Logout', icon: Logout01Icon, isLogout: true }]
      : [{ id: '9', title: 'Login / Register', icon: Login01Icon, isLogin: true, route: '/auth/login' }]),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topGreetingHeader}>
        <View style={styles.greetingCol}>
          <Text style={[styles.greetingTitle, { color: colors.text }]}>{userProfile.name}</Text>
          <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>{userProfile.greeting}</Text>
        </View>
        <Header showCurrency={false} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' }}
            style={styles.cardCover}
          />
          <View style={styles.userInfoRow}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: userProfile.avatar }} style={[styles.avatar, { borderColor: colors.primary }]} />
              <TouchableOpacity
                style={[styles.editAvatarBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/profile-settings')}
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={12} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.userMetaCol}>
              <Text style={[styles.userName, { color: colors.text }]}>{userProfile.name}</Text>
              <View style={styles.userSubRow}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>Joined {userProfile.joinedYear}</Text>
                <HugeiconsIcon icon={Globe02Icon} size={12} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{userProfile.country}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* General Settings Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>General Settings</Text>

        <View style={styles.menuContainer}>
          {settingsMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  item.highlight && { borderColor: colors.primary, backgroundColor: 'rgba(0, 102, 255, 0.08)' },
                ]}
                onPress={() => {
                  if (item.isLogout) {
                    handleLogoutPress();
                  } else if (item.isThemeToggle) {
                    toggleThemeMode();
                  } else if (item.route) {
                    router.push(item.route as any);
                  }
                }}
              >
                <View style={styles.menuItemLeft}>
                  <HugeiconsIcon
                    icon={IconComponent}
                    size={20}
                    color={
                      item.isLogout
                        ? colors.error
                        : item.highlight || item.isLogin
                        ? colors.primary
                        : colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: colors.text },
                      item.isLogout && { color: colors.error },
                      (item.highlight || item.isLogin) && { color: colors.primary, fontWeight: 'bold' },
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>

                {item.badge ? (
                  <View style={[styles.badgeBox, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : (
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGreetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
  },
  greetingCol: {
    marginTop: 8,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  greetingSub: {
    fontSize: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  userCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  cardCover: {
    width: '100%',
    height: 85,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: -30,
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userMetaCol: {
    flex: 1,
    marginTop: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 10,
  },
  menuContainer: {
    marginHorizontal: 16,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
