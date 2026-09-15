import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bookmark, LogIn, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../context/AuthContext';
import { savedSchemesApi } from '../../api/savedSchemesApi';

interface SaveSchemeButtonProps {
  schemeId: string;
  initialIsSaved?: boolean;
  onToggle?: (isSaved: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const SaveSchemeButton: React.FC<SaveSchemeButtonProps> = ({
  schemeId,
  initialIsSaved,
  onToggle,
  size = 'md',
  showLabel = true,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [isSaved, setIsSaved] = useState<boolean>(
    initialIsSaved ?? false
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  /*
   * Keep local saved state synchronized with the value supplied
   * by the parent component.
   */
  useEffect(() => {
    if (initialIsSaved !== undefined) {
      setIsSaved(initialIsSaved);
    }
  }, [initialIsSaved]);

  /*
   * If the parent does not provide initialIsSaved, check the
   * actual saved status from the existing backend API.
   */
  useEffect(() => {
    if (
      initialIsSaved !== undefined ||
      !isAuthenticated ||
      !schemeId
    ) {
      return;
    }

    let isMounted = true;

    savedSchemesApi
      .checkSavedStatus(schemeId)
      .then((res) => {
        if (isMounted) {
          setIsSaved(res.is_saved);
        }
      })
      .catch(() => {
        // Keep the current local state if the status check fails.
      });

    return () => {
      isMounted = false;
    };
  }, [schemeId, isAuthenticated, initialIsSaved]);

  const handleToggle = async () => {
    /*
     * Native Pressable does not need preventDefault/stopPropagation
     * like the web button did.
     */
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (loading) {
      return;
    }

    const previousState = isSaved;
    const nextState = !previousState;

    // Optimistic UI update.
    setIsSaved(nextState);
    setLoading(true);

    try {
      if (nextState) {
        await savedSchemesApi.saveScheme(schemeId);
      } else {
        await savedSchemesApi.removeSavedScheme(schemeId);
      }

      onToggle?.(nextState);
    } catch (error) {
      // Revert optimistic update if API operation fails.
      setIsSaved(previousState);
    } finally {
      setLoading(false);
    }
  };

  const sizeConfig = {
    sm: {
      minHeight: 34,
      horizontalPadding: 10,
      iconSize: 14,
      fontSize: 12,
      gap: 4,
      borderRadius: 8,
    },
    md: {
      minHeight: 40,
      horizontalPadding: 14,
      iconSize: 16,
      fontSize: 14,
      gap: 6,
      borderRadius: 9,
    },
    lg: {
      minHeight: 46,
      horizontalPadding: 20,
      iconSize: 20,
      fontSize: 16,
      gap: 8,
      borderRadius: 10,
    },
  }[size];

  const label = isSaved
    ? t('savedSchemes.saved', 'Saved')
    : t('savedSchemes.saveScheme', 'Save Scheme');

  const accessibilityLabel = isSaved
    ? t(
        'savedSchemes.removeSavedTooltip',
        'Remove from Saved Schemes'
      )
    : t(
        'savedSchemes.saveSchemeTooltip',
        'Save Scheme for Later'
      );

  return (
    <>
      <Pressable
        onPress={handleToggle}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          disabled: loading,
          selected: isSaved,
        }}
        style={({ pressed }) => [
          styles.button,
          {
            minHeight: sizeConfig.minHeight,
            paddingHorizontal: sizeConfig.horizontalPadding,
            borderRadius: sizeConfig.borderRadius,
            gap: sizeConfig.gap,
          },
          isSaved ? styles.savedButton : styles.unsavedButton,
          pressed && !loading && styles.pressedButton,
          loading && styles.disabledButton,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isSaved ? '#f59e0b' : '#f59e0b'}
          />
        ) : (
          <Bookmark
            size={sizeConfig.iconSize}
            color="#f59e0b"
            fill={isSaved ? '#f59e0b' : 'none'}
            strokeWidth={2}
          />
        )}

        {showLabel && (
          <Text
            style={[
              styles.buttonText,
              {
                fontSize: sizeConfig.fontSize,
              },
              isSaved
                ? styles.savedButtonText
                : styles.unsavedButtonText,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </Pressable>

      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Bookmark
                  size={22}
                  color="#f59e0b"
                  fill="none"
                  strokeWidth={2}
                />
              </View>

              <Pressable
                onPress={() => setShowLoginModal(false)}
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
                  size={22}
                  color="#94a3b8"
                  strokeWidth={2}
                />
              </Pressable>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {t(
                  'savedSchemes.saveToAccount',
                  'Save Scheme to Account'
                )}
              </Text>

              <Text style={styles.modalDescription}>
                {t(
                  'savedSchemes.saveModalDesc',
                  'Please login to save schemes to your account. You can review saved schemes anytime from your dashboard.'
                )}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowLoginModal(false);
                  router.push('/(auth)/login');
                }}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'auth.loginNow',
                  'Login Now'
                )}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                ]}
              >
                <LogIn
                  size={18}
                  color="#ffffff"
                  strokeWidth={2}
                />

                <Text style={styles.loginButtonText}>
                  {t('auth.loginNow', 'Login Now')}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowLoginModal(false)}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'common.cancel',
                  'Cancel'
                )}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.cancelButtonPressed,
                ]}
              >
                <Text style={styles.cancelButtonText}>
                  {t('common.cancel', 'Cancel')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  savedButton: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },

  unsavedButton: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },

  buttonText: {
    fontWeight: '700',
  },

  savedButtonText: {
    color: '#be123c',
  },

  unsavedButtonText: {
    color: '#334155',
  },

  pressedButton: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  disabledButton: {
    opacity: 0.6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  modalIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonPressed: {
    backgroundColor: '#f1f5f9',
  },

  modalContent: {
    marginTop: 16,
  },

  modalTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    color: '#0f172a',
  },

  modalDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },

  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
  },

  loginButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: '#0c4a6e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  loginButtonPressed: {
    opacity: 0.8,
  },

  loginButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  cancelButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonPressed: {
    backgroundColor: '#e2e8f0',
  },

  cancelButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SaveSchemeButton;

