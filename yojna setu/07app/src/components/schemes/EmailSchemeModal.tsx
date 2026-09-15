import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  ShieldCheck,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { schemeApi } from '../../api/schemeApi';

interface EmailSchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeId: string;
  schemeName: string;
  defaultEmail?: string;
}

export const EmailSchemeModal: React.FC<EmailSchemeModalProps> = ({
  isOpen,
  onClose,
  schemeId,
  schemeName,
  defaultEmail = '',
}) => {
  const { t, i18n } = useTranslation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /*
   * Reset the modal whenever it is opened.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setEmail(defaultEmail || '');
    setError(null);
    setSuccess(false);
    setSuccessMessage(null);
    setLoading(false);
  }, [isOpen, defaultEmail]);

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleSubmit = async () => {
    if (loading || success) {
      return;
    }

    const trimmed = email.trim();

    if (!trimmed) {
      setError(
        t(
          'emailModal.errors.required',
          'Please enter your email address.'
        )
      );
      return;
    }

    if (!validateEmail(trimmed)) {
      setError(
        t(
          'emailModal.errors.invalid',
          'Please enter a valid email address.'
        )
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await schemeApi.emailScheme(
        schemeId,
        trimmed,
        i18n.language || 'en'
      );

      if (res.sent) {
        setSuccess(true);

        setSuccessMessage(
          res.message ||
            t(
              'emailModal.success',
              'Scheme details sent to your email.'
            )
        );
      } else {
        setError(
          res.message ||
            t(
              'emailModal.errors.failed',
              'Failed to send scheme details. Please try again.'
            )
        );
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        t(
          'emailModal.errors.failed',
          'Failed to send scheme details. Please try again later.'
        );

      setError(
        typeof message === 'string'
          ? message
          : JSON.stringify(message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

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
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlayInner}>
          <View style={styles.modalContainer}>
            {/* =====================================================
                MODAL HEADER
            ====================================================== */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Mail
                    size={18}
                    color="#bae6fd"
                    strokeWidth={2}
                  />
                </View>

                <View style={styles.headerTextContainer}>
                  <Text
                    style={styles.headerTitle}
                    numberOfLines={1}
                  >
                    {t(
                      'emailModal.title',
                      'Email Scheme Details'
                    )}
                  </Text>

                  <Text
                    style={styles.headerSubtitle}
                    numberOfLines={2}
                  >
                    {t(
                      'emailModal.subtitle',
                      'Receive official scheme overview in your inbox'
                    )}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleClose}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'common.close',
                  'Close'
                )}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && !loading && styles.closeButtonPressed,
                  loading && styles.disabled,
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
                SCROLLABLE CONTENT
            ====================================================== */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* =================================================
                  SELECTED SCHEME CARD
              ================================================== */}
              <View style={styles.schemeCard}>
                <Text style={styles.schemeLabel}>
                  {t(
                    'emailModal.selectedScheme',
                    'Selected Scheme'
                  )}
                </Text>

                <Text
                  style={styles.schemeName}
                  numberOfLines={3}
                >
                  {schemeName}
                </Text>

                <Text style={styles.schemeId}>
                  ID: {schemeId}
                </Text>
              </View>

              {success ? (
                /* =================================================
                   SUCCESS STATE
                ================================================== */
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <CheckCircle2
                      size={32}
                      color="#059669"
                      strokeWidth={2}
                    />
                  </View>

                  <Text style={styles.successTitle}>
                    {t(
                      'emailModal.sentSuccessTitle',
                      'Scheme Details Sent!'
                    )}
                  </Text>

                  <Text style={styles.successMessage}>
                    {successMessage ||
                      t(
                        'emailModal.success',
                        'Scheme details sent to your email.'
                      )}
                  </Text>

                  <Text style={styles.inboxNote}>
                    {t(
                      'emailModal.checkInboxNote',
                      'Please check your inbox or spam folder in a few moments.'
                    )}
                  </Text>

                  <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.doneButton,
                      pressed && styles.primaryPressed,
                    ]}
                  >
                    <Text style={styles.doneButtonText}>
                      {t('emailModal.closeBtn', 'Done')}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                /* =================================================
                   FORM STATE
                ================================================== */
                <View style={styles.form}>
                  {/* Email label */}
                  <Text style={styles.inputLabel}>
                    {t(
                      'emailModal.emailLabel',
                      'Recipient Email Address'
                    )}
                  </Text>

                  {/* Email input */}
                  <View
                    style={[
                      styles.inputContainer,
                      error && styles.inputContainerError,
                    ]}
                  >
                    <TextInput
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);

                        if (error) {
                          setError(null);
                        }
                      }}
                      editable={!loading}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      placeholder="name@example.com"
                      placeholderTextColor="#94a3b8"
                      returnKeyType="send"
                      onSubmitEditing={handleSubmit}
                      accessibilityLabel={t(
                        'emailModal.emailLabel',
                        'Recipient Email Address'
                      )}
                      style={styles.input}
                    />

                    <Mail
                      size={18}
                      color="#94a3b8"
                      strokeWidth={2}
                    />
                  </View>

                  {/* Error */}
                  {error && (
                    <View style={styles.errorContainer}>
                      <AlertCircle
                        size={15}
                        color="#e11d48"
                        strokeWidth={2}
                      />

                      <Text style={styles.errorText}>
                        {error}
                      </Text>
                    </View>
                  )}

                  {/* =================================================
                      PRIVACY NOTICE
                  ================================================== */}
                  <View style={styles.privacyContainer}>
                    <ShieldCheck
                      size={18}
                      color="#0369a1"
                      strokeWidth={2}
                    />

                    <Text style={styles.privacyText}>
                      {t(
                        'emailModal.privacyNote',
                        'Your email is only used to send this official scheme brief. We never share your data or request passwords/Aadhaar.'
                      )}
                    </Text>
                  </View>

                  {/* =================================================
                      ACTION BUTTONS
                  ================================================== */}
                  <View style={styles.actions}>
                    <Pressable
                      onPress={handleClose}
                      disabled={loading}
                      accessibilityRole="button"
                      accessibilityLabel={t(
                        'emailModal.cancelBtn',
                        'Cancel'
                      )}
                      style={({ pressed }) => [
                        styles.cancelButton,
                        pressed &&
                          !loading &&
                          styles.cancelPressed,
                        loading && styles.disabled,
                      ]}
                    >
                      <Text style={styles.cancelButtonText}>
                        {t(
                          'emailModal.cancelBtn',
                          'Cancel'
                        )}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleSubmit}
                      disabled={loading || !email.trim()}
                      accessibilityRole="button"
                      accessibilityLabel={
                        loading
                          ? t(
                              'emailModal.sending',
                              'Sending...'
                            )
                          : t(
                              'emailModal.sendBtn',
                              'Send Scheme'
                            )
                      }
                      style={({ pressed }) => [
                        styles.sendButton,
                        (!email.trim() || loading) &&
                          styles.sendButtonDisabled,
                        pressed &&
                          email.trim() &&
                          !loading &&
                          styles.primaryPressed,
                      ]}
                    >
                      {loading ? (
                        <>
                          <ActivityIndicator
                            size="small"
                            color="#ffffff"
                          />

                          <Text style={styles.sendButtonText}>
                            {t(
                              'emailModal.sending',
                              'Sending...'
                            )}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Send
                            size={16}
                            color="#ffffff"
                            strokeWidth={2}
                          />

                          <Text style={styles.sendButtonText}>
                            {t(
                              'emailModal.sendBtn',
                              'Send Scheme'
                            )}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  /*
   * Modal background
   */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },

  overlayInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  /*
   * Main modal
   */
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },

  /*
   * Header
   */
  header: {
    minHeight: 68,
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
    backgroundColor: 'rgba(14, 165, 233, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#bae6fd',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
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
   * Scroll content
   */
  scrollView: {
    flexGrow: 0,
  },

  content: {
    padding: 16,
    paddingBottom: 18,
  },

  /*
   * Selected scheme card
   */
  schemeCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  schemeLabel: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 3,
  },

  schemeName: {
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },

  schemeId: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 5,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },

  /*
   * Form
   */
  form: {
    width: '100%',
  },

  inputLabel: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingLeft: 13,
    paddingRight: 13,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputContainerError: {
    borderColor: '#fb7185',
  },

  input: {
    flex: 1,
    minWidth: 0,
    color: '#0f172a',
    fontSize: 14,
    paddingVertical: 11,
    paddingRight: 10,
  },

  /*
   * Error
   */
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 7,
    gap: 6,
  },

  errorText: {
    flex: 1,
    color: '#e11d48',
    fontSize: 11,
    lineHeight: 16,
  },

  /*
   * Privacy notice
   */
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    borderRadius: 9,
    padding: 10,
    marginTop: 16,
    gap: 8,
  },

  privacyText: {
    flex: 1,
    color: '#082f49',
    fontSize: 11,
    lineHeight: 17,
  },

  /*
   * Action buttons
   */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },

  cancelButton: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelPressed: {
    backgroundColor: '#e2e8f0',
  },

  cancelButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },

  sendButton: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#082f49',
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

  sendButtonDisabled: {
    opacity: 0.5,
  },

  sendButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /*
   * Success state
   */
  successContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },

  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  successTitle: {
    color: '#0f172a',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  successMessage: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 5,
  },

  inboxNote: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },

  doneButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#082f49',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  doneButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /*
   * Press / disabled states
   */
  primaryPressed: {
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.5,
  },
});

export default EmailSchemeModal;

