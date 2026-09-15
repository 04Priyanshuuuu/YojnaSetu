import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { schemeApi, SchemeQueryParams } from '../../api/schemeApi';
import {
  FilterOptionsResponse,
  Scheme,
} from '../../types';
import { SchemeCard } from '../../components/schemes/SchemeCard';
import { FilterModal, SchemeFilters } from '../../components/schemes/FilterModal';
import theme from '../../constants/theme';

const PAGE_SIZE = 12;

type SortValue =
  | 'relevance_asc'
  | 'scheme_name_asc'
  | 'scheme_name_desc'
  | 'max_loan_amount_desc'
  | 'interest_rate_min_asc'
  | 'created_at_desc';

const SORT_OPTIONS: Array<{
  value: SortValue;
  label: string;
}> = [
  {
    value: 'relevance_asc',
    label: 'Relevance',
  },
  {
    value: 'scheme_name_asc',
    label: 'Name: A → Z',
  },
  {
    value: 'scheme_name_desc',
    label: 'Name: Z → A',
  },
  {
    value: 'max_loan_amount_desc',
    label: 'Maximum Support',
  },
  {
    value: 'interest_rate_min_asc',
    label: 'Lowest Interest',
  },
  {
    value: 'created_at_desc',
    label: 'Recently Added',
  },
];

const SEARCH_SUGGESTIONS = [
  'MUDRA',
  'PMEGP',
  'PM Vishwakarma',
  'Kisan',
  'Scholarship',
  'Women',
];

const initialFilters: SchemeFilters = {
  ministry: '',
  sector: '',
  financial_type: '',
  beneficiary_category: '',
  application_route: '',
};

const getErrorMessage = (error: any): string => {
  if (error?.userFriendlyMessage) {
    return error.userFriendlyMessage;
  }

  if (error?.response?.data?.detail) {
    if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }

    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail
        .map(
          (item: any) =>
            item?.msg || item?.message
        )
        .filter(Boolean)
        .join('; ');
    }
  }

  if (error?.message) {
    return error.message;
  }

  return 'Unable to load schemes. Please try again.';
};

const sortParts = (value: SortValue) => {
  const lastUnderscore = value.lastIndexOf('_');

  return {
    sortBy: value.slice(0, lastUnderscore),
    sortOrder: value.slice(lastUnderscore + 1),
  };
};

