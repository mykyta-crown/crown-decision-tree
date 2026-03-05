<template>
  <v-sheet class="custom-border bg-background pa-4">
    <v-row class="mb-4">
      <v-col>
        <h2 class="text-h5 font-weight-bold d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-stethoscope</v-icon>
          Health Check
        </h2>
        <p class="text-body-2 text-grey mt-1">Technical verification of auction configuration</p>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" :loading="loading" @click="runHealthCheck">
          <v-icon left>mdi-refresh</v-icon>
          Run Check
        </v-btn>
      </v-col>
    </v-row>

    <!-- Loading state -->
    <v-row v-if="loading">
      <v-col class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="mt-4 text-grey">Running checks...</p>
      </v-col>
    </v-row>

    <!-- Results -->
    <template v-else-if="results">
      <!-- Summary Cards -->
      <v-row class="mb-4">
        <v-col cols="3">
          <v-card class="text-center pa-4" color="success" variant="tonal">
            <v-icon size="32" color="success">mdi-check-circle</v-icon>
            <div class="text-h4 font-weight-bold mt-2">{{ results.summary.passed }}</div>
            <div class="text-body-2">Passed</div>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card class="text-center pa-4" color="warning" variant="tonal">
            <v-icon size="32" color="warning">mdi-alert</v-icon>
            <div class="text-h4 font-weight-bold mt-2">{{ results.summary.warnings }}</div>
            <div class="text-body-2">Warnings</div>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card class="text-center pa-4" color="error" variant="tonal">
            <v-icon size="32" color="error">mdi-close-circle</v-icon>
            <div class="text-h4 font-weight-bold mt-2">{{ results.summary.failed }}</div>
            <div class="text-body-2">Failed</div>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card class="text-center pa-4" color="grey" variant="tonal">
            <v-icon size="32" color="grey">mdi-clipboard-list</v-icon>
            <div class="text-h4 font-weight-bold mt-2">{{ results.summary.total }}</div>
            <div class="text-body-2">Total Tests</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Global failure alert -->
      <v-alert v-if="hasFailures" type="error" variant="tonal" class="mb-4" density="comfortable">
        <div class="font-weight-medium mb-1">Blocking issues detected</div>
        <div v-for="(msg, idx) in failureMessages" :key="idx" class="text-body-2">
          {{ msg }}
        </div>
      </v-alert>

      <!-- Dedicated alert for prebids missing Cloud Tasks -->
      <v-alert
        v-if="missingCloudTaskMessages.length > 0"
        type="error"
        variant="outlined"
        class="mb-4"
        density="comfortable"
      >
        <div class="font-weight-medium mb-1">Dutch prebids not scheduled in Cloud Tasks</div>
        <div v-for="(msg, idx) in missingCloudTaskMessages" :key="idx" class="text-body-2">
          {{ msg }}
        </div>
      </v-alert>

      <!-- Auctions (Lots) Details - First -->
      <v-card v-for="auction in results.auctions" :key="auction.id" class="mb-3" variant="outlined">
        <v-card-title class="d-flex align-center py-2">
          <v-chip size="small" :color="getAuctionStatusColor(auction.status)" class="mr-2">
            {{ auction.status }}
          </v-chip>
          <v-icon class="mr-2" color="primary">mdi-gavel</v-icon>
          <span class="font-weight-medium">Lot {{ auction.lotNumber }}: {{ auction.name }}</span>
          <v-spacer />
          <v-chip size="small" variant="outlined" class="ml-2">
            {{ auction.type }}
          </v-chip>
          <v-chip
            v-if="getAuctionFailures(auction) > 0"
            size="small"
            color="error"
            variant="flat"
            class="ml-1"
          >
            {{ getAuctionFailures(auction) }} fail
          </v-chip>
          <v-chip
            v-if="getAuctionWarnings(auction) > 0"
            size="small"
            color="warning"
            variant="flat"
            class="ml-1"
          >
            {{ getAuctionWarnings(auction) }} warn
          </v-chip>
        </v-card-title>
        <v-divider />
        <v-card-text class="py-2">
          <!-- Auction checks -->
          <div v-for="(check, idx) in auction.checks" :key="idx" class="d-flex align-center py-1">
            <v-icon size="small" :color="getStatusColor(check.status)" class="mr-2">
              {{ getStatusIcon(check.status) }}
            </v-icon>
            <div>
              <span class="text-body-2">{{ check.message }}</span>
              <span v-if="check.description" class="text-caption text-grey ml-2"
                >({{ check.description }})</span
              >
            </div>
          </div>

          <!-- Winner info -->
          <v-alert
            v-if="auction.winner"
            type="success"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            <strong>Winner:</strong> {{ auction.winner.email }}
            <span v-if="auction.winner.company" class="text-grey"
              >({{ auction.winner.company }})</span
            >
            <span class="ml-2"
              >{{ formatPrice(auction.winner.price) }}
              {{ results.auctionGroup?.currency || '' }}</span
            >
            <v-chip v-if="auction.winner.type === 'prebid'" size="x-small" class="ml-2"
              >prebid</v-chip
            >
          </v-alert>

          <!-- Sellers -->
          <div v-if="auction.sellers && auction.sellers.length > 0" class="mt-3">
            <div class="text-caption text-grey mb-1">Sellers ({{ auction.sellers.length }})</div>
            <v-chip
              v-for="seller in auction.sellers"
              :key="seller.email"
              size="small"
              :color="seller.termsAccepted ? 'success' : 'grey'"
              :variant="seller.termsAccepted ? 'flat' : 'outlined'"
              class="mr-1 mb-1"
            >
              <v-icon v-if="seller.termsAccepted" size="x-small" class="mr-1">mdi-check</v-icon>
              {{ seller.name || seller.email }}
            </v-chip>
          </div>

          <!-- Supplies -->
          <div v-if="auction.supplies && auction.supplies.length > 0" class="mt-3">
            <div class="text-caption text-grey mb-1">
              Line items ({{ auction.supplies.length }})
            </div>
            <v-chip
              v-for="supply in auction.supplies"
              :key="supply.name"
              size="small"
              variant="outlined"
              class="mr-1 mb-1"
            >
              {{ supply.name }} ({{ supply.quantity }} {{ supply.unit }})
            </v-chip>
          </div>
        </v-card-text>
      </v-card>

      <!-- Sections - After Lots -->
      <v-card v-for="section in results.sections" :key="section.id" class="mb-3" variant="outlined">
        <v-card-title class="d-flex align-center py-2">
          <v-icon :color="getSectionColor(section)" class="mr-2">{{ section.icon }}</v-icon>
          <span class="font-weight-medium">{{ section.title }}</span>
          <span class="text-caption text-grey ml-2">{{ section.description }}</span>
          <v-spacer />
          <v-chip
            v-if="getSectionStats(section).passed > 0"
            size="small"
            color="success"
            variant="flat"
            class="ml-1"
          >
            {{ getSectionStats(section).passed }}
          </v-chip>
          <v-chip
            v-if="getSectionStats(section).warnings > 0"
            size="small"
            color="warning"
            variant="flat"
            class="ml-1"
          >
            {{ getSectionStats(section).warnings }}
          </v-chip>
          <v-chip
            v-if="getSectionStats(section).failed > 0"
            size="small"
            color="error"
            variant="flat"
            class="ml-1"
          >
            {{ getSectionStats(section).failed }}
          </v-chip>
        </v-card-title>
        <v-divider />
        <v-card-text class="py-2">
          <div v-for="(check, idx) in section.checks" :key="idx" class="d-flex align-center py-1">
            <v-icon size="small" :color="getStatusColor(check.status)" class="mr-2">
              {{ getStatusIcon(check.status) }}
            </v-icon>
            <div>
              <span class="text-body-2">{{ check.message }}</span>
              <span v-if="check.description" class="text-caption text-grey ml-2"
                >({{ check.description }})</span
              >
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Timestamp -->
      <div class="text-caption text-grey text-right mt-4">
        Last check: {{ formatTimestamp(results.timestamp) }}
      </div>
    </template>

    <!-- Initial state -->
    <v-row v-else>
      <v-col class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-clipboard-search</v-icon>
        <p class="mt-4 text-grey">Click "Run Check" to verify the auction configuration</p>
      </v-col>
    </v-row>
  </v-sheet>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed } from 'vue'

