import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Award, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../constants/theme';

interface CertificatePreviewProps {
  studentName?: string;
  courseTitle?: string;
  instructorName?: string;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  studentName = 'STUDENT NAME',
  courseTitle = 'Complete AI & Tech Engineering Track',
  instructorName = 'Alex Mercer & ETA Academic Board',
}) => {
  return (
    <View style={styles.certCard}>
      <View style={styles.headerRow}>
        <Award size={18} color={Colors.primary} />
        <Text style={styles.brandTitle}>Express Tech Academy</Text>
      </View>

      <Text style={styles.certTitle}>CERTIFICATE OF COMPLETION</Text>
      <Text style={styles.subText}>This certificate is proudly presented to</Text>

      <Text style={styles.studentName}>{studentName}</Text>
      <View style={styles.divider} />

      <Text style={styles.subText}>In Recognition of Completing</Text>
      <Text style={styles.courseTitle}>{courseTitle}</Text>

      <View style={styles.footerRow}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>Date of Completion</Text>
          <Text style={styles.footerValue}>Date</Text>
        </View>

        <View style={styles.sealBox}>
          <ShieldCheck size={28} color={Colors.primary} />
        </View>

        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>Instructor</Text>
          <Text style={styles.footerValue}>{instructorName}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  certCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 3,
    borderColor: '#D4AF37',
    alignItems: 'center',
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  certTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#111',
    marginTop: 4,
  },
  subText: {
    fontSize: 10,
    color: '#666',
    marginVertical: 2,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1.5,
    marginVertical: 6,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: '#DDD',
    marginBottom: 6,
  },
  courseTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  footerCol: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 8,
    color: '#777',
  },
  footerValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#222',
  },
  sealBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
