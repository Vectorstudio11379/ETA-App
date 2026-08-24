import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/SearchBar';
import { MOCK_INSTRUCTORS, Instructor } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export default function InstructorsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const statusBarPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const filteredInstructors = MOCK_INSTRUCTORS.filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Safe Area Padding */}
      <View style={[styles.headerRow, { paddingTop: statusBarPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search Instructors"
        />

        <View style={styles.listContainer}>
          {filteredInstructors.map((inst: Instructor) => (
            <TouchableOpacity
              key={inst.id}
              style={[styles.instructorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.88}
              onPress={() =>
                router.push({
                  pathname: '/instructor/[id]',
                  params: { id: inst.id },
                })
              }
            >
              <Image source={{ uri: inst.avatar }} style={styles.avatar} />

              <View style={styles.infoCol}>
                <Text style={[styles.name, { color: colors.text }]}>{inst.name}</Text>
                <Text style={[styles.role, { color: colors.textSecondary }]}>{inst.role}</Text>
                <Text style={[styles.joinedText, { color: colors.textMuted }]}>
                  Joined Since {inst.joinedYear}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
  scrollContent: {
    paddingBottom: 40,
  },
  listContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 12,
  },
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  role: {
    fontSize: 12,
    marginBottom: 4,
  },
  joinedText: {
    fontSize: 11,
  },
});
