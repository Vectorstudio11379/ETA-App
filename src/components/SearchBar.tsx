import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon, FilterIcon } from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search for your preferred course',
  onFilterPress,
}) => {
  const { colors } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <HugeiconsIcon icon={Search01Icon} size={18} color={colors.textMuted} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
      <TouchableOpacity style={styles.filterBtn} onPress={onFilterPress}>
        <HugeiconsIcon icon={FilterIcon} size={18} color={colors.secondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  filterBtn: {
    padding: 6,
  },
});
