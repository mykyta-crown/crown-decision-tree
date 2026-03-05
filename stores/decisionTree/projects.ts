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
  hidden: boolean
  archived: boolean
  topFamily: string | null
  state: any | null
}

function normalizeProject(p: Partial<Project>): Project {
  return {
    id: 0,
    name: 'Untitled',
    created: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    baseline: 0,
    ccy: 'EUR',
    status: 'Draft',
    owner: 'You',
    client: 'Crown',
    category: 'Real',
    favorite: false,
    hidden: false,
    archived: false,
    topFamily: null,
    state: null,
    ...p,
  }
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const search = ref('')
  const listFilter = ref('All')
  const openMenuId = ref<number | null>(null)
  const userName = ref('')
  const storageReady = ref(false)

  // Load from localStorage on init
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem('crown:projects')
      if (raw) projects.value = JSON.parse(raw).map(normalizeProject)
      const name = localStorage.getItem('crown:user_name')
      if (name) userName.value = name
    } catch (e) { /* first load */ }
    storageReady.value = true
  }

  // Persist to localStorage
  function saveToStorage() {
    if (!storageReady.value) return
    try {
      localStorage.setItem('crown:projects', JSON.stringify(projects.value))
      localStorage.setItem('crown:user_name', userName.value)
    } catch (e) { /* storage full */ }
  }

  // Watchers for auto-save
  watch([projects, userName], saveToStorage, { deep: true })

  // Computed
  const allActive = computed(() => projects.value.filter(p => !p.hidden && !p.archived))

  const visibleProjects = computed(() =>
    allActive.value
      .filter(p => listFilter.value === 'All' || p.category === listFilter.value)
      .filter(p => !search.value || p.name.toLowerCase().includes(search.value.toLowerCase()))
  )

  const headerCount = computed(() =>
    listFilter.value === 'All'
      ? allActive.value.length
      : allActive.value.filter(p => p.category === listFilter.value).length
  )

  // Actions
  function createProject(): number {
    const id = Date.now()
    const now = new Date().toISOString()
    projects.value = [...projects.value, normalizeProject({
      id,
      name: 'Untitled',
      created: now,
      lastActive: now,
      owner: userName.value || 'You',
    })]
    return id
  }

  function saveProject(activeId: number, snapshot: any, meta: { evName: string; totBase: number; ccy: string; statusLabel: string; topFamily: string | null }) {
    projects.value = projects.value.map(p => p.id === activeId ? {
      ...p,
      name: meta.evName || 'Untitled',
      lastActive: new Date().toISOString(),
      baseline: meta.totBase,
      ccy: meta.ccy,
      status: meta.statusLabel,
      owner: userName.value || p.owner || 'You',
      topFamily: meta.topFamily,
      state: snapshot,
    } : p)
  }

  function deleteProject(id: number) {
    projects.value = projects.value.map(p => p.id === id ? { ...p, hidden: true } : p)
    openMenuId.value = null
  }

  function archiveProject(id: number) {
    projects.value = projects.value.map(p => p.id === id ? { ...p, archived: true } : p)
    openMenuId.value = null
  }

  function duplicateProject(id: number) {
    const proj = projects.value.find(p => p.id === id)
    if (!proj) return
    const newId = Date.now() + Math.floor(Math.random() * 10000)
    const now = new Date().toISOString()
    projects.value = [...projects.value, {
      ...proj,
      id: newId,
      name: 'Copy of ' + proj.name,
      created: now,
      lastActive: now,
      favorite: false,
      hidden: false,
      archived: false,
    }]
    openMenuId.value = null
  }

  function toggleFavorite(id: number) {
    projects.value = projects.value.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p)
  }

  function getProject(id: number): Project | undefined {
    return projects.value.find(p => p.id === id)
  }

  return {
    projects, search, listFilter, openMenuId, userName, storageReady,
    allActive, visibleProjects, headerCount,
    loadFromStorage, createProject, saveProject,
    deleteProject, archiveProject, duplicateProject, toggleFavorite, getProject,
  }
})
