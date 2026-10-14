import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon, Tick01Icon } from '@hugeicons/core-free-icons';
import { SUPPORTED_COUNTRIES, CountryItem } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export default function ChooseCountryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>();

  const insets = useSafeAreaInsets();
  const { colors, signup } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('NG');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCountries = SUPPORTED_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery)
  );

  const handleProceed = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const countryObj = SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountry);
    const countryName = countryObj ? countryObj.name : 'Nigeria';

    try {
      const success = await signup({
        fullName: params.fullName || 'New User',
        email: params.email || 'user@example.com',
        phone: params.phone || '',
        password: params.password || 'password123',
        country: countryName,
      });

      if (success) {
        router.replace('/(tabs)');
      } else {
        setErrorMsg('Failed to complete registration');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Handle bar decor */}
      <View style={styles.topHandleRow}>
        <View style={[styles.handleBar, { backgroundColor: colors.textMuted }]} />
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Choose your country</Text>

      {errorMsg ? (
        <View style={[styles.errorBanner, { backgroundColor: '#FF4D4D20', borderColor: '#FF4D4D' }]}>
          <Text style={[styles.errorText, { color: '#FF4D4D' }]}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <HugeiconsIcon icon={Search01Icon} size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Choose your country"
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Country List */}
      <FlatList
        data={filteredCountries}
        keyExtractor={(item) => item.code}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: CountryItem }) => {
          const isSelected = selectedCountry === item.code;
          return (
            <TouchableOpacity
              style={[
                styles.countryCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isSelected && { borderColor: colors.primary, backgroundColor: 'rgba(0, 102, 255, 0.06)' },
              ]}
              activeOpacity={0.8}
              onPress={() => setSelectedCountry(item.code)}
            >
              <View style={styles.countryLeft}>
                <Text style={styles.flagIcon}>{item.flag}</Text>
                <Text style={[styles.countryName, { color: colors.text }]}>{item.name}</Text>
              </View>

              <View style={styles.countryRight}>
                <Text style={[styles.dialCode, { color: colors.textSecondary }]}>{item.dialCode}</Text>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                    <HugeiconsIcon icon={Tick01Icon} size={12} color="#FFF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Sticky Bottom Proceed Button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.proceedBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
          activeOpacity={0.88}
          onPress={handleProceed}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.proceedText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 14,
  },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    height: 50,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  countryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  countryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagIcon: {
    fontSize: 22,
  },
  countryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  countryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dialCode: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  proceedBtn: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
  },
  proceedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
