import React from 'react';
import { TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { WhatsappIcon } from '@hugeicons/core-free-icons';

export const FloatingWhatsApp: React.FC = () => {
  const handlePress = () => {
    Linking.openURL('https://wa.me/2348000000000?text=Hello%20Express%20Tech%20Academy%20Support');
  };

  return (
    <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={handlePress}>
      <HugeiconsIcon icon={WhatsappIcon} size={26} color="#FFF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 99,
  },
});
