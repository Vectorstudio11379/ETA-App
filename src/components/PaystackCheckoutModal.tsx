import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, SecurityCheckIcon } from '@hugeicons/core-free-icons';
import { useApp } from '../context/AppContext';

interface PaystackCheckoutModalProps {
  visible: boolean;
  authorizationUrl: string | null;
  reference: string | null;
  orderId: number | null;
  onClose: () => void;
  onSuccess: (reference: string, orderId: number) => void;
}

export const PaystackCheckoutModal: React.FC<PaystackCheckoutModalProps> = ({
  visible,
  authorizationUrl,
  reference,
  orderId,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useApp();
  const [isVerifying, setIsVerifying] = useState(false);

  if (!visible || !authorizationUrl) {
    return null;
  }

  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 6
    : Math.max(insets.top, 12);

  const triggerSuccess = (detectedRef?: string, detectedOrder?: number) => {
    if (isVerifying) return;
    setIsVerifying(true);
    const finalRef = detectedRef || reference || '';
    const finalOrder = detectedOrder || orderId || 0;
    onSuccess(finalRef, finalOrder);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    if (!url) return;

    // Detect Paystack redirect / completion triggers
    const isPaymentComplete =
      url.includes('payment-complete') ||
      url.includes('payment-success') ||
      url.includes('paystack-callback') ||
      url.startsWith('expressteck://payment-success');

    if (isPaymentComplete) {
      try {
        const urlObj = new URL(url);
        const refParam =
          urlObj.searchParams.get('reference') ||
          urlObj.searchParams.get('ref') ||
          urlObj.searchParams.get('trxref') ||
          reference ||
          '';
        const orderParam =
          parseInt(urlObj.searchParams.get('order_id') || '0', 10) || orderId || 0;
        triggerSuccess(refParam, orderParam);
      } catch (e) {
        triggerSuccess();
      }
    } else if (url.includes('close') || url.includes('cancel')) {
      onClose();
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && (data.status === 'success' || data.event === 'successful')) {
        const refParam = data.reference || data.trxref || reference || '';
        const orderParam = data.order_id || orderId || 0;
        triggerSuccess(refParam, orderParam);
      } else if (data && (data.status === 'close' || data.event === 'close')) {
        onClose();
      }
    } catch (e) {
      // non-JSON message
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;
    if (url && (url.startsWith('expressteck://payment-success') || url.startsWith('expressteck://'))) {
      try {
        const urlObj = new URL(url);
        const refParam =
          urlObj.searchParams.get('reference') ||
          urlObj.searchParams.get('ref') ||
          reference ||
          '';
        const orderParam =
          parseInt(urlObj.searchParams.get('order_id') || '0', 10) || orderId || 0;
        triggerSuccess(refParam, orderParam);
      } catch (e) {
        triggerSuccess();
      }
      return false;
    }
    return true;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Safe Area Header Bar */}
        <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.shieldBadge, { backgroundColor: colors.accentLight }]}>
              <HugeiconsIcon icon={SecurityCheckIcon} size={18} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Secure Paystack Checkout</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Encrypted 256-bit Connection</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Verification Overlay while processing */}
        {isVerifying ? (
          <View style={[styles.verifyingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.verifyingTitle, { color: colors.text }]}>Confirming Payment...</Text>
            <Text style={[styles.verifyingSub, { color: colors.textSecondary }]}>
              Please wait while your course enrollment is finalized.
            </Text>
          </View>
        ) : (
          <WebView
            source={{ uri: authorizationUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading secure checkout...</Text>
              </View>
            )}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            style={styles.webview}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  verifyingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  verifyingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  verifyingSub: {
    fontSize: 13,
    textAlign: 'center',
  },
});
