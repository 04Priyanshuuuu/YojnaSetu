import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  MessageSquare,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import Screen from "../../components/Screen";
import { partnerApi } from "../../api/partnerApi";

type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | string;

interface ApplicationDocument {
  app_document_id: string;
  document_name: string;
  requirement_type?: string | null;
  verification_status?: string | null;
  is_uploaded?: boolean;
  file_name?: string | null;
  uploaded_at?: string | null;
}

interface ReviewNote {
  note_id: string;
  author_role?: string | null;
  author_id?: string | null;
  created_at?: string | null;
  content?: string | null;
}

interface StatusHistoryItem {
  status?: string | null;
  changed_at?: string | null;
  created_at?: string | null;
  changed_by?: string | null;
  actor_id?: string | null;
  note?: string | null;
  reason?: string | null;
}

interface ApplicationData {
  application_id: string;
  scheme_id?: string | null;
  scheme_name?: string | null;
  user_id?: string | null;
  status: ApplicationStatus;
  documents: ApplicationDocument[];
  review_notes?: ReviewNote[];
  status_history?: StatusHistoryItem[];
  submitted_at?: string | null;
}

interface ApprovalReadiness {
  can_approve: boolean;
  message: string;
  blocking_documents: string[];
}

type ModalType =
  | "documentReject"
  | "finalReject"
  | "correction"
  | null;

export default function PartnerDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const applicationId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [appData, setAppData] = useState<ApplicationData | null>(null);
  const [readiness, setReadiness] =
    useState<ApprovalReadiness | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [noteText, setNoteText] = useState("");

  const [activeModal, setActiveModal] =
    useState<ModalType>(null);

  const [rejectingDoc, setRejectingDoc] =
    useState<ApplicationDocument | null>(null);

  const [docRejectReason, setDocRejectReason] = useState("");
  const [finalRejectReason, setFinalRejectReason] = useState("");

  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionFields, setCorrectionFields] = useState("");

  const [isActionLoading, setIsActionLoading] = useState(false);

  const [isCompleteModalOpen, setIsCompleteModalOpen] =
  useState(false);

