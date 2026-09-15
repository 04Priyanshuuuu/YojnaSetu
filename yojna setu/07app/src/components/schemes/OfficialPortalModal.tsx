import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ExternalLink,
  AlertTriangle,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface OfficialPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  officialUrl?: string | null;
  schemeName?: string;
}

export const OfficialPortalModal: React.FC<
  OfficialPortalModalProps
> = ({
  isOpen,
  onClose,
  officialUrl,
  schemeName,
}) => {
  const { t } = useTranslation();

  /*
   * Only allow actual HTTP/HTTPS URLs.
   * UNKNOWN and NOT_APPLICABLE are treated as invalid,
   * exactly like the web implementation.
   */
  const validUrl =
    officialUrl &&
    officialUrl !== 'UNKNOWN' &&
    officialUrl !== 'NOT_APPLICABLE' &&
    /^https?:\/\//i.test(officialUrl.trim())
      ? officialUrl.trim()
      : null;

  const handleContinue = async () => {
    if (!validUrl) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(validUrl);

      if (supported) {
        await Linking.openURL(validUrl);
      }
    } catch {
      // Keep the modal behavior safe if the URL cannot be opened.
    } finally {
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* =====================================================
              HEADER
          ====================================================== */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <ExternalLink
                  size={18}
                  color="#fcd34d"
                  strokeWidth={2}
                />
              </View>

              <Text
                style={styles.headerTitle}
                numberOfLines={2}
              >
                {t('portalModal.title')}
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={t(
                'common.close',
                'Close'
              )}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <X
                size={20}
                color="#cbd5e1"
                strokeWidth={2}
              />
            </Pressable>
          </View>

          {/* =====================================================
              CONTENT
          ====================================================== */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Warning */}
            <View style={styles.warningContainer}>
              <AlertTriangle
                size={21}
                color="#d97706"
                strokeWidth={2}
              />

              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>
                  {t('portalModal.warning')}
                </Text>

                <Text style={styles.warningDescription}>
                  {t('portalModal.disclaimer')}
                </Text>
              </View>
            </View>

            {/* Selected Scheme */}
            {schemeName ? (
              <View style={styles.schemeContainer}>
                <Text style={styles.schemeLabel}>
                  {t('portalModal.selectedScheme')}
                </Text>

                <Text style={styles.schemeName}>
                  {schemeName}
                </Text>
              </View>
            ) : null}

            {/* =================================================
                VERIFIED URL / PENDING URL
            ================================================== */}
            {validUrl ? (
              <View style={styles.verifiedContainer}>
                <ShieldCheck
                  size={18}
                  color="#0284c7"
                  strokeWidth={2}
                />

                <View style={styles.urlContent}>
                  <Text style={styles.verifiedLabel}>
                    {t('portalModal.verifiedUrl')}
                  </Text>

                  <Text
                    style={styles.urlText}
                    numberOfLines={3}
                    ellipsizeMode="middle"
                  >
                    {validUrl}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.pendingContainer}>
                <Text style={styles.pendingTitle}>
                  {t(
                    'portalModal.pendingTitle',
                    'Official Application Link Pending Verification'
                  )}
                </Text>

                <Text style={styles.pendingDescription}>
                  {t('portalModal.pendingUrl')}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* =====================================================
              FOOTER ACTIONS
          ====================================================== */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={t(
                'portalModal.cancel'
              )}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>
                {t('portalModal.cancel')}
              </Text>
            </Pressable>

            {validUrl ? (
              <Pressable
                onPress={handleContinue}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'portalModal.continue'
                )}
                style={({ pressed }) => [
                  styles.continueButton,
                  pressed && styles.continueButtonPressed,
                ]}
              >
                <Text style={styles.continueButtonText}>
                  {t('portalModal.continue')}
                </Text>

                <ExternalLink
                  size={15}
                  color="#ffffff"
                  strokeWidth={2}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  /*
   * ============================================================
   * MODAL
   * ============================================================
   */

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.20,
    shadowRadius: 20,
    elevation: 12,
  },

  /*
   * ============================================================
   * HEADER
   * ============================================================
   */

  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#082f49',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(245, 158, 11, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  closeButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },

  /*
   * ============================================================
   * CONTENT
   * ============================================================
   */

  scrollView: {
    flexGrow: 0,
  },

  content: {
    padding: 16,
    gap: 14,
  },

  /*
   * Warning
   */

  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 14,
    gap: 11,
  },

  warningContent: {
    flex: 1,
    minWidth: 0,
  },

  warningTitle: {
    color: '#451a03',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  warningDescription: {
    color: '#92400e',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  /*
   * Selected scheme
   */

  schemeContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },

  schemeLabel: {
    color: '#64748b',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  schemeName: {
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    marginTop: 3,
  },

  /*
   * Verified URL
   */

  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 12,
    gap: 9,
  },

  urlContent: {
    flex: 1,
    minWidth: 0,
  },

  verifiedLabel: {
    color: '#0369a1',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },

  urlText: {
    color: '#082f49',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2,
    fontFamily: 'monospace',
  },

  /*
   * Pending URL
   */

  pendingContainer: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 12,
  },

  pendingTitle: {
    color: '#9f1239',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },

  pendingDescription: {
    color: '#be123c',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  /*
   * ============================================================
   * FOOTER
   * ============================================================
   */

  footer: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 9,
  },

  cancelButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonPressed: {
    backgroundColor: '#e2e8f0',
  },

  cancelButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },

  continueButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: '#0369a1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },

  continueButtonPressed: {
    backgroundColor: '#082f49',
  },

  continueButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OfficialPortalModal;

