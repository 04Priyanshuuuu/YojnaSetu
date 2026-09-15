import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  PlusCircle,
  ShieldCheck,
  X,
} from "lucide-react-native";

import Screen from "../../components/Screen";
import AppHeader from "../../components/AppHeader";

import { applicationApi } from '../../api/applicationApi';
import type { ApplicationDocument } from '../../types';

type ApplicationStatus =
  | ""
  | "DRAFT"
  | "DOCUMENTS_PENDING"
  | "READY_FOR_SUBMISSION"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUIRED"
  | "APPROVED"
  | "COMPLETED"
  | "WITHDRAWN"
  | "REJECTED"
  | string;



interface ApplicationItem {
  application_id: string | number;
  scheme_id?: string | number;
  scheme_name?: string | null;
  status: ApplicationStatus;
  created_at: string;
  documents?: ApplicationDocument[];
  [key: string]: unknown;
}


const STATUS_OPTIONS: {
  value: ApplicationStatus;
  label: string;
}[] = [
  {
    value: "",
    label: "All Applications & Guidance Records",
  },
  {
    value: "DRAFT",
    label: "Guidance Started",
  },
  {
    value: "DOCUMENTS_PENDING",
    label: "Checklist Pending",
  },
  {
    value: "READY_FOR_SUBMISSION",
    label: "Ready to Apply on Official Portal",
  },
  {
    value: "SUBMITTED",
    label: "Submitted to Partner",
  },
  {
    value: "UNDER_REVIEW",
    label: "Under Official Review",
  },
  {
    value: "CORRECTION_REQUIRED",
    label: "Action Required",
  },
  {
    value: "APPROVED",
    label: "Approved",
  },
  {
    value: "COMPLETED",
    label: "Completed / Benefit Disbursed",
  },
  {
    value: "WITHDRAWN",
    label: "Withdrawn",
  },
  {
    value: "REJECTED",
    label: "Rejected",
  },
];

const STATUS_STYLES: Record<
  string,
  {
    background: string;
    border: string;
    text: string;
  }
> = {
  DRAFT: {
    background: "#f1f5f9",
    border: "#cbd5e1",
    text: "#475569",
  },
  DOCUMENTS_PENDING: {
    background: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
  },
  READY_FOR_SUBMISSION: {
    background: "#ecfdf5",
    border: "#a7f3d0",
    text: "#047857",
  },
  SUBMITTED: {
    background: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
  },
  UNDER_REVIEW: {
    background: "#f0f9ff",
    border: "#bae6fd",
    text: "#0369a1",
  },
  CORRECTION_REQUIRED: {
    background: "#fef2f2",
    border: "#fecaca",
    text: "#b91c1c",
  },
  APPROVED: {
    background: "#ecfdf5",
    border: "#a7f3d0",
    text: "#047857",
  },
  COMPLETED: {
    background: "#f0fdf4",
    border: "#bbf7d0",
    text: "#15803d",
  },
  WITHDRAWN: {
    background: "#f8fafc",
    border: "#cbd5e1",
    text: "#64748b",
  },
  REJECTED: {
    background: "#fef2f2",
    border: "#fecaca",
    text: "#b91c1c",
  },
};

function getStatusLabel(status: ApplicationStatus): string {
  const option = STATUS_OPTIONS.find((item) => item.value === status);

  if (option && option.value !== "") {
    return option.label;
  }

  return status || "Guidance Started";
}

function getStatusColors(status: ApplicationStatus) {
  return (
    STATUS_STYLES[status] || {
      background: "#f1f5f9",
      border: "#cbd5e1",
      text: "#475569",
    }
  );
}

function formatDate(value: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            detail?: string;
          };
        };
      }
    ).response;

    if (response?.data?.detail) {
      return response.data.detail;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to fetch your application guidance records.";
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const colors = getStatusColors(status);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          {
            color: colors.text,
          },
        ]}
        numberOfLines={1}
      >
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

