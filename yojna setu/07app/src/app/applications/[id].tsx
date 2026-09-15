import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  MapPin,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from "lucide-react-native";

import Screen from "../../components/Screen";
import AppHeader from "../../components/AppHeader";

import { applicationApi } from "../../api/applicationApi";
import { schemeApi } from "../../api/schemeApi";

import type {
  ApplicationResponse,
  ApplicationDocument,
  SubmissionValidationResponse,
  Scheme,
} from "../../types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ApplicationStatus = string;

interface StatusHistoryItem {
  status?: string;
  created_at?: string;
  timestamp?: string;
  changed_at?: string;
  note?: string;
  remarks?: string;
  [key: string]: unknown;
}

interface Partner {
  partner_id: string;
  name?: string;
  business_name?: string;
  organization_name?: string;
  address?: string;
  city?: string;
  distance_km?: number;
  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const STATUS_COLORS: Record<
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
    background: "#fffbeb",
    border: "#fcd34d",
    text: "#92400e",
  },
  NEEDS_CORRECTION: {
    background: "#fffbeb",
    border: "#fcd34d",
    text: "#92400e",
  },
  MORE_INFORMATION_REQUIRED: {
    background: "#fffbeb",
    border: "#fcd34d",
    text: "#92400e",
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

function getStatusColors(status: string) {
  return (
    STATUS_COLORS[status] || {
      background: "#f1f5f9",
      border: "#cbd5e1",
      text: "#475569",
    }
  );
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Guidance Started",
    DOCUMENTS_PENDING: "Checklist Pending",
    READY_FOR_SUBMISSION: "Ready to Apply",
    SUBMITTED: "Submitted to Partner",
    UNDER_REVIEW: "Under Official Review",
    CORRECTION_REQUIRED: "Action Required",
    NEEDS_CORRECTION: "Action Required",
    MORE_INFORMATION_REQUIRED: "Information Required",
    APPROVED: "Approved",
    COMPLETED: "Completed / Benefit Disbursed",
    WITHDRAWN: "Withdrawn",
    REJECTED: "Rejected",
  };

  return labels[status] || status || "Guidance Started";
}

function formatDate(value?: string | null) {
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

function formatFileSize(bytes?: number | null) {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getErrorMessage(error: unknown) {
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

  return "Something went wrong. Please try again.";
}

function parseCorrectionFields(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }

      return [value];
    } catch {
      return [value];
    }
  }

  return [String(value)];
}

/* -------------------------------------------------------------------------- */
/* Status Badge                                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: string }) {
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
      >
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Timeline                                                                   */
/* -------------------------------------------------------------------------- */

