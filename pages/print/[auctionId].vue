<template>
  <div v-if="isReady" class="print-layout" data-ready="true">
    <div class="print-header">
      <h1>Auction Report</h1>
      <div class="print-meta">
        <p>Generated: {{ formattedDate }}</p>
        <p>Auction ID: {{ auctionId }}</p>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <p>Error loading auction data: {{ error }}</p>
    </div>

    <div v-else-if="loading" class="loading-message">
      <p>Loading auction data...</p>
    </div>

    <div v-else class="print-content">
      <!-- Content will be dynamically injected based on auction type -->
      <slot />
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'print',
  middleware: [] // Disable all middlewares for print pages
})

const route = useRoute()
const auctionId = computed(() => route.params.auctionId)
const formattedDate = computed(() => new Date().toLocaleString('fr-FR'))

// State management
const isReady = ref(false)
const loading = ref(false)
const error = ref(null)

// Signal readiness for PDF capture
const signalReady = () => {
  if (import.meta.client) {
    document.body.setAttribute('data-ready', 'true')
    console.log('[Print Page] Ready for capture')
  }
}

onMounted(() => {
  console.log('[Print Page] Mounted for auction:', auctionId.value)

  // Short delay to ensure everything is rendered
  // This is important for Puppeteer to capture the complete page
  requestAnimationFrame(() => {
    setTimeout(() => {
      isReady.value = true
      nextTick(() => {
        signalReady()
      })
    }, 150)
  })
})

onBeforeUnmount(() => {
  console.log('[Print Page] Unmounting')
})
</script>

<style scoped>
.print-layout {
  min-height: 100vh;
  padding: 40px;
  font-family: 'Poppins', Arial, sans-serif;
  background: white;
  color: #000;
}

.print-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 3px solid #1976d2;
}

h1 {
  font-size: 32px;
  color: #1976d2;
  margin-bottom: 10px;
  font-weight: 600;
}

.print-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.print-meta p {
  margin: 0;
}

.print-content {
  margin-top: 20px;
}

.error-message,
.loading-message {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
}

.loading-message {
  color: #0c5460;
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
}

/* Print-specific styles */
@media print {
  .print-layout {
    padding: 0;
  }

  .print-header {
    page-break-after: avoid;
  }
}
</style>
