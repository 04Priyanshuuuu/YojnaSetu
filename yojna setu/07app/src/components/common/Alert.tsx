import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react-native";

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
}) => {
  const stylesByType = {
    info: {
      container: styles.infoContainer,
      iconColor: "#2563EB",
      titleColor: "#1E3A8A",
      textColor: "#1E3A8A",
    },
    success: {
      container: styles.successContainer,
      iconColor: "#059669",
      titleColor: "#064E3B",
      textColor: "#064E3B",
    },
    warning: {
      container: styles.warningContainer,
      iconColor: "#D97706",
      titleColor: "#78350F",
      textColor: "#78350F",
    },
    error: {
      container: styles.errorContainer,
      iconColor: "#E11D48",
      titleColor: "#881337",
      textColor: "#881337",
    },
  };

  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const currentStyle = stylesByType[type];
  const Icon = icons[type];

  return (
    <View
      style={[
        styles.container,
        currentStyle.container,
      ]}
    >
      <View style={styles.iconContainer}>
        <Icon
          size={20}
          color={currentStyle.iconColor}
          strokeWidth={2}
        />
      </View>

      <View style={styles.contentContainer}>
        {title ? (
          <Text
            style={[
              styles.title,
              {
                color: currentStyle.titleColor,
              },
            ]}
          >
            {title}
          </Text>
        ) : null}

        <Text
          style={[
            styles.message,
            {
              color: currentStyle.textColor,
            },
          ]}
        >
          {children}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  iconContainer: {
    width: 20,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  contentContainer: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 4,
  },

  message: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "400",
  },

  infoContainer: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },

  successContainer: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },

  warningContainer: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },

  errorContainer: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
  },
});

export default Alert;