function StatusTimeline({
  currentStatus,
  history,
  submittedAt,
}: {
  currentStatus: string;
  history?: StatusHistoryItem[];
  submittedAt?: string | null;
}) {
  const items = Array.isArray(history) ? history : [];

  const timeline = [...items];

  if (timeline.length === 0) {
    timeline.push({
      status: currentStatus,
      created_at: submittedAt || undefined,
    });
  }

  return (
    <View style={styles.timelineCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Clock size={18} color="#0284c7" />
        </View>

        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Application Status</Text>
          <Text style={styles.sectionSubtitle}>
            Track the progress of your guidance record
          </Text>
        </View>
      </View>

      <View style={styles.timeline}>
        {timeline.map((item, index) => {
          const status = item.status || currentStatus;
          const isLast = index === timeline.length - 1;
          const colors = getStatusColors(status);

          return (
            <View key={`${status}-${index}`} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Check size={13} color={colors.text} strokeWidth={2.8} />
                </View>

                {!isLast && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineStatus}>
                  {getStatusLabel(status)}
                </Text>

                {(item.created_at || item.timestamp || item.changed_at) && (
                  <Text style={styles.timelineDate}>
                    {formatDate(
                      item.created_at || item.timestamp || item.changed_at,
                    )}
                  </Text>
                )}

                {item.note || item.remarks ? (
                  <Text style={styles.timelineNote}>
                    {String(item.note || item.remarks)}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Official Portal Modal                                                      */
/* -------------------------------------------------------------------------- */

function OfficialPortalModal({
  visible,
  onClose,
  officialUrl,
  schemeName,
}: {
  visible: boolean;
  onClose: () => void;
  officialUrl?: string | null;
  schemeName: string;
}) {
  const handleOpenPortal = async () => {
    if (!officialUrl) {
      Alert.alert(
        "Official Portal Unavailable",
        "An official application portal link is not available for this scheme.",
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(officialUrl);

      if (!supported) {
        Alert.alert(
          "Unable to Open Portal",
          "Your device could not open this official portal link.",
        );
        return;
      }

      await Linking.openURL(officialUrl);
      onClose();
    } catch {
      Alert.alert(
        "Unable to Open Portal",
        "Something went wrong while opening the official government portal.",
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.portalModal}>
          <View style={styles.modalHandle} />

          <View style={styles.portalIcon}>
            <ExternalLink size={24} color="#d97706" />
          </View>

          <Text style={styles.portalTitle}>Apply on Official Portal</Text>

          <Text style={styles.portalSchemeName}>{schemeName}</Text>

          <Text style={styles.portalDescription}>
            You are about to leave YojnaSetu and open the verified official
            government application portal.
          </Text>

          <View style={styles.portalNotice}>
            <ShieldCheck size={18} color="#0369a1" />

            <Text style={styles.portalNoticeText}>
              Final application submission, document verification and approval
              are handled by the concerned government authority.
            </Text>
          </View>

          {officialUrl ? (
            <Text style={styles.portalUrl} numberOfLines={2}>
              {officialUrl}
            </Text>
          ) : (
            <Text style={styles.portalUnavailable}>
              Official portal link is currently unavailable.
            </Text>
          )}

          <Pressable
            onPress={handleOpenPortal}
            style={({ pressed }) => [
              styles.portalPrimaryButton,
              pressed && styles.pressed,
              !officialUrl && styles.disabledButton,
            ]}
            disabled={!officialUrl}
          >
            <Text style={styles.portalPrimaryText}>Open Official Portal</Text>

            <ExternalLink size={17} color="#ffffff" />
          </Pressable>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.portalCancelButton,
              pressed && styles.pressedLight,
            ]}
          >
            <Text style={styles.portalCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Application Detail Screen                                                  */
/* -------------------------------------------------------------------------- */

export default function ApplicationDetailScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const applicationId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [appData, setAppData] = useState<ApplicationResponse | null>(null);

  const [scheme, setScheme] = useState<Scheme | null>(null);

  const [validation, setValidation] =
    useState<SubmissionValidationResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const [withdrawReason, setWithdrawReason] = useState("");

  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [isUploading, setIsUploading] = useState<string | null>(null);

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  const [partners, setPartners] = useState<Partner[]>([]);

  const [isPartnersLoading, setIsPartnersLoading] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* Fetch Application                                                       */
  /* ---------------------------------------------------------------------- */

  const fetchApplicationDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await applicationApi.getApplicationById(id);

      setAppData(data);

      if (data.scheme_id) {
        try {
          const schemeData = await schemeApi.getSchemeById(
            String(data.scheme_id),
          );

          setScheme(schemeData);
        } catch (schemeError) {
          console.warn("Scheme details load note:", schemeError);
        }
      }

      if (
        [
          "DRAFT",
          "DOCUMENTS_PENDING",
          "READY_FOR_SUBMISSION",
          "CORRECTION_REQUIRED",
        ].includes(data.status)
      ) {
        try {
          const validationData = await applicationApi.validateSubmission(id);

          setValidation(validationData);
        } catch (validationError) {
          console.warn("Validation check error:", validationError);
        }
      }
    } catch (error) {
      setErrorMsg(
        `Failed to load application details. ${getErrorMessage(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetail(applicationId);
    } else {
      setIsLoading(false);
      setErrorMsg("Application ID was not provided.");
    }
  }, [applicationId, fetchApplicationDetail]);

  /* ---------------------------------------------------------------------- */
  /* Upload Document                                                         */
  /* ---------------------------------------------------------------------- */

  const handleFileUpload = async (document: ApplicationDocument) => {
    if (!applicationId) {
      return;
    }

    /*
     * React Native does not have the browser's <input type="file">.
     *
     * The native document-picker integration should provide a file
     * object/URI here. This handler intentionally keeps the API call
     * isolated so the backend upload contract remains unchanged.
     */

    try {
      const DocumentPicker = await import("expo-document-picker");

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/png", "image/jpeg"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      if (typeof asset.size === "number" && asset.size > 5 * 1024 * 1024) {
        Alert.alert(
          "File Too Large",
          `File size exceeds the 5MB limit (${(
            asset.size /
            1024 /
            1024
          ).toFixed(2)} MB).`,
        );
        return;
      }

      setIsUploading(document.app_document_id);
      setErrorMsg(null);
      setSuccessMsg(null);

      /*
       * The current API definition expects a browser File.
       * Expo returns a local URI instead.
       *
       * If applicationApi.uploadDocument has already been adapted
       * to accept an Expo file object, pass `asset` directly.
       *
       * Otherwise the API method needs a small native FormData
       * adaptation using:
       *
       * {
       *   uri: asset.uri,
       *   name: asset.name,
       *   type: asset.mimeType ?? 'application/octet-stream'
       * }
       */

      const nativeFile = {
        uri: asset.uri,
        name: asset.name || "document",
        type: asset.mimeType || "application/octet-stream",
      };

      await applicationApi.uploadDocument(
        applicationId,
        document.app_document_id,
        nativeFile as never,
      );

      setSuccessMsg(
        `Document "${document.document_name}" added to your personal checklist.`,
      );

      await fetchApplicationDetail(applicationId);
    } catch (error) {
      setErrorMsg(`Document upload failed. ${getErrorMessage(error)}`);
    } finally {
      setIsUploading(null);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Submit                                                                  */
  /* ---------------------------------------------------------------------- */

  const handleSubmitApplication = async () => {
    if (!applicationId || !selectedPartnerId) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await applicationApi.submitApplication(applicationId, selectedPartnerId);

      setSuccessMsg("Application successfully routed to the Channel Partner.");

      await fetchApplicationDetail(applicationId);
    } catch (error) {
      setErrorMsg(`Failed to submit application. ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Withdraw                                                                */
  /* ---------------------------------------------------------------------- */

  const handleWithdrawApplication = async () => {
    if (!applicationId) {
      return;
    }

    setIsWithdrawing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await applicationApi.withdrawApplication(
        applicationId,
        withdrawReason.trim() || undefined,
      );

      setSuccessMsg("Application successfully withdrawn.");

      setIsWithdrawModalOpen(false);
      setWithdrawReason("");

      await fetchApplicationDetail(applicationId);
    } catch (error) {
      setErrorMsg(`Failed to withdraw application. ${getErrorMessage(error)}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Derived State                                                           */
  /* ---------------------------------------------------------------------- */

  const officialUrl =
    scheme?.application_url ||
    scheme?.official_portal ||
    scheme?.official_source_url;

  const isActionRequired =
    appData &&
    [
      "CORRECTION_REQUIRED",
      "NEEDS_CORRECTION",
      "MORE_INFORMATION_REQUIRED",
    ].includes(appData.status);

  const canWithdraw =
    appData &&
    !["APPROVED", "REJECTED", "WITHDRAWN", "COMPLETED"].includes(
      appData.status,
    );

  const documents = (appData?.documents || []) as ApplicationDocument[];

  const uploadedCount = documents.filter(
    (document) => document.is_uploaded,
  ).length;

  const documentProgress = useMemo(() => {
    if (documents.length === 0) {
      return 0;
    }

    return Math.round((uploadedCount / documents.length) * 100);
  }, [documents.length, uploadedCount]);

  const correctionFields = parseCorrectionFields(appData?.correction_fields);

  const validationIssues = useMemo(() => {
    if (!validation) {
      return [];
    }

    const result: string[] = [];

    const value = validation as Record<string, unknown>;

    if (Array.isArray(value.missing_documents)) {
      result.push(...value.missing_documents.map(String));
    }

    if (Array.isArray(value.errors)) {
      result.push(...value.errors.map(String));
    }

    if (Array.isArray(value.missing_fields)) {
      result.push(...value.missing_fields.map(String));
    }

    return result;
  }, [validation]);

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                 */
  /* ---------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <Screen>
        <AppHeader title="Application Details" />

        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#0284c7" />

          <Text style={styles.loadingText}>
            Loading application guidance details...
          </Text>
        </View>
      </Screen>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Not Found                                                               */
  /* ---------------------------------------------------------------------- */

  if (!appData) {
    return (
      <Screen>
        <AppHeader title="Application Details" />

        <View style={styles.notFoundContainer}>
          <View style={styles.notFoundIcon}>
            <XCircle size={34} color="#dc2626" />
          </View>

          <Text style={styles.notFoundTitle}>Record Not Found</Text>

          <Text style={styles.notFoundDescription}>
            {errorMsg ||
              `Application guidance record with ID "${applicationId}" was not found.`}
          </Text>

          <Pressable
            onPress={() => router.replace("/applications")}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={17} color="#ffffff" />

            <Text style={styles.backButtonText}>Back to Guidance List</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Main UI                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <Screen>
      <AppHeader title="Application Details" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Back / Withdraw */}
        <View style={styles.topNavigation}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backLink,
              pressed && styles.pressedLight,
            ]}
          >
            <ArrowLeft size={17} color="#475569" />

            <Text style={styles.backLinkText}>Back to Guidance</Text>
          </Pressable>

          {canWithdraw ? (
            <Pressable
              onPress={() => setIsWithdrawModalOpen(true)}
              style={({ pressed }) => [
                styles.withdrawLink,
                pressed && styles.pressedLight,
              ]}
            >
              <Text style={styles.withdrawLinkText}>Withdraw</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <StatusBadge status={appData.status} />

            <Text style={styles.guidanceId} numberOfLines={1}>
              ID: {String(appData.application_id)}
            </Text>
          </View>

          <Text style={styles.schemeTitle}>
            {appData.scheme_name || `Scheme ${appData.scheme_id}`}
          </Text>

          <Text style={styles.dateText}>
            Created: {formatDate(appData.created_at)}
          </Text>

          <Text style={styles.dateText}>
            Last Updated: {formatDate(appData.updated_at)}
          </Text>

          <Pressable
            onPress={() => setIsPortalModalOpen(true)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Apply on Official Portal
            </Text>

            <ExternalLink size={17} color="#ffffff" />
          </Pressable>
        </View>

        {/* Action Required */}
        {isActionRequired ? (
          <View style={styles.actionRequiredCard}>
            <View style={styles.actionRequiredHeader}>
              <AlertTriangle size={22} color="#b45309" />

              <Text style={styles.actionRequiredTitle}>Action Required</Text>
            </View>

            <Text style={styles.actionRequiredDescription}>
              The reviewing channel partner authority has requested corrections
              or additional details for your application.
            </Text>

            {appData.correction_reason ? (
              <View style={styles.reviewerBox}>
                <Text style={styles.reviewerLabel}>Reviewer Remarks</Text>

                <Text style={styles.reviewerText}>
                  "{String(appData.correction_reason)}"
                </Text>
              </View>
            ) : null}

            {correctionFields.length > 0 ? (
              <View style={styles.correctionFieldsContainer}>
                <Text style={styles.correctionFieldsTitle}>
                  Specific Fields / Items Requiring Update
                </Text>

                <View style={styles.chipsContainer}>
                  {correctionFields.map((field, index) => (
                    <View
                      key={`${field}-${index}`}
                      style={styles.correctionChip}
                    >
                      <Text style={styles.correctionChipText}>• {field}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/applications/[id]",
                  params: {
                    id: String(appData.application_id),
                  },
                })
              }
              style={({ pressed }) => [
                styles.actionRequiredButton,
                pressed && styles.pressed,
              ]}
            >
              <Upload size={16} color="#ffffff" />

              <Text style={styles.actionRequiredButtonText}>
                Update Documents & Checklist
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Official Notice */}
        <View style={styles.noticeCard}>
          <ShieldCheck size={21} color="#0369a1" />

          <View style={styles.noticeTextContainer}>
            <Text style={styles.noticeTitle}>
              Official Application Guidance Notice
            </Text>

            <Text style={styles.noticeDescription}>
              YojnaSetu helps citizens organize documents and verify eligibility
              rules. Final application submission, document verification, and
              approval are performed on the official government website.
            </Text>
          </View>
        </View>

        {/* Messages */}
        {successMsg ? (
          <View style={styles.successCard}>
            <CheckCircle2 size={19} color="#047857" />

            <Text style={styles.successText}>{successMsg}</Text>

            <Pressable onPress={() => setSuccessMsg(null)}>
              <X size={17} color="#047857" />
            </Pressable>
          </View>
        ) : null}

        {errorMsg ? (
          <View style={styles.errorCard}>
            <AlertTriangle size={19} color="#b91c1c" />

            <Text style={styles.errorText}>{errorMsg}</Text>

            <Pressable onPress={() => setErrorMsg(null)}>
              <X size={17} color="#b91c1c" />
            </Pressable>
          </View>
        ) : null}

        {/* Document Checklist */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <FileText size={19} color="#d97706" />
            </View>

            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Document Checklist</Text>

              <Text style={styles.sectionSubtitle}>
                {uploadedCount} of {documents.length} documents checked
              </Text>
            </View>

            <Text style={styles.progressPercentage}>{documentProgress}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${documentProgress}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.documentIntro}>
            Organize your document files before applying on the official portal.
          </Text>

          {documents.length === 0 ? (
            <View style={styles.noDocumentsBox}>
              <FileText size={25} color="#94a3b8" />

              <Text style={styles.noDocumentsText}>
                No document checklist items are available.
              </Text>
            </View>
          ) : (
            <View style={styles.documentsList}>
              {documents.map((document) => {
                const uploading = isUploading === document.app_document_id;

                return (
                  <View
                    key={document.app_document_id}
                    style={styles.documentItem}
                  >
                    <View style={styles.documentHeader}>
                      <View style={styles.documentTitleContainer}>
                        <View style={styles.documentNameRow}>
                          {document.is_uploaded ? (
                            <CheckCircle2 size={17} color="#059669" />
                          ) : (
                            <FileText size={17} color="#64748b" />
                          )}

                          <Text style={styles.documentName}>
                            {document.document_name}
                          </Text>
                        </View>

                        <View style={styles.requirementBadge}>
                          <Text style={styles.requirementText}>
                            {document.requirement_type}
                          </Text>
                        </View>
                      </View>

                      {document.is_uploaded ? (
                        <View style={styles.uploadedBadge}>
                          <CheckCircle2 size={13} color="#059669" />

                          <Text style={styles.uploadedBadgeText}>ADDED</Text>
                        </View>
                      ) : (
                        <View style={styles.optionalBadge}>
                          <Clock size={13} color="#d97706" />

                          <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                        </View>
                      )}
                    </View>

                    {document.condition ? (
                      <Text style={styles.documentCondition}>
                        {document.condition}
                      </Text>
                    ) : null}

                    <View style={styles.documentDivider} />

                    {document.is_uploaded ? (
                      <View style={styles.fileInfoRow}>
                        <FileCheck2 size={17} color="#059669" />

                        <View style={styles.fileInfoTextContainer}>
                          <Text style={styles.fileInfoLabel}>File</Text>

                          <Text style={styles.fileName} numberOfLines={2}>
                            {document.file_name || "Uploaded document"}
                          </Text>

                          <Text style={styles.fileSize}>
                            {formatFileSize(document.file_size_bytes)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.noFileText}>
                        No document file added yet
                      </Text>
                    )}

                    <Pressable
                      onPress={() => handleFileUpload(document)}
                      disabled={uploading}
                      style={({ pressed }) => [
                        styles.uploadButton,
                        pressed && styles.pressedLight,
                        uploading && styles.uploadButtonDisabled,
                      ]}
                    >
                      {uploading ? (
                        <ActivityIndicator size="small" color="#0284c7" />
                      ) : (
                        <Upload size={16} color="#0284c7" />
                      )}

                      <Text style={styles.uploadButtonText}>
                        {uploading
                          ? "Uploading..."
                          : document.is_uploaded
                            ? "Re-upload File"
                            : "Upload File"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.disclaimer}>
            * Final document requirements may vary. Please verify them on the
            official application portal.
          </Text>
        </View>

        {/* Validation */}
        {validation ? (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                {validationIssues.length === 0 ? (
                  <CheckCircle2 size={19} color="#059669" />
                ) : (
                  <AlertTriangle size={19} color="#d97706" />
                )}
              </View>

              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Submission Readiness</Text>

                <Text style={styles.sectionSubtitle}>
                  {validationIssues.length === 0
                    ? "Your current record is ready for the next step."
                    : "Some items may require your attention."}
                </Text>
              </View>
            </View>

            {validationIssues.length === 0 ? (
              <View style={styles.validationSuccess}>
                <CheckCircle2 size={18} color="#047857" />

                <Text style={styles.validationSuccessText}>
                  No missing validation items were reported.
                </Text>
              </View>
            ) : (
              <View style={styles.validationIssues}>
                {validationIssues.map((issue, index) => (
                  <View
                    key={`${issue}-${index}`}
                    style={styles.validationIssue}
                  >
                    <XCircle size={15} color="#dc2626" />

                    <Text style={styles.validationIssueText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* Partner Routing */}
        {[
          "DRAFT",
          "DOCUMENTS_PENDING",
          "READY_FOR_SUBMISSION",
          "CORRECTION_REQUIRED",
        ].includes(appData.status) ? (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MapPin size={19} color="#4f46e5" />
              </View>

              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Channel Partner</Text>

                <Text style={styles.sectionSubtitle}>
                  Select a partner before routing your application.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setIsPartnerModalOpen(true)}
              style={({ pressed }) => [
                styles.partnerSelectButton,
                pressed && styles.pressedLight,
              ]}
            >
              <View style={styles.partnerSelectText}>
                <Text style={styles.partnerSelectLabel}>Selected Partner</Text>

                <Text style={styles.partnerSelectValue}>
                  {selectedPartnerId || "Select a channel partner"}
                </Text>
              </View>

              <MapPin size={18} color="#4f46e5" />
            </Pressable>

            <Pressable
              onPress={handleSubmitApplication}
              disabled={!selectedPartnerId || isSubmitting}
              style={({ pressed }) => [
                styles.submitPartnerButton,
                pressed && styles.pressed,
                (!selectedPartnerId || isSubmitting) && styles.disabledButton,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitPartnerButtonText}>
                  Submit to Channel Partner
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* Ready to Apply */}
        <View style={styles.readyCard}>
          <View style={styles.readyHeader}>
            <ExternalLink size={19} color="#fbbf24" />

            <Text style={styles.readyTitle}>Ready to Apply?</Text>
          </View>

          <Text style={styles.readyDescription}>
            When you are ready, open the verified official portal and complete
            your application there.
          </Text>

          <Pressable
            onPress={() => setIsPortalModalOpen(true)}
            style={({ pressed }) => [
              styles.readyButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.readyButtonText}>Apply on Official Portal</Text>

            <ExternalLink size={16} color="#ffffff" />
          </Pressable>
        </View>

        {/* Timeline */}
        <StatusTimeline
          currentStatus={appData.status}
          history={appData.status_history as StatusHistoryItem[] | undefined}
          submittedAt={appData.submitted_at}
        />
      </ScrollView>

      {/* Official Portal Modal */}
      <OfficialPortalModal
        visible={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        officialUrl={officialUrl}
        schemeName={appData.scheme_name || `Scheme ${appData.scheme_id}`}
      />

      {/* Withdraw Modal */}
      <Modal
        visible={isWithdrawModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsWithdrawModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsWithdrawModalOpen(false)}
          />

          <View style={styles.withdrawModal}>
            <View style={styles.modalHandle} />

            <View style={styles.withdrawHeader}>
              <View style={styles.withdrawIcon}>
                <AlertTriangle size={21} color="#e11d48" />
              </View>

              <View style={styles.withdrawHeaderText}>
                <Text style={styles.withdrawTitle}>Withdraw Application</Text>

                <Text style={styles.withdrawSubtitle}>
                  Confirm withdrawing your active application
                </Text>
              </View>

              <Pressable
                onPress={() => setIsWithdrawModalOpen(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#475569" />
              </Pressable>
            </View>

            <Text style={styles.withdrawDescription}>
              Are you sure you want to withdraw this application? This action
              will mark your application status as{" "}
              <Text style={styles.withdrawBold}>WITHDRAWN</Text>.
            </Text>

            <Text style={styles.inputLabel}>
              Reason for Withdrawal (Optional)
            </Text>

            <TextInput
              value={withdrawReason}
              onChangeText={setWithdrawReason}
              placeholder="e.g. Applied via alternate scheme / No longer pursuing..."
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              style={styles.reasonInput}
              maxLength={500}
            />

            <View style={styles.withdrawActions}>
              <Pressable
                onPress={() => setIsWithdrawModalOpen(false)}
                disabled={isWithdrawing}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressedLight,
                ]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleWithdrawApplication}
                disabled={isWithdrawing}
                style={({ pressed }) => [
                  styles.confirmWithdrawButton,
                  pressed && styles.pressed,
                  isWithdrawing && styles.disabledButton,
                ]}
              >
                {isWithdrawing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmWithdrawText}>
                    Confirm Withdrawal
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Partner Modal */}
      <Modal
        visible={isPartnerModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPartnerModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsPartnerModalOpen(false)}
          />

          <View style={styles.partnerModal}>
            <View style={styles.modalHandle} />

            <View style={styles.partnerModalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Channel Partner</Text>

                <Text style={styles.modalSubtitle}>
                  Choose the partner responsible for assisted submission.
                </Text>
              </View>

              <Pressable
                onPress={() => setIsPartnerModalOpen(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#475569" />
              </Pressable>
            </View>

            {isPartnersLoading ? (
              <View style={styles.partnerLoading}>
                <ActivityIndicator size="large" color="#4f46e5" />

                <Text style={styles.partnerLoadingText}>
                  Loading partners...
                </Text>
              </View>
            ) : partners.length === 0 ? (
              <View style={styles.noPartners}>
                <MapPin size={30} color="#94a3b8" />

                <Text style={styles.noPartnersTitle}>
                  Partner selection unavailable
                </Text>

                <Text style={styles.noPartnersDescription}>
                  No channel partner list is currently available through the
                  mobile API.
                </Text>
              </View>
            ) : (
              <FlatList
                data={partners}
                keyExtractor={(item) => item.partner_id}
                contentContainerStyle={styles.partnerList}
                renderItem={({ item }) => {
                  const isSelected = selectedPartnerId === item.partner_id;

                  return (
                    <Pressable
                      onPress={() => {
                        setSelectedPartnerId(item.partner_id);
                        setIsPartnerModalOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.partnerItem,
                        isSelected && styles.partnerItemSelected,
                        pressed && styles.pressedLight,
                      ]}
                    >
                      <View style={styles.partnerItemIcon}>
                        <MapPin size={18} color="#4f46e5" />
                      </View>

                      <View style={styles.partnerItemText}>
                        <Text style={styles.partnerName}>
                          {item.name ||
                            item.business_name ||
                            item.organization_name ||
                            item.partner_id}
                        </Text>

                        {item.address || item.city ? (
                          <Text style={styles.partnerAddress}>
                            {[item.address, item.city]
                              .filter(Boolean)
                              .join(", ")}
                          </Text>
                        ) : null}
                      </View>

                      {isSelected ? <Check size={19} color="#4f46e5" /> : null}
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 500,
  },

  loadingText: {
    marginTop: 11,
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },

  notFoundContainer: {
    margin: 16,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 500,
    padding: 25,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
  },

  notFoundIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  notFoundTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },

  notFoundDescription: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    color: "#64748b",
    textAlign: "center",
    maxWidth: 300,
  },

  backButton: {
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius: 11,
    backgroundColor: "#0284c7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  backButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  topNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  backLink: {
    minHeight: 38,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  backLinkText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "800",
  },

  withdrawLink: {
    minHeight: 38,
    paddingHorizontal: 5,
    justifyContent: "center",
  },

  withdrawLinkText: {
    fontSize: 11,
    color: "#e11d48",
    fontWeight: "800",
  },

  headerCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 1,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: "70%",
  },

  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
  },

  guidanceId: {
    flex: 1,
    marginLeft: 9,
    fontSize: 10,
    color: "#64748b",
    fontWeight: "700",
    textAlign: "right",
  },

  schemeTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
    color: "#0f172a",
  },

  dateText: {
    marginTop: 4,
    fontSize: 10.5,
    color: "#64748b",
  },

  primaryButton: {
    minHeight: 46,
    marginTop: 15,
    borderRadius: 11,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  actionRequiredCard: {
    marginTop: 12,
    backgroundColor: "#fffbeb",
    borderWidth: 2,
    borderColor: "#fbbf24",
    borderRadius: 18,
    padding: 15,
  },

  actionRequiredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  actionRequiredTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
    color: "#78350f",
  },

  actionRequiredDescription: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    color: "#92400e",
  },

  reviewerBox: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 12,
  },

  reviewerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#92400e",
  },

  reviewerText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: "#334155",
    fontStyle: "italic",
  },

  correctionFieldsContainer: {
    marginTop: 12,
  },

  correctionFieldsTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#92400e",
  },

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 7,
  },

  correctionChip: {
    backgroundColor: "#fde68a",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  correctionChipText: {
    fontSize: 10,
    color: "#78350f",
    fontWeight: "800",
  },

  actionRequiredButton: {
    minHeight: 44,
    marginTop: 13,
    backgroundColor: "#b45309",
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  actionRequiredButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },

  noticeCard: {
    marginTop: 12,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  noticeTextContainer: {
    flex: 1,
    marginLeft: 9,
  },

  noticeTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0c4a6e",
  },

  noticeDescription: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 16,
    color: "#075985",
  },

  successCard: {
    marginTop: 12,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 13,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  successText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#047857",
    fontWeight: "700",
  },

  errorCard: {
    marginTop: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 13,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  errorText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#b91c1c",
    fontWeight: "700",
  },

  card: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 15,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderText: {
    flex: 1,
    marginLeft: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
    color: "#64748b",
  },

  progressPercentage: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0284c7",
  },

  progressTrack: {
    height: 7,
    marginTop: 13,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#0284c7",
    borderRadius: 999,
  },

  documentIntro: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 15,
    color: "#64748b",
  },

  documentsList: {
    marginTop: 13,
    gap: 10,
  },

  documentItem: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
  },

  documentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  documentTitleContainer: {
    flex: 1,
    paddingRight: 8,
  },

  documentNameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  documentName: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "#0f172a",
    fontWeight: "800",
  },

  requirementBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    marginLeft: 24,
    backgroundColor: "#e2e8f0",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  requirementText: {
    fontSize: 8.5,
    color: "#475569",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  uploadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  uploadedBadgeText: {
    fontSize: 8,
    color: "#047857",
    fontWeight: "900",
  },

  optionalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  optionalBadgeText: {
    fontSize: 8,
    color: "#92400e",
    fontWeight: "800",
  },

  documentCondition: {
    marginTop: 7,
    marginLeft: 24,
    fontSize: 10,
    lineHeight: 15,
    color: "#64748b",
  },

  documentDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 10,
  },

  fileInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  fileInfoTextContainer: {
    flex: 1,
    marginLeft: 7,
  },

  fileInfoLabel: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "700",
  },

  fileName: {
    marginTop: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: "#334155",
    fontWeight: "700",
  },

  fileSize: {
    marginTop: 2,
    fontSize: 9,
    color: "#64748b",
  },

  noFileText: {
    fontSize: 10,
    color: "#64748b",
    fontStyle: "italic",
  },

  uploadButton: {
    minHeight: 40,
    marginTop: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  uploadButtonText: {
    fontSize: 10.5,
    color: "#0369a1",
    fontWeight: "800",
  },

  uploadButtonDisabled: {
    opacity: 0.6,
  },

  disclaimer: {
    marginTop: 13,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#64748b",
    fontStyle: "italic",
  },

  noDocumentsBox: {
    marginTop: 13,
    padding: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    alignItems: "center",
  },

  noDocumentsText: {
    marginTop: 7,
    fontSize: 10.5,
    color: "#64748b",
    textAlign: "center",
  },

  validationSuccess: {
    marginTop: 12,
    padding: 11,
    backgroundColor: "#ecfdf5",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  validationSuccessText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: "#047857",
    fontWeight: "700",
  },

  validationIssues: {
    marginTop: 12,
    gap: 7,
  },

  validationIssue: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  validationIssueText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: "#b91c1c",
  },

  partnerSelectButton: {
    marginTop: 13,
    minHeight: 58,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  partnerSelectText: {
    flex: 1,
  },

  partnerSelectLabel: {
    fontSize: 9,
    color: "#6366f1",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  partnerSelectValue: {
    marginTop: 3,
    fontSize: 11,
    color: "#3730a3",
    fontWeight: "800",
  },

  submitPartnerButton: {
    minHeight: 46,
    marginTop: 10,
    backgroundColor: "#4f46e5",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  submitPartnerButtonText: {
    fontSize: 11.5,
    color: "#ffffff",
    fontWeight: "800",
  },

  readyCard: {
    marginTop: 12,
    backgroundColor: "#0f172a",
    borderRadius: 18,
    padding: 16,
  },

  readyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  readyTitle: {
    fontSize: 13,
    color: "#fbbf24",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  readyDescription: {
    marginTop: 8,
    fontSize: 10.5,
    lineHeight: 17,
    color: "#cbd5e1",
  },

  readyButton: {
    minHeight: 44,
    marginTop: 12,
    backgroundColor: "#f59e0b",
    borderRadius: 10,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  readyButtonText: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "800",
  },

  timelineCard: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 15,
  },

  timeline: {
    marginTop: 15,
  },

  timelineRow: {
    flexDirection: "row",
  },

  timelineRail: {
    width: 31,
    alignItems: "center",
  },

  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  timelineLine: {
    width: 1,
    flex: 1,
    minHeight: 35,
    backgroundColor: "#cbd5e1",
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 9,
    paddingBottom: 18,
  },

  timelineStatus: {
    fontSize: 11.5,
    lineHeight: 17,
    color: "#1e293b",
    fontWeight: "800",
  },

  timelineDate: {
    marginTop: 2,
    fontSize: 9.5,
    color: "#64748b",
  },

  timelineNote: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: "#475569",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#cbd5e1",
    marginBottom: 15,
  },

  portalModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 28,
  },

  portalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 11,
  },

  portalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
  },

  portalSchemeName: {
    marginTop: 5,
    fontSize: 12,
    color: "#475569",
    fontWeight: "700",
    textAlign: "center",
  },

  portalDescription: {
    marginTop: 13,
    fontSize: 11,
    lineHeight: 17,
    color: "#475569",
    textAlign: "center",
  },

  portalNotice: {
    marginTop: 13,
    padding: 11,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  portalNoticeText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: "#075985",
  },

  portalUrl: {
    marginTop: 11,
    fontSize: 9,
    lineHeight: 14,
    color: "#64748b",
  },

  portalUnavailable: {
    marginTop: 11,
    fontSize: 10,
    color: "#b91c1c",
    textAlign: "center",
  },

  portalPrimaryButton: {
    minHeight: 46,
    marginTop: 15,
    borderRadius: 11,
    backgroundColor: "#f59e0b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  portalPrimaryText: {
    fontSize: 11.5,
    color: "#ffffff",
    fontWeight: "800",
  },

  portalCancelButton: {
    minHeight: 44,
    marginTop: 8,
    borderRadius: 11,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  portalCancelText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "800",
  },

  withdrawModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 28,
  },

  withdrawHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  withdrawIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#ffe4e6",
    alignItems: "center",
    justifyContent: "center",
  },

  withdrawHeaderText: {
    flex: 1,
    marginLeft: 10,
  },

  withdrawTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },

  withdrawSubtitle: {
    marginTop: 2,
    fontSize: 9.5,
    color: "#64748b",
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  withdrawDescription: {
    marginTop: 15,
    fontSize: 11,
    lineHeight: 17,
    color: "#475569",
  },

  withdrawBold: {
    fontWeight: "900",
    color: "#b91c1c",
  },

  inputLabel: {
    marginTop: 15,
    marginBottom: 6,
    fontSize: 10.5,
    color: "#334155",
    fontWeight: "800",
  },

  reasonInput: {
    minHeight: 90,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 11,
    lineHeight: 16,
    color: "#334155",
    backgroundColor: "#ffffff",
  },

  withdrawActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },

  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "800",
  },

  confirmWithdrawButton: {
    flex: 1.4,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  confirmWithdrawText: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "800",
  },

  partnerModal: {
    maxHeight: "78%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 25,
  },

  partnerModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: "#64748b",
    maxWidth: 280,
  },

  partnerList: {
    paddingTop: 9,
    paddingBottom: 10,
  },

  partnerItem: {
    minHeight: 62,
    borderRadius: 12,
    paddingHorizontal: 11,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  partnerItemSelected: {
    backgroundColor: "#eef2ff",
  },

  partnerItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },

  partnerItemText: {
    flex: 1,
    marginLeft: 9,
    paddingRight: 8,
  },

  partnerName: {
    fontSize: 11.5,
    color: "#1e293b",
    fontWeight: "800",
  },

  partnerAddress: {
    marginTop: 2,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#64748b",
  },

  partnerLoading: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },

  partnerLoadingText: {
    marginTop: 9,
    fontSize: 10.5,
    color: "#64748b",
  },

  noPartners: {
    minHeight: 190,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  noPartnersTitle: {
    marginTop: 9,
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },

  noPartnersDescription: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 16,
    color: "#64748b",
    textAlign: "center",
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },

  pressedLight: {
    opacity: 0.7,
  },

  disabledButton: {
    opacity: 0.5,
  },
});