const route = useRoute()
const loading = ref(false)
const results = ref(null)

const hasFailures = computed(() => {
  const summaryFailed = (results.value?.summary?.failed || 0) > 0
  const auctionFailed =
    results.value?.auctions?.some((a) => (a.checks || []).some((c) => c.status === 'fail')) || false
  const sectionFailed =
    results.value?.sections?.some((s) => (s.checks || []).some((c) => c.status === 'fail')) || false
  return summaryFailed || auctionFailed || sectionFailed
})

const failureMessages = computed(() => {
  const messages = []

  // Auction-level failures
  if (results.value?.auctions) {
    for (const auction of results.value.auctions) {
      const fails = (auction.checks || []).filter((c) => c.status === 'fail')
      for (const fail of fails) {
        messages.push(
          `Lot ${auction.lotNumber}: ${fail.message}${fail.description ? ` (${fail.description})` : ''}`
        )
      }
    }
  }

  // Section-level failures
  if (results.value?.sections) {
    for (const section of results.value.sections) {
      const fails = (section.checks || []).filter((c) => c.status === 'fail')
      for (const fail of fails) {
        messages.push(
          `${section.title}: ${fail.message}${fail.description ? ` (${fail.description})` : ''}`
        )
      }
    }
  }

  // Fallback when summary.failed > 0 but no detailed messages
  if (messages.length === 0 && (results.value?.summary?.failed || 0) > 0) {
    messages.push('Some checks failed (details unavailable)')
  }

  return messages
})