function ApplicationCard({
  application,
  onPress,
}: {
  application: ApplicationItem;
  onPress: () => void;
}) {
  const documents = application.documents ?? [];
  const uploadedDocs = documents.filter(
    (document) => document.is_uploaded,
  ).length;
  const totalDocs = documents.length;

  const progress =
    totalDocs > 0 ? Math.round((uploadedDocs / totalDocs) * 100) : 0;

  return (
    <View style={styles.applicationCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.fileIconContainer}>
          <FileText size={20} color="#0284c7" strokeWidth={2} />
        </View>

        <View style={styles.cardTitleContainer}>
          <Text style={styles.schemeName} numberOfLines={2}>
            {application.scheme_name ||
              `Scheme ${application.scheme_id ?? application.application_id}`}
          </Text>

          <StatusBadge status={application.status} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metadataContainer}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Guidance ID</Text>
          <Text style={styles.metadataValue} numberOfLines={1}>
            {String(application.application_id)}
          </Text>
        </View>

        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Created</Text>
          <Text style={styles.metadataValue}>
            {formatDate(application.created_at)}
          </Text>
        </View>
      </View>

      <View style={styles.checklistContainer}>
        <View style={styles.checklistHeader}>
          <Text style={styles.checklistTitle}>Document Checklist</Text>

          <Text style={styles.checklistCount}>
            {uploadedDocs} / {totalDocs}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.checklistDescription}>
          {totalDocs === 0
            ? "No checklist items available yet"
            : `${uploadedDocs} of ${totalDocs} items checked`}
        </Text>
      </View>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`View checklist for ${
          application.scheme_name || "application"
        }`}
      >
        <Text style={styles.viewButtonText}>
          View Checklist & Official Portal
        </Text>

        <ArrowRight size={17} color="#ffffff" strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

