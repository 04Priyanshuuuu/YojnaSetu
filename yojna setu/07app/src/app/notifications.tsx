import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Settings,
  Smartphone,
  X,
} from "lucide-react-native";

import { notificationApi } from "../api/notificationApi";
import {
  NotificationItem,
  NotificationPreference,
} from "../types";

type TabFilter = "ALL" | "UNREAD" | "READ";

type NotificationTypeOption = {
  value: string;
  label: string;
};

const NOTIFICATION_TYPES: NotificationTypeOption[] = [
  { value: "", label: "All Notification Types" },
  { value: "APPLICATION_SUBMITTED", label: "Submitted" },
  { value: "APPLICATION_UNDER_REVIEW", label: "Under Review" },
  { value: "DOCUMENT_VERIFIED", label: "Document Verified" },
  { value: "DOCUMENT_REJECTED", label: "Document Rejected" },
  { value: "CORRECTION_REQUIRED", label: "Correction Required" },
  { value: "APPLICATION_RESUBMITTED", label: "Resubmitted" },
  { value: "APPLICATION_APPROVED", label: "Approved" },
  { value: "APPLICATION_REJECTED", label: "Rejected" },
];

const PAGE_SIZE = 15;

export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [tabFilter, setTabFilter] = useState<TabFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [preferences, setPreferences] =
    useState<NotificationPreference | null>(null);

  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  const selectedTypeLabel = useMemo(() => {
    return (
      NOTIFICATION_TYPES.find((item) => item.value === typeFilter)?.label ??
      "All Notification Types"
    );
  }, [typeFilter]);

  const fetchNotifications = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setIsLoading(true);
      }

      setErrorMsg(null);

      try {
        let isReadParam: boolean | undefined;

        if (tabFilter === "UNREAD") {
          isReadParam = false;
        } else if (tabFilter === "READ") {
          isReadParam = true;
        }

        const data = await notificationApi.getNotifications({
          is_read: isReadParam,
          notification_type: typeFilter || undefined,
          page,
          page_size: PAGE_SIZE,
        });

        setNotifications(data.items);
        setTotalCount(data.total);
        setUnreadCount(data.unread_count);
      } catch (err: any) {
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          "Please try again.";

        setErrorMsg(`Failed to load notifications. ${detail}`);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, tabFilter, typeFilter]
  );

  const fetchPreferences = useCallback(async () => {
    try {
      const prefs = await notificationApi.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error("Failed to load preferences:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifications(false);
  }, [fetchNotifications]);

  const handleSelectTab = (tab: TabFilter) => {
    setTabFilter(tab);
    setPage(1);
  };

  const handleSelectType = (value: string) => {
    setTypeFilter(value);
    setPage(1);
    setIsTypeModalOpen(false);
  };

  const handleMarkRead = async (item: NotificationItem) => {
    if (item.is_read) {
      return;
    }

    try {
      await notificationApi.markRead(item.notification_id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.notification_id === item.notification_id
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount <= 0) {
      return;
    }

    try {
      await notificationApi.markAllRead();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setErrorMsg("Failed to mark all notifications as read.");
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    await handleMarkRead(item);

    let targetUrl = item.application_id
      ? `/applications/${item.application_id}`
      : "/notifications";

    if (item.metadata_json) {
      try {
        const meta = JSON.parse(item.metadata_json);

        if (meta?.deep_link) {
          targetUrl = meta.deep_link;
        }
      } catch (err) {
        console.warn("Invalid notification metadata:", err);
      }
    }

    if (item.application_id) {
      router.push(targetUrl as any);
    }
  };

  const handleTogglePref = async (
    key: keyof NotificationPreference
  ) => {
    if (!preferences || key === "user_id" || key === "updated_at") {
      return;
    }

    const currentValue = preferences[key];

    if (typeof currentValue !== "boolean") {
      return;
    }

    const updated: NotificationPreference = {
      ...preferences,
      [key]: !currentValue,
    };

    setPreferences(updated);
    setSavingPref(true);

    try {
      await notificationApi.updatePreferences({
        [key]: updated[key],
      });
    } catch (err) {
      console.error("Preference update failed:", err);

      // Revert optimistic update if API fails.
      setPreferences(preferences);
    } finally {
      setSavingPref(false);
    }
  };

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return styles.priorityUrgent;

      case "HIGH":
        return styles.priorityHigh;

      default:
        return styles.priorityNormal;
    }
  };

  const renderNotification = ({
    item,
  }: {
    item: NotificationItem;
  }) => {
    const isUnread = !item.is_read;

    return (
      <Pressable
        onPress={() => handleNotificationClick(item)}
        style={({ pressed }) => [
          styles.notificationCard,
          isUnread
            ? styles.notificationUnread
            : styles.notificationRead,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.notificationTopRow}>
          <View style={styles.titleContainer}>
            {isUnread && <View style={styles.unreadDot} />}

            <Text style={styles.notificationTitle} numberOfLines={3}>
              {item.title}
            </Text>
          </View>

          <View
            style={[
              styles.priorityBadge,
              getPriorityStyle(item.priority),
            ]}
          >
            <Text style={styles.priorityText}>
              {item.priority}
            </Text>
          </View>
        </View>

        <Text style={styles.notificationMessage}>
          {item.message}
        </Text>

        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            {formatDate(item.created_at)}
          </Text>

          <View style={styles.metaDot} />

          <Text style={styles.metaText} numberOfLines={1}>
            Channel: {item.channel}
          </Text>
        </View>

        {item.application_id ? (
          <View style={styles.openDetailsRow}>
            <Text style={styles.openDetailsText}>
              Open Details
            </Text>

            <ArrowRight
              size={16}
              color="#ffffff"
              strokeWidth={2.5}
            />
          </View>
        ) : null}
      </Pressable>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Bell
            size={14}
            color="#7dd3fc"
            strokeWidth={2.5}
          />

          <Text style={styles.badgeText}>
            Communication & Notification Center
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          Notifications & Application Alerts
        </Text>

        <Text style={styles.heroSubtitle}>
          Real-time status updates for applications, document
          verification results, and authority reviews.
        </Text>

        <View style={styles.heroActions}>
          <Pressable
            onPress={() => setIsPrefModalOpen(true)}
            style={({ pressed }) => [
              styles.preferenceButton,
              pressed && styles.pressed,
            ]}
          >
            <Settings
              size={17}
              color="#7dd3fc"
              strokeWidth={2.2}
            />

            <Text style={styles.preferenceButtonText}>
              Delivery Preferences
            </Text>
          </Pressable>

          {unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAllRead}
              style={({ pressed }) => [
                styles.markAllButton,
                pressed && styles.pressed,
              ]}
            >
              <CheckCheck
                size={17}
                color="#ffffff"
                strokeWidth={2.2}
              />

              <Text style={styles.markAllButtonText}>
                Mark All as Read
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {errorMsg ? (
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <X
              size={16}
              color="#b91c1c"
              strokeWidth={2.5}
            />
          </View>

          <Text style={styles.errorText}>{errorMsg}</Text>

          <Pressable
            onPress={() => fetchNotifications()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.contentCard}>
        <View style={styles.filterHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Notification Feed
            </Text>

            <Text style={styles.sectionSubtitle}>
              {totalCount} notification
              {totalCount === 1 ? "" : "s"}
            </Text>
          </View>

          <View style={styles.filterIconContainer}>
            <Filter
              size={16}
              color="#64748b"
              strokeWidth={2}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {(["ALL", "UNREAD", "READ"] as TabFilter[]).map(
            (tab) => {
              const selected = tabFilter === tab;

              return (
                <Pressable
                  key={tab}
                  onPress={() => handleSelectTab(tab)}
                  style={({ pressed }) => [
                    styles.filterTab,
                    selected
                      ? styles.filterTabActive
                      : styles.filterTabInactive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selected
                        ? styles.filterTabTextActive
                        : styles.filterTabTextInactive,
                    ]}
                  >
                    {tab === "ALL"
                      ? "ALL"
                      : tab === "UNREAD"
                        ? "UNREAD"
                        : "READ"}
                  </Text>

                  {tab === "UNREAD" && unreadCount > 0 ? (
                    <View style={styles.unreadCountBadge}>
                      <Text style={styles.unreadCountText}>
                        {unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            }
          )}
        </ScrollView>

        <Pressable
          onPress={() => setIsTypeModalOpen(true)}
          style={({ pressed }) => [
            styles.typeFilterButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.typeFilterLeft}>
            <Filter
              size={17}
              color="#64748b"
              strokeWidth={2}
            />

            <Text
              style={styles.typeFilterText}
              numberOfLines={1}
            >
              {selectedTypeLabel}
            </Text>
          </View>

          <ChevronDown
            size={18}
            color="#64748b"
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={isLoading ? [] : notifications}
        keyExtractor={(item) => item.notification_id}
        renderItem={renderNotification}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color="#0284c7"
              />

              <Text style={styles.loadingText}>
                Loading notifications...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Bell
                  size={34}
                  color="#94a3b8"
                  strokeWidth={1.8}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Notifications Found
              </Text>

              <Text style={styles.emptySubtitle}>
                You're all caught up with your updates.
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0284c7"
            colors={["#0284c7"]}
          />
        }
      />

      {/* Notification Type Modal */}
      <Modal
        visible={isTypeModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTypeModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsTypeModalOpen(false)}
          />

          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>
                  Notification Type
                </Text>

                <Text style={styles.sheetSubtitle}>
                  Filter your notification feed
                </Text>
              </View>

              <Pressable
                onPress={() => setIsTypeModalOpen(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#475569" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.optionsContainer}
            >
              {NOTIFICATION_TYPES.map((option) => {
                const selected =
                  typeFilter === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() =>
                      handleSelectType(option.value)
                    }
                    style={({ pressed }) => [
                      styles.optionRow,
                      selected && styles.optionRowSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>

                    {selected ? (
                      <Check
                        size={19}
                        color="#0284c7"
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delivery Preferences Modal */}
      <Modal
        visible={isPrefModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPrefModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsPrefModalOpen(false)}
          />

          <View style={styles.preferenceSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.preferenceTitleRow}>
                <View style={styles.preferenceHeaderIcon}>
                  <Settings
                    size={20}
                    color="#0284c7"
                    strokeWidth={2.2}
                  />
                </View>

                <View style={styles.preferenceTitleContainer}>
                  <Text style={styles.sheetTitle}>
                    Notification Delivery Preferences
                  </Text>

                  <Text style={styles.sheetSubtitle}>
                    Configure your alert delivery channels
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setIsPrefModalOpen(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#475569" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.preferenceScrollContent
              }
            >
              <Text style={styles.preferenceDescription}>
                Configure delivery channels for real-time
                application updates and verification alerts.
              </Text>

              <PreferenceRow
                icon={
                  <Bell
                    size={20}
                    color="#0284c7"
                    strokeWidth={2}
                  />
                }
                iconBackground="#e0f2fe"
                title="In-App Notifications"
                description="Header bell & portal alerts"
                enabled={
                  preferences?.in_app_enabled ?? false
                }
                disabled={!preferences || savingPref}
                onToggle={() =>
                  handleTogglePref("in_app_enabled")
                }
              />

              <PreferenceRow
                icon={
                  <Mail
                    size={20}
                    color="#4f46e5"
                    strokeWidth={2}
                  />
                }
                iconBackground="#eef2ff"
                title="Email Notifications"
                description="Email status updates (Adapter ready)"
                enabled={
                  preferences?.email_enabled ?? false
                }
                disabled={!preferences || savingPref}
                onToggle={() =>
                  handleTogglePref("email_enabled")
                }
              />

              <PreferenceRow
                icon={
                  <Phone
                    size={20}
                    color="#059669"
                    strokeWidth={2}
                  />
                }
                iconBackground="#ecfdf5"
                title="SMS Alerts"
                description="Mobile SMS alerts (Adapter ready)"
                enabled={
                  preferences?.sms_enabled ?? false
                }
                disabled={!preferences || savingPref}
                onToggle={() =>
                  handleTogglePref("sms_enabled")
                }
              />

              <PreferenceRow
                icon={
                  <MessageSquare
                    size={20}
                    color="#16a34a"
                    strokeWidth={2}
                  />
                }
                iconBackground="#f0fdf4"
                title="WhatsApp Updates"
                description="WhatsApp Business notifications"
                enabled={
                  preferences?.whatsapp_enabled ?? false
                }
                disabled={!preferences || savingPref}
                onToggle={() =>
                  handleTogglePref("whatsapp_enabled")
                }
              />

              <PreferenceRow
                icon={
                  <Smartphone
                    size={20}
                    color="#9333ea"
                    strokeWidth={2}
                  />
                }
                iconBackground="#faf5ff"
                title="Mobile Push"
                description="Device push notifications"
                enabled={
                  preferences?.push_enabled ?? false
                }
                disabled={!preferences || savingPref}
                onToggle={() =>
                  handleTogglePref("push_enabled")
                }
              />

              <Pressable
                onPress={() => setIsPrefModalOpen(false)}
                style={({ pressed }) => [
                  styles.closePreferenceButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.closePreferenceText}>
                  Close & Save Preferences
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type PreferenceRowProps = {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

function PreferenceRow({
  icon,
  iconBackground,
  title,
  description,
  enabled,
  disabled,
  onToggle,
}: PreferenceRowProps) {
  return (
    <View
      style={[
        styles.preferenceRow,
        disabled && styles.preferenceRowDisabled,
      ]}
    >
      <View
        style={[
          styles.preferenceIcon,
          { backgroundColor: iconBackground },
        ]}
      >
        {icon}
      </View>

      <View style={styles.preferenceTextContainer}>
        <Text style={styles.preferenceTitle}>{title}</Text>

        <Text style={styles.preferenceDescriptionSmall}>
          {description}
        </Text>
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={title}
        accessibilityState={{
          checked: enabled,
          disabled: !!disabled,
        }}
        disabled={disabled}
        onPress={onToggle}
        style={[
          styles.switch,
          enabled
            ? styles.switchEnabled
            : styles.switchDisabled,
        ]}
      >
        <View
          style={[
            styles.switchThumb,
            enabled
              ? styles.switchThumbEnabled
              : styles.switchThumbDisabled,
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  listContent: {
    paddingBottom: 32,
  },

  hero: {
    backgroundColor: "#082f49",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 22,
    borderBottomWidth: 4,
    borderBottomColor: "#0ea5e9",
  },

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#0c4a6e",
    borderWidth: 1,
    borderColor: "#075985",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginBottom: 12,
  },

  badgeText: {
    color: "#bae6fd",
    fontSize: 11,
    fontWeight: "700",
  },

  heroTitle: {
    color: "#ffffff",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
  },

  heroSubtitle: {
    color: "#e0f2fe",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },

  heroActions: {
    marginTop: 18,
    gap: 9,
  },

  preferenceButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },

  preferenceButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  markAllButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#0284c7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },

  markAllButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  errorCard: {
    marginHorizontal: 14,
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  errorIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    flex: 1,
    color: "#991b1b",
    fontSize: 11,
    lineHeight: 16,
  },

  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#991b1b",
  },

  retryText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },

  contentCard: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
  },

  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 2,
  },

  filterIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  tabsContainer: {
    gap: 8,
    paddingBottom: 12,
  },

  filterTab: {
    minHeight: 38,
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  filterTabActive: {
    backgroundColor: "#075985",
  },

  filterTabInactive: {
    backgroundColor: "#f1f5f9",
  },

  filterTabText: {
    fontSize: 10,
    fontWeight: "800",
  },

  filterTabTextActive: {
    color: "#ffffff",
  },

  filterTabTextInactive: {
    color: "#475569",
  },

  unreadCountBadge: {
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
  },

  unreadCountText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },

  typeFilterButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },

  typeFilterLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  typeFilterText: {
    flex: 1,
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
  },

  notificationCard: {
    marginHorizontal: 14,
    marginTop: 9,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
  },

  notificationUnread: {
    backgroundColor: "#f0f9ff",
    borderColor: "#7dd3fc",
  },

  notificationRead: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
  },

  notificationTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#0284c7",
    marginTop: 5,
  },

  notificationTitle: {
    flex: 1,
    color: "#0f172a",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
  },

  priorityBadge: {
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  priorityUrgent: {
    backgroundColor: "#ffe4e6",
    borderColor: "#fda4af",
  },

  priorityHigh: {
    backgroundColor: "#fef3c7",
    borderColor: "#fcd34d",
  },

  priorityNormal: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },

  priorityText: {
    color: "#475569",
    fontSize: 8,
    fontWeight: "800",
  },

  notificationMessage: {
    color: "#334155",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },

  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 11,
  },

  metaText: {
    flexShrink: 1,
    color: "#94a3b8",
    fontSize: 9,
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
  },

  openDetailsRow: {
    marginTop: 12,
    minHeight: 38,
    borderRadius: 9,
    backgroundColor: "#075985",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  openDetailsText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },

  loadingContainer: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  loadingText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 10,
  },

  emptyContainer: {
    marginHorizontal: 14,
    marginTop: 9,
    minHeight: 280,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  emptySubtitle: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.58)",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    maxHeight: "82%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  preferenceSheet: {
    maxHeight: "90%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    marginBottom: 15,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  sheetTitle: {
    flex: 1,
    color: "#0f172a",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },

  sheetSubtitle: {
    color: "#64748b",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  optionsContainer: {
    paddingVertical: 8,
  },

  optionRow: {
    minHeight: 52,
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },

  optionRowSelected: {
    backgroundColor: "#f0f9ff",
  },

  optionText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: "#0369a1",
    fontWeight: "800",
  },

  preferenceTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  preferenceHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },

  preferenceTitleContainer: {
    flex: 1,
  },

  preferenceScrollContent: {
    paddingTop: 14,
    paddingBottom: 10,
  },

  preferenceDescription: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 13,
  },

  preferenceRow: {
    minHeight: 70,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  preferenceRowDisabled: {
    opacity: 0.65,
  },

  preferenceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  preferenceTextContainer: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
  },

  preferenceTitle: {
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "800",
  },

  preferenceDescriptionSmall: {
    color: "#64748b",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: "center",
  },

  switchEnabled: {
    backgroundColor: "#0284c7",
    alignItems: "flex-end",
  },

  switchDisabled: {
    backgroundColor: "#cbd5e1",
    alignItems: "flex-start",
  },

  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ffffff",
  },

  switchThumbEnabled: {
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    elevation: 2,
  },

  switchThumbDisabled: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    elevation: 1,
  },

  closePreferenceButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#075985",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  closePreferenceText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.78,
  },
});

