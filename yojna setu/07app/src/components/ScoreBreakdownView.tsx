import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  XCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { ScoreDimensionBreakdown } from "../types";

interface ScoreBreakdownViewProps {
  scoreBreakdown: ScoreDimensionBreakdown[];
  matchedFactors: string[];
  unmatchedFactors: string[];
  notEvaluatedFactors: string[];
}

type ResultType = "MATCH" | "PARTIAL_MATCH" | "NO_MATCH" | string;

export const ScoreBreakdownView: React.FC<ScoreBreakdownViewProps> = ({
  scoreBreakdown,
  matchedFactors,
  unmatchedFactors,
  notEvaluatedFactors,
}) => {
  const { t } = useTranslation();

  /*
   * Result badge
   */
  const getResultBadge = (res: ResultType) => {
    switch (res) {
      case "MATCH":
        return (
          <View style={[styles.resultBadge, styles.matchBadge]}>
            <CheckCircle2 size={12} color="#059669" strokeWidth={2} />

            <Text style={[styles.resultBadgeText, styles.matchText]}>
              {t("scoreBreakdown.strongMatch", "✓ Strong Match")}
            </Text>
          </View>
        );

      case "PARTIAL_MATCH":
        return (
          <View style={[styles.resultBadge, styles.partialMatchBadge]}>
            <AlertCircle size={12} color="#D97706" strokeWidth={2} />

            <Text style={[styles.resultBadgeText, styles.partialMatchText]}>
              {t("scoreBreakdown.relatedMatch", "◐ Related Match")}
            </Text>
          </View>
        );

      case "NO_MATCH":
        return (
          <View style={[styles.resultBadge, styles.noMatchBadge]}>
            <XCircle size={12} color="#E11D48" strokeWidth={2} />

            <Text style={[styles.resultBadgeText, styles.noMatchText]}>
              {t("scoreBreakdown.noMatch", "✕ Not a match")}
            </Text>
          </View>
        );

      default:
        return (
          <View style={[styles.resultBadge, styles.insufficientBadge]}>
            <HelpCircle size={12} color="#94A3B8" strokeWidth={2} />

            <Text style={[styles.resultBadgeText, styles.insufficientText]}>
              {t("scoreBreakdown.insufficientInfo", "— Not enough information")}
            </Text>
          </View>
        );
    }
  };

  /*
   * Sanitize backend reason text.
   */
  const sanitizeReason = (reason: string) => {
    if (!reason) {
      return t(
        "scoreBreakdown.notEnoughInfo",
        "Not enough information to compare",
      );
    }

    return reason
      .replace(
        /UNKNOWN/g,
        t(
          "scoreBreakdown.notSpecified",
          "not specified / requires verification",
        ),
      )
      .replace(
        /NOT_APPLICABLE/g,
        t("scoreBreakdown.variesByCandidate", "varies by candidate"),
      );
  };

  /*
   * Safely calculate progress percentage.
   *
   * max_weight can theoretically be 0, so avoid
   * division by zero.
   */
  const getProgressWidth = (score: number, maxWeight: number): `${number}%` => {
    if (
      !Number.isFinite(score) ||
      !Number.isFinite(maxWeight) ||
      maxWeight <= 0
    ) {
      return "0%";
    }

    const percentage = Math.max(0, Math.min(100, (score / maxWeight) * 100));

    return `${percentage}%`;
  };

  /*
   * Progress-bar color according to result.
   */
  const getProgressColor = (result: ResultType) => {
    switch (result) {
      case "MATCH":
        return "#10B981";

      case "PARTIAL_MATCH":
        return "#F59E0B";

      case "NO_MATCH":
        return "#F43F5E";

      default:
        return "#CBD5E1";
    }
  };

  /*
   * Format dimension names.
   */
  const formatDimension = (value: string) => {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  /*
   * Render a factor list.
   */
  const renderFactors = (factors: string[], textColor: string) => {
    if (factors.length === 0) {
      return (
        <Text
          style={[
            styles.noneText,
            {
              color: textColor,
            },
          ]}
        >
          {t("common.none", "None")}
        </Text>
      );
    }

    return (
      <View style={styles.factorList}>
        {factors.map((factor, index) => (
          <View key={`${factor}-${index}`} style={styles.factorRow}>
            <Text
              style={[
                styles.bullet,
                {
                  color: textColor,
                },
              ]}
            >
              {"•"}
            </Text>

            <Text
              style={[
                styles.factorText,
                {
                  color: textColor,
                },
              ]}
            >
              {formatDimension(factor)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Dimension Scores */}
      <View style={styles.scoreSection}>
        <Text style={styles.sectionTitle}>
          {t("scoreBreakdown.title", "Scheme Criteria Match Breakdown")}
        </Text>

        <View style={styles.scoreList}>
          {scoreBreakdown.map((item, index) => {
            const progressWidth = getProgressWidth(item.score, item.max_weight);

            const progressColor = getProgressColor(item.result);

            return (
              <View key={`${item.dimension}-${index}`} style={styles.scoreCard}>
                {/* Dimension heading */}
                <View style={styles.scoreHeader}>
                  <Text style={styles.dimensionName} numberOfLines={2}>
                    {formatDimension(item.dimension)}
                  </Text>

                  <View style={styles.scoreHeaderRight}>
                    {getResultBadge(item.result)}

                    <Text style={styles.scoreText}>
                      {item.score} / {item.max_weight}{" "}
                      {t("scoreBreakdown.pts", "pts")}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: progressWidth,
                        backgroundColor: progressColor,
                      },
                    ]}
                  />
                </View>

                {/* Reason */}
                <Text style={styles.reasonText}>
                  {sanitizeReason(item.reason || "")}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Factor Lists */}
      <View style={styles.factorSections}>
        {/* Matched */}
        <View style={[styles.factorCard, styles.matchedCard]}>
          <View style={styles.factorHeader}>
            <CheckCircle2 size={16} color="#059669" strokeWidth={2} />

            <Text style={[styles.factorTitle, styles.matchedTitle]}>
              {t(
                "scoreBreakdown.matchedDimensionsCount",
                "Matched Dimensions ({{count}})",
                {
                  count: matchedFactors.length,
                },
              )}
            </Text>
          </View>

          {renderFactors(matchedFactors, "#047857")}
        </View>

        {/* Unmatched */}
        <View style={[styles.factorCard, styles.unmatchedCard]}>
          <View style={styles.factorHeader}>
            <XCircle size={16} color="#E11D48" strokeWidth={2} />

            <Text style={[styles.factorTitle, styles.unmatchedTitle]}>
              {t(
                "scoreBreakdown.unmatchedDimensionsCount",
                "Unmatched Dimensions ({{count}})",
                {
                  count: unmatchedFactors.length,
                },
              )}
            </Text>
          </View>

          {renderFactors(unmatchedFactors, "#BE123C")}
        </View>

        {/* Not evaluated */}
        <View style={[styles.factorCard, styles.notEvaluatedCard]}>
          <View style={styles.factorHeader}>
            <HelpCircle size={16} color="#64748B" strokeWidth={2} />

            <Text style={[styles.factorTitle, styles.notEvaluatedTitle]}>
              {t(
                "scoreBreakdown.unspecifiedDimensionsCount",
                "Unspecified Dimensions ({{count}})",
                {
                  count: notEvaluatedFactors.length,
                },
              )}
            </Text>
          </View>

          {renderFactors(notEvaluatedFactors, "#475569")}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /*
   * Main container
   */
  container: {
    width: "100%",
    gap: 24,
  },

  /*
   * Dimension scores section
   */
  scoreSection: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  sectionTitle: {
    color: "#334155",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 16,
  },

  scoreList: {
    gap: 12,
  },

  /*
   * Individual score card
   */
  scoreCard: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },

  dimensionName: {
    flex: 1,
    color: "#1E293B",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  scoreHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexShrink: 1,
  },

  scoreText: {
    color: "#0F172A",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "monospace",
    fontWeight: "800",
  },

  /*
   * Result badges
   */
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 4,
  },

  resultBadgeText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },

  matchBadge: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },

  matchText: {
    color: "#047857",
  },

  partialMatchBadge: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },

  partialMatchText: {
    color: "#B45309",
  },

  noMatchBadge: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
  },

  noMatchText: {
    color: "#BE123C",
  },

  insufficientBadge: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },

  insufficientText: {
    color: "#475569",
  },

  /*
   * Progress bar
   */
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 4,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  /*
   * Reason
   */
  reasonText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
  },

  /*
   * Factor sections
   */
  factorSections: {
    width: "100%",
    gap: 12,
  },

  factorCard: {
    width: "100%",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },

  factorHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 8,
  },

  factorTitle: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },

  /*
   * Matched
   */
  matchedCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },

  matchedTitle: {
    color: "#14532D",
  },

  /*
   * Unmatched
   */
  unmatchedCard: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
  },

  unmatchedTitle: {
    color: "#881337",
  },

  /*
   * Not evaluated
   */
  notEvaluatedCard: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },

  notEvaluatedTitle: {
    color: "#1E293B",
  },

  /*
   * Factor list
   */
  factorList: {
    gap: 4,
  },

  factorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 4,
  },

  bullet: {
    width: 14,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  factorText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
  },

  noneText: {
    fontSize: 11,
    lineHeight: 17,
    fontStyle: "italic",
  },
});

export default ScoreBreakdownView;