const [completionNotes, setCompletionNotes] =
  useState("");

  const { role } = useAuth();

  const isDecisionMaker =
    role === "PARTNER_ADMIN" ||
    role === "SYSTEM_ADMIN";

  const isFinalized =
  appData?.status === "APPROVED" ||
  appData?.status === "REJECTED" ||
  appData?.status === "COMPLETED";

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const fetchDetail = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const data =
          await partnerApi.getPartnerApplicationDetail(id);

        setAppData(data as ApplicationData);

        try {
          const readinessData =
            await partnerApi.checkApprovalReadiness(id);

          setReadiness(
            readinessData as ApprovalReadiness,
          );
        } catch (readinessError) {
          console.error(
            "Readiness check error:",
            readinessError,
          );
          setReadiness(null);
        }
      } catch (err: any) {
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          "Unknown error";

        setErrorMsg(
          `Failed to load application detail. ${detail}`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (applicationId) {
      fetchDetail(applicationId);
    } else {
      setIsLoading(false);
      setErrorMsg(
        t(
          "partner.appNotFound",
          "Application ID is missing.",
        ),
      );
    }
  }, [applicationId, fetchDetail, t]);

  const closeModal = () => {
    if (isActionLoading) return;

    setActiveModal(null);

    setRejectingDoc(null);
    setDocRejectReason("");
    setFinalRejectReason("");
    setCorrectionReason("");
    setCorrectionFields("");
  };

  /**
   * Verify document
   */
  const handleVerifyDocument = async (
    documentId: string,
  ) => {
    if (!applicationId) return;

    clearMessages();
    setIsActionLoading(true);

    try {
      await partnerApi.reviewDocument(
        applicationId,
        documentId,
        {
          verification_status: "VERIFIED",
          reason:
            "Document verified against authentic records.",
        },
      );

      setSuccessMsg(
        "Document verified successfully.",
      );

      await fetchDetail(applicationId);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Unknown error";

      setErrorMsg(
        `Document verification failed: ${detail}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Reject document
   */
  const handleRejectDocument = async () => {
    if (
      !applicationId ||
      !rejectingDoc ||
      !docRejectReason.trim()
    ) {
      return;
    }

    clearMessages();
    setIsActionLoading(true);

    try {
      await partnerApi.reviewDocument(
        applicationId,
        rejectingDoc.app_document_id,
        {
          verification_status: "REJECTED",
          reason: docRejectReason.trim(),
        },
      );

      setSuccessMsg(
        `Document "${rejectingDoc.document_name}" rejected.`,
      );

      closeModal();
      await fetchDetail(applicationId);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Unknown error";

      setErrorMsg(
        `Document rejection failed: ${detail}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Add internal note
   */
  const handleAddNote = async () => {
    if (!applicationId || !noteText.trim()) {
      return;
    }

    clearMessages();
    setIsActionLoading(true);

    try {
      await partnerApi.addReviewNote(
        applicationId,
        noteText.trim(),
      );

      setNoteText("");

      setSuccessMsg("Internal note added.");

      await fetchDetail(applicationId);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Unknown error";

      setErrorMsg(
        `Add Note Error: ${detail}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Final approval
   */
  const executeApproval = async () => {
    if (!applicationId) return;

    clearMessages();
    setIsActionLoading(true);

    try {
      const updated =
        await partnerApi.processReviewDecision(
          applicationId,
          {
            decision: "APPROVED",
            reason:
              "All criteria and document verifications passed cleanly.",
          },
        );

      setAppData(updated as ApplicationData);

      setSuccessMsg(
        "Application APPROVED successfully!",
      );
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Unknown error";

      setErrorMsg(
        `Approval decision failed: ${detail}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApprove = () => {
    if (!applicationId) return;

    if (
      readiness &&
      !readiness.can_approve
    ) {
      Alert.alert(
        "Approval blocked",
        readiness.message ||
          "This application is not ready for approval.",
      );
      return;
    }

    Alert.alert(
      "Confirm Approval",
      "Confirm final approval decision for this application?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: executeApproval,
        },
      ],
    );
  };

  /**
   * Final rejection
   */
  const handleRejectFinal = async () => {
    if (
      !applicationId ||
      !finalRejectReason.trim()
    ) {
      return;
    }

    clearMessages();
    setIsActionLoading(true);

    try {
      const updated =
        await partnerApi.processReviewDecision(
          applicationId,
          {
            decision: "REJECTED",
            reason: finalRejectReason.trim(),
          },
        );

      setAppData(updated as ApplicationData);

      closeModal();

      setSuccessMsg(
        "Application REJECTED.",
      );
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Unknown error";

      setErrorMsg(
        `Rejection decision failed: ${detail}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Request correction
   */
  const handleRequestCorrection = async () => {
    if (
      !applicationId ||
      !correctionReason.trim()
    ) {
      return;
    }

    clearMessages();
    setIsActionLoading(true);

    try {
      const updated =
        await partnerApi.requestCorrection(
          applicationId,
          {
            reason: correctionReason.trim(),
            correction_fields:
              correctionFields
                ? correctionFields
                    .split(",")
                    .map((field) => field.trim())
                    .filter(Boolean)
                : [],
          },
        );

      setAppData(updated as ApplicationData);

      closeModal();

      setSuccessMsg(
        "Correction request sent to beneficiary.",
      );
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Unknown error";

      setErrorMsg(
        `Request correction failed: ${detail}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Mark completed / benefit disbursed
   */
  const executeMarkCompleted = async (
    notes: string,
  ) => {
    if (!applicationId) return;

    clearMessages();
    setIsActionLoading(true);

    try {
      const updated =
        await partnerApi.completeApplication(
          applicationId,
          notes,
        );

      setAppData(updated as ApplicationData);

      setSuccessMsg(
        "Application marked COMPLETED / Benefit Disbursed successfully!",
      );
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Unknown error";

      setErrorMsg(
        `Mark completed failed: ${detail}`,
      );
    } finally {
      setIsActionLoading(false);
    }
  };

 const handleMarkCompleted = () => {
  setCompletionNotes("");
  setIsCompleteModalOpen(true);
};


const handleCompleteSubmit = async () => {
  if (!applicationId) return;

  clearMessages();
  setIsActionLoading(true);

  try {
    const updated =
      await partnerApi.completeApplication(
        applicationId,
        completionNotes.trim(),
      );

    setAppData(updated as ApplicationData);

    setIsCompleteModalOpen(false);
    setCompletionNotes("");

    setSuccessMsg(
      "Application marked COMPLETED / Benefit Disbursed successfully!",
    );
  } catch (err: any) {
    const detail =
      err?.response?.data?.detail ||
      err?.message ||
      "Unknown error";

    setErrorMsg(
      `Mark completed failed: ${detail}`,
    );
  } finally {
    setIsActionLoading(false);
  }
};

  /**
   * Loading
   */
  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            accessibilityLabel="Loading"
          />

          <Text style={styles.loadingText}>
            {t(
              "partner.loadingWorkspace",
              "Loading partner review workspace...",
            )}
          </Text>
        </View>
      </Screen>
    );
  }

  /**
   * Not found / inaccessible
   */
  if (!appData) {
    return (
      <Screen scrollable>
        <View style={styles.errorPage}>
          <AlertBanner
            type="error"
            title={t(
              "partner.accessRestriction",
              "Access Restriction",
            )}
            message={
              errorMsg ||
              t(
                "partner.appNotFound",
                "Application not found or inaccessible.",
              )
            }
          />

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft
              size={18}
              color="#334155"
            />

            <Text style={styles.backButtonText}>
              {t(
                "partner.backToQueue",
                "Back to Queue",
              )}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const documents = appData.documents || [];
  const reviewNotes = appData.review_notes || [];
  const statusHistory =
    appData.status_history || [];

  return (
    <Screen scrollable>
      <View style={styles.container}>
        {/* Back */}
        <Pressable
          style={styles.topBackButton}
          onPress={() => router.back()}
        >
          <ArrowLeft
            size={18}
            color="#475569"
          />

          <Text style={styles.topBackText}>
            {t(
              "partner.backToQueueList",
              "Back to Queue List",
            )}
          </Text>
        </Pressable>

        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerMain}>
            <View style={styles.statusRow}>
              <StatusBadge
                status={appData.status}
              />

              <Text style={styles.appId}>
                {t(
                  "partner.appId",
                  "App ID: {{id}}",
                  {
                    id: appData.application_id,
                  },
                )}
              </Text>
            </View>

            <Text style={styles.title}>
              {appData.scheme_name ||
                `Scheme ${appData.scheme_id || ""}`}
            </Text>

            <Text style={styles.beneficiaryId}>
              {t(
                "partner.beneficiaryUserId",
                "Beneficiary User ID: {{id}}",
                {
                  id: appData.user_id || "—",
                },
              )}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.headerActions}>
            {appData.status === "APPROVED" &&
              isDecisionMaker && (
                <ActionButton
                  label={t(
                    "partner.markCompletedBtn",
                    "Mark Completed / Benefit Disbursed",
                  )}
                  icon={
                    <ShieldCheck
                      size={17}
                      color="#FFFFFF"
                    />
                  }
                  variant="success"
                  onPress={handleMarkCompleted}
                  disabled={isActionLoading}
                />
              )}

            {!isFinalized && (
              <>
                <ActionButton
                  label={t(
                    "partner.requestCorrectionBtn",
                    "Request Correction",
                  )}
                  icon={
                    <AlertTriangle
                      size={17}
                      color="#FFFFFF"
                    />
                  }
                  variant="warning"
                  onPress={() =>
                    setActiveModal("correction")
                  }
                  disabled={isActionLoading}
                />

                {isDecisionMaker && (
                  <>
                    <ActionButton
                      label={t(
                        "partner.rejectAppBtn",
                        "Reject Application",
                      )}
                      icon={
                        <XCircle
                          size={17}
                          color="#FFFFFF"
                        />
                      }
                      variant="danger"
                      onPress={() =>
                        setActiveModal("finalReject")
                      }
                      disabled={isActionLoading}
                    />

                    <ActionButton
                      label={t(
                        "partner.issueApprovalBtn",
                        "Issue Approval Decision",
                      )}
                      icon={
                        <CheckCircle2
                          size={17}
                          color="#FFFFFF"
                        />
                      }
                      variant="success"
                      onPress={handleApprove}
                      disabled={
                        isActionLoading ||
                        Boolean(
                          readiness &&
                            !readiness.can_approve,
                        )
                      }
                    />
                  </>
                )}
              </>
            )}
          </View>
        </View>

        {/* Messages */}
        {successMsg && (
          <AlertBanner
            type="success"
            message={successMsg}
          />
        )}

        {errorMsg && (
          <AlertBanner
            type="error"
            message={errorMsg}
          />
        )}

        {/* Approval Readiness */}
        {readiness && !isFinalized && (
          <AlertBanner
            type={
              readiness.can_approve
                ? "success"
                : "warning"
            }
            title={t(
              "partner.approvalReadinessStatus",
              "Approval Readiness Status",
            )}
            message={readiness.message}
            extra={
              readiness.blocking_documents
                ?.length > 0
                ? `Unverified Documents: ${readiness.blocking_documents.join(
                    ", ",
                  )}`
                : undefined
            }
          />
        )}

        {/* Documents */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <FileCheck2
              size={21}
              color="#D97706"
            />

            <Text style={styles.sectionTitle}>
              {t(
                "partner.docQueueTitle",
                "Document Verification Queue ({{count}})",
                {
                  count: documents.length,
                },
              )}
            </Text>
          </View>

          <View style={styles.sectionDivider} />

          {documents.length === 0 ? (
            <EmptyState text="No documents available." />
          ) : (
            documents.map((doc) => (
              <DocumentCard
                key={doc.app_document_id}
                document={doc}
                isFinalized={isFinalized}
                isLoading={isActionLoading}
                onVerify={() =>
                  handleVerifyDocument(
                    doc.app_document_id,
                  )
                }
                onReject={() => {
                  setRejectingDoc(doc);
                  setActiveModal(
                    "documentReject",
                  );
                }}
              />
            ))
          )}
        </View>

        {/* Review Notes */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MessageSquare
              size={21}
              color="#0284C7"
            />

            <Text style={styles.sectionTitle}>
              {t(
                "partner.reviewNotesTitle",
                "Internal Agency Review Notes ({{count}})",
                {
                  count: reviewNotes.length,
                },
              )}
            </Text>
          </View>

          <View style={styles.sectionDivider} />

          {reviewNotes.length > 0 &&
            reviewNotes.map((note) => (
              <View
                key={note.note_id}
                style={styles.noteCard}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteAuthor}>
                    {note.author_role || "Unknown"}{" "}
                    {note.author_id
                      ? `(${note.author_id})`
                      : ""}
                  </Text>

                  <Text style={styles.noteDate}>
                    {formatDateTime(
                      note.created_at,
                    )}
                  </Text>
                </View>

                <Text style={styles.noteContent}>
                  {note.content || ""}
                </Text>
              </View>
            ))}

          {!isFinalized && (
            <View style={styles.noteForm}>
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder={t(
                  "partner.addNotesPlaceholder",
                  "Add internal partner review notes...",
                )}
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.textArea}
                editable={!isActionLoading}
              />

              <Pressable
                style={[
                  styles.noteButton,
                  (!noteText.trim() ||
                    isActionLoading) &&
                    styles.disabledButton,
                ]}
                disabled={
                  !noteText.trim() ||
                  isActionLoading
                }
                onPress={handleAddNote}
              >
                <Text style={styles.noteButtonText}>
                  {isActionLoading
                    ? "Saving..."
                    : t(
                        "partner.addNoteBtn",
                        "Add Internal Note",
                      )}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Status Timeline */}
        <StatusTimeline
          currentStatus={appData.status}
          history={statusHistory}
          submittedAt={appData.submitted_at}
        />
      </View>

      {/* Document Rejection */}
      <NativeModal
        visible={
          activeModal === "documentReject"
        }
        onClose={closeModal}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {t(
              "partner.rejectDocTitle",
              "Reject Document",
            )}
          </Text>

          <Pressable
            onPress={closeModal}
            disabled={isActionLoading}
          >
            <X
              size={22}
              color="#64748B"
            />
          </Pressable>
        </View>

        {rejectingDoc && (
          <Text style={styles.modalSubtitle}>
            {rejectingDoc.document_name}
          </Text>
        )}

        <Text style={styles.inputLabel}>
          {t(
            "partner.mandatoryRejectReason",
            "Mandatory Rejection Reason",
          )}
        </Text>

        <TextInput
          value={docRejectReason}
          onChangeText={setDocRejectReason}
          placeholder={t(
            "partner.docRejectPlaceholder",
            "e.g. Document image is blurry or income proof mismatch.",
          )}
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.modalTextArea}
        />

        <ModalButtons
          cancel={closeModal}
          confirm={handleRejectDocument}
          confirmLabel={t(
            "partner.confirmDocRejectBtn",
            "Confirm Document Rejection",
          )}
          danger
          disabled={
            !docRejectReason.trim() ||
            isActionLoading
          }
        />
      </NativeModal>

      {/* Final Rejection */}
      <NativeModal
        visible={
          activeModal === "finalReject"
        }
        onClose={closeModal}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {t(
              "partner.rejectAppTitle",
              "Reject Application",
            )}
          </Text>

          <Pressable
            onPress={closeModal}
            disabled={isActionLoading}
          >
            <X
              size={22}
              color="#64748B"
            />
          </Pressable>
        </View>

        <Text style={styles.inputLabel}>
          {t(
            "partner.mandatoryRejectReason",
            "Mandatory Rejection Reason",
          )}
        </Text>

        <TextInput
          value={finalRejectReason}
          onChangeText={setFinalRejectReason}
          placeholder={t(
            "partner.finalRejectPlaceholder",
            "e.g. Ineligible income slab or mandatory documents not provided.",
          )}
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.modalTextArea}
        />

        <ModalButtons
          cancel={closeModal}
          confirm={handleRejectFinal}
          confirmLabel={t(
            "partner.confirmAppRejectBtn",
            "Confirm Application Rejection",
          )}
          danger
          disabled={
            !finalRejectReason.trim() ||
            isActionLoading
          }
        />
      </NativeModal>

      {/* Correction */}
      <NativeModal
        visible={
          activeModal === "correction"
        }
        onClose={closeModal}
      >
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleRow}>
            <AlertTriangle
              size={21}
              color="#D97706"
            />

            <Text style={styles.modalTitle}>
              {t(
                "partner.requestCorrectionTitle",
                "Request Application Correction",
              )}
            </Text>
          </View>

          <Pressable
            onPress={closeModal}
            disabled={isActionLoading}
          >
            <X
              size={22}
              color="#64748B"
            />
          </Pressable>
        </View>

        <Text style={styles.inputLabel}>
          {t(
            "partner.mandatoryCorrectionReason",
            "Mandatory Correction Reason",
          )}
        </Text>

        <TextInput
          value={correctionReason}
          onChangeText={setCorrectionReason}
          placeholder={t(
            "partner.correctionReasonPlaceholder",
            "e.g. Uploaded Aadhaar card scan is blurry. Please re-upload legible document.",
          )}
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.modalTextArea}
        />

        <Text style={styles.inputLabel}>
          {t(
            "partner.targetFieldsLabel",
            "Target Documents / Fields (Comma-separated)",
          )}
        </Text>

        <TextInput
          value={correctionFields}
          onChangeText={setCorrectionFields}
          placeholder={t(
            "partner.targetFieldsPlaceholder",
            "e.g. Identity Proof, Address Proof",
          )}
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />

        <ModalButtons
          cancel={closeModal}
          confirm={handleRequestCorrection}
          confirmLabel={t(
            "partner.sendCorrectionBtn",
            "Send Correction Request",
          )}
          warning
          disabled={
            !correctionReason.trim() ||
            isActionLoading
          }
        />
      </NativeModal>

      {/* Mark Completed / Benefit Disbursed Modal */}
<NativeModal
  visible={isCompleteModalOpen}
  onClose={() => {
    if (!isActionLoading) {
      setIsCompleteModalOpen(false);
      setCompletionNotes("");
    }
  }}
>
  <View style={styles.modalHeader}>
    <View style={styles.modalTitleRow}>
      <ShieldCheck
        size={21}
        color="#059669"
      />

      <Text style={styles.modalTitle}>
        Mark Application Completed
      </Text>
    </View>

    <Pressable
      onPress={() => {
        if (!isActionLoading) {
          setIsCompleteModalOpen(false);
          setCompletionNotes("");
        }
      }}
      disabled={isActionLoading}
    >
      <X
        size={22}
        color="#64748B"
      />
    </Pressable>
  </View>

  <Text style={styles.modalSubtitle}>
    Mark this approved application as completed
    and record the benefit disbursement details.
  </Text>

  <Text style={styles.inputLabel}>
    Completion / Disbursement Notes
  </Text>

  <TextInput
    value={completionNotes}
    onChangeText={setCompletionNotes}
    placeholder="Enter optional completion or disbursement notes..."
    placeholderTextColor="#94A3B8"
    multiline
    numberOfLines={5}
    textAlignVertical="top"
    style={styles.modalTextArea}
    editable={!isActionLoading}
  />

  <View style={styles.modalButtons}>
    <Pressable
      style={styles.cancelButton}
      onPress={() => {
        if (!isActionLoading) {
          setIsCompleteModalOpen(false);
          setCompletionNotes("");
        }
      }}
      disabled={isActionLoading}
    >
      <Text style={styles.cancelButtonText}>
        Cancel
      </Text>
    </Pressable>

    <Pressable
      style={[
        styles.modalConfirmButton,
        {
          backgroundColor: "#059669",
        },
        isActionLoading &&
          styles.disabledButton,
      ]}
      onPress={handleCompleteSubmit}
      disabled={isActionLoading}
    >
      {isActionLoading ? (
        <ActivityIndicator
          size="small"
          color="#FFFFFF"
        />
      ) : (
        <ShieldCheck
          size={16}
          color="#FFFFFF"
        />
      )}

      <Text style={styles.modalConfirmText}>
        {isActionLoading
          ? "Processing..."
          : "Mark Completed"}
      </Text>
    </Pressable>
  </View>
</NativeModal>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toUpperCase();

  let background = "#FEF3C7";
  let textColor = "#92400E";

  if (normalized === "APPROVED") {
    background = "#DCFCE7";
    textColor = "#166534";
  } else if (
    normalized === "REJECTED"
  ) {
    background = "#FEE2E2";
    textColor = "#991B1B";
  } else if (
    normalized === "COMPLETED"
  ) {
    background = "#DBEAFE";
    textColor = "#1D4ED8";
  }

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: background,
        },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          {
            color: textColor,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  variant,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  variant: "success" | "danger" | "warning";
  onPress: () => void;
  disabled?: boolean;
}) {
  const backgroundColor =
    variant === "success"
      ? "#059669"
      : variant === "danger"
        ? "#E11D48"
        : "#D97706";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        {
          backgroundColor,
        },
        disabled && styles.disabledButton,
      ]}
    >
      {icon}

      <Text style={styles.actionButtonText}>
        {label}
      </Text>
    </Pressable>
  );
}

