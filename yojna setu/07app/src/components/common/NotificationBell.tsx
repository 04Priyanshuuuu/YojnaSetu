import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react-native";

import { notificationApi } from "../../api/notificationApi";
import { NotificationItem } from "../../types";

export const NotificationButton: React.FC = () => {
  const { t } = useTranslation();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] =
    useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /*
   * Fetch unread notification count when the component
   * mounts and then poll every 15 seconds.
   */
  useEffect(() => {
    void fetchUnreadCount();

    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response =
        await notificationApi.getUnreadCount();

      setUnreadCount(response.unread_count);
    } catch {
      /*
       * Silent error during background polling.
       */
    }
  };

  /*
   * Open/close the native notification modal.
   *
   * When opening, load the latest five notifications.
   */
  const handleToggleOpen = async () => {
    const nextState = !isOpen;

    setIsOpen(nextState);

    if (!nextState) {
      return;
    }

    setIsLoading(true);

    try {
      const data =
        await notificationApi.getNotifications({
          page: 1,
          page_size: 5,
        });

      setRecentNotifications(data.items);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error(
        "Failed to load recent notifications:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * Mark one notification as read.
   */
  const handleMarkAsRead = async (
    item: NotificationItem
  ) => {
    if (item.is_read) {
      return;
    }

    try {
      await notificationApi.markRead(
        item.notification_id
      );

      setRecentNotifications((previous) =>
        previous.map((notification) =>
          notification.notification_id ===
          item.notification_id
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );

      setUnreadCount((previous) =>
        Math.max(0, previous - 1)
      );
    } catch (error) {
      console.error(
        "Mark read error:",
        error
      );
    }
  };

  /*
   * Mark all currently unread notifications as read.
   */
  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();

      setRecentNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Mark all read error:",
        error
      );
    }
  };

  /*
   * Open a notification.
   *
   * 1. Mark it as read if necessary.
   * 2. Check metadata_json for a deep_link.
   * 3. Otherwise use the application detail route.
   * 4. If there is no application_id, open the
   *    notifications screen.
   */
  const handleNotificationClick = async (
    item: NotificationItem
  ) => {
    if (!item.is_read) {
      try {
        await notificationApi.markRead(
          item.notification_id
        );

        setRecentNotifications((previous) =>
          previous.map((notification) =>
            notification.notification_id ===
            item.notification_id
              ? {
                  ...notification,
                  is_read: true,
                }
              : notification
          )
        );

        setUnreadCount((previous) =>
          Math.max(0, previous - 1)
        );
      } catch {
        /*
         * Keep navigation working even if marking
         * the notification as read fails.
         */
      }
    }

    setIsOpen(false);

    let targetUrl = `/applications/${item.application_id}`;

    if (item.metadata_json) {
      try {
        const metadata = JSON.parse(
          item.metadata_json
        );

        if (
          metadata &&
          typeof metadata.deep_link === "string" &&
          metadata.deep_link.trim().length > 0
        ) {
          targetUrl = metadata.deep_link;
        }
      } catch {
        /*
         * Invalid metadata falls back to the
         * application route.
         */
      }
    }

    if (item.application_id) {
      router.push(targetUrl as never);
    } else {
      router.push("/notifications");
    }
  };

  /*
   * Priority badge.
   */
  const getPriorityBadge = (
    priority: string
  ) => {
    switch (priority) {
      case "URGENT":
        return (
          <View
            style={[
              styles.priorityBadge,
              styles.urgentBadge,
            ]}
          >
            <Text
              style={[
                styles.priorityText,
                styles.urgentText,
              ]}
            >
              {t(
                "notifications.urgent",
                "URGENT"
              )}
            </Text>
          </View>
        );

      case "HIGH":
        return (
          <View
            style={[
              styles.priorityBadge,
              styles.highBadge,
            ]}
          >
            <Text
              style={[
                styles.priorityText,
                styles.highText,
              ]}
            >
              {t(
                "notifications.high",
                "HIGH"
              )}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Notification button */}
      <Pressable
        onPress={() => {
          void handleToggleOpen();
        }}
        accessibilityRole="button"
        accessibilityLabel={t(
          "notifications.title",
          "Notifications"
        )}
        style={({ pressed }) => [
          styles.bellButton,
          pressed && styles.bellButtonPressed,
        ]}
      >
        <Bell
          size={20}
          color="#CBD5E1"
          strokeWidth={2}
        />

        {unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {unreadCount > 9
                ? "9+"
                : unreadCount}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {/* Native notification modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Tap outside to close */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsOpen(false)}
          />

          <View style={styles.notificationPanel}>
            {/* Header */}
            <View style={styles.panelHeader}>
              <View style={styles.headerLeft}>
                <Bell
                  size={17}
                  color="#38BDF8"
                  strokeWidth={2}
                />

                <Text style={styles.headerTitle}>
                  {t(
                    "notifications.title",
                    "Notifications"
                  )}
                </Text>

                {unreadCount > 0 ? (
                  <View style={styles.newAlertsBadge}>
                    <Text
                      style={
                        styles.newAlertsText
                      }
                    >
                      {t(
                        "notifications.newAlertsCount",
                        "{{count}} New",
                        {
                          count: unreadCount,
                        }
                      )}
                    </Text>
                  </View>
                ) : null}
              </View>

              {unreadCount > 0 ? (
                <Pressable
                  onPress={() => {
                    void handleMarkAllRead();
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.markAllButton,
                    pressed &&
                      styles.markAllButtonPressed,
                  ]}
                >
                  <CheckCheck
                    size={14}
                    color="#7DD3FC"
                    strokeWidth={2}
                  />

                  <Text
                    style={styles.markAllText}
                  >
                    {t(
                      "notifications.markAllRead",
                      "Mark all read"
                    )}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* Notification list */}
            <ScrollView
              style={styles.notificationList}
              contentContainerStyle={
                styles.notificationListContent
              }
              showsVerticalScrollIndicator={false}
            >
              {isLoading ? (
                <View
                  style={styles.loadingContainer}
                >
                  <ActivityIndicator
                    size="small"
                    color="#0284C7"
                  />

                  <Text
                    style={styles.loadingText}
                  >
                    {t(
                      "notifications.loadingAlerts",
                      "Loading alerts..."
                    )}
                  </Text>
                </View>
              ) : recentNotifications.length ===
                0 ? (
                <View
                  style={styles.emptyContainer}
                >
                  <Bell
                    size={32}
                    color="#CBD5E1"
                    strokeWidth={1.8}
                  />

                  <Text
                    style={styles.emptyTitle}
                  >
                    {t(
                      "notifications.noNotifications",
                      "No Notifications"
                    )}
                  </Text>

                  <Text
                    style={styles.emptyDescription}
                  >
                    {t(
                      "notifications.allCaughtUp",
                      "You're all caught up with your updates."
                    )}
                  </Text>
                </View>
              ) : (
                recentNotifications.map(
                  (item) => (
                    <Pressable
                      key={String(
                        item.notification_id
                      )}
                      onPress={() => {
                        void handleNotificationClick(
                          item
                        );
                      }}
                      style={({ pressed }) => [
                        styles.notificationItem,
                        !item.is_read &&
                          styles.unreadNotificationItem,
                        pressed &&
                          styles.notificationItemPressed,
                      ]}
                    >
                      {/* Unread indicator */}
                      {!item.is_read ? (
                        <View
                          style={
                            styles.unreadDot
                          }
                        />
                      ) : (
                        <View
                          style={
                            styles.readDotSpacer
                          }
                        />
                      )}

                      <View
                        style={
                          styles.notificationContent
                        }
                      >
                        <View
                          style={
                            styles.notificationTitleRow
                          }
                        >
                          <Text
                            style={
                              styles.notificationTitle
                            }
                            numberOfLines={2}
                          >
                            {item.title}
                          </Text>

                          {getPriorityBadge(
                            item.priority
                          )}
                        </View>

                        <Text
                          style={
                            styles.notificationMessage
                          }
                          numberOfLines={2}
                        >
                          {item.message}
                        </Text>

                        <Text
                          style={
                            styles.notificationDate
                          }
                          numberOfLines={1}
                        >
                          {new Date(
                            item.created_at
                          ).toLocaleString()}
                        </Text>
                      </View>
                    </Pressable>
                  )
                )
              )}
            </ScrollView>

            {/* View all */}
            <View style={styles.footer}>
              <Pressable
                onPress={() => {
                  setIsOpen(false);
                  router.push("/notifications");
                }}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.viewAllButton,
                  pressed &&
                    styles.viewAllButtonPressed,
                ]}
              >
                <Text
                  style={styles.viewAllText}
                >
                  {t(
                    "notifications.viewAll",
                    "View All Notifications"
                  )}
                </Text>

                <ExternalLink
                  size={13}
                  color="#0369A1"
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  /*
   * Bell button
   */
  bellButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  bellButtonPressed: {
    backgroundColor: "#0F172A",
  },

  unreadBadge: {
    position: "absolute",
    top: 3,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#F43F5E",
    borderWidth: 2,
    borderColor: "#0E766E",
    alignItems: "center",
    justifyContent: "center",
  },

  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "800",
    textAlign: "center",
  },

  /*
   * Modal
   */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 52,
    paddingHorizontal: 12,
  },

  notificationPanel: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "78%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },

  /*
   * Header
   */
  panelHeader: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0F172A",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },

  newAlertsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#0284C7",
  },

  newAlertsText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
  },

  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingLeft: 4,
  },

  markAllButtonPressed: {
    opacity: 0.65,
  },

  markAllText: {
    color: "#7DD3FC",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },

  /*
   * Notification list
   */
  notificationList: {
    flexGrow: 0,
  },

  notificationListContent: {
    paddingBottom: 0,
  },

  notificationItem: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },

  unreadNotificationItem: {
    backgroundColor: "#F0F9FF",
  },

  notificationItemPressed: {
    backgroundColor: "#F8FAFC",
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0284C7",
    marginTop: 5,
    flexShrink: 0,
  },

  readDotSpacer: {
    width: 8,
    height: 8,
    flexShrink: 0,
  },

  notificationContent: {
    flex: 1,
    minWidth: 0,
  },

  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  notificationTitle: {
    flex: 1,
    color: "#0F172A",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  notificationMessage: {
    marginTop: 4,
    color: "#475569",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "400",
  },

  notificationDate: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 14,
    fontFamily: "monospace",
  },

  /*
   * Priority badges
   */
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 4,
  },

  priorityText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
  },

  urgentBadge: {
    backgroundColor: "#FFE4E6",
    borderColor: "#FDA4AF",
  },

  urgentText: {
    color: "#9F1239",
  },

  highBadge: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },

  highText: {
    color: "#92400E",
  },

  /*
   * Loading
   */
  loadingContainer: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },

  /*
   * Empty state
   */
  emptyContainer: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  emptyTitle: {
    marginTop: 8,
    color: "#334155",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 2,
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  /*
   * Footer
   */
  footer: {
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    padding: 10,
  },

  viewAllButton: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 6,
  },

  viewAllButtonPressed: {
    opacity: 0.65,
  },

  viewAllText: {
    color: "#0369A1",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
});

export default NotificationButton;
