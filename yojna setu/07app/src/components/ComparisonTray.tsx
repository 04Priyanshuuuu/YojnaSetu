import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowRight,
  Scale,
  Trash2,
  X,
} from "lucide-react-native";

import { useComparison } from "../context/ComparisonContext";

export const ComparisonTray: React.FC = () => {
  const { t } = useTranslation();

  const {
    selectedSchemeIds,
    removeSchemeFromCompare,
    clearComparison,
    warningMessage,
  } = useComparison();

  if (selectedSchemeIds.length === 0) {
    return null;
  }

  const handleCompareNow = () => {
    if (selectedSchemeIds.length >= 2) {
      router.push({
        pathname: "/compare",
        params: {
          schemes: selectedSchemeIds.join(","),
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left: Info and selected schemes */}
        <View style={styles.leftSection}>
          {/* Compare title */}
          <View style={styles.titleBadge}>
            <Scale
              size={16}
              color="#34D399"
              strokeWidth={2}
            />

            <Text style={styles.titleText}>
              {t(
                "compare.trayTitle",
                "Compare Schemes"
              )}{" "}
              ({selectedSchemeIds.length}/4)
            </Text>
          </View>

          {/* Selected scheme chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.chipsContainer
            }
          >
            {selectedSchemeIds.map((id) => (
              <View
                key={id}
                style={styles.schemeChip}
              >
                <Text
                  style={styles.schemeId}
                  numberOfLines={1}
                >
                  {id}
                </Text>

                <Pressable
                  onPress={() =>
                    removeSchemeFromCompare(id)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${t(
                    "compare.remove",
                    "Remove"
                  )} ${id}`}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed &&
                      styles.removeButtonPressed,
                  ]}
                >
                  <X
                    size={14}
                    color="#CBD5E1"
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Right: Messages and actions */}
        <View style={styles.rightSection}>
          {/* Warning */}
          {warningMessage ? (
            <View style={styles.warningContainer}>
              <AlertCircle
                size={14}
                color="#FCD34D"
                strokeWidth={2}
              />

              <Text style={styles.warningText}>
                {warningMessage}
              </Text>
            </View>
          ) : null}

          {/* Select one more message */}
          {selectedSchemeIds.length === 1 &&
          !warningMessage ? (
            <Text style={styles.selectMoreText}>
              {t(
                "compare.selectOneMore",
                "Select at least one more scheme to compare."
              )}
            </Text>
          ) : null}

          {/* Clear all */}
          <Pressable
            onPress={clearComparison}
            accessibilityRole="button"
            accessibilityLabel={t(
              "compare.clearAll",
              "Clear All"
            )}
            style={({ pressed }) => [
              styles.clearButton,
              pressed &&
                styles.clearButtonPressed,
            ]}
          >
            <Trash2
              size={14}
              color="#94A3B8"
              strokeWidth={2}
            />

            <Text style={styles.clearButtonText}>
              {t(
                "compare.clearAll",
                "Clear All"
              )}
            </Text>
          </Pressable>

          {/* Compare now */}
          <Pressable
            disabled={
              selectedSchemeIds.length < 2
            }
            onPress={handleCompareNow}
            accessibilityRole="button"
            accessibilityLabel={t(
              "compare.compareNow",
              "Compare Now"
            )}
            style={({ pressed }) => [
              styles.compareButton,
              selectedSchemeIds.length < 2 &&
                styles.compareButtonDisabled,
              pressed &&
                selectedSchemeIds.length >= 2 &&
                styles.compareButtonPressed,
            ]}
          >
            <Text style={styles.compareButtonText}>
              {t(
                "compare.compareNow",
                "Compare Now"
              )}
            </Text>

            <ArrowRight
              size={16}
              color="#FFFFFF"
              strokeWidth={2.5}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /*
   * Bottom tray
   */
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: "rgba(15, 23, 42, 0.97)",
    borderTopWidth: 1,
    borderTopColor: "#334155",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },

  content: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },

  /*
   * Left section
   */
  leftSection: {
    width: "100%",
    gap: 10,
  },

  titleBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(14, 116, 144, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(14, 116, 144, 0.5)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  titleText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  /*
   * Selected scheme chips
   */
  chipsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 4,
  },

  schemeChip: {
    maxWidth: 180,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  schemeId: {
    flexShrink: 1,
    color: "#E2E8F0",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "monospace",
    fontWeight: "500",
  },

  removeButton: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },

  removeButtonPressed: {
    backgroundColor: "#334155",
  },

  /*
   * Right section
   */
  rightSection: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  /*
   * Warning
   */
  warningContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "rgba(69, 26, 3, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  warningText: {
    flex: 1,
    color: "#FCD34D",
    fontSize: 11,
    lineHeight: 16,
  },

  /*
   * Select-one-more message
   */
  selectMoreText: {
    flex: 1,
    minWidth: 180,
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 16,
    fontStyle: "italic",
  },

  /*
   * Clear button
   */
  clearButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  clearButtonPressed: {
    backgroundColor: "#1E293B",
  },

  clearButtonText: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  /*
   * Compare button
   */
  compareButton: {
    flex: 1,
    minHeight: 44,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#0D9488",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  compareButtonDisabled: {
    opacity: 0.5,
  },

  compareButtonPressed: {
    opacity: 0.85,
  },

  compareButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
});

export default ComparisonTray;