// Specific detection for prebids missing Cloud Task scheduling
const missingCloudTaskMessages = computed(() => {
  const msgs = []
  if (results.value?.auctions) {
    for (const auction of results.value.auctions) {
      const fails = (auction.checks || []).filter(
        (c) =>
          c.status === 'fail' &&
          typeof c.message === 'string' &&
          c.message.toLowerCase().includes('prebid') &&
          c.message.toLowerCase().includes('cloud_task')
      )
      for (const fail of fails) {
        msgs.push(
          `Lot ${auction.lotNumber}: ${fail.message}${
            fail.description ? ` (${fail.description})` : ''
          }`
        )
      }
    }
  }
  return msgs
})

function getStatusColor(status) {
  switch (status) {
    case 'pass':
      return 'success'
    case 'fail':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
      return 'grey'
    default:
      return 'grey'
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'pass':
      return 'mdi-check-circle'
    case 'fail':
      return 'mdi-close-circle'
    case 'warning':
      return 'mdi-alert-circle'
    case 'info':
      return 'mdi-information'
    default:
      return 'mdi-circle'
  }
}

function getAuctionStatusColor(status) {
  switch (status) {
    case 'active':
      return 'success'
    case 'upcoming':
      return 'info'
    case 'closed':
      return 'grey'
    case 'draft':
      return 'warning'
    default:
      return 'grey'
  }
}

function getSectionColor(section) {
  const stats = getSectionStats(section)
  if (stats.failed > 0) return 'error'
  if (stats.warnings > 0) return 'warning'
  if (stats.passed > 0) return 'success'
  return 'grey'
}

function getSectionStats(section) {
  const stats = { passed: 0, warnings: 0, failed: 0 }
  for (const check of section.checks || []) {
    if (check.status === 'pass') stats.passed++
    else if (check.status === 'warning') stats.warnings++
    else if (check.status === 'fail') stats.failed++
  }
  return stats
}

function getAuctionFailures(auction) {
  return auction.checks?.filter((c) => c.status === 'fail').length || 0
}

function getAuctionWarnings(auction) {
  return auction.checks?.filter((c) => c.status === 'warning').length || 0
}

function formatTimestamp(ts) {
  return dayjs(ts).format('DD/MM/YYYY HH:mm:ss')
}

function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR').format(price)
}

async function runHealthCheck() {
  loading.value = true
  try {
    const auctionGroupId = route.params.auctionGroupId
    const response = await $fetch(`/api/v1/health-check/${auctionGroupId}`)
    results.value = response
  } catch (error) {
    console.error('Health check failed:', error)
    results.value = {
      summary: { passed: 0, failed: 1, warnings: 0, total: 1 },
      sections: [
        {
          id: 'error',
          title: 'Error',
          icon: 'mdi-alert-circle',
          description: 'An error occurred',
          checks: [
            { status: 'fail', message: `Error: ${error.message}`, description: 'System error' }
          ]
        }
      ],
      auctions: [],
      timestamp: new Date().toISOString()
    }
  } finally {
    loading.value = false
  }
}

// Auto-run on mount
onMounted(() => {
  runHealthCheck()
})
</script>

<style scoped>
.custom-border {
  border-radius: 0 0 4px 4px !important;
  border: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-top: none !important;
}
</style>
