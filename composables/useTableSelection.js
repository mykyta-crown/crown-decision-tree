import { ref, computed } from 'vue'
import { uniq } from 'lodash'

/**
 * Composable for managing table row selection
 * Handles multi-row selection and checkbox indeterminate states
 */
export function useTableSelection(filteredAuctions) {
  const selectedRows = ref([])
  const checkingHeader = ref(false)
  const headerIndeterminate = ref('default')

  /**
   * Computed property for checkbox indeterminate state
   */
  const isCheckboxIndeterminate = computed(() => {
    return headerIndeterminate.value === 'indeterminate'
  })

  /**
   * Toggle checkbox state (empty -> indeterminate -> all selected)
   */
  const toggleCheckboxState = () => {
    if (!checkingHeader.value) {
      headerIndeterminate.value = 'indeterminate'
      selectedRows.value = []
      checkingHeader.value = true
    } else if (checkingHeader.value) {
      selectedRows.value = filteredAuctions.value.map((item) => item.auctions_group_settings_id)
      checkingHeader.value = !checkingHeader.value
      headerIndeterminate.value = 'checked'
    } else {
      selectedRows.value = []
      checkingHeader.value = false
      headerIndeterminate.value = 'default'
    }
  }

  /**
   * Empty all selected rows
   */
  const emptySelection = () => {
    selectedRows.value = []
    checkingHeader.value = false
    headerIndeterminate.value = 'default'
  }

  /**
   * Toggle delete for a specific row
   * @param {string|number} groupId - Group ID to toggle
   */
  const toggleDelete = (groupId) => {
    selectedRows.value.push(groupId)
    selectedRows.value = uniq(selectedRows.value)
    headerIndeterminate.value = 'indeterminate'
    checkingHeader.value = true
  }

  /**
   * Cancel deletion and reset selection
   */
  const cancelDeletion = () => {
    selectedRows.value = []
    checkingHeader.value = false
    headerIndeterminate.value = 'default'
  }

  /**
   * Sync selected rows with filtered auctions
   * Removes selected rows that are no longer in filtered results
   */
  const syncSelectedRowsWithFiltered = () => {
    selectedRows.value = selectedRows.value.filter((groupId) => {
      return filteredAuctions.value.find((item) => item.auctions_group_settings_id === groupId)
    })
  }

  return {
    selectedRows,
    checkingHeader,
    headerIndeterminate,
    isCheckboxIndeterminate,
    toggleCheckboxState,
    emptySelection,
    toggleDelete,
    cancelDeletion,
    syncSelectedRowsWithFiltered
  }
}
