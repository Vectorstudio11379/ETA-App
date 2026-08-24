import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { TickDouble01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { toastMessage, colors } = useApp();

  if (!toastMessage) return null;

  const topOffset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 10
    : Math.max(insets.top, 16);

  const isSuccess =
    toastMessage.toLowerCase().includes('added') ||
    toastMessage.toLowerCase().includes('successful') ||
    toastMessage.toLowerCase().includes('switched');

  return (
    <View style={[styles.toastContainer, { top: topOffset }]}>
      <View
        style={[
          styles.toastCard,
          { backgroundColor: isSuccess ? '#10B981' : colors.primary },
        ]}
      >
        <HugeiconsIcon
          icon={isSuccess ? TickDouble01Icon : InformationCircleIcon}
          size={18}
          color="#FFF"
        />
        <Text style={styles.toastText}>{toastMessage}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