export default function ApplicationsScreen() {
  const router = useRouter();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const selectedFilterLabel = useMemo(() => {
    return (
      STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label ||
      "All Applications & Guidance Records"
    );
  }, [statusFilter]);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await applicationApi.getMyApplications(
  statusFilter || undefined,
);
      setApplications(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleFindNewScheme = () => {
    router.push("/(tabs)/match");
  };

  const handleApplicationPress = (applicationId: string | number) => {
    router.push(`/applications/${applicationId}`);
  };

  const handleFilterSelect = (value: ApplicationStatus) => {
    setStatusFilter(value);
    setIsFilterVisible(false);
  };

  const renderApplication = ({ item }: { item: ApplicationItem }) => (
    <ApplicationCard
      application={item}
      onPress={() => handleApplicationPress(item.application_id)}
    />
  );

  const renderHeader = () => (
    <>
      <View style={styles.introCard}>
        <View style={styles.introIconContainer}>
          <FileText size={22} color="#0284c7" strokeWidth={2.2} />
        </View>

        <View style={styles.introTextContainer}>
          <Text style={styles.pageTitle}>Assisted Application Guidance</Text>

          <Text style={styles.pageSubtitle}>
            YojnaSetu helps you discover schemes, review eligibility, and
            prepare your document checklists.
          </Text>

          <Text style={styles.pageSubtitleSecondary}>
            Final application submission and approval are handled directly on
            the concerned official government portal.
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.filterWrapper}>
          <Pressable
            onPress={() => setIsFilterVisible(true)}
            style={({ pressed }) => [
              styles.filterButton,
              pressed && styles.pressedLight,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Filter application guidance records"
          >
            <View style={styles.filterTextContainer}>
              <Text style={styles.filterLabel}>Filter</Text>

              <Text style={styles.filterValue} numberOfLines={1}>
                {selectedFilterLabel}
              </Text>
            </View>

            <ChevronDown size={18} color="#475569" />
          </Pressable>
        </View>

        <Pressable
          onPress={handleFindNewScheme}
          style={({ pressed }) => [
            styles.findSchemeButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Find a new scheme"
        >
          <PlusCircle size={18} color="#ffffff" strokeWidth={2.2} />

          <Text style={styles.findSchemeButtonText}>Find New Scheme</Text>
        </Pressable>
      </View>

      <View style={styles.reminderCard}>
        <View style={styles.reminderIconContainer}>
          <ShieldCheck size={21} color="#0369a1" strokeWidth={2.2} />
        </View>

        <View style={styles.reminderTextContainer}>
          <Text style={styles.reminderTitle}>
            Official Application Portal Reminder
          </Text>

          <Text style={styles.reminderDescription}>
            Once you complete your document checklist on YojnaSetu, use the
            reference link to submit your official application on the concerned
            government portal.
          </Text>

          <Text style={styles.reminderDescription}>
            Keep your official reference or acknowledgement number for tracking.
          </Text>
        </View>
      </View>

      {errorMsg ? (
        <View style={styles.errorCard}>
          <View style={styles.errorIconContainer}>
            <AlertCircle size={20} color="#b91c1c" />
          </View>

          <View style={styles.errorTextContainer}>
            <Text style={styles.errorTitle}>Unable to load records</Text>

            <Text style={styles.errorMessage}>{errorMsg}</Text>

            <Pressable
              onPress={fetchApplications}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressedLight,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Retry loading applications"
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!isLoading && applications.length > 0 ? (
        <View style={styles.recordsHeader}>
          <Text style={styles.recordsTitle}>Your Guidance Records</Text>

          <Text style={styles.recordsCount}>
            {applications.length}{" "}
            {applications.length === 1 ? "record" : "records"}
          </Text>
        </View>
      ) : null}
    </>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return null;
    }

    if (errorMsg) {
      return null;
    }

    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconContainer}>
          <FileText size={32} color="#94a3b8" strokeWidth={1.8} />
        </View>

        <Text style={styles.emptyTitle}>No Guidance Records Found</Text>

        <Text style={styles.emptyDescription}>
          You don't have any application records matching the selected status
          filter.
        </Text>

        {statusFilter ? (
          <Pressable
            onPress={() => setStatusFilter("")}
            style={({ pressed }) => [
              styles.clearFilterButton,
              pressed && styles.pressedLight,
            ]}
          >
            <X size={16} color="#0369a1" />

            <Text style={styles.clearFilterText}>Clear Filter</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={handleFindNewScheme}
          style={({ pressed }) => [
            styles.emptyActionButton,
            pressed && styles.pressed,
          ]}
        >
          <PlusCircle size={17} color="#ffffff" />

          <Text style={styles.emptyActionButtonText}>Find a Scheme</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Screen>
      <AppHeader title="Applications" />

      <View style={styles.container}>
        {isLoading ? (
          <FlatList
            data={[]}
            renderItem={renderApplication}
            ListHeaderComponent={
              <>
                {renderHeader()}

                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0284c7" />

                  <Text style={styles.loadingText}>
                    Loading application guidance records...
                  </Text>
                </View>
              </>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={applications}
            keyExtractor={(item) => String(item.application_id)}
            renderItem={renderApplication}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[
              styles.listContent,
              applications.length === 0 && styles.emptyListContent,
            ]}
            ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchApplications}
          />
        )}
      </View>

      <Modal
        visible={isFilterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsFilterVisible(false)}
          />

          <View style={styles.filterModal}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Filter Applications</Text>

                <Text style={styles.modalSubtitle}>
                  Select a guidance status
                </Text>
              </View>

              <Pressable
                onPress={() => setIsFilterVisible(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressedLight,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close filter"
              >
                <X size={21} color="#475569" />
              </Pressable>
            </View>

            <FlatList
              data={STATUS_OPTIONS}
              keyExtractor={(item) => item.value || "ALL"}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.filterOptions}
              renderItem={({ item }) => {
                const isSelected = item.value === statusFilter;

                return (
                  <Pressable
                    onPress={() => handleFilterSelect(item.value)}
                    style={({ pressed }) => [
                      styles.filterOption,
                      isSelected && styles.filterOptionSelected,
                      pressed && styles.pressedLight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        isSelected && styles.filterOptionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {isSelected ? (
                      <View style={styles.selectedIcon}>
                        <Check size={16} color="#0284c7" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  introCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  introIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  introTextContainer: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: "#0f172a",
  },

  pageSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
    marginTop: 6,
  },

  pageSubtitleSecondary: {
    fontSize: 11,
    lineHeight: 16,
    color: "#64748b",
    marginTop: 4,
  },

  actionRow: {
    marginTop: 12,
    gap: 10,
  },

  filterWrapper: {
    width: "100%",
  },

  filterButton: {
    minHeight: 54,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  filterTextContainer: {
    flex: 1,
    paddingRight: 10,
  },

  filterLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  filterValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginTop: 2,
  },

  findSchemeButton: {
    minHeight: 48,
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#0f172a",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },

  findSchemeButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  reminderCard: {
    marginTop: 12,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  reminderIconContainer: {
    marginTop: 1,
    marginRight: 10,
  },

  reminderTextContainer: {
    flex: 1,
  },

  reminderTitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#0c4a6e",
  },

  reminderDescription: {
    fontSize: 10.5,
    lineHeight: 16,
    color: "#075985",
    marginTop: 4,
  },

  errorCard: {
    marginTop: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  errorIconContainer: {
    marginRight: 10,
    marginTop: 1,
  },

  errorTextContainer: {
    flex: 1,
  },

  errorTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#991b1b",
  },

  errorMessage: {
    fontSize: 11,
    lineHeight: 16,
    color: "#b91c1c",
    marginTop: 3,
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fecaca",
  },

  retryButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#b91c1c",
  },

  recordsHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recordsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },

  recordsCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },

  applicationCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 15,
    shadowColor: "#0f172a",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 1,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  fileIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  cardTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  schemeName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 7,
  },

  statusBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: "100%",
  },

  statusBadgeText: {
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 13,
  },

  metadataContainer: {
    gap: 7,
  },

  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metadataLabel: {
    fontSize: 10.5,
    color: "#64748b",
    fontWeight: "600",
  },

  metadataValue: {
    flex: 1,
    marginLeft: 10,
    textAlign: "right",
    fontSize: 10.5,
    color: "#334155",
    fontWeight: "700",
  },

  checklistContainer: {
    marginTop: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 11,
  },

  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  checklistTitle: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "700",
  },

  checklistCount: {
    fontSize: 11,
    color: "#0369a1",
    fontWeight: "800",
  },

  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
    marginTop: 8,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#0284c7",
  },

  checklistDescription: {
    fontSize: 9.5,
    color: "#64748b",
    marginTop: 5,
  },

  viewButton: {
    minHeight: 46,
    marginTop: 13,
    backgroundColor: "#0284c7",
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  viewButtonText: {
    flex: 1,
    textAlign: "center",
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "800",
  },

  cardSeparator: {
    height: 10,
  },

  loadingContainer: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 10,
  },

  emptyCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 34,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  emptyIconContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 300,
    fontSize: 11,
    lineHeight: 17,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
  },

  clearFilterButton: {
    marginTop: 15,
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#bae6fd",
    backgroundColor: "#f0f9ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  clearFilterText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0369a1",
  },

  emptyActionButton: {
    minHeight: 42,
    marginTop: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#0284c7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  emptyActionButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },

  filterModal: {
    maxHeight: "82%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 9,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#cbd5e1",
    marginBottom: 14,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },

  modalSubtitle: {
    fontSize: 10.5,
    color: "#64748b",
    marginTop: 2,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  filterOptions: {
    paddingTop: 8,
    paddingBottom: 10,
  },

  filterOption: {
    minHeight: 50,
    paddingHorizontal: 12,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  filterOptionSelected: {
    backgroundColor: "#f0f9ff",
  },

  filterOptionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "#475569",
    fontWeight: "600",
    paddingRight: 10,
  },

  filterOptionTextSelected: {
    color: "#0369a1",
    fontWeight: "800",
  },

  selectedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },

  pressedLight: {
    opacity: 0.7,
  },
});
