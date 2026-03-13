import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface Project {
  id: number
  name: string
  created: string
  lastActive: string
  baseline: number
  ccy: string
  status: string
  owner: string
  client: string
  category: string
  favorite: boolean
  topFamily: string | null
  state: any | null
}

interface DbRow {
  id: number
  name: string
  owner_name: string
  client: string
  status: string
  baseline: number
  ccy: string
  category: string
  favorite: boolean
  top_family: string | null
  state: any | null
  created_at: string
  updated_at: string
}

export interface DateFilter {
  type: 'before' | 'after' | 'between' | null
  date: string | null
  startDate: string | null
  endDate: string | null
}

export interface SortEntry {
  key: string
  order: 'asc' | 'desc'
}

function rowToProject(r: DbRow): Project {
  return {
    id: r.id,
    name: r.name,
    created: r.created_at,
    lastActive: r.updated_at,
    baseline: Number(r.baseline) || 0,
    ccy: r.ccy || 'EUR',
    status: r.status,
    owner: r.owner_name || '',
    client: r.client || 'Crown',
    category: r.category || 'Real',
    favorite: r.favorite ?? false,
    topFamily: r.top_family,
    state: r.state,
  }
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const search = ref('')
  const listFilter = ref('All')
  const openMenuId = ref<number | null>(null)
  const userName = ref('')
  const loading = ref(false)
  const loaded = ref(false)

  // ─── Pagination ───
  const page = ref(1)
  const pageSize = ref(20) // 20 | 50 | 100 | 0 (0 = all)

  // ─── Selection ───
  const selectedIds = ref<Set<number>>(new Set())

  // ─── Filters ───
  const dropdownFilters = ref<{
    owners: string[]
    statuses: string[]
    types: string[]       // topFamily
    clients: string[]
    createdDateFilter: DateFilter
    modifiedDateFilter: DateFilter
  }>({
    owners: [],
    statuses: [],
    types: [],
    clients: [],
    createdDateFilter: { type: null, date: null, startDate: null, endDate: null },
    modifiedDateFilter: { type: null, date: null, startDate: null, endDate: null },
  })

  const sortBy = ref<SortEntry[]>([])

  // ─── Unique values for filter dropdowns ───
  const uniqueOwners = computed(() => {
    const set = new Set(allActive.value.map(p => p.owner).filter(Boolean))
    return [...set].sort()
  })

  const uniqueStatuses = computed(() => {
    const set = new Set(allActive.value.map(p => p.status).filter(Boolean))
    return [...set].sort()
  })

  const uniqueTypes = computed(() => {
    const set = new Set(allActive.value.map(p => p.topFamily).filter(Boolean) as string[])
    return [...set].sort()
  })

  const uniqueClients = computed(() => {
    const set = new Set(allActive.value.map(p => p.client).filter(Boolean))
    return [...set].sort()
  })

  // ─── Active filter count ───
  const activeFilterCount = computed(() => {
    let count = 0
    if (dropdownFilters.value.owners.length) count++
    if (dropdownFilters.value.statuses.length) count++
    if (dropdownFilters.value.types.length) count++
    if (dropdownFilters.value.clients.length) count++
    if (dropdownFilters.value.createdDateFilter.type) count++
    if (dropdownFilters.value.modifiedDateFilter.type) count++
    if (sortBy.value.length) count++
    return count
  })

  // ─── Supabase helpers ───
  function getClient() {
    return useSupabaseClient()
  }

  async function getUserId(): Promise<string | null> {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  }

  // ─── Load projects from Supabase ───
  async function loadProjects() {
    const uid = await getUserId()
    if (!uid) return
    loading.value = true
    try {
      const { data, error } = await getClient()
        .from('dt_projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      projects.value = (data || []).map(rowToProject)

      // Load user name from profile
      if (!userName.value) {
        const { data: profile } = await getClient()
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', uid)
          .single()
        if (profile) {
          userName.value = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
        }
      }
    } catch (e) {
      console.error('[DT] Failed to load projects:', e)
    } finally {
      loading.value = false
      loaded.value = true
    }
  }

  // ─── Computed ───
  const allActive = computed(() => projects.value.filter(p => p.status !== 'Archived'))

  // ─── Date filter helper ───
  function matchesDateFilter(dateStr: string | null | undefined, filter: DateFilter): boolean {
    if (!filter.type) return true
    if (!dateStr) return false
    const d = new Date(dateStr).getTime()
    if (filter.type === 'before' && filter.date) {
      return d <= new Date(filter.date).getTime() + 86400000 // end of day
    }
    if (filter.type === 'after' && filter.date) {
      return d >= new Date(filter.date).getTime()
    }
    if (filter.type === 'between' && filter.startDate && filter.endDate) {
      return d >= new Date(filter.startDate).getTime() && d <= new Date(filter.endDate).getTime() + 86400000
    }
    return true
  }

  // ─── Sorting helper ───
  function compareProjects(a: Project, b: Project, key: string, order: 'asc' | 'desc'): number {
    const dir = order === 'asc' ? 1 : -1
    switch (key) {
      case 'name':
        return dir * (a.name || '').localeCompare(b.name || '')
      case 'client':
        return dir * (a.client || '').localeCompare(b.client || '')
      case 'created':
        return dir * (new Date(a.created).getTime() - new Date(b.created).getTime())
      case 'lastActive':
        return dir * (new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime())
      case 'type':
        return dir * (a.topFamily || '').localeCompare(b.topFamily || '')
      case 'owner':
        return dir * (a.owner || '').localeCompare(b.owner || '')
      case 'status':
        return dir * (a.status || '').localeCompare(b.status || '')
      default:
        return 0
    }
  }

  const visibleProjects = computed(() => {
    let list = allActive.value

    // Category filter
    if (listFilter.value !== 'All') {
      list = list.filter(p => p.category === listFilter.value)
    }

    // Global search
    if (search.value) {
      const q = search.value.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        (p.topFamily || '').toLowerCase().includes(q)
      )
    }

    // Dropdown filters
    const f = dropdownFilters.value
    if (f.owners.length) {
      list = list.filter(p => f.owners.includes(p.owner))
    }
    if (f.statuses.length) {
      list = list.filter(p => f.statuses.includes(p.status))
    }
    if (f.types.length) {
      list = list.filter(p => p.topFamily && f.types.includes(p.topFamily))
    }
    if (f.clients.length) {
      list = list.filter(p => f.clients.includes(p.client))
    }

    // Date filters
    list = list.filter(p => matchesDateFilter(p.created, f.createdDateFilter))
    list = list.filter(p => matchesDateFilter(p.lastActive, f.modifiedDateFilter))

    // Sorting
    if (sortBy.value.length) {
      list = [...list].sort((a, b) => {
        for (const s of sortBy.value) {
          const cmp = compareProjects(a, b, s.key, s.order)
          if (cmp !== 0) return cmp
        }
        return 0
      })
    }

    return list
  })

  const headerCount = computed(() =>
    listFilter.value === 'All'
      ? allActive.value.length
      : allActive.value.filter(p => p.category === listFilter.value).length
  )

  // ─── Sort action ───
  function toggleSort(key: string, order: 'asc' | 'desc') {
    const existing = sortBy.value.findIndex(s => s.key === key)
    if (existing >= 0) {
      const current = sortBy.value[existing]
      if (current.order === order) {
        // Remove this sort
        sortBy.value = sortBy.value.filter((_, i) => i !== existing)
      } else {
        // Update order
        sortBy.value = sortBy.value.map((s, i) => i === existing ? { ...s, order } : s)
      }
    } else {
      // Add as top priority
      sortBy.value = [{ key, order }, ...sortBy.value]
    }
  }

  function clearFilters() {
    dropdownFilters.value = {
      owners: [],
      statuses: [],
      types: [],
      clients: [],
      createdDateFilter: { type: null, date: null, startDate: null, endDate: null },
      modifiedDateFilter: { type: null, date: null, startDate: null, endDate: null },
    }
    sortBy.value = []
    search.value = ''
  }

  // ─── Actions ───
  async function createProject(): Promise<number | null> {
    const uid = await getUserId()
    if (!uid) { console.error('[DT] No user logged in'); return null }

    // Get company_id from profile
    const { data: profile } = await getClient()
      .from('profiles')
      .select('company_id')
      .eq('id', uid)
      .single()

    const { data, error } = await getClient()
      .from('dt_projects')
      .insert({
        user_id: uid,
        company_id: profile?.company_id ?? null,
        name: 'Untitled',
        owner_name: userName.value || '',
      })
      .select()
      .single()

    if (error || !data) {
      console.error('[DT] Failed to create project:', error)
      return null
    }

    return data.id
  }

  async function saveProject(
    activeId: number,
    snapshot: any,
    meta: { evName: string; totBase: number; ccy: string; statusLabel: string; topFamily: string | null }
  ) {
    const update = {
      name: meta.evName || 'Untitled',
      baseline: meta.totBase,
      ccy: meta.ccy,
      status: meta.statusLabel,
      owner_name: userName.value || '',
      top_family: meta.topFamily,
      state: snapshot,
    }

    // Optimistic local update
    projects.value = projects.value.map(p => p.id === activeId ? {
      ...p,
      name: update.name,
      lastActive: new Date().toISOString(),
      baseline: update.baseline,
      ccy: update.ccy,
      status: update.status,
      owner: update.owner_name,
      topFamily: update.top_family,
      state: update.state,
    } : p)

    // Persist to DB
    const { error } = await getClient()
      .from('dt_projects')
      .update(update)
      .eq('id', activeId)

    if (error) {
      console.error('[DT] Failed to save project:', error)
      throw error
    }
  }

  async function deleteProject(id: number) {
    // Soft delete → archive
    const { error } = await getClient()
      .from('dt_projects')
      .update({ status: 'Archived' })
      .eq('id', id)

    if (!error) {
      projects.value = projects.value.map(p => p.id === id ? { ...p, status: 'Archived' } : p)
    }
    openMenuId.value = null
  }

  async function archiveProject(id: number) {
    return deleteProject(id)
  }

  async function duplicateProject(id: number) {
    const proj = projects.value.find(p => p.id === id)
    if (!proj) return

    const uid = await getUserId()
    if (!uid) return

    const { data: profile } = await getClient()
      .from('profiles')
      .select('company_id')
      .eq('id', uid)
      .single()

    const { data, error } = await getClient()
      .from('dt_projects')
      .insert({
        user_id: uid,
        company_id: profile?.company_id ?? null,
        name: 'Copy of ' + proj.name,
        owner_name: proj.owner,
        client: proj.client,
        category: proj.category,
        baseline: proj.baseline,
        ccy: proj.ccy,
        state: proj.state,
      })
      .select()
      .single()

    if (!error && data) {
      projects.value = [rowToProject(data), ...projects.value]
    }
    openMenuId.value = null
  }

  async function toggleFavorite(id: number) {
    const proj = projects.value.find(p => p.id === id)
    if (!proj) return

    const newVal = !proj.favorite
    projects.value = projects.value.map(p => p.id === id ? { ...p, favorite: newVal } : p)

    await getClient()
      .from('dt_projects')
      .update({ favorite: newVal })
      .eq('id', id)
  }

  function getProject(id: number): Project | undefined {
    return projects.value.find(p => p.id === id)
  }

  // ─── Pagination ───
  const totalPages = computed(() => {
    if (!pageSize.value) return 1 // "All"
    return Math.max(1, Math.ceil(visibleProjects.value.length / pageSize.value))
  })

  const paginatedProjects = computed(() => {
    if (!pageSize.value) return visibleProjects.value // "All"
    const start = (page.value - 1) * pageSize.value
    return visibleProjects.value.slice(start, start + pageSize.value)
  })

  // Reset to page 1 when filters/search change
  watch([search, dropdownFilters, sortBy], () => { page.value = 1 }, { deep: true })

  // ─── Selection ───
  function toggleSelect(id: number) {
    const s = new Set(selectedIds.value)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    selectedIds.value = s
  }

  function selectAllVisible() {
    const s = new Set(selectedIds.value)
    paginatedProjects.value.forEach(p => s.add(p.id))
    selectedIds.value = s
  }

  function deselectAll() {
    selectedIds.value = new Set()
  }

  const allVisibleSelected = computed(() => {
    if (paginatedProjects.value.length === 0) return false
    return paginatedProjects.value.every(p => selectedIds.value.has(p.id))
  })

  const someVisibleSelected = computed(() => {
    return paginatedProjects.value.some(p => selectedIds.value.has(p.id)) && !allVisibleSelected.value
  })

  async function bulkDelete() {
    const ids = [...selectedIds.value]
    if (!ids.length) return

    const { error } = await getClient()
      .from('dt_projects')
      .update({ status: 'Archived' })
      .in('id', ids)

    if (!error) {
      projects.value = projects.value.map(p =>
        ids.includes(p.id) ? { ...p, status: 'Archived' } : p
      )
      selectedIds.value = new Set()
      // Reset to last valid page if current page is now empty
      if (page.value > totalPages.value) {
        page.value = Math.max(1, totalPages.value)
      }
    }
  }

  return {
    projects, search, listFilter, openMenuId, userName, loading, loaded,
    dropdownFilters, sortBy, activeFilterCount,
    uniqueOwners, uniqueStatuses, uniqueTypes, uniqueClients,
    allActive, visibleProjects, headerCount,
    page, pageSize, totalPages, paginatedProjects,
    selectedIds, allVisibleSelected, someVisibleSelected,
    toggleSelect, selectAllVisible, deselectAll, bulkDelete,
    loadProjects, createProject, saveProject,
    deleteProject, archiveProject, duplicateProject, toggleFavorite, getProject,
    toggleSort, clearFilters,
  }
})