export default function SchemesScreen() {
  const router = useRouter();

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [filters, setFilters] =
    useState<SchemeFilters>(initialFilters);

  const [sortValue, setSortValue] =
    useState<SortValue>('scheme_name_asc');

  const [filterOptions, setFilterOptions] =
    useState<FilterOptionsResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [isLoadingFilters, setIsLoadingFilters] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isFilterModalVisible, setIsFilterModalVisible] =
    useState(false);

  const [showSortOptions, setShowSortOptions] =
    useState(false);

  const [isSearchFocused, setIsSearchFocused] =
    useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (search) count += 1;
    if (filters.ministry) count += 1;
    if (filters.sector) count += 1;
    if (filters.financial_type) count += 1;
    if (filters.beneficiary_category) count += 1;
    if (filters.application_route) count += 1;

    return count;
  }, [search, filters]);

  const fetchFilterOptions = useCallback(
    async () => {
      setIsLoadingFilters(true);

      try {
        const data =
          await schemeApi.getFilterOptions();

        setFilterOptions(data);
      } catch (error) {
        console.error(
          'Failed to load scheme filter options:',
          error
        );
      } finally {
        setIsLoadingFilters(false);
      }
    },
    []
  );

  const fetchSchemes = useCallback(
    async (
      requestedPage = page,
      isRefresh = false
    ) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage(null);

      try {
        const { sortBy, sortOrder } =
          sortParts(sortValue);

        const queryParams: SchemeQueryParams = {
          page: requestedPage,
          page_size: PAGE_SIZE,

          search: search.trim() || undefined,

          ministry:
            filters.ministry || undefined,

          sector:
            filters.sector || undefined,

          financial_type:
            filters.financial_type || undefined,

          beneficiary_category:
            filters.beneficiary_category ||
            undefined,

          application_route:
            filters.application_route ||
            undefined,

          sort_by: sortBy || undefined,
          sort_order: sortOrder || undefined,
        };

        const response =
          await schemeApi.getSchemes(queryParams);

        setSchemes(response.items || []);
        setTotal(response.total || 0);
        setPage(response.page || requestedPage);
        setTotalPages(
          Math.max(1, response.pages || 1)
        );
      } catch (error) {
        console.error(
          'Failed to load schemes:',
          error
        );

        setErrorMessage(
          getErrorMessage(error)
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      page,
      search,
      filters,
      sortValue,
    ]
  );

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchSchemes(1);
  }, [
    search,
    filters,
    sortValue,
  ]);

  const handleRefresh = () => {
    fetchSchemes(page, true);
  };

  const handleClearAll = () => {
    setSearchInput('');
    setSearch('');
    setFilters(initialFilters);
    setSortValue('scheme_name_asc');
    setPage(1);
    setErrorMessage(null);
  };

  const handleFilterChange = (
    key: keyof SchemeFilters,
    value: string
  ) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));

    setPage(1);
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();

    const cleaned = searchInput.trim();

    setSearch(cleaned);
    setSearchInput(cleaned);
    setPage(1);
  };

  const handleSuggestion = (value: string) => {
    setSearchInput(value);
    setSearch(value);
    setPage(1);
    Keyboard.dismiss();
  };

  const handlePrevious = () => {
    if (page <= 1 || isLoading) {
      return;
    }

    const nextPage = page - 1;

    setPage(nextPage);
    fetchSchemes(nextPage);
  };

  const handleNext = () => {
    if (page >= totalPages || isLoading) {
      return;
    }

    const nextPage = page + 1;

    setPage(nextPage);
    fetchSchemes(nextPage);
  };

  const renderScheme = ({
    item,
  }: {
    item: Scheme;
  }) => {
    return <SchemeCard scheme={item} />;
  };

  const keyExtractor = (item: Scheme) =>
    item.scheme_id;

  const ListHeader = () => (
    <View>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.repositoryBadgeRow}>
          <View style={styles.repositoryBadge}>
            <Ionicons
              name="shield-checkmark"
              size={12}
              color="#0369A1"
            />

            <Text style={styles.repositoryBadgeText}>
              VERIFIED REPOSITORY
            </Text>
          </View>

          <Text style={styles.schemeTotal}>
            {filterOptions?.total_schemes || 90}{' '}
            schemes
          </Text>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.bookIcon}>
            <Ionicons
              name="book-outline"
              size={23}
              color="#0284C7"
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>
              Government Schemes
            </Text>

            <Text style={styles.pageSubtitle}>
              Discover verified government schemes
              and support programs that match your
              needs.
            </Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          isSearchFocused &&
            styles.searchContainerFocused,
        ]}
      >
        <Ionicons
          name="search"
          size={19}
          color={
            isSearchFocused
              ? '#0284C7'
              : '#94A3B8'
          }
        />

        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search schemes, benefits, ministries..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          clearButtonMode="never"
        />

        {searchInput.length > 0 ? (
          <Pressable
            onPress={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
            style={styles.searchClear}
            accessibilityLabel="Clear search"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color="#94A3B8"
            />
          </Pressable>
        ) : null}

        <Pressable
          onPress={handleSearchSubmit}
          style={({ pressed }) => [
            styles.searchButton,
            pressed && styles.pressed,
          ]}
          accessibilityLabel="Search schemes"
        >
          <Ionicons
            name="arrow-forward"
            size={17}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      {/* Filter / Sort Controls */}
      <View style={styles.controlRow}>
        <Pressable
          onPress={() =>
            setIsFilterModalVisible(true)
          }
          style={({ pressed }) => [
            styles.filterButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="options-outline"
            size={17}
            color="#0369A1"
          />

          <Text style={styles.filterButtonText}>
            Filters
          </Text>

          {activeFiltersCount > 0 ? (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>
                {activeFiltersCount}
              </Text>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.sortContainer}>
          <Pressable
            onPress={() =>
              setShowSortOptions(
                (previous) => !previous
              )
            }
            style={({ pressed }) => [
              styles.sortButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={16}
              color="#475569"
            />

            <Text
              style={styles.sortButtonText}
              numberOfLines={1}
            >
              {
                SORT_OPTIONS.find(
                  (item) =>
                    item.value === sortValue
                )?.label
              }
            </Text>

            <Ionicons
              name={
                showSortOptions
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={15}
              color="#64748B"
            />
          </Pressable>

          {showSortOptions ? (
            <View style={styles.sortMenu}>
              {SORT_OPTIONS.map((option) => {
                const selected =
                  option.value === sortValue;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setSortValue(option.value);
                      setShowSortOptions(false);
                      setPage(1);
                    }}
                    style={[
                      styles.sortOption,
                      selected &&
                        styles.sortOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        selected &&
                          styles.sortOptionSelectedText,
                      ]}
                    >
                      {option.label}
                    </Text>

                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={17}
                        color="#0284C7"
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>

      {/* Active Filters */}
      {activeFiltersCount > 0 ? (
        <View style={styles.activeFiltersBox}>
          <View style={styles.activeFiltersHeader}>
            <Text style={styles.activeFiltersLabel}>
              Active filters
            </Text>

            <Pressable
              onPress={handleClearAll}
            >
              <Text style={styles.clearText}>
                Clear all
              </Text>
            </Pressable>
          </View>

          <View style={styles.chipsRow}>
            {search ? (
              <View style={styles.searchChip}>
                <Ionicons
                  name="search"
                  size={11}
                  color="#0369A1"
                />

                <Text
                  style={styles.searchChipText}
                  numberOfLines={1}
                >
                  {search}
                </Text>

                <Pressable
                  onPress={() => {
                    setSearch('');
                    setSearchInput('');
                    setPage(1);
                  }}
                >
                  <Ionicons
                    name="close"
                    size={13}
                    color="#0369A1"
                  />
                </Pressable>
              </View>
            ) : null}

            {filters.ministry ? (
              <FilterChip
                label={`Ministry: ${filters.ministry}`}
                onRemove={() =>
                  handleFilterChange(
                    'ministry',
                    ''
                  )
                }
              />
            ) : null}

            {filters.sector ? (
              <FilterChip
                label={`Sector: ${filters.sector}`}
                onRemove={() =>
                  handleFilterChange(
                    'sector',
                    ''
                  )
                }
              />
            ) : null}

            {filters.financial_type ? (
              <FilterChip
                label={`Type: ${filters.financial_type.replace(
                  /_/g,
                  ' '
                )}`}
                onRemove={() =>
                  handleFilterChange(
                    'financial_type',
                    ''
                  )
                }
              />
            ) : null}

            {filters.beneficiary_category ? (
              <FilterChip
                label={`Target: ${filters.beneficiary_category}`}
                onRemove={() =>
                  handleFilterChange(
                    'beneficiary_category',
                    ''
                  )
                }
              />
            ) : null}

            {filters.application_route ? (
              <FilterChip
                label={`Route: ${filters.application_route.replace(
                  /_/g,
                  ' '
                )}`}
                onRemove={() =>
                  handleFilterChange(
                    'application_route',
                    ''
                  )
                }
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Results Count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsCount}>
          {isLoading
            ? 'Loading schemes...'
            : `${schemes.length} of ${total} schemes`}
        </Text>

        {activeFiltersCount === 0 &&
        total > 0 ? (
          <Text style={styles.resultsHint}>
            Browse all available schemes
          </Text>
        ) : null}
      </View>

      {/* Error */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle"
              size={20}
              color="#E11D48"
            />
          </View>

          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>
              Unable to load schemes
            </Text>

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>

            <Pressable
              onPress={() =>
                fetchSchemes(page)
              }
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="refresh"
                size={14}
                color="#BE123C"
              />

              <Text style={styles.retryText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  const ListEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator
            size="large"
            color="#0284C7"
          />

          <Text style={styles.loadingTitle}>
            Loading schemes...
          </Text>

          <Text style={styles.loadingSubtitle}>
            Fetching verified government schemes
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyBox}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="search-outline"
            size={34}
            color="#94A3B8"
          />
        </View>

        <Text style={styles.emptyTitle}>
          No schemes found
        </Text>

        <Text style={styles.emptyDescription}>
          We couldn't find schemes matching your
          current search or filters.
        </Text>

        <Text style={styles.suggestionTitle}>
          TRY SEARCHING FOR
        </Text>

        <View style={styles.suggestions}>
          {SEARCH_SUGGESTIONS.map((item) => (
            <Pressable
              key={item}
              onPress={() =>
                handleSuggestion(item)
              }
              style={({ pressed }) => [
                styles.suggestionChip,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.suggestionText}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleClearAll}
          style={({ pressed }) => [
            styles.emptyClearButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="refresh-outline"
            size={16}
            color="#FFFFFF"
          />

          <Text style={styles.emptyClearText}>
            Clear Filters
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/match')}
          style={({ pressed }) => [
            styles.matchButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="sparkles-outline"
            size={16}
            color="#0369A1"
          />

          <Text style={styles.matchButtonText}>
            Find Schemes For Me
          </Text>
        </Pressable>
      </View>
    );
  };

  const ListFooter = () => {
    if (
      schemes.length === 0 ||
      totalPages <= 1
    ) {
      return <View style={{ height: 30 }} />;
    }

    return (
      <View style={styles.pagination}>
        <Text style={styles.pageText}>
          Page {page} of {totalPages}
        </Text>

        <View style={styles.paginationButtons}>
          <Pressable
            disabled={page <= 1 || isLoading}
            onPress={handlePrevious}
            style={({ pressed }) => [
              styles.paginationButton,
              (page <= 1 || isLoading) &&
                styles.paginationDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={17}
              color={
                page <= 1
                  ? '#CBD5E1'
                  : '#475569'
              }
            />

            <Text
              style={[
                styles.paginationButtonText,
                page <= 1 &&
                  styles.paginationDisabledText,
              ]}
            >
              Previous
            </Text>
          </Pressable>

          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>
              {page}
            </Text>

            <Text style={styles.pageIndicatorSlash}>
              /
            </Text>

            <Text style={styles.pageIndicatorTotal}>
              {totalPages}
            </Text>
          </View>

          <Pressable
            disabled={
              page >= totalPages || isLoading
            }
            onPress={handleNext}
            style={({ pressed }) => [
              styles.paginationButton,
              (page >= totalPages || isLoading) &&
                styles.paginationDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.paginationButtonText,
                page >= totalPages &&
                  styles.paginationDisabledText,
              ]}
            >
              Next
            </Text>

            <Ionicons
              name="chevron-forward"
              size={17}
              color={
                page >= totalPages
                  ? '#CBD5E1'
                  : '#475569'
              }
            />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={schemes}
        keyExtractor={keyExtractor}
        renderItem={renderScheme}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={[
          styles.listContent,
          schemes.length === 0 &&
            styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0284C7"
            colors={['#0284C7']}
          />
        }
      />

      <FilterModal
        visible={isFilterModalVisible}
        filters={filters}
        filterOptions={filterOptions}
        onChange={handleFilterChange}
        onClose={() =>
          setIsFilterModalVisible(false)
        }
        onClear={handleClearAll}
        resultCount={total}
        loading={isLoading}
      />

      {isLoadingFilters ? null : null}
    </View>
  );
}

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  onRemove,
}) => {
  return (
    <View style={styles.filterChip}>
      <Text
        style={styles.filterChipText}
        numberOfLines={1}
      >
        {label}
      </Text>

      <Pressable
        onPress={onRemove}
        hitSlop={6}
      >
        <Ionicons
          name="close"
          size={13}
          color="#475569"
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  listContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 28,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  pageHeader: {
    paddingHorizontal: 3,
    paddingTop: 5,
    paddingBottom: 14,
  },

  repositoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    gap: 8,
  },

  repositoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  repositoryBadgeText: {
    color: '#0369A1',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  schemeTotal: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  bookIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleContainer: {
    flex: 1,
  },

  pageTitle: {
    color: '#0F172A',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
  },

  pageSubtitle: {
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 3,
  },

  searchContainer: {
    minHeight: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 15,
    paddingLeft: 13,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },

  searchContainerFocused: {
    borderColor: '#38BDF8',
    shadowOpacity: 0.07,
  },

  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '600',
    paddingHorizontal: 9,
    paddingVertical: 0,
  },

  searchClear: {
    padding: 5,
    marginRight: 1,
  },

  searchButton: {
    width: 41,
    height: 41,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 9,
    zIndex: 20,
  },

  filterButton: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexShrink: 0,
  },

  filterButtonText: {
    color: '#0369A1',
    fontSize: 11.5,
    fontWeight: '800',
  },

  filterCount: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  filterCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  sortContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 30,
  },

  sortButton: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 10,
  },

  sortButtonText: {
    flex: 1,
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '700',
  },

  sortMenu: {
    position: 'absolute',
    top: 49,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    overflow: 'hidden',
    zIndex: 50,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },

  sortOption: {
    minHeight: 43,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  sortOptionSelected: {
    backgroundColor: '#F0F9FF',
  },

  sortOptionText: {
    flex: 1,
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },

  sortOptionSelectedText: {
    color: '#0369A1',
    fontWeight: '800',
  },

  activeFiltersBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    padding: 11,
    marginBottom: 10,
  },

  activeFiltersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  activeFiltersLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  clearText: {
    color: '#E11D48',
    fontSize: 10.5,
    fontWeight: '800',
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  searchChip: {
    maxWidth: '100%',
    minHeight: 27,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 20,
    paddingHorizontal: 8,
  },

  searchChipText: {
    maxWidth: 180,
    color: '#0369A1',
    fontSize: 9.5,
    fontWeight: '700',
  },

  filterChip: {
    maxWidth: '100%',
    minHeight: 27,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 9,
  },

  filterChipText: {
    maxWidth: 190,
    color: '#475569',
    fontSize: 9.5,
    fontWeight: '700',
  },

  resultsRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  resultsCount: {
    color: '#334155',
    fontSize: 11.5,
    fontWeight: '800',
  },

  resultsHint: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '600',
  },

  errorBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 9,
  },

  errorIcon: {
    width: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    color: '#9F1239',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 3,
  },

  errorText: {
    color: '#BE123C',
    fontSize: 10.5,
    lineHeight: 16,
  },

  retryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  retryText: {
    color: '#BE123C',
    fontSize: 10,
    fontWeight: '800',
  },

  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  loadingTitle: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
  },

  loadingSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
    marginTop: 4,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },

  emptyDescription: {
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 290,
  },

  suggestionTitle: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 22,
    marginBottom: 9,
  },

  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
  },

  suggestionChip: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  suggestionText: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '700',
  },

  emptyClearButton: {
    minHeight: 43,
    marginTop: 20,
    width: '100%',
    borderRadius: 11,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  emptyClearText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  matchButton: {
    minHeight: 43,
    marginTop: 8,
    width: '100%',
    borderRadius: 11,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  matchButtonText: {
    color: '#0369A1',
    fontSize: 11.5,
    fontWeight: '800',
  },

  pagination: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    padding: 12,
    marginTop: 5,
    marginBottom: 15,
  },

  pageText: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },

  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  paginationButton: {
    flex: 1,
    minHeight: 43,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  paginationDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },

  paginationButtonText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '800',
  },

  paginationDisabledText: {
    color: '#CBD5E1',
  },

  pageIndicator: {
    minWidth: 55,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },

  pageIndicatorText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '900',
  },

  pageIndicatorSlash: {
    color: '#94A3B8',
    fontSize: 11,
  },

  pageIndicatorTotal: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});