import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  ShieldCheck,
  XCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { ApplicationStatus } from "../../types";

interface VerificationBadgeProps {
  status?: string | null;
}

export const VerificationBadge: React.FC<
  VerificationBadgeProps
> = ({ status }) => {
  const { t } = useTranslation();

  const normStatus = (status || "")
    .toUpperCase()
    .trim();

  if (
    normStatus === "VERIFIED" ||
    normStatus === "VERIFIED_OFFICIAL"
  ) {
    return (
      <View
        style={[
          styles.verificationBadge,
          styles.govtVerifiedBadge,
        ]}
      >
        <ShieldCheck
          size={14}
          color="#059669"
          strokeWidth={2}
        />

        <Text
          style={[
            styles.verificationText,
            styles.govtVerifiedText,
          ]}
        >
          {t("schemeCard.govtVerified")}
        </Text>
      </View>
    );
  }

  if (normStatus === "SOURCE_VERIFIED") {
    return (
      <View
        style={[
          styles.verificationBadge,
          styles.sourceVerifiedBadge,
        ]}
      >
        <ShieldCheck
          size={14}
          color="#2563EB"
          strokeWidth={2}
        />

        <Text
          style={[
            styles.verificationText,
            styles.sourceVerifiedText,
          ]}
        >
          {t("schemeCard.sourceVerified")}
        </Text>
      </View>
    );
  }

  if (
    normStatus === "UNDER_REVIEW" ||
    normStatus === "UNVERIFIED" ||
    normStatus === "NEEDS_SOURCE_VERIFICATION"
  ) {
    return (
      <View
        style={[
          styles.verificationBadge,
          styles.underVerificationBadge,
        ]}
      >
        <Clock
          size={14}
          color="#D97706"
          strokeWidth={2}
        />

        <Text
          style={[
            styles.verificationText,
            styles.underVerificationText,
          ]}
        >
          {t("schemeCard.underVerification")}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.verificationBadge,
        styles.sourceUnavailableBadge,
      ]}
    >
      <AlertCircle
        size={14}
        color="#64748B"
        strokeWidth={2}
      />

      <Text
        style={[
          styles.verificationText,
          styles.sourceUnavailableText,
        ]}
      >
        {t("schemeCard.sourceUnavailable")}
      </Text>
    </View>
  );
};

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus | string;
}

type BadgeConfig = {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  fontWeight?: "500" | "700";
};

export const ApplicationStatusBadge: React.FC<
  ApplicationStatusBadgeProps