function DocumentCard({
  document,
  isFinalized,
  isLoading,
  onVerify,
  onReject,
}: {
  document: ApplicationDocument;
  isFinalized: boolean;
  isLoading: boolean;
  onVerify: () => void;
  onReject: () => void;
}) {
  const status =
    document.verification_status ||
    "PENDING";

  let statusBackground = "#FEF3C7";
  let statusColor = "#92400E";

  if (status === "VERIFIED") {
    statusBackground = "#DCFCE7";
    statusColor = "#166534";
  } else if (status === "REJECTED") {
    statusBackground = "#FEE2E2";
    statusColor = "#991B1B";
  }

  return (
    <View style={styles.documentCard}>
      <View style={styles.documentTop}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName}>
            {document.document_name}
          </Text>

          <Text style={styles.documentType}>
            {document.requirement_type ||
              "Document"}
          </Text>
        </View>

        <View
          style={[
            styles.documentStatus,
            {
              backgroundColor:
                statusBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.documentStatusText,
              {
                color: statusColor,
              },
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      {document.is_uploaded ? (
        <View style={styles.uploadedBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fileLabel}>
              File
            </Text>

            <Text style={styles.fileName}>
              {document.file_name ||
                "Uploaded file"}
            </Text>
          </View>

          <Text style={styles.uploadDate}>
            {document.uploaded_at
              ? formatDate(
                  document.uploaded_at,
                )
              : ""}
          </Text>
        </View>
      ) : (
        <Text style={styles.notUploaded}>
          Not uploaded by beneficiary
        </Text>
      )}

      {!isFinalized &&
        document.is_uploaded && (
          <View style={styles.documentActions}>
            <Pressable
              style={[
                styles.rejectDocButton,
                isLoading &&
                  styles.disabledButton,
              ]}
              disabled={isLoading}
              onPress={onReject}
            >
              <Text
                style={
                  styles.rejectDocButtonText
                }
              >
                Reject Document
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.verifyDocButton,
                isLoading &&
                  styles.disabledButton,
              ]}
              disabled={isLoading}
              onPress={onVerify}
            >
              <CheckCircle2
                size={16}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.verifyDocButtonText
                }
              >
                Verify Document
              </Text>
            </Pressable>
          </View>
        )}
    </View>
  );
}

