import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { savedSchemesApi, SavedSchemeItem } from '../../api/savedSchemesApi';
import { colors, radius, spacing, typography } from '../../constants/theme';

type EmailStatus = {
  loading: boolean;
  message: string;
  success?: boolean;
};

const SavedSchemesScreen: React.FC = () => {
  const router = useRouter();

  const [savedItems, setSavedItems] = useState<SavedSchemeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [emailStatus, setEmailStatus] = useState<
    Record<string, EmailStatus>
  >({});

  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [selectedSchemeName, setSelectedSchemeName] = useState('');
  const [selectedOfficialUrl, setSelectedOfficialUrl] = useState<string | null>(
    null
  );

  const fetchSavedSchemes = useCallback(async () => {
    try {
      setLoading(true);

      const res = await savedSchemesApi.listSavedSchemes();

      setSavedItems(res?.items || []);
    } catch (error) {
      console.error('Failed to load saved schemes:', error);

      Alert.alert(
        'Unable to load saved schemes',
        'Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedSchemes();
  }, [fetchSavedSchemes]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const res = await savedSchemesApi.listSavedSchemes();

      setSavedItems(res?.items || []);
    } catch (error) {
      console.error('Failed to refresh saved schemes:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemove = async (schemeId: string) => {
    const previousItems = savedItems;

    // Optimistic UI update
    setSavedItems((prev) =>
      prev.filter((item) => item.scheme_id !== schemeId)
    );

    try {
      await savedSchemesApi.removeSavedScheme(schemeId);
    } catch (error) {
      console.error('Failed to remove saved scheme:', error);

      // Restore previous state
      setSavedItems(previousItems);

      Alert.alert(
        'Could not remove',
        'The scheme could not be removed from your saved list.'
      );
    }
  };

  const confirmRemove = (schemeId: string, schemeName: string) => {
    Alert.alert(
      'Remove saved scheme?',
      `Are you sure you want to remove "${schemeName}" from your saved schemes?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => handleRemove(schemeId),
        },
      ]
    );
  };

  const handleEmailScheme = async (schemeId: string) => {
    setEmailStatus((prev) => ({
      ...prev,
      [schemeId]: {
        loading: true,
        message: 'Sending email...',
      },
    }));

    try {
      const res = await savedSchemesApi.emailScheme(schemeId);

      setEmailStatus((prev) => ({
        ...prev,
        [schemeId]: {
          loading: false,
          message: res?.message || 'Email sent successfully.',
          success: res?.sent,
        },
      }));

      Alert.alert(
        res?.sent ? 'Email sent' : 'Email status',
        res?.message || 'The scheme information has been processed.'
      );
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.detail ||
        'Email delivery service is currently unavailable.';

      setEmailStatus((prev) => ({
        ...prev,
        [schemeId]: {
          loading: false,
          message: errorMsg,
          success: false,
        },
      }));

      Alert.alert('Email failed', errorMsg);
    }
  };

  const handleOpenPortal = (
    schemeName: string,
    url?: string | null
  ) => {
    setSelectedSchemeName(schemeName);
    setSelectedOfficialUrl(url || null);
    setPortalModalOpen(true);
  };

  const openOfficialPortal = async () => {
    if (!selectedOfficialUrl) {
      Alert.alert(
        'Official portal unavailable',
        'The official portal URL is not available for this scheme.'
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(selectedOfficialUrl);

      if (!supported) {
        Alert.alert(
          'Cannot open portal',
          'This official portal link cannot be opened on your device.'
        );
        return;
      }

      await Linking.openURL(selectedOfficialUrl);
      setPortalModalOpen(false);
    } catch (error) {
      console.error('Failed to open official portal:', error);

      Alert.alert(
        'Unable to open portal',
        'Please try opening the official portal again.'
      );
    }
  };

  const handleCompare = (schemeId: string) => {
    router.push({
      pathname: '/compare',
      params: {
        schemeId,
      },
    });
  };

  const handleViewDetails = (schemeId: string) => {
    router.push({
      pathname: '/schemes/[id]',
      params: {
        id: schemeId,
      },
    });
  };

  const renderHeader = () => (
    <View style={styles.hero}>
      <View style={styles.heroBadge}>
        <Ionicons
          name="bookmark"
          size={14}
          color={colors.rose || '#F43F5E'}
        />

        <Text style={styles.heroBadgeText}>SAVED SCHEMES</Text>
      </View>

      <Text style={styles.heroTitle}>Saved Schemes</Text>

      <Text style={styles.heroSubtitle}>
        Keep track of government schemes that you are interested in and access
        them whenever you need.
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconOuter}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="bookmark-outline"
            size={34}
            color={colors.rose || '#F43F5E'}
          />
        </View>
      </View>

      <Text style={styles.emptyTitle}>
        No saved schemes yet
      </Text>

      <Text style={styles.emptySubtitle}>
        Schemes that you save will appear here so you can easily access them
        later.
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.exploreButton,
          pressed && styles.pressed,
        ]}
        onPress={() => router.push('/(tabs)/schemes')}
      >
        <Text style={styles.exploreButtonText}>
          Explore All Schemes
        </Text>

        <Ionicons
          name="arrow-forward"
          size={18}
          color="#FFFFFF"
        />
      </Pressable>
    </View>
  );

  const renderSchemeCard = (item: SavedSchemeItem) => {
    const scheme = item.scheme;

    const schemeName =
      scheme?.scheme_name || item.scheme_id;

    const ministry =
      scheme?.ministry || 'Government of India';

    const objective =
      scheme?.objective || '';

    const emailState =
      emailStatus[item.scheme_id];

    return (
      <View
        key={item.scheme_id}
        style={styles.schemeCard}
      >
        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <View style={styles.schemeIdContainer}>
              <Text
                style={styles.schemeId}
                numberOfLines={1}
              >
                {item.scheme_id}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.removeButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                confirmRemove(
                  item.scheme_id,
                  schemeName
                )
              }
              accessibilityLabel={`Remove ${schemeName}`}
            >
              <Ionicons
                name="trash-outline"
                size={19}
                color="#94A3B8"
              />
            </Pressable>
          </View>

          <View style={styles.schemeInfo}>
            <Text
              style={styles.schemeName}
              numberOfLines={3}
            >
              {schemeName}
            </Text>

            <View style={styles.ministryRow}>
              <Ionicons
                name="business-outline"
                size={15}
                color="#94A3B8"
              />

              <Text
                style={styles.ministry}
                numberOfLines={2}
              >
                {ministry}
              </Text>
            </View>
          </View>

          {!!objective && (
            <Text
              style={styles.objective}
              numberOfLines={4}
            >
              {objective}
            </Text>
          )}
        </View>

        {/* Card Actions */}
        <View style={styles.cardActions}>
          <View style={styles.leftActions}>
            <Pressable
              style={({ pressed }) => [
                styles.detailsButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                handleViewDetails(item.scheme_id)
              }
            >
              <Text style={styles.detailsText}>
                View Details
              </Text>

              <Ionicons
                name="arrow-forward"
                size={15}
                color={colors.sky || '#0284C7'}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.compareButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                handleCompare(item.scheme_id)
              }
            >
              <Ionicons
                name="git-compare-outline"
                size={15}
                color="#475569"
              />

              <Text style={styles.compareText}>
                Compare
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.emailButton,
              emailState?.loading && styles.emailButtonDisabled,
              pressed && !emailState?.loading && styles.pressed,
            ]}
            disabled={emailState?.loading}
            onPress={() =>
              handleEmailScheme(item.scheme_id)
            }
          >
            {emailState?.loading ? (
              <ActivityIndicator
                size="small"
                color={colors.sky || '#0284C7'}
              />
            ) : (
              <Ionicons
                name="mail-outline"
                size={16}
                color={colors.sky || '#0284C7'}
              />
            )}

            <Text style={styles.emailText}>
              {emailState?.loading
                ? 'Sending...'
                : 'Email Me'}
            </Text>
          </Pressable>
        </View>

        {/* Email feedback */}
        {!!emailState?.message &&
          !emailState.loading && (
            <View
              style={[
                styles.emailFeedback,
                emailState.success
                  ? styles.emailSuccess
                  : styles.emailError,
              ]}
            >
              <Ionicons
                name={
                  emailState.success
                    ? 'checkmark-circle'
                    : 'information-circle'
                }
                size={16}
                color={
                  emailState.success
                    ? '#15803D'
                    : '#B45309'
                }
              />

              <Text
                style={[
                  styles.emailFeedbackText,
                  emailState.success
                    ? styles.emailSuccessText
                    : styles.emailErrorText,
                ]}
              >
                {emailState.message}
              </Text>
            </View>
          )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.blue || '#2563EB'}
          />
        }
      >
        {renderHeader()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.saffron || '#D7832D'}
            />

            <Text style={styles.loadingText}>
              Loading saved schemes...
            </Text>
          </View>
        ) : savedItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.listContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                Your Saved Schemes
              </Text>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {savedItems.length}
                </Text>
              </View>
            </View>

            {savedItems.map(renderSchemeCard)}
          </View>
        )}
      </ScrollView>

      {/* Official Portal Modal */}
      <Modal
        visible={portalModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setPortalModalOpen(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons
                name="shield-checkmark"
                size={30}
                color={colors.blue || '#2563EB'}
              />
            </View>

            <Text style={styles.modalTitle}>
              Official Government Portal
            </Text>

            <Text style={styles.modalSchemeName}>
              {selectedSchemeName}
            </Text>

            <Text style={styles.modalDescription}>
              You are about to visit the official portal
              for this government scheme.
            </Text>

            {selectedOfficialUrl ? (
              <View style={styles.urlBox}>
                <Ionicons
                  name="link-outline"
                  size={17}
                  color="#64748B"
                />

                <Text
                  style={styles.urlText}
                  numberOfLines={2}
                >
                  {selectedOfficialUrl}
                </Text>
              </View>
            ) : (
              <View style={styles.noUrlBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#B45309"
                />

                <Text style={styles.noUrlText}>
                  Official portal link is not available.
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() =>
                  setPortalModalOpen(false)
                }
              >
                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalOpenButton,
                  !selectedOfficialUrl &&
                    styles.modalOpenButtonDisabled,
                ]}
                disabled={!selectedOfficialUrl}
                onPress={openOfficialPortal}
              >
                <Text style={styles.modalOpenText}>
                  Open Portal
                </Text>

                <Ionicons
                  name="open-outline"
                  size={17}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SavedSchemesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#FEF9F3',
  },

  scrollContent: {
    padding: spacing.lg || 20,
    paddingBottom: 40,
  },

  /* ---------------------------------- */
  /* Hero                                */
  /* ---------------------------------- */

  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 26,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginBottom: 13,
  },

  heroBadgeText: {
    color: '#FDA4AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  heroSubtitle: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 21,
  },

  /* ---------------------------------- */
  /* Loading                             */
  /* ---------------------------------- */

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
  },

  loadingText: {
    marginTop: 14,
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },

  /* ---------------------------------- */
  /* Empty                               */
  /* ---------------------------------- */

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 38,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  emptyIconOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },

  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 24,
  },

  exploreButton: {
    backgroundColor: colors.blue || '#2563EB',
    borderRadius: 13,
    paddingHorizontal: 20,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* ---------------------------------- */
  /* List                                */
  /* ---------------------------------- */

  listContainer: {
    gap: 14,
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  listTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },

  countBadge: {
    marginLeft: 9,
    minWidth: 28,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '800',
  },

  /* ---------------------------------- */
  /* Scheme Card                         */
  /* ---------------------------------- */

  schemeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  cardContent: {
    padding: 18,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  schemeIdContainer: {
    maxWidth: '78%',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  schemeId: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },

  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  schemeInfo: {
    marginBottom: 10,
  },

  schemeName: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    marginBottom: 7,
  },

  ministryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  ministry: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },

  objective: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  /* ---------------------------------- */
  /* Card Actions                        */
  /* ---------------------------------- */

  cardActions: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },

  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },

  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },

  detailsText: {
    color: colors.sky || '#0284C7',
    fontSize: 11,
    fontWeight: '800',
  },

  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  compareText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },

  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  emailButtonDisabled: {
    opacity: 0.65,
  },

  emailText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
  },

  emailFeedback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },

  emailSuccess: {
    backgroundColor: '#F0FDF4',
    borderTopColor: '#DCFCE7',
  },

  emailError: {
    backgroundColor: '#FFFBEB',
    borderTopColor: '#FEF3C7',
  },

  emailFeedbackText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },

  emailSuccessText: {
    color: '#166534',
  },

  emailErrorText: {
    color: '#92400E',
  },

  /* ---------------------------------- */
  /* Modal                               */
  /* ---------------------------------- */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },

  modalIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 7,
  },

  modalSchemeName: {
    color: colors.blue || '#2563EB',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    marginBottom: 10,
  },

  modalDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },

  urlBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 11,
    marginBottom: 20,
  },

  urlText: {
    flex: 1,
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
  },

  noUrlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 11,
    marginBottom: 20,
  },

  noUrlText: {
    flex: 1,
    color: '#92400E',
    fontSize: 12,
    lineHeight: 17,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },

  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },

  modalOpenButton: {
    flex: 1,
    backgroundColor: colors.blue || '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  modalOpenButtonDisabled: {
    opacity: 0.45,
  },

  modalOpenText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.7,
  },
});