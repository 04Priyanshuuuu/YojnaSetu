import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FilterOptionsResponse } from '../../types';

export interface SchemeFilters {
  ministry: string;
  sector: string;
  financial_type: string;
  beneficiary_category: string;
  application_route: string;
}

interface FilterModalProps {
  visible: boolean;
  filters: SchemeFilters;
  filterOptions: FilterOptionsResponse | null;
  onChange: (
    key: keyof SchemeFilters,
    value: string
  ) => void;
  onClose: () => void;
  onClear: () => void;
  resultCount: number;
  loading: boolean;
}

interface FilterSectionProps {
  title: string;
  value: string;
  options: Array<{
    label: string;
    value: string;
    count: number;
  }>;
  allLabel: string;
  onSelect: (value: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  value,
  options,
  allLabel,
  onSelect,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const selectedLabel =
    value === ''
      ? allLabel
      : options.find((item) => item.value === value)
          ?.label || value;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <Pressable
        onPress={() => setExpanded((previous) => !previous)}
        style={({ pressed }) => [
          styles.selector,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.selectorText,
            value !== '' && styles.selectorSelectedText,
          ]}
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#64748B"
        />
      </Pressable>

      {expanded ? (
        <View style={styles.optionsBox}>
          <Pressable
            onPress={() => {
              onSelect('');
              setExpanded(false);
            }}
            style={[
              styles.option,
              value === '' && styles.selectedOption,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                value === '' && styles.selectedOptionText,
              ]}
            >
              {allLabel}
            </Text>

            {value === '' ? (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#0284C7"
              />
            ) : null}
          </Pressable>

          {options.map((option) => {
            const selected = value === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSelect(option.value);
                  setExpanded(false);
                }}
                style={[
                  styles.option,
                  selected && styles.selectedOption,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected &&
                      styles.selectedOptionText,
                  ]}
                  numberOfLines={2}
                >
                  {option.label}
                  {'  '}
                  <Text style={styles.optionCount}>
                    ({option.count})
                  </Text>
                </Text>

                {selected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#0284C7"
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  filterOptions,
  onChange,
  onClose,
  onClear,
  resultCount,
  loading,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.filterIcon}>
                <Ionicons
                  name="options-outline"
                  size={19}
                  color="#0284C7"
                />
              </View>

              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>
                  Filter Schemes
                </Text>

                <Text style={styles.subtitle}>
                  Refine schemes based on your needs
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
              accessibilityLabel="Close filters"
            >
              <Ionicons
                name="close"
                size={23}
                color="#475569"
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filterOptions ? (
              <>
                <FilterSection
                  title="Ministry"
                  value={filters.ministry}
                  options={filterOptions.ministries}
                  allLabel="All Ministries"
                  onSelect={(value) =>
                    onChange('ministry', value)
                  }
                />

                <FilterSection
                  title="Sector"
                  value={filters.sector}
                  options={filterOptions.sectors}
                  allLabel="All Sectors"
                  onSelect={(value) =>
                    onChange('sector', value)
                  }
                />

                <FilterSection
                  title="Financial Type"
                  value={filters.financial_type}
                  options={filterOptions.financial_types}
                  allLabel="All Financial Types"
                  onSelect={(value) =>
                    onChange('financial_type', value)
                  }
                />

                <FilterSection
                  title="Beneficiary Category"
                  value={filters.beneficiary_category}
                  options={
                    filterOptions.beneficiary_categories
                  }
                  allLabel="All Beneficiaries"
                  onSelect={(value) =>
                    onChange(
                      'beneficiary_category',
                      value
                    )
                  }
                />

                <FilterSection
                  title="Application Route"
                  value={filters.application_route}
                  options={
                    filterOptions.application_routes
                  }
                  allLabel="All Application Routes"
                  onSelect={(value) =>
                    onChange(
                      'application_route',
                      value
                    )
                  }
                />
              </>
            ) : (
              <View style={styles.loadingBox}>
                <Text style={styles.loadingText}>
                  Loading filter options...
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultNumber}>
                {loading ? '...' : resultCount}
              </Text>

              <Text style={styles.resultLabel}>
                schemes found
              </Text>
            </View>

            <View style={styles.footerButtons}>
              <Pressable
                onPress={onClear}
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.clearButtonText}>
                  Clear All
                </Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.applyButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.applyButtonText}>
                  Apply Filters
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '92%',
    minHeight: '70%',
  },

  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 11,
  },

  filterIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextContainer: {
    flex: 1,
  },

  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },

  subtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 28,
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 7,
  },

  selector: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },

  selectorText: {
    flex: 1,
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 10,
  },

  selectorSelectedText: {
    color: '#0F172A',
    fontWeight: '800',
  },

  optionsBox: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },

  option: {
    minHeight: 46,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  selectedOption: {
    backgroundColor: '#F0F9FF',
  },

  optionText: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },

  selectedOptionText: {
    color: '#0369A1',
    fontWeight: '800',
  },

  optionCount: {
    color: '#94A3B8',
    fontWeight: '600',
  },

  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },

  loadingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
  },

  resultInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },

  resultNumber: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    marginRight: 5,
  },

  resultLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },

  footerButtons: {
    flexDirection: 'row',
    gap: 9,
  },

  clearButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },

  applyButton: {
    flex: 1.5,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.7,
  },
});