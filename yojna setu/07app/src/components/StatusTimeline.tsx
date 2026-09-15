import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  AlertCircle,
  Check,
  Clock,
  ShieldCheck,
  XCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { ApplicationStatus, StatusHistory } from "../types";

interface StatusTimelineProps {
  currentStatus: ApplicationStatus | string;
  history?: StatusHistory[];
  submittedAt?: string | null;
}

type StepState =
  | "completed"
  | "current"
  | "upcoming"
  | "rejected"
  | "withdrawn";

interface LifecycleStep {
  key: string;
  label: string;
  description: string;
  matchedStatuses: string[];
}

const STAGE_ORDER = [
  "DRAFT",
  "DOCUMENTS_PENDING",
  "READY_FOR_SUBMISSION",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CORRECTION_REQUIRED",
  "DECISION",
  "COMPLETED",
];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  currentStatus,
  history = [],
}) => {
  const { t } = useTranslation();

  const normStatus = (currentStatus || "").toUpperCase().trim();

  const isWithdrawn = normStatus === "WITHDRAWN";

  const isRejected = normStatus === "REJECTED";

  const isApproved = normStatus === "APPROVED" || normStatus === "COMPLETED";

  const isCompleted = normStatus === "COMPLETED";

  const isActionRequired =
    normStatus === "CORRECTION_REQUIRED" ||
    normStatus === "NEEDS_CORRECTION" ||
    normStatus === "MORE_INFORMATION_REQUIRED";

  /*
   * Lifecycle steps.
   *
   * This follows the same business/status mapping
   * as the web implementation.
   */
  const LIFECYCLE_STEPS: LifecycleStep[] = [
    {
      key: "PREPARATION",
      label: t("timeline.preparationLabel", "Application Initiated"),
      description: t(
        "timeline.preparationDesc",
        "Scheme selected & profile snapshot saved",
      ),
      matchedStatuses: ["DRAFT", "DOCUMENTS_PENDING"],
    },

    {
      key: "CHECKLIST_READY",
      label: t(
        "timeline.checklistReadyLabel",
        "Checklist & Readiness Confirmed",
      ),
      description: t(
        "timeline.checklistReadyDesc",
        "Document requirements reviewed & ready for submission",
      ),
      matchedStatuses: ["READY_FOR_SUBMISSION"],
    },

    {
      key: "SUBMITTED",
      label: t("timeline.submittedLabel", "Submitted to Channel Partner"),
      description: t(
        "timeline.submittedDesc",
        "Application routed to official processing partner",
      ),
      matchedStatuses: ["SUBMITTED"],
    },

    {
      key: "UNDER_REVIEW",
      label: t("timeline.underReviewLabel", "Under Official Review"),
      description: t(
        "timeline.underReviewDesc",
        "Processing officer reviewing eligibility & credentials",
      ),
      matchedStatuses: ["UNDER_REVIEW"],
    },

    ...(isActionRequired
      ? [
          {
            key: "ACTION_REQUIRED",
            label: t(
              "timeline.actionRequiredLabel",
              "Action / Information Required",
            ),
            description: t(
              "timeline.actionRequiredDesc",
              "Reviewer requested correction or additional document checklist update",
            ),
            matchedStatuses: [
              "CORRECTION_REQUIRED",
              "NEEDS_CORRECTION",
              "MORE_INFORMATION_REQUIRED",
            ],
          },
        ]
      : []),

    {
      key: "DECISION",
      label: isRejected
        ? t("timeline.decisionRejected", "Application Rejected")
        : isApproved
          ? t("timeline.decisionApproved", "Application Approved")
          : t("timeline.decisionPending", "Final Processing Decision"),

      description: isRejected
        ? t(
            "timeline.decisionRejectedDesc",
            "Application did not meet specified official criteria",
          )
        : isApproved
          ? t(
              "timeline.decisionApprovedDesc",
              "Application officially approved by processing authority",
            )
          : t(
              "timeline.decisionPendingDesc",
              "Awaiting final decision from channel partner",
            ),

      matchedStatuses: ["APPROVED", "REJECTED", "COMPLETED"],
    },

    {
      key: "COMPLETED",
      label: t("timeline.completedLabel", "Completed / Benefit Disbursed"),
      description: t(
        "timeline.completedDesc",
        "Scheme benefit disbursed or official process finished",
      ),
      matchedStatuses: ["COMPLETED"],
    },
  ];

  /*
   * Determine the visual state of each step.
   */
  const getStepState = (stepKey: string, stepStatuses: string[]): StepState => {
    if (isWithdrawn) {
      return "withdrawn";
    }

    if (stepStatuses.includes(normStatus)) {
      return "current";
    }

    if (stepKey === "PREPARATION") {
      return "completed";
    }

    if (stepKey === "CHECKLIST_READY") {
      return [
        "SUBMITTED",
        "UNDER_REVIEW",
        "CORRECTION_REQUIRED",
        "NEEDS_CORRECTION",
        "MORE_INFORMATION_REQUIRED",
        "APPROVED",
        "REJECTED",
        "COMPLETED",
      ].includes(normStatus)
        ? "completed"
        : "upcoming";
    }

    if (stepKey === "SUBMITTED") {
      return [
        "UNDER_REVIEW",
        "CORRECTION_REQUIRED",
        "NEEDS_CORRECTION",
        "MORE_INFORMATION_REQUIRED",
        "APPROVED",
        "REJECTED",
        "COMPLETED",
      ].includes(normStatus)
        ? "completed"
        : "upcoming";
    }

    if (stepKey === "UNDER_REVIEW") {
      return ["APPROVED", "REJECTED", "COMPLETED"].includes(normStatus)
        ? "completed"
        : "upcoming";
    }

    if (stepKey === "ACTION_REQUIRED") {
      return isActionRequired ? "current" : "upcoming";
    }

    if (stepKey === "DECISION") {
      if (isRejected) {
        return "rejected";
      }

      if (isApproved) {
        return "completed";
      }

      return "upcoming";
    }

    if (stepKey === "COMPLETED") {
      return isCompleted ? "completed" : "upcoming";
    }

    return "upcoming";
  };

  /*
   * Icon used inside each timeline bullet.
   */
  const renderStepIcon = (state: StepState, stepKey: string) => {
    if (state === "completed") {
      return <Check size={14} color="#FFFFFF" strokeWidth={3} />;
    }

    if (state === "rejected") {
      return <XCircle size={14} color="#FFFFFF" strokeWidth={2.5} />;
    }

    if (stepKey === "ACTION_REQUIRED") {
      return <AlertCircle size={14} color="#FFFFFF" strokeWidth={2.5} />;
    }

    return (
      <Clock
        size={14}
        color={state === "upcoming" ? "#64748B" : "#FFFFFF"}
        strokeWidth={2}
      />
    );
  };

  /*
   * Get styles for timeline bullet.
   */
  const getBulletStyle = (state: StepState, stepKey: string) => {
    if (state === "completed") {
      return styles.completedBullet;
    }

    if (state === "current") {
      if (stepKey === "ACTION_REQUIRED") {
        return styles.actionRequiredBullet;
      }

      return styles.currentBullet;
    }

    if (state === "rejected") {
      return styles.rejectedBullet;
    }

    if (state === "withdrawn") {
      return styles.withdrawnBullet;
    }

    return styles.upcomingBullet;
  };

  /*
   * Get title color.
   */
  const getTitleStyle = (state: StepState, stepKey: string) => {
    if (state === "current") {
      if (stepKey === "ACTION_REQUIRED") {
        return styles.actionRequiredTitle;
      }

      return styles.currentTitle;
    }

    if (state === "rejected") {
      return styles.rejectedTitle;
    }

    if (state === "completed") {
      return styles.completedTitle;
    }

    if (state === "withdrawn") {
      return styles.withdrawnTitle;
    }

    return styles.upcomingTitle;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <ShieldCheck size={20} color="#0284C7" strokeWidth={2} />

            <Text style={styles.title}>
              {t("timeline.title", "Application Lifecycle & History")}
            </Text>
          </View>

          <Text style={styles.subtitle}>
            {t(
              "timeline.subtitle",
              "Real-time status progression and traceable audit history",
            )}
          </Text>
        </View>
      </View>

      {/* Withdrawn notice */}
      {isWithdrawn ? (
        <View style={styles.withdrawnNotice}>
          <XCircle size={16} color="#64748B" strokeWidth={2} />

          <Text style={styles.withdrawnNoticeText}>
            {t(
              "timeline.withdrawnNotice",
              "This application was withdrawn by the beneficiary.",
            )}
          </Text>
        </View>
      ) : null}

      {/* Timeline */}
      <View style={styles.timeline}>
        {LIFECYCLE_STEPS.map((step, index) => {
          const state = getStepState(step.key, step.matchedStatuses);

          /*
           * Find the audit history entry
           * associated with this lifecycle step.
           */
          const historyEntry = history.find((entry) =>
            step.matchedStatuses.includes(
              (entry.new_status || "").toUpperCase().trim(),
            ),
          );

          const isLast = index === LIFECYCLE_STEPS.length - 1;

          return (
            <View
              key={step.key}
              style={[
                styles.timelineItem,
                !isLast && styles.timelineItemWithLine,
              ]}
            >
              {/* Timeline vertical line */}
              {!isLast ? (
                <View
                  style={[
                    styles.timelineLine,
                    state === "completed" && styles.completedTimelineLine,
                  ]}
                />
              ) : null}

              {/* Timeline bullet */}
              <View
                style={[styles.timelineBullet, getBulletStyle(state, step.key)]}
              >
                {renderStepIcon(state, step.key)}
              </View>

              {/* Step content */}
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text
                    style={[styles.stepTitle, getTitleStyle(state, step.key)]}
                  >
                    {step.label}
                  </Text>

                  {state === "current" ? (
                    <View
                      style={[
                        styles.currentStageBadge,
                        step.key === "ACTION_REQUIRED" &&
                          styles.actionRequiredBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.currentStageText,
                          step.key === "ACTION_REQUIRED" &&
                            styles.actionRequiredBadgeText,
                        ]}
                      >
                        {t("timeline.currentStage", "Current Stage")}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.stepDescription}>{step.description}</Text>

                {/* Audit history */}
                {historyEntry ? (
                  <View style={styles.historyCard}>
                    <Text style={styles.historyUpdated}>
                      {t("timeline.updated", "Updated")}:{" "}
                      {new Date(
                        historyEntry.created_at ||
                          historyEntry.changed_at ||
                          historyEntry.timestamp ||
                          Date.now(),
                      ).toLocaleString()}
                    </Text>

                    {historyEntry.reason ? (
                      <Text style={styles.historyReason}>
                        "{historyEntry.reason}"
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /*
   * Main card
   */
  container: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  /*
   * Header
   */
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 12,
    marginBottom: 16,
  },

  headerContent: {
    width: "100%",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  title: {
    flex: 1,
    color: "#0F172A",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },

  /*
   * Withdrawn notice
   */
  withdrawnNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },

  withdrawnNoticeText: {
    flex: 1,
    color: "#334155",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },

  /*
   * Timeline
   */
  timeline: {
    width: "100%",
    paddingLeft: 4,
  },

  timelineItem: {
    position: "relative",
    minHeight: 92,
    flexDirection: "row",
    paddingBottom: 24,
  },

  timelineItemWithLine: {
    // The vertical line is rendered separately.
  },

  timelineLine: {
    position: "absolute",
    left: 11,
    top: 24,
    bottom: 0,
    width: 2,
    backgroundColor: "#E2E8F0",
  },

  completedTimelineLine: {
    backgroundColor: "#A7F3D0",
  },

  /*
   * Timeline bullet
   */
  timelineBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    zIndex: 2,
  },

  completedBullet: {
    backgroundColor: "#059669",
  },

  currentBullet: {
    backgroundColor: "#0284C7",
    borderWidth: 3,
    borderColor: "#E0F2FE",
  },

  actionRequiredBullet: {
    backgroundColor: "#F59E0B",
    borderWidth: 3,
    borderColor: "#FEF3C7",
  },

  rejectedBullet: {
    backgroundColor: "#E11D48",
    borderWidth: 3,
    borderColor: "#FFE4E6",
  },

  withdrawnBullet: {
    backgroundColor: "#94A3B8",
  },

  upcomingBullet: {
    backgroundColor: "#E2E8F0",
  },

  /*
   * Step content
   */
  stepContent: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 16,
    paddingTop: 1,
  },

  stepTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 7,
  },

  stepTitle: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },

  currentTitle: {
    color: "#0369A1",
    fontWeight: "800",
  },

  actionRequiredTitle: {
    color: "#92400E",
    fontWeight: "800",
  },

  rejectedTitle: {
    color: "#BE123C",
  },

  completedTitle: {
    color: "#0F172A",
  },

  withdrawnTitle: {
    color: "#475569",
  },

  upcomingTitle: {
    color: "#64748B",
  },

  /*
   * Current stage badge
   */
  currentStageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#E0F2FE",
  },

  actionRequiredBadge: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },

  currentStageText: {
    color: "#075985",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  actionRequiredBadgeText: {
    color: "#78350F",
  },

  /*
   * Description
   */
  stepDescription: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },

  /*
   * History entry
   */
  historyCard: {
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  historyUpdated: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },

  historyReason: {
    marginTop: 4,
    color: "#334155",
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
});

export default StatusTimeline;