> = ({ status }) => {
  const configs: Record<string, BadgeConfig> = {
    DRAFT: {
      label: "Guidance Started",
      backgroundColor: "#F1F5F9",
      textColor: "#334155",
      borderColor: "#CBD5E1",
      iconColor: "#64748B",
      icon: Clock,
      fontWeight: "700",
    },

    DOCUMENTS_PENDING: {
      label: "Checklist Pending",
      backgroundColor: "#FFFBEB",
      textColor: "#92400E",
      borderColor: "#FCD34D",
      iconColor: "#D97706",
      icon: AlertCircle,
      fontWeight: "700",
    },

    READY_FOR_SUBMISSION: {
      label: "Ready for Official Portal",
      backgroundColor: "#EFF6FF",
      textColor: "#1E40AF",
      borderColor: "#93C5FD",
      iconColor: "#2563EB",
      icon: FileCheck,
      fontWeight: "700",
    },

    SUBMITTED: {
      label: "Redirected to Portal",
      backgroundColor: "#EEF2FF",
      textColor: "#3730A3",
      borderColor: "#A5B4FC",
      iconColor: "#4F46E5",
      icon: Clock,
      fontWeight: "700",
    },

    UNDER_REVIEW: {
      label: "Assisted Review",
      backgroundColor: "#FAF5FF",
      textColor: "#6B21A8",
      borderColor: "#D8B4FE",
      iconColor: "#9333EA",
      icon: Clock,
      fontWeight: "700",
    },

    CORRECTION_REQUIRED: {
      label: "Action Required",
      backgroundColor: "#FEF3C7",
      textColor: "#78350F",
      borderColor: "#FBBF24",
      iconColor: "#B45309",
      icon: AlertCircle,
      fontWeight: "700",
    },

    NEEDS_CORRECTION: {
      label: "Action Required",
      backgroundColor: "#FEF3C7",
      textColor: "#78350F",
      borderColor: "#FBBF24",
      iconColor: "#B45309",
      icon: AlertCircle,
      fontWeight: "700",
    },

    MORE_INFORMATION_REQUIRED: {
      label: "Information Required",
      backgroundColor: "#FEF3C7",
      textColor: "#78350F",
      borderColor: "#FBBF24",
      iconColor: "#B45309",
      icon: AlertCircle,
      fontWeight: "700",
    },

    APPROVED: {
      label: "Approved",
      backgroundColor: "#ECFDF5",
      textColor: "#065F46",
      borderColor: "#A7F3D0",
      iconColor: "#059669",
      icon: CheckCircle2,
      fontWeight: "700",
    },

    COMPLETED: {
      label: "Completed / Benefit Disbursed",
      backgroundColor: "#D1FAE5",
      textColor: "#064E3B",
      borderColor: "#6EE7B7",
      iconColor: "#047857",
      icon: ShieldCheck,
      fontWeight: "700",
    },

    REJECTED: {
      label: "Rejected",
      backgroundColor: "#FFF1F2",
      textColor: "#9F1239",
      borderColor: "#FDA4AF",
      iconColor: "#E11D48",
      icon: XCircle,
      fontWeight: "700",
    },

    WITHDRAWN: {
      label: "Withdrawn",
      backgroundColor: "#E2E8F0",
      textColor: "#334155",
      borderColor: "#94A3B8",
      iconColor: "#64748B",
      icon: XCircle,
      fontWeight: "700",
    },
  };

  const fallbackConfig: BadgeConfig = {
    label: String(status).replace(/_/g, " "),
    backgroundColor: "#F1F5F9",
    textColor: "#334155",
    borderColor: "#CBD5E1",
    iconColor: "#64748B",
    icon: Clock,
    fontWeight: "700",
  };

  const cfg = configs[String(status)] || fallbackConfig;
  const Icon = cfg.icon;

  return (
    <View
      style={[
        styles.applicationBadge,
        {
          backgroundColor: cfg.backgroundColor,
          borderColor: cfg.borderColor,
        },
      ]}
    >
      <Icon
        size={14}
        color={cfg.iconColor}
        strokeWidth={2}
      />

      <Text
        style={[
          styles.applicationBadgeText,
          {
            color: cfg.textColor,
            fontWeight: cfg.fontWeight || "700",
          },
        ]}
      >
        {cfg.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  /*
   * Verification badges
   */

  verificationBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 4,
  },

  verificationText: {
    fontSize: 11,
    lineHeight: 16,
  },

  govtVerifiedBadge: {
    backgroundColor: "#D1FAE5",
    borderColor: "#6EE7B7",
  },

  govtVerifiedText: {
    color: "#065F46",
    fontWeight: "700",
  },

  sourceVerifiedBadge: {
    backgroundColor: "#DBEAFE",
    borderColor: "#93C5FD",
  },

  sourceVerifiedText: {
    color: "#1E40AF",
    fontWeight: "700",
  },

  underVerificationBadge: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },

  underVerificationText: {
    color: "#92400E",
    fontWeight: "500",
  },

  sourceUnavailableBadge: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },

  sourceUnavailableText: {
    color: "#334155",
    fontWeight: "500",
  },

  /*
   * Application status badges
   */

  applicationBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 6,
  },

  applicationBadgeText: {
    fontSize: 12,
    lineHeight: 18,
  },
});

export default ApplicationStatusBadge;