function AlertBanner({
  type,
  title,
  message,
  extra,
}: {
  type: "success" | "error" | "warning";
  title?: string;
  message: string;
  extra?: string;
}) {
  const isSuccess = type === "success";
  const isError = type === "error";

  const backgroundColor = isSuccess
    ? "#ECFDF5"
    : isError
      ? "#FEF2F2"
      : "#FFFBEB";

  const borderColor = isSuccess
    ? "#A7F3D0"
    : isError
      ? "#FECACA"
      : "#FDE68A";

  const textColor = isSuccess
    ? "#065F46"
    : isError
      ? "#991B1B"
      : "#92400E";

  return (
    <View
      style={[
        styles.alert,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <Text
        style={[
          styles.alertTitle,
          { color: textColor },
        ]}
      >
        {title ||
          (isSuccess
            ? "Success"
            : isError
              ? "Error"
              : "Warning")}
      </Text>

      <Text
        style={[
          styles.alertMessage,
          { color: textColor },
        ]}
      >
        {message}
      </Text>

      {extra && (
        <Text
          style={[
            styles.alertExtra,
            { color: textColor },
          ]}
        >
          {extra}
        </Text>
      )}
    </View>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {text}
      </Text>
    </View>
  );
}

function NativeModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ModalButtons({
  cancel,
  confirm,
  confirmLabel,
  danger,
  warning,
  disabled,
}: {
  cancel: () => void;
  confirm: () => void;
  confirmLabel: string;
  danger?: boolean;
  warning?: boolean;
  disabled?: boolean;
}) {
  const backgroundColor = danger
    ? "#E11D48"
    : warning
      ? "#D97706"
      : "#059669";

  return (
    <View style={styles.modalButtons}>
      <Pressable
        style={styles.cancelButton}
        onPress={cancel}
        disabled={disabled}
      >
        <Text style={styles.cancelButtonText}>
          Cancel
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.modalConfirmButton,
          {
            backgroundColor,
          },
          disabled &&
            styles.disabledButton,
        ]}
        onPress={confirm}
        disabled={disabled}
      >
        <Text
          style={styles.modalConfirmText}
        >
          {disabled
            ? "Processing..."
            : confirmLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function StatusTimeline({
  currentStatus,
  history,
  submittedAt,
}: {
  currentStatus: string;
  history: StatusHistoryItem[];
  submittedAt?: string | null;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <ShieldCheck
          size={21}
          color="#0F172A"
        />

        <Text style={styles.sectionTitle}>
          Status Timeline
        </Text>
      </View>

      <View style={styles.sectionDivider} />

      <TimelineItem
        title="Submitted"
        date={submittedAt}
        active
        first
      />

      {history.map((item, index) => (
        <TimelineItem
          key={`${item.status}-${index}`}
          title={
            item.status ||
            "Status Update"
          }
          date={
            item.changed_at ||
            item.created_at
          }
          active
          last={
            index === history.length - 1
          }
          note={
            item.reason ||
            item.note
          }
        />
      ))}

      {history.length === 0 && (
        <TimelineItem
          title={currentStatus}
          date={undefined}
          active
          last
        />
      )}
    </View>
  );
}

function TimelineItem({
  title,
  date,
  active,
  first,
  last,
  note,
}: {
  title: string;
  date?: string | null;
  active?: boolean;
  first?: boolean;
  last?: boolean;
  note?: string | null;
}) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineRail}>
        <View
          style={[
            styles.timelineDot,
            active &&
              styles.timelineDotActive,
          ]}
        />

        {!last && (
          <View
            style={styles.timelineLine}
          />
        )}
      </View>

      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>
          {title}
        </Text>

        {date && (
          <Text style={styles.timelineDate}>
            {formatDateTime(date)}
          </Text>
        )}

        {note && (
          <Text style={styles.timelineNote}>
            {note}
          </Text>
        )}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(
  value?: string | null,
) {
  if (!value) return "";

  try {
    return new Date(
      value,
    ).toLocaleDateString();
  } catch {
    return value;
  }
}

function formatDateTime(
  value?: string | null,
) {
  if (!value) return "";

  try {
    return new Date(
      value,
    ).toLocaleString();
  } catch {
    return value;
  }
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },

  loadingContainer: {
    flex: 1,
    minHeight: 500,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
  },

  errorPage: {
    padding: 16,
    gap: 16,
  },

  topBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },

  topBackText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
  },

  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },

  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    gap: 18,
  },

  headerMain: {
    gap: 7,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flexWrap: "wrap",
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  appId: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },

  title: {
    fontSize: 22,
    lineHeight: 28,
    color: "#0F172A",
    fontWeight: "800",
  },

  beneficiaryId: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },

  headerActions: {
    gap: 9,
  },

  actionButton: {
    minHeight: 44,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
  },

  disabledButton: {
    opacity: 0.5,
  },

  alert: {
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
    gap: 4,
  },

  alertTitle: {
    fontSize: 13,
    fontWeight: "800",
  },

  alertMessage: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  alertExtra: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 13,
  },

  documentCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 13,
    padding: 13,
    marginBottom: 11,
    gap: 11,
  },

  documentTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  documentInfo: {
    flex: 1,
  },

  documentName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },

  documentType: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  documentStatus: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },

  documentStatusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  uploadedBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 9,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  fileLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },

  fileName: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "700",
    marginTop: 2,
  },

  uploadDate: {
    fontSize: 10,
    color: "#94A3B8",
  },

  notUploaded: {
    fontSize: 11,
    color: "#BE123C",
    fontStyle: "italic",
  },

  documentActions: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },

  rejectDocButton: {
    borderWidth: 1,
    borderColor: "#FDA4AF",
    backgroundColor: "#FFF1F2",
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  rejectDocButtonText: {
    color: "#9F1239",
    fontSize: 10,
    fontWeight: "800",
  },

  verifyDocButton: {
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  verifyDocButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  noteCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 11,
    marginBottom: 9,
  },

  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },

  noteAuthor: {
    flex: 1,
    fontSize: 10,
    color: "#334155",
    fontWeight: "800",
  },

  noteDate: {
    fontSize: 9,
    color: "#94A3B8",
  },

  noteContent: {
    fontSize: 12,
    lineHeight: 18,
    color: "#334155",
  },

  noteForm: {
    marginTop: 7,
    gap: 9,
  },

  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 12,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },

  noteButton: {
    alignSelf: "flex-start",
    backgroundColor: "#0F172A",
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  noteButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
  },

  emptyStateText: {
    fontSize: 12,
    color: "#94A3B8",
  },

  timelineItem: {
    flexDirection: "row",
    minHeight: 58,
  },

  timelineRail: {
    width: 26,
    alignItems: "center",
  },

  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#CBD5E1",
    marginTop: 3,
  },

  timelineDotActive: {
    backgroundColor: "#0F172A",
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginTop: 3,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 7,
    paddingBottom: 13,
  },

  timelineTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },

  timelineDate: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },

  timelineNote: {
    fontSize: 10,
    lineHeight: 15,
    color: "#64748B",
    marginTop: 3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },

  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },

  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 13,
    marginBottom: 6,
  },

  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    paddingHorizontal: 11,
    fontSize: 12,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },

  modalTextArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 12,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    textAlignVertical: "top",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 9,
    marginTop: 18,
  },

  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
  },

  cancelButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },

  modalConfirmButton: {
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 9,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
},

  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});