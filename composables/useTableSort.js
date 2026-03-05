/**
 * Composable for managing table sorting functionality
 * Handles sort state, sort operations, and sort UI helpers
 */
export function useTableSort(sortBy) {
  /**
   * Apply sorting to a column
   * @param {string} key - Column key to sort by
   * @param {string} order - Sort order ('asc' or 'desc')
   */
  const applySort = (key, order) => {
    const existing = sortBy.value.find((item) => item.key === key)
    if (existing && existing.order === order) return
    const others = sortBy.value.filter((item) => item.key !== key)
    sortBy.value = [{ key, order }, ...others]
  }

  /**
   * Clear sorting for a specific column
   * @param {string} key - Column key to clear sorting for
   */
  const clearSort = (key) => {
    sortBy.value = sortBy.value.filter((item) => item.key !== key)
  }

  /**
   * Get the current sort state for a column
   * @param {string} key - Column key
   * @returns {Object|undefined} Sort state object with key and order
   */
  const getSortState = (key) => sortBy.value.find((item) => item.key === key)

  /**
   * Check if column is sorted ascending
   * @param {string} key - Column key
   * @returns {boolean}
   */
  const isSortedAsc = (key) => getSortState(key)?.order === 'asc'

  /**
   * Check if column is sorted descending
   * @param {string} key - Column key
   * @returns {boolean}
   */
  const isSortedDesc = (key) => getSortState(key)?.order === 'desc'

  /**
   * Check if column has any sorting applied
   * @param {string} key - Column key
   * @returns {boolean}
   */
  const isSorted = (key) => Boolean(getSortState(key))

  /**
   * Get the appropriate icon for the column's sort state
   * @param {string} key - Column key
   * @returns {string} Icon name
   */
  const getSortIcon = (key) => {
    const state = getSortState(key)
    if (!state) return 'mdi-swap-vertical'
    return state.order === 'desc' ? 'mdi-arrow-down' : 'mdi-arrow-up'
  }

  return {
    applySort,
    clearSort,
    getSortState,
    isSortedAsc,
    isSortedDesc,
    isSorted,
    getSortIcon
  }
}
