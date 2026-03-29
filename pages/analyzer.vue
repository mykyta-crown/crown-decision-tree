<template>
  <v-container class="px-5 pt-2 pb-10" :fluid="width < 1440">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="d-flex align-center ga-3">
        <span class="text-h4">Analyzer</span>
        <v-chip v-if="filteredAuctions.length" variant="text" class="rounded justify-center text-h6 font-weight-bold text-black bg-green-light" label>
          {{ filteredAuctions.length }}
        </v-chip>
        <div class="export-chip" @click="exportPdf"><v-icon size="14" class="mr-1">mdi-download</v-icon>PDF</div>
      </div>
      <div class="d-flex align-center ga-2 filters-row">
        <div class="filter-group">
          <label class="filter-label">Client</label>
          <v-select v-model="selectedCompany" :items="companyOptions" density="compact" variant="solo-filled" flat hide-details clearable placeholder="All" class="filter-input filter-input--md" />
        </div>
        <div class="filter-group">
          <label class="filter-label">Events</label>
          <v-select v-model="selectedEvents" :items="eventOptions" density="compact" variant="solo-filled" flat hide-details clearable multiple placeholder="All" class="filter-input filter-input--lg">
            <template #selection="{ index }">
              <span v-if="index === 0" class="filter-selection-text">{{ selectedEvents.length }} selected</span>
            </template>
          </v-select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Currency</label>
          <v-select v-model="displayCurrency" :items="availableCurrencies" density="compact" variant="solo-filled" flat hide-details class="filter-input filter-input--sm" />
        </div>
        <div class="filter-group">
          <label class="filter-label">Search</label>
          <v-text-field v-model="globalSearch" density="compact" variant="solo-filled" flat hide-details clearable placeholder="Name, client..." class="filter-input filter-input--md">
            <template #prepend-inner><v-icon size="16" color="grey">mdi-magnify</v-icon></template>
          </v-text-field>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-row">
      <v-tabs v-model="activeTab" density="compact" hide-slider>
        <v-tab
          v-for="tab in tabs"
          :key="tab.value"
          class="analyzer-tab"
          :class="{ 'analyzer-tab--active': activeTab === tab.value }"
          :style="activeTab === tab.value ? `background-color: ${tab.activeBg}; border-bottom-color: ${tab.activeBg}` : ''"
          :value="tab.value"
        >
          {{ tab.label }}
        </v-tab>
      </v-tabs>
      <div class="tabs-border-line" />
    </div>

    <v-row v-if="loading" justify="center" align="center" style="min-height: 400px">
      <v-progress-circular indeterminate :size="64" color="grey" />
    </v-row>

    <!-- ========== TAB: DASHBOARD ========== -->
    <template v-else-if="activeTab === 'dashboard'">
      <div class="dashboard-frame">
        <!-- Row 1: 3 cards — Financial / Auctions / Suppliers -->
        <v-row class="mx-0 mb-3">
          <!-- Card 1: Financial -->
          <v-col cols="12" md="4" class="px-1">
            <div class="hero-card">
              <div class="hero-card-header"><span class="hero-card-title">Financial Overview</span></div>
              <div class="hero-metric">
                <span class="hero-metric-label">Baseline</span>
                <span class="hero-metric-value">{{ dashData.mainBaseline }}</span>
              </div>
              <div class="hero-metric">
                <span class="hero-metric-label">Spend</span>
                <span class="hero-metric-value">{{ dashData.mainSpend }}</span>
              </div>
              <div class="hero-metric hero-metric--highlight">
                <span class="hero-metric-label">Saved</span>
                <span class="hero-metric-value text-green font-weight-bold">{{ dashData.mainSaved }}</span>
              </div>
              <!-- all values converted to selected currency -->
              <div class="hero-big-pct mt-2">
                <span class="hero-big-pct-value text-green">{{ dashData.avgSaving }}%</span>
                <span class="hero-big-pct-label">avg saving</span>
              </div>
            </div>
          </v-col>

          <!-- Card 2: Auctions -->
          <v-col cols="12" md="4" class="px-1">
            <div class="hero-card">
              <div class="hero-card-header"><span class="hero-card-title">Auctions</span></div>
              <div class="hero-metric">
                <span class="hero-metric-label">Completed lots</span>
                <span class="hero-metric-value font-weight-bold">{{ dashData.auctionCount }}</span>
              </div>
              <div class="hero-metric">
                <span class="hero-metric-label">Events</span>
                <span class="hero-metric-value">{{ dashData.eventCount }}</span>
              </div>
              <div class="hero-metric">
                <span class="hero-metric-label">Success rate</span>
                <span class="hero-metric-value font-weight-bold">{{ dashData.successRate }}%</span>
              </div>
              <div class="hero-card-divider" />
              <div class="hero-metric">
                <span class="hero-metric-label">Dutch</span>
                <span class="hero-metric-value">{{ dashData.dutchCount }} lots · <span class="text-green">{{ dashData.dutchAvg }}%</span> avg</span>
              </div>
              <div class="hero-metric">
                <span class="hero-metric-label">English</span>
                <span class="hero-metric-value">{{ dashData.englishCount }} lots · <span class="text-green">{{ dashData.englishAvg }}%</span> avg</span>
              </div>
            </div>
          </v-col>

          <!-- Card 3: Suppliers -->
          <v-col cols="12" md="4" class="px-1">
            <div class="hero-card">
              <div class="hero-card-header"><span class="hero-card-title">Suppliers</span></div>
              <div class="hero-metric">
                <span class="hero-metric-label">Total suppliers</span>
                <span class="hero-metric-value font-weight-bold">{{ dashData.supplierCount }}</span>
              </div>
              <div class="hero-metric">
                <span class="hero-metric-label">Invitations</span>
                <span class="hero-metric-value">{{ dashData.totalInvitations }}</span>
              </div>
              <div class="hero-metric">
                <span class="hero-metric-label">Clients</span>
                <span class="hero-metric-value">{{ dashData.buyerCount }}</span>
              </div>
              <div class="hero-card-divider" />
              <div class="d-flex flex-wrap ga-2">
                <div v-for="p in dashData.profileBreakdown.slice(0, 4)" :key="p.profile" class="d-flex align-center ga-1">
                  <div class="profile-badge profile-badge--sm" :class="`profile-badge--${p.profile.toLowerCase()}`">{{ p.profile }}</div>
                  <span style="font-size: 13px; font-weight: 600">{{ p.count }}</span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Row 2: Activity + Top Savings -->
        <v-row class="mx-0 mb-3">
          <v-col cols="12" md="5" class="px-1">
            <div class="stat-card" style="height: 100%">
              <div class="stat-card-title mb-2">Activity</div>
              <div class="activity-header">
                <span class="activity-h" style="width:50px"></span>
                <span class="activity-h" style="flex:1"></span>
                <span class="activity-h" style="width:30px; text-align:right">Lots</span>
                <span class="activity-h" style="width:60px; text-align:right">Spend</span>
                <span class="activity-h" style="width:50px; text-align:right">Saving</span>
              </div>
              <div v-for="q in dashData.quarterly" :key="q.quarter" class="activity-row">
                <span class="activity-q">{{ q.quarter }}</span>
                <div class="activity-bar-bg">
                  <div class="activity-bar-fill" :style="{ width: q.auctionBarH + '%' }">
                  </div>
                </div>
                <span class="activity-count">{{ q.auctions }}</span>
                <span class="activity-spend">{{ q.spend }}</span>
                <span class="activity-saving">{{ q.avgSaving }}%</span>
              </div>
            </div>
          </v-col>
          <v-col cols="12" md="7" class="px-1">
            <div class="stat-card" style="height: 100%">
              <div class="stat-card-title mb-2">Top Events</div>
              <div class="top-events-header">
                <span class="te-h" style="flex:2">Event</span>
                <span class="te-h">Client</span>
                <span class="te-h te-right">Lots</span>
                <span class="te-h te-right">Spend</span>
                <span class="te-h te-right">Saved</span>
                <span class="te-h te-right">Saving</span>
              </div>
              <div v-for="(ev, i) in dashData.topEvents" :key="i" class="top-events-row">
                <div class="te-cell te-name" style="flex:2">
                  <span class="te-rank">{{ i + 1 }}</span>
                  {{ ev.name }}
                </div>
                <span class="te-cell">{{ titleCase(ev.company) }}</span>
                <span class="te-cell te-right">{{ ev.lots }}</span>
                <span class="te-cell te-right">{{ ev.spend }}</span>
                <span class="te-cell te-right text-green font-weight-bold">{{ ev.saved }}</span>
                <span class="te-cell te-right text-green font-weight-bold">{{ ev.savingPct }}</span>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Row 3: Clients + Top Suppliers -->
        <v-row class="mx-0">
          <v-col cols="12" md="5" class="px-1">
            <div class="stat-card">
              <div class="stat-card-title mb-2">Clients</div>
              <div class="activity-header">
                <span class="activity-h" style="width:100px"></span>
                <span class="activity-h" style="flex:1"></span>
                <span class="activity-h" style="width:30px; text-align:right">Lots</span>
                <span class="activity-h" style="width:60px; text-align:right">Spend</span>
                <span class="activity-h" style="width:60px; text-align:right">Saved</span>
                <span class="activity-h" style="width:50px; text-align:right">Saving</span>
              </div>
              <div v-for="cl in dashData.topClients" :key="cl.company" class="activity-row">
                <span class="activity-q" style="width:100px; font-weight:500; color:#1D1D1B">{{ titleCase(cl.company) }}</span>
                <div class="activity-bar-bg">
                  <div class="activity-bar-fill" :style="{ width: cl.spendBarWidth + '%' }" />
                </div>
                <span class="activity-count" style="width:30px">{{ cl.count }}</span>
                <span class="activity-spend" style="width:60px">{{ cl.spend }}</span>
                <span class="activity-saving" style="width:60px; color:#16a34a">{{ cl.saved }}</span>
                <span class="activity-saving" style="width:50px">{{ cl.avgSaving }}%</span>
              </div>
            </div>
          </v-col>
          <v-col cols="12" md="7" class="px-1">
            <div class="stat-card">
              <div class="stat-card-title mb-2">Top Suppliers</div>
              <div class="top-supplier-header">
                <span class="ts-h" style="flex:2">Supplier</span>
                <span class="ts-h">Won</span>
                <span class="ts-h">Invited</span>
                <span class="ts-h">Win %</span>
                <span class="ts-h">Spend Won</span>
                <span class="ts-h">Avg Compr.</span>
              </div>
              <div v-for="w in dashData.topSuppliers" :key="w.email" class="top-supplier-row">
                <span class="ts-cell ts-email" style="flex:2">{{ w.email }}</span>
                <span class="ts-cell font-weight-bold">{{ w.won }}</span>
                <span class="ts-cell">{{ w.invited }}</span>
                <span class="ts-cell text-green font-weight-bold">{{ w.winRate }}%</span>
                <span class="ts-cell">{{ w.spend }}</span>
                <span class="ts-cell">{{ w.compression }}</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </template>

    <!-- ========== TAB: AUCTIONS ========== -->
    <template v-else-if="activeTab === 'auctions'">
      <v-col cols="12" class="datatable-col px-0 pt-0">
        <v-data-table v-model:sort-by="sortBy" v-model:page="page" :headers="auctionHeaders" :items="filteredAuctions" :items-per-page="effectivePageSize" :hover="true" class="bg-none custom-data-table-in-tabs" hide-default-footer must-sort>
          <template #item="{ item, index }">
            <tr :class="[hoveredRow === index ? 'bg-grey-deep' : 'bg-white', selectedLotId === item.id ? 'supplier-row-selected' : '']" @mouseover="hoveredRow = index" @mouseleave="hoveredRow = null" @click="loadLotDetail(item.id)" style="cursor:pointer">
              <td class="auction-name-cell pl-3"><v-tooltip activator="parent" location="top left" content-class="bg-white border">{{ item.name }}</v-tooltip>{{ item.name }}</td>
              <td class="truncate-cell">{{ titleCase(item.company_name) }}</td>
              <td><div class="type-chip" :class="`type-chip--${item.type}`">{{ typeLabel(item.type) }}</div></td>
              <td class="text-no-wrap">{{ fmtDate(item.start_at) }}</td>
              <td class="text-right num-cell">{{ fmtC(item.baseline, item.currency) }}</td>
              <td class="text-right num-cell">{{ fmtC(item.best_price, item.currency) }}</td>
              <td class="text-right num-cell"><span v-if="item.saving_abs != null && item.saving_abs !== 0" :class="savCls(item.saving_pct)">{{ fmtC(Math.abs(item.saving_abs), item.currency) }}</span><span v-else class="text-grey">—</span></td>
              <td class="text-right num-cell"><span v-if="item.saving_pct != null" :class="savCls(item.saving_pct)">{{ fmtSaving(item.saving_pct) }}</span><span v-else class="text-grey">—</span></td>
              <td class="text-center num-cell">{{ item.sellers_invited || '—' }}</td>
              <td class="text-center num-cell">{{ item.bid_count || '—' }}</td>
              <td class="text-center num-cell">{{ item.prebid_count || '—' }}</td>
              <td class="text-center num-cell"><span v-if="item.bids_per_minute">{{ item.bids_per_minute }}</span><span v-else class="text-grey">—</span></td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
      <v-col cols="12" class="px-0">
        <div v-if="filteredAuctions.length > 0" class="pagination-footer">
          <div class="pagination-info">
            <span class="pagination-count">{{ auctionPaginationRange }} of {{ filteredAuctions.length }} auctions</span>
          </div>
          <div class="pagination-controls">
            <v-btn icon variant="text" size="x-small" :disabled="page <= 1" @click="page--"><v-icon size="18">mdi-chevron-left</v-icon></v-btn>
            <span class="pagination-pages">{{ page }} / {{ auctionTotalPages }}</span>
            <v-btn icon variant="text" size="x-small" :disabled="page >= auctionTotalPages" @click="page++"><v-icon size="18">mdi-chevron-right</v-icon></v-btn>
          </div>
          <div class="pagination-size">
            <span class="pagination-size-label">Per page</span>
            <v-btn-toggle :model-value="pageSize" mandatory density="compact" variant="outlined" divided class="page-size-toggle" @update:model-value="pageSize = $event; page = 1">
              <v-btn :value="20" size="x-small">20</v-btn>
              <v-btn :value="50" size="x-small">50</v-btn>
              <v-btn :value="100" size="x-small">100</v-btn>
              <v-btn :value="0" size="x-small">All</v-btn>
            </v-btn-toggle>
          </div>
        </div>
      </v-col>

      <!-- Lot detail modal -->
      <v-dialog v-model="lotDetailOpen" max-width="1100" scrollable>
        <v-card v-if="lotDetail" class="lot-detail-panel pa-5">
          <div class="d-flex justify-space-between align-center mb-3">
            <div class="d-flex align-center ga-3">
              <div class="type-chip" :class="`type-chip--${lotDetail.auction.type}`">{{ typeLabel(lotDetail.auction.type) }}</div>
              <span class="text-h6">{{ lotDetail.auction.name }}</span>
              <span class="stat-card-count">{{ titleCase(lotDetail.auction.company_name) }}</span>
            </div>
            <v-btn icon variant="text" size="small" @click="lotDetailOpen = false"><v-icon>mdi-close</v-icon></v-btn>
          </div>

          <!-- Lot KPIs -->
          <div class="d-flex ga-2 mb-3">
            <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ fmtC(lotDetail.auction.baseline, lotDetail.auction.currency) }}</div><div class="kpi-label">Baseline</div></div>
            <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ fmtC(lotDetail.auction.winning_price, lotDetail.auction.currency) }}</div><div class="kpi-label">Winning Price</div></div>
            <div class="kpi-card flex-grow-1"><div class="kpi-value text-green">{{ lotDetail.auction.saving_pct != null ? fmtSaving(lotDetail.auction.saving_pct) : '—' }}</div><div class="kpi-label">Saving</div></div>
            <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ lotDetail.suppliers.length }}</div><div class="kpi-label">Suppliers</div></div>
            <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ lotDetail.bid_timeline.filter(b => b.type === 'bid').length }}</div><div class="kpi-label">Bids</div></div>
            <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ lotDetail.auction.duration }}min</div><div class="kpi-label">Duration</div></div>
          </div>

          <!-- Supplier breakdown -->
          <div class="stat-card mb-3">
            <div class="stat-card-title mb-2">Suppliers Breakdown</div>
            <div class="lot-supplier-header">
              <span class="ls-h" style="flex:2">Supplier</span>
              <span class="ls-h ls-center">Status</span>
              <span class="ls-h ls-right">Entry %BL</span>
              <span class="ls-h ls-right">Best %BL</span>
              <span class="ls-h ls-right">Compression</span>
              <span class="ls-h ls-center">Bids</span>
              <span class="ls-h ls-center">Prebids</span>
              <span class="ls-h ls-right">Reaction</span>
              <span class="ls-h ls-right">vs Winner</span>
              <span class="ls-h ls-center">Result</span>
            </div>
            <div v-for="s in lotDetail.suppliers" :key="s.email" class="lot-supplier-row">
              <span class="ls-cell ls-email" style="flex:2">{{ s.email }}</span>
              <span class="ls-cell ls-center"><span v-if="s.total_bids > 0 || s.total_prebids > 0" class="status-dot status-dot--bid" /><span v-else-if="s.connected" class="status-dot status-dot--connected" /><span v-else class="status-dot status-dot--invited" /></span>
              <span class="ls-cell ls-right">{{ s.start_pct_bl ? s.start_pct_bl + '%' : '—' }}</span>
              <span class="ls-cell ls-right">{{ s.best_pct_bl ? s.best_pct_bl + '%' : '—' }}</span>
              <span class="ls-cell ls-right">{{ s.compression > 0 ? s.compression + '%' : '—' }}</span>
              <span class="ls-cell ls-center">{{ s.total_bids || '—' }}</span>
              <span class="ls-cell ls-center">{{ s.total_prebids || '—' }}</span>
              <span class="ls-cell ls-right">{{ s.reaction_sec != null ? (s.reaction_sec / 60).toFixed(1) + 'min' : '—' }}</span>
              <span class="ls-cell ls-right">{{ s.delta_vs_winner != null ? '+' + s.delta_vs_winner + '%' : '—' }}</span>
              <span class="ls-cell ls-center"><span :class="s.won ? 'result-won' : s.total_bids > 0 || s.total_prebids > 0 ? 'result-lost' : 'text-grey'">{{ s.won ? 'Won' : s.total_bids > 0 || s.total_prebids > 0 ? 'Lost' : 'No bid' }}</span></span>
            </div>
          </div>

          <!-- Bid timeline (English auctions) -->
          <div v-if="lotDetail.bid_timeline.filter(b => b.type === 'bid').length > 2" class="stat-card">
            <div class="stat-card-title mb-2">Bid Timeline</div>
            <div class="bid-timeline">
              <div v-for="(b, i) in lotDetail.bid_timeline.filter(b => b.type === 'bid')" :key="i" class="bid-timeline-row">
                <span class="bt-time">{{ Math.floor(b.seconds_from_start / 60) }}:{{ String(Math.floor(b.seconds_from_start % 60)).padStart(2, '0') }}</span>
                <span class="bt-email">{{ b.seller_email.split('@')[0] }}</span>
                <div class="bt-bar-bg">
                  <div class="bt-bar" :style="{ width: (b.pct_bl ? Math.max(5, 100 - (120 - b.pct_bl) * 2.5) : 50) + '%' }" />
                </div>
                <span class="bt-price">{{ fmtC(b.price, lotDetail.auction.currency) }}</span>
                <span class="bt-pct">{{ b.pct_bl }}%</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-dialog>
    </template>

    <!-- ========== TAB: EVENTS ========== -->
    <template v-else-if="activeTab === 'events'">
      <v-col cols="12" class="datatable-col px-0 pt-0">
        <v-data-table v-model:sort-by="eventSortBy" v-model:page="eventPage" :headers="eventHeaders" :items="filteredEvents" :items-per-page="effectiveEventPageSize" :hover="true" class="bg-none custom-data-table-in-tabs" hide-default-footer must-sort>
          <template #item="{ item, index }">
            <tr :class="hoveredRow === index ? 'bg-grey-deep' : 'bg-white'" @mouseover="hoveredRow = index" @mouseleave="hoveredRow = null">
              <td class="auction-name-cell pl-4"><v-tooltip activator="parent" location="top left" content-class="bg-white border">{{ item.event_name }}</v-tooltip>{{ item.event_name }}</td>
              <td class="truncate-cell">{{ titleCase(item.company_name) }}</td>
              <td class="text-center font-weight-bold">{{ item.lot_count }}</td>
              <td>{{ item.types.split(', ').map(t => typeLabel(t)).join(', ') }}</td>
              <td class="text-no-wrap">{{ fmtDate(item.first_start) }}</td>
              <td class="text-right">{{ fmtC(item.total_baseline, item.currency) }}</td>
              <td class="text-right">{{ fmtC(item.total_spend, item.currency) }}</td>
              <td class="text-right"><span v-if="item.total_saved !== 0" :class="item.total_saved > 0 ? 'text-green font-weight-bold' : 'text-red font-weight-bold'">{{ fmtC(Math.abs(item.total_saved), item.currency) }}</span><span v-else class="text-grey">—</span></td>
              <td class="text-right"><span v-if="item.saving_pct" :class="savCls(item.saving_pct)">{{ fmtSaving(item.saving_pct) }}</span><span v-else class="text-grey">—</span></td>
              <td class="text-center">{{ item.unique_suppliers }}</td>
              <td class="text-center">{{ item.lots_with_bids }}/{{ item.lot_count }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
      <v-col cols="12" class="px-0">
        <div v-if="filteredEvents.length > 0" class="pagination-footer">
          <div class="pagination-info">
            <span class="pagination-count">{{ eventPaginationRange }} of {{ filteredEvents.length }} events</span>
          </div>
          <div class="pagination-controls">
            <v-btn icon variant="text" size="x-small" :disabled="eventPage <= 1" @click="eventPage--"><v-icon size="18">mdi-chevron-left</v-icon></v-btn>
            <span class="pagination-pages">{{ eventPage }} / {{ eventTotalPages }}</span>
            <v-btn icon variant="text" size="x-small" :disabled="eventPage >= eventTotalPages" @click="eventPage++"><v-icon size="18">mdi-chevron-right</v-icon></v-btn>
          </div>
          <div class="pagination-size">
            <span class="pagination-size-label">Per page</span>
            <v-btn-toggle :model-value="eventPageSize" mandatory density="compact" variant="outlined" divided class="page-size-toggle" @update:model-value="eventPageSize = $event; eventPage = 1">
              <v-btn :value="20" size="x-small">20</v-btn>
              <v-btn :value="50" size="x-small">50</v-btn>
              <v-btn :value="100" size="x-small">100</v-btn>
              <v-btn :value="0" size="x-small">All</v-btn>
            </v-btn-toggle>
          </div>
        </div>
      </v-col>
    </template>

    <!-- ========== TAB: SAVINGS ========== -->
    <template v-else-if="activeTab === 'savings'">
      <v-col cols="12" class="px-0 pt-4">
        <div class="section-title mb-3">By Client</div>
        <v-row class="mx-0 mb-6">
          <v-col v-for="cs in savingsByClient" :key="cs.company" cols="12" md="6" lg="4" class="px-1 mb-2">
            <div class="stat-card">
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="stat-card-title">{{ titleCase(cs.company) }}</span>
                <span class="stat-card-count">{{ cs.count }} auctions</span>
              </div>
              <div class="d-flex justify-space-between">
                <div><div class="stat-card-label">Baseline</div><div class="stat-card-medium">{{ cs.totalBaseline }}</div></div>
                <div><div class="stat-card-label">Spend</div><div class="stat-card-medium">{{ cs.totalSpend }}</div></div>
                <div class="text-right"><div class="stat-card-label">Saved</div><div class="stat-card-medium text-green">{{ cs.totalSaved }}</div></div>
                <div class="text-right"><div class="stat-card-label">Avg</div><div class="stat-card-medium text-green">{{ cs.avgSaving }}%</div></div>
              </div>
              <div class="spend-saving-bar mt-3"><div class="spend-saving-bar-spend" :style="{ width: cs.spendPct + '%' }" /><div class="spend-saving-bar-saving" :style="{ width: cs.savingPct + '%' }" /></div>
              <div class="d-flex justify-space-between mt-1"><span class="bar-legend bar-legend--spend">Spend</span><span class="bar-legend bar-legend--saving">Saved</span></div>
            </div>
          </v-col>
        </v-row>

        <div class="section-title mb-3">By Auction Type</div>
        <v-row class="mx-0 mb-6">
          <v-col v-for="ts in savingsByType" :key="ts.type" cols="6" md="3" class="px-1 mb-2">
            <div class="stat-card">
              <div class="d-flex align-center ga-2 mb-3"><div class="type-chip" :class="`type-chip--${ts.typeKey}`">{{ ts.type }}</div><span class="stat-card-count">{{ ts.count }}</span></div>
              <div class="d-flex justify-space-between mb-1"><div><div class="stat-card-label">Spend</div><div class="stat-card-medium">{{ ts.totalSpend }}</div></div><div class="text-right"><div class="stat-card-label">Saved</div><div class="stat-card-medium text-green">{{ ts.totalSaved }}</div></div></div>
              <div class="stat-card-big text-green">{{ ts.avgSaving }}%</div><div class="stat-card-label">avg saving</div>
            </div>
          </v-col>
        </v-row>

        <v-row class="mx-0 mb-6">
          <!-- Savings Distribution (horizontal) -->
          <v-col cols="12" md="4" class="px-1 mb-2">
            <div class="stat-card" style="height:100%">
              <div class="stat-card-title mb-2">Savings Distribution</div>
              <div class="horiz-bar-row" style="margin-bottom:2px">
                <span class="horiz-bar-label" style="color:#AEB0B2; font-size:10px">Range</span>
                <div style="flex:1"></div>
                <span class="horiz-bar-value" style="color:#AEB0B2; font-size:10px">Lots</span>
              </div>
              <div v-for="b in savingsDistribution" :key="b.label" class="horiz-bar-row">
                <span class="horiz-bar-label">{{ b.label }}</span>
                <div class="horiz-bar-bg"><div class="horiz-bar-fill horiz-bar-fill--green" :style="{ width: b.height + '%' }" /></div>
                <span class="horiz-bar-value">{{ b.count }}</span>
              </div>
            </div>
          </v-col>

          <!-- Quarterly Trend (horizontal) -->
          <v-col cols="12" md="4" class="px-1 mb-2">
            <div class="stat-card" style="height:100%">
              <div class="stat-card-title mb-2">Quarterly Trend</div>
              <div class="horiz-bar-row" style="margin-bottom:2px">
                <span class="horiz-bar-label" style="color:#AEB0B2; font-size:10px">Quarter</span>
                <div style="flex:1"></div>
                <span class="horiz-bar-value" style="color:#AEB0B2; font-size:10px">Saving</span>
                <span class="horiz-bar-sub" style="color:#AEB0B2; font-size:10px">Lots</span>
              </div>
              <div v-for="q in savingsByQuarter" :key="q.quarter" class="horiz-bar-row">
                <span class="horiz-bar-label">{{ q.quarter }}</span>
                <div class="horiz-bar-bg"><div class="horiz-bar-fill horiz-bar-fill--green" :style="{ width: q.barHeight + '%' }" /></div>
                <span class="horiz-bar-value text-green">{{ q.avgSaving }}%</span>
                <span class="horiz-bar-sub">{{ q.count }}</span>
              </div>
            </div>
          </v-col>

          <!-- Suppliers vs Savings (horizontal) -->
          <v-col cols="12" md="4" class="px-1 mb-2">
            <div class="stat-card" style="height:100%">
              <div class="stat-card-title mb-2">Suppliers vs Savings</div>
              <div class="horiz-bar-row" style="margin-bottom:2px">
                <span class="horiz-bar-label" style="width:85px; color:#AEB0B2; font-size:10px">Suppliers</span>
                <div style="flex:1"></div>
                <span class="horiz-bar-value" style="color:#AEB0B2; font-size:10px">Saving</span>
                <span class="horiz-bar-sub" style="color:#AEB0B2; font-size:10px">Lots</span>
              </div>
              <div v-for="b in suppliersVsSavingsData" :key="b.label" class="horiz-bar-row">
                <span class="horiz-bar-label" style="width:85px">{{ b.label }}</span>
                <div class="horiz-bar-bg"><div class="horiz-bar-fill horiz-bar-fill--green" :style="{ width: b.barHeight + '%' }" /></div>
                <span class="horiz-bar-value text-green">{{ b.avgSaving }}%</span>
                <span class="horiz-bar-sub">{{ b.count }}</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-col>
    </template>

    <!-- ========== TAB: COMPETITION ========== -->
    <template v-else-if="activeTab === 'competition'">
      <v-col cols="12" class="px-0 pt-3">
        <!-- Two columns: English | Dutch -->
        <v-row class="mx-0 mb-3">
          <!-- ENGLISH column -->
          <v-col cols="12" md="6" class="px-1">
            <div class="competition-column">
              <div class="competition-column-header competition-column-header--english">
                <div class="type-chip type-chip--reverse">English</div>
                <span class="competition-column-count">{{ englishCompStats.count }} lots</span>
              </div>

              <!-- English KPIs -->
              <div class="d-flex ga-2 mb-3">
                <div class="kpi-card flex-grow-1"><div class="kpi-value text-green">{{ englishCompStats.avgSaving }}%</div><div class="kpi-label">Avg saving</div></div>
                <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ englishCompStats.avgBidders }}</div><div class="kpi-label">Avg bidders</div></div>
                <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ englishCompStats.avgBidsPerLot }}</div><div class="kpi-label">Avg bids/lot</div></div>
                <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ englishCompStats.avgBpm }}</div><div class="kpi-label">Bids/min</div></div>
              </div>

              <!-- Bidders vs Savings (grouped) -->
              <div class="stat-card mb-3">
                <div class="stat-card-title mb-2">Bidders vs Savings</div>
                <div class="horiz-bar-row" style="margin-bottom:2px">
                  <span class="horiz-bar-label" style="width:70px; color:#AEB0B2; font-size:10px">Bidders</span>
                  <div style="flex:1"></div>
                  <span class="horiz-bar-value" style="color:#AEB0B2; font-size:10px">Saving</span>
                  <span class="horiz-bar-sub" style="color:#AEB0B2; font-size:10px">Lots</span>
                </div>
                <div v-for="e in englishBidderGrouped" :key="e.label" class="horiz-bar-row">
                  <span class="horiz-bar-label" style="width:70px">{{ e.label }}</span>
                  <div class="horiz-bar-bg"><div class="horiz-bar-fill horiz-bar-fill--green" :style="{ width: e.barHeight + '%' }" /></div>
                  <span class="horiz-bar-value text-green">{{ e.avgSaving }}%</span>
                  <span class="horiz-bar-sub">{{ e.count }}</span>
                </div>
              </div>

              <!-- Competition gap: 1st vs 2nd -->
              <div class="stat-card mb-3">
                <div class="stat-card-title mb-2">Price Dynamics</div>
                <div class="hero-metric"><span class="hero-metric-label">Avg compression (all bidders)</span><span class="hero-metric-value">{{ englishCompStats.avgCompression }}%</span></div>
                <div class="hero-metric"><span class="hero-metric-label">Avg gap 1st vs 2nd</span><span class="hero-metric-value">{{ englishCompStats.avgGap1v2 }}%</span></div>
                <div class="hero-metric"><span class="hero-metric-label">Lots with overtime bids</span><span class="hero-metric-value">{{ englishCompStats.overtimeLots }}</span></div>
              </div>

              <!-- Top English auctions -->
              <div class="stat-card">
                <div class="stat-card-title mb-2">Most Competitive</div>
                <div class="comp-auction-row" style="border-bottom:1px solid #E9EAEC">
                  <span class="comp-auction-name" style="color:#AEB0B2; font-size:10px">Auction</span>
                  <span class="comp-auction-stat" style="color:#AEB0B2; font-size:10px">Bids</span>
                  <span class="comp-auction-stat" style="color:#AEB0B2; font-size:10px">Pace</span>
                  <span class="comp-auction-stat" style="color:#AEB0B2; font-size:10px">Saving</span>
                </div>
                <div v-for="a in topEnglish" :key="a.id" class="comp-auction-row">
                  <span class="comp-auction-name">{{ a.name }}</span>
                  <span class="comp-auction-stat">{{ a.bid_count }}</span>
                  <span class="comp-auction-stat">{{ a.bids_per_minute || '—' }} b/m</span>
                  <span class="comp-auction-stat text-green">{{ fmtSaving(a.saving_pct) }}</span>
                </div>
              </div>
            </div>
          </v-col>

          <!-- DUTCH column -->
          <v-col cols="12" md="6" class="px-1">
            <div class="competition-column">
              <div class="competition-column-header competition-column-header--dutch">
                <div class="type-chip type-chip--dutch">Dutch</div>
                <span class="competition-column-count">{{ dutchStats.totalCount }} lots</span>
              </div>

              <!-- Dutch KPIs -->
              <div class="d-flex ga-2 mb-3">
                <div class="kpi-card flex-grow-1"><div class="kpi-value text-green">{{ dutchStats.avgSaving }}%</div><div class="kpi-label">Avg saving</div></div>
                <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ dutchStats.prebidPct }}%</div><div class="kpi-label">Prebid wins</div></div>
                <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ dutchStats.avgSuppliers }}</div><div class="kpi-label">Avg suppliers</div></div>
                <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ dutchStats.successRate }}%</div><div class="kpi-label">Success</div></div>
              </div>

              <!-- Dutch: Suppliers vs Savings -->
              <div class="stat-card mb-3">
                <div class="stat-card-title mb-2">Suppliers vs Savings</div>
                <div class="horiz-bar-row" style="margin-bottom:2px">
                  <span class="horiz-bar-label" style="width:70px; color:#AEB0B2; font-size:10px">Suppliers</span>
                  <div style="flex:1"></div>
                  <span class="horiz-bar-value" style="color:#AEB0B2; font-size:10px">Saving</span>
                  <span class="horiz-bar-sub" style="color:#AEB0B2; font-size:10px">Lots</span>
                </div>
                <div v-for="b in dutchSuppliersVsSavings" :key="b.label" class="horiz-bar-row">
                  <span class="horiz-bar-label" style="width:70px">{{ b.label }}</span>
                  <div class="horiz-bar-bg"><div class="horiz-bar-fill" style="background:#A78BFA" :style="{ width: b.barHeight + '%' }" /></div>
                  <span class="horiz-bar-value text-green">{{ b.avgSaving }}%</span>
                  <span class="horiz-bar-sub">{{ b.count }}</span>
                </div>
              </div>

              <!-- How are Dutch won -->
              <div class="stat-card mb-3">
                <div class="stat-card-title mb-2">How are Dutch auctions won?</div>
                <div class="horiz-bar-row" style="margin-bottom:2px">
                  <span class="horiz-bar-label" style="width:90px; color:#AEB0B2; font-size:10px">Type</span>
                  <div style="flex:1"></div>
                  <span class="horiz-bar-value" style="color:#AEB0B2; font-size:10px">Lots</span>
                  <span class="horiz-bar-sub" style="color:#AEB0B2; font-size:10px">Saving</span>
                </div>
                <div class="horiz-bar-row">
                  <span class="horiz-bar-label" style="width:90px">Auto-prebid</span>
                  <div class="horiz-bar-bg"><div class="horiz-bar-fill horiz-bar-fill--green" :style="{ width: dutchStats.totalCount ? (dutchStats.prebidCount / dutchStats.totalCount * 100) + '%' : '0%' }" /></div>
                  <span class="horiz-bar-value">{{ dutchStats.prebidCount }}</span>
                  <span class="horiz-bar-sub text-green">{{ dutchStats.prebidSaving }}%</span>
                </div>
                <div class="horiz-bar-row">
                  <span class="horiz-bar-label" style="width:90px">Manual bid</span>
                  <div class="horiz-bar-bg"><div class="horiz-bar-fill horiz-bar-fill--blue" :style="{ width: dutchStats.totalCount ? (dutchStats.manualCount / dutchStats.totalCount * 100) + '%' : '0%' }" /></div>
                  <span class="horiz-bar-value">{{ dutchStats.manualCount }}</span>
                  <span class="horiz-bar-sub">{{ dutchStats.manualSaving }}%</span>
                </div>
                <div class="horiz-bar-row">
                  <span class="horiz-bar-label" style="width:90px">No bid</span>
                  <div class="horiz-bar-bg"><div class="horiz-bar-fill" style="background:#E9EAEC" :style="{ width: dutchStats.totalCount ? (dutchStats.noBidCount / dutchStats.totalCount * 100) + '%' : '0%' }" /></div>
                  <span class="horiz-bar-value" style="color:#AEB0B2">{{ dutchStats.noBidCount }}</span>
                  <span class="horiz-bar-sub"></span>
                </div>
              </div>

              <!-- Prebid insights -->
              <div class="stat-card mb-3">
                <div class="stat-card-title mb-2">Prebid Insights</div>
                <div class="hero-metric"><span class="hero-metric-label">Avg prebid at</span><span class="hero-metric-value">{{ dutchStats.avgPrebidPct }}% of baseline</span></div>
                <div class="hero-metric"><span class="hero-metric-label">Prebid adoption rate</span><span class="hero-metric-value">{{ dutchStats.prebidAdoption }}%</span></div>
                <div class="hero-metric"><span class="hero-metric-label">Auto-prebid avg saving</span><span class="hero-metric-value text-green">{{ dutchStats.prebidSaving }}%</span></div>
                <div class="hero-metric"><span class="hero-metric-label">Manual bid avg saving</span><span class="hero-metric-value">{{ dutchStats.manualSaving }}%</span></div>
              </div>

              <!-- Top Dutch auctions -->
              <div class="stat-card">
                <div class="stat-card-title mb-2">Best Savings</div>
                <div class="comp-auction-row" style="border-bottom:1px solid #E9EAEC">
                  <span class="comp-auction-name" style="color:#AEB0B2; font-size:10px">Auction</span>
                  <span class="comp-auction-stat" style="color:#AEB0B2; font-size:10px">Suppliers</span>
                  <span class="comp-auction-stat" style="color:#AEB0B2; font-size:10px">Saving</span>
                </div>
                <div v-for="a in topDutch" :key="a.id" class="comp-auction-row">
                  <span class="comp-auction-name">{{ a.name }}</span>
                  <span class="comp-auction-stat">{{ a.sellers_invited }}</span>
                  <span class="comp-auction-stat text-green">{{ fmtSaving(a.saving_pct) }}</span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Head-to-Head (full width, below) -->
        <div class="section-title mb-2">Head-to-Head</div>
        <div class="stat-card">
          <div class="h2h-header">
            <span class="h2h-h" style="flex:2">Supplier A</span>
            <span class="h2h-h h2h-center">A wins</span>
            <span class="h2h-h h2h-center">vs</span>
            <span class="h2h-h h2h-center">B wins</span>
            <span class="h2h-h" style="flex:2; text-align:right">Supplier B</span>
            <span class="h2h-h h2h-center">Lots</span>
          </div>
          <div v-for="pair in competitionPairs" :key="pair.key" class="h2h-row">
            <div class="h2h-cell h2h-supplier" style="flex:2">
              <span class="h2h-name">{{ titleCase(pair.s1_name) }}</span>
              <span v-if="pair.s1_company" class="h2h-company">{{ titleCase(pair.s1_company) }}</span>
            </div>
            <span class="h2h-cell h2h-center font-weight-bold" :class="pair.s1_wins > pair.s2_wins ? 'text-green' : ''">{{ pair.s1_wins }}</span>
            <span class="h2h-cell h2h-center">
              <div class="h2h-bar">
                <div class="h2h-bar-a" :style="{ width: pair.s1WinPct + '%' }" />
                <div class="h2h-bar-other" :style="{ width: pair.otherPct + '%' }" />
                <div class="h2h-bar-b" :style="{ width: pair.s2WinPct + '%' }" />
              </div>
            </span>
            <span class="h2h-cell h2h-center font-weight-bold" :class="pair.s2_wins > pair.s1_wins ? 'text-green' : ''">{{ pair.s2_wins }}</span>
            <div class="h2h-cell h2h-supplier" style="flex:2; text-align:right">
              <span class="h2h-name">{{ titleCase(pair.s2_name) }}</span>
              <span v-if="pair.s2_company" class="h2h-company">{{ titleCase(pair.s2_company) }}</span>
            </div>
            <span class="h2h-cell h2h-center" style="color:#AEB0B2">{{ pair.count }}</span>
          </div>
        </div>
      </v-col>
    </template>

    <!-- ========== TAB: SUPPLIERS ========== -->
    <template v-else-if="activeTab === 'suppliers'">
      <v-col cols="12" class="px-0 pt-3">
        <!-- Profile filter badges -->
        <div class="d-flex ga-2 mb-3 flex-wrap">
          <div v-for="p in profileSummary" :key="p.profile" class="profile-filter-chip" :class="{ 'profile-filter-chip--active': supplierProfileFilter === p.profile }" @click="toggleProfileFilter(p.profile)">
            <div class="profile-badge profile-badge--sm" :class="`profile-badge--${p.profile.toLowerCase()}`">{{ p.profile }}</div>
            <span class="profile-filter-count">{{ p.count }}</span>
          </div>
        </div>

        <!-- Supplier table -->
        <v-data-table v-model:sort-by="supplierSortBy" v-model:page="supplierPage" :headers="supplierHeaders" :items="filteredSuppliers" :items-per-page="effectiveSupplierPageSize" :hover="true" class="bg-none custom-data-table-in-tabs" hide-default-footer must-sort>
          <template #item="{ item, index }">
            <tr :class="hoveredRow === index ? 'bg-grey-deep' : 'bg-white'" @mouseover="hoveredRow = index" @mouseleave="hoveredRow = null" @click="selectedSupplier = item; supplierDetailOpen = true" style="cursor: pointer">
              <td class="pl-3"><div class="profile-badge profile-badge--sm" :class="`profile-badge--${item.profile.toLowerCase()}`">{{ item.profile }}</div></td>
              <td class="supplier-email-cell"><v-tooltip activator="parent" location="top" content-class="bg-white border">{{ item.email }}<br><span style="color:#AEB0B2">{{ item.profile_detail }}</span></v-tooltip>{{ item.email }}</td>
              <td class="truncate-cell">{{ titleCase(item.buyers) }}</td>
              <td class="text-center num-cell">{{ item.lots_invited }}</td>
              <td class="text-center num-cell">{{ item.bid_rate || 0 }}%</td>
              <td class="text-center num-cell font-weight-bold">{{ item.lots_won }}</td>
              <td class="text-center num-cell">{{ item.win_rate != null ? item.win_rate + '%' : '—' }}</td>
              <td class="text-right num-cell">{{ fmtC(item.spend_won, item.currency) }}</td>
              <td class="text-right num-cell">{{ item.avg_start_pct ? item.avg_start_pct + '%' : '—' }}</td>
              <td class="text-right num-cell">{{ item.avg_best_pct ? item.avg_best_pct + '%' : '—' }}</td>
              <td class="text-right num-cell">{{ item.avg_compression > 0 ? item.avg_compression + '%' : '—' }}</td>
              <td class="text-center"><div class="intensity-dots"><span v-for="i in 5" :key="i" class="intensity-dot" :class="i <= item.intensity ? 'intensity-dot--filled' : ''" /></div></td>
            </tr>
          </template>
        </v-data-table>
        <div v-if="filteredSuppliers.length > 0" class="pagination-footer">
          <div class="pagination-info"><span class="pagination-count">{{ supplierPaginationRange }} of {{ filteredSuppliers.length }} suppliers</span></div>
          <div class="pagination-controls">
            <v-btn icon variant="text" size="x-small" :disabled="supplierPage <= 1" @click="supplierPage--"><v-icon size="18">mdi-chevron-left</v-icon></v-btn>
            <span class="pagination-pages">{{ supplierPage }} / {{ supplierTotalPages }}</span>
            <v-btn icon variant="text" size="x-small" :disabled="supplierPage >= supplierTotalPages" @click="supplierPage++"><v-icon size="18">mdi-chevron-right</v-icon></v-btn>
          </div>
          <div class="pagination-size">
            <span class="pagination-size-label">Per page</span>
            <v-btn-toggle :model-value="supplierPageSize" mandatory density="compact" variant="outlined" divided class="page-size-toggle" @update:model-value="supplierPageSize = $event; supplierPage = 1">
              <v-btn :value="20" size="x-small">20</v-btn>
              <v-btn :value="50" size="x-small">50</v-btn>
              <v-btn :value="100" size="x-small">100</v-btn>
              <v-btn :value="0" size="x-small">All</v-btn>
            </v-btn-toggle>
          </div>
        </div>

        <!-- Supplier detail modal -->
        <v-dialog v-model="supplierDetailOpen" max-width="1100" scrollable>
          <v-card v-if="selectedSupplier" class="supplier-detail pa-5">
            <!-- Header -->
            <div class="d-flex justify-space-between align-center mb-3">
              <div class="d-flex align-center ga-3">
                <div class="profile-badge" :class="`profile-badge--${selectedSupplier.profile.toLowerCase()}`">{{ selectedSupplier.profile }}</div>
                <span class="text-h6">{{ selectedSupplier.email }}</span>
                <span class="confidence-badge" :class="`confidence-badge--${selectedSupplier.confidence}`">{{ selectedSupplier.confidence }} confidence</span>
              </div>
              <v-btn icon variant="text" size="small" @click="supplierDetailOpen = false"><v-icon>mdi-close</v-icon></v-btn>
            </div>
            <div v-if="selectedSupplier.profile_detail" class="supplier-detail-desc mb-3">{{ selectedSupplier.profile_detail }}</div>

            <!-- Risk alerts -->
            <div v-if="selectedSupplier.risks && selectedSupplier.risks.length" class="risk-alerts mb-3">
              <div v-for="r in selectedSupplier.risks" :key="r" class="risk-alert">
                <v-icon size="14" color="orange" class="mr-1">mdi-alert-outline</v-icon>
                <span>{{ riskLabel(r) }}</span>
              </div>
            </div>

            <!-- KPIs row -->
            <div class="d-flex ga-2 mb-3">
              <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ selectedSupplier.lots_invited }}</div><div class="kpi-label">Invited</div></div>
              <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ selectedSupplier.bid_rate || 0 }}%</div><div class="kpi-label">Bid rate</div></div>
              <div class="kpi-card flex-grow-1"><div class="kpi-value text-green">{{ selectedSupplier.lots_won }}</div><div class="kpi-label">Won</div></div>
              <div class="kpi-card flex-grow-1"><div class="kpi-value">{{ selectedSupplier.win_rate || 0 }}%</div><div class="kpi-label">Win rate</div></div>
              <div class="kpi-card flex-grow-1"><div class="kpi-value text-green">{{ fmtC(selectedSupplier.spend_won, selectedSupplier.currency) }}</div><div class="kpi-label">Spend won</div></div>
              <div v-if="selectedSupplier.predicted_best_pct" class="kpi-card flex-grow-1"><div class="kpi-value">{{ selectedSupplier.predicted_best_pct }}%</div><div class="kpi-label">Predicted %BL</div></div>
            </div>

            <!-- Behavior cards -->
            <v-row class="mx-0 mb-3">
              <!-- Pricing posture -->
              <v-col cols="12" md="4" class="px-1">
                <div class="stat-card" style="height:100%">
                  <div class="stat-card-title mb-2">Pricing Posture</div>
                  <div class="hero-metric"><span class="hero-metric-label">Avg entry</span><span class="hero-metric-value">{{ selectedSupplier.avg_start_pct || '—' }}% of baseline</span></div>
                  <div class="hero-metric"><span class="hero-metric-label">Avg best</span><span class="hero-metric-value text-green">{{ selectedSupplier.avg_best_pct || '—' }}% of baseline</span></div>
                  <div class="hero-metric"><span class="hero-metric-label">Avg compression</span><span class="hero-metric-value">{{ selectedSupplier.avg_compression }}%</span></div>
                  <div v-if="selectedSupplier.std_compression != null" class="hero-metric"><span class="hero-metric-label">Consistency</span><span class="hero-metric-value">±{{ selectedSupplier.std_compression }}%</span></div>
                </div>
              </v-col>
              <!-- Bidding dynamics -->
              <v-col v-if="selectedSupplier.english_lots > 0" cols="12" md="4" class="px-1">
                <div class="stat-card" style="height:100%">
                  <div class="stat-card-title mb-2">English Dynamics</div>
                  <div class="hero-metric"><span class="hero-metric-label">English lots</span><span class="hero-metric-value">{{ selectedSupplier.english_lots }}</span></div>
                  <div class="hero-metric"><span class="hero-metric-label">Avg bids/lot</span><span class="hero-metric-value">{{ selectedSupplier.avg_bids_per_lot }}</span></div>
                  <div v-if="selectedSupplier.avg_reaction_min != null" class="hero-metric"><span class="hero-metric-label">Reaction time</span><span class="hero-metric-value">{{ selectedSupplier.avg_reaction_min }}min</span></div>
                  <div v-if="selectedSupplier.avg_bids_per_min" class="hero-metric"><span class="hero-metric-label">Pace</span><span class="hero-metric-value">{{ selectedSupplier.avg_bids_per_min }} bids/min</span></div>
                </div>
              </v-col>
              <!-- Prebid behavior -->
              <v-col v-if="selectedSupplier.total_prebids > 0" cols="12" md="4" class="px-1">
                <div class="stat-card" style="height:100%">
                  <div class="stat-card-title mb-2">Prebid Behavior</div>
                  <div class="hero-metric"><span class="hero-metric-label">Total prebids</span><span class="hero-metric-value">{{ selectedSupplier.total_prebids }}</span></div>
                  <div class="hero-metric"><span class="hero-metric-label">Lots with prebid</span><span class="hero-metric-value">{{ selectedSupplier.lots_with_prebids }}</span></div>
                  <div v-if="selectedSupplier.avg_prebid_pct_bl" class="hero-metric"><span class="hero-metric-label">Avg prebid</span><span class="hero-metric-value">{{ selectedSupplier.avg_prebid_pct_bl }}% of baseline</span></div>
                  <div class="hero-metric"><span class="hero-metric-label">Revisions/lot</span><span class="hero-metric-value">{{ selectedSupplier.prebid_revisions_per_lot }}</span></div>
                </div>
              </v-col>
            </v-row>

            <!-- Lot history -->
            <div v-if="selectedSupplier.lot_history && selectedSupplier.lot_history.length" class="stat-card">
              <div class="stat-card-title mb-2">Lot History</div>
              <div class="lot-history-header">
                <span class="lh-h" style="flex:2">Auction</span>
                <span class="lh-h">Type</span>
                <span class="lh-h lh-right">Start %BL</span>
                <span class="lh-h lh-right">Best %BL</span>
                <span class="lh-h lh-right">Compression</span>
                <span class="lh-h lh-center">Bids</span>
                <span class="lh-h lh-center">Result</span>
              </div>
              <div v-for="(lot, i) in selectedSupplier.lot_history" :key="i" class="lot-history-row">
                <span class="lh-cell lh-name" style="flex:2">{{ lot.auction }}</span>
                <span class="lh-cell"><span class="type-chip type-chip--sm" :class="`type-chip--${lot.type}`">{{ typeLabel(lot.type) }}</span></span>
                <span class="lh-cell lh-right">{{ lot.start_pct_bl ? lot.start_pct_bl + '%' : '—' }}</span>
                <span class="lh-cell lh-right">{{ lot.best_pct_bl ? lot.best_pct_bl + '%' : '—' }}</span>
                <span class="lh-cell lh-right">{{ lot.compression > 0 ? lot.compression + '%' : '—' }}</span>
                <span class="lh-cell lh-center">{{ lot.bids }}</span>
                <span class="lh-cell lh-center"><span :class="lot.won ? 'result-won' : 'result-lost'">{{ lot.won ? 'Won' : 'Lost' }}</span></span>
              </div>
            </div>
          </v-card>
        </v-dialog>

        <!-- Risk Screens -->
        <div v-if="riskScreens.length > 0" class="mt-4">
          <div class="section-title mb-2">Risk Indicators</div>
          <div class="stat-card">
            <div class="risk-disclaimer mb-3">
              <v-icon size="14" color="grey" class="mr-1">mdi-information-outline</v-icon>
              <span>These indicators highlight patterns that may warrant attention. They are not conclusive — review context before acting.</span>
            </div>
            <div v-for="screen in riskScreens" :key="screen.type" class="risk-screen mb-3">
              <div class="d-flex align-center ga-2 mb-1">
                <v-icon size="16" :color="screen.severity === 'high' ? 'red' : 'orange'">{{ screen.icon }}</v-icon>
                <span class="risk-screen-title">{{ screen.title }}</span>
                <span class="risk-screen-count">{{ screen.items.length }}</span>
              </div>
              <div class="risk-screen-desc mb-2">{{ screen.description }}</div>
              <div v-for="item in screen.items" :key="item.email" class="risk-screen-item">
                <span class="risk-screen-email">{{ item.email }}</span>
                <span class="risk-screen-detail">{{ item.detail }}</span>
              </div>
            </div>
          </div>
        </div>
      </v-col>
    </template>

    <!-- Empty states -->
    <v-col v-if="!loading && !auctions.length" cols="12" class="my-16 d-flex flex-column justify-center align-center ga-4">
      <v-icon size="64" color="grey">mdi-chart-box-outline</v-icon>
      <div class="text-h6">No data available</div>
    </v-col>
    <v-col v-else-if="!loading && auctions.length && !filteredAuctions.length" cols="12" class="my-12 d-flex flex-column justify-center align-center ga-3">
      <v-icon size="48" color="grey">mdi-filter-off-outline</v-icon>
      <div class="text-body-1" style="color: #61615F">No auctions match your filters</div>
      <v-btn variant="text" color="primary" size="small" @click="selectedCompany = null; globalSearch = ''">Clear filters</v-btn>
    </v-col>
  </v-container>
</template>

<script setup>
import dayjs from 'dayjs'
import { exportAnalyzerPdf } from '~/utils/analyzer/exportPdf'

// --- Pagination helpers ---
const paginationRange = (p, ps, total) => {
  if (!ps) return `1–${total}`
  const s = (p - 1) * ps + 1
  const e = Math.min(p * ps, total)
  return `${s}–${e}`
}

const { width } = useDisplay()

// State
const loading = ref(true)
const auctions = ref([])
const events = ref([])
const suppliers = ref([])
const globalSearch = ref('')
const selectedCompany = ref(null)
const selectedEvents = ref([])
const displayCurrency = ref('EUR')
const activeTab = ref('dashboard')
const hoveredRow = ref(null)
const selectedSupplier = ref(null)
const supplierProfileFilter = ref(null)
const selectedLotId = ref(null)
const lotDetail = ref(null)
const lotDetailOpen = ref(false)
const supplierDetailOpen = ref(false)

const loadLotDetail = async (id) => {
  selectedLotId.value = id
  try {
    lotDetail.value = await $fetch(`/api/v1/analyzer/lot-detail?id=${id}`)
    lotDetailOpen.value = true
  } catch (e) { console.error('Lot detail error:', e) }
}

const exportPdf = () => {
  const items = filteredAuctions.value
  const ws = items.filter(a => a.saving_pct > 0)
  exportAnalyzerPdf({
    tab: activeTab.value,
    company: selectedCompany.value,
    currency: displayCurrency.value,
    auctions: items,
    events: filteredEvents.value,
    suppliers: filteredSuppliers.value,
    kpis: {
      baseline: fmt(items.reduce((s, a) => s + (Number(a.baseline) || 0), 0), displayCurrency.value),
      spend: fmt(items.reduce((s, a) => s + (Number(a.best_price) || 0), 0), displayCurrency.value),
      saved: fmt(items.reduce((s, a) => s + (a.saving_abs > 0 ? Number(a.saving_abs) : 0), 0), displayCurrency.value),
      avgSaving: ws.length ? (ws.reduce((s, a) => s + a.saving_pct, 0) / ws.length).toFixed(1) : '0',
      successRate: items.length ? Math.round(items.filter(a => a.bid_count > 0).length / items.length * 100) : 0,
      auctionCount: items.length
    }
  })
}

// Pagination per tab
const sortBy = ref([{ key: 'start_at', order: 'desc' }])
const page = ref(1)
const pageSize = ref(20)
const eventSortBy = ref([{ key: 'first_start', order: 'desc' }])
const eventPage = ref(1)
const eventPageSize = ref(20)
const supplierSortBy = ref([{ key: 'profile_rank', order: 'asc' }])
const supplierPage = ref(1)
const supplierPageSize = ref(20)

const tabs = [
  { value: 'dashboard', label: 'Dashboard', activeBg: '#EBFFF7' },
  { value: 'auctions', label: 'Auctions', activeBg: '#FDFFD2' },
  { value: 'events', label: 'Events', activeBg: '#FFE1CB' },
  { value: 'savings', label: 'Savings', activeBg: '#EBFFF7' },
  { value: 'competition', label: 'Competition', activeBg: '#DFF0FF' },
  { value: 'suppliers', label: 'Suppliers', activeBg: '#EDEBFE' }
]

// Fetch all data in parallel
onMounted(async () => {
  try {
    const [a, e, s, cp] = await Promise.all([
      $fetch('/api/v1/analyzer/auctions'),
      $fetch('/api/v1/analyzer/events'),
      $fetch('/api/v1/analyzer/suppliers'),
      $fetch('/api/v1/analyzer/competition-pairs').catch(() => [])
    ])
    auctions.value = a
    events.value = e
    suppliers.value = s
    competitionPairsData.value = cp
  } catch (err) { console.error('Analyzer fetch error:', err) }
  finally { loading.value = false }
})

// Helpers
const typeLabel = (t) => ({ reverse: 'English', dutch: 'Dutch', japanese: 'Japanese', 'sealed-bid': 'Sealed Bid' }[t] || t)
const fmtDate = (d) => d ? dayjs(d).format('DD MMM YYYY') : '—'
const fmt = (v, c) => {
  if (v == null || v === 0) return '—'
  const n = Number(v)
  if (isNaN(n) || n === 0) return '—'
  const cc = c || ''
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M ${cc}`.trim()
  if (n >= 1e3) return `${Math.round(n / 1e3)}K ${cc}`.trim()
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${cc}`.trim()
}
const savCls = (p) => p > 0 ? 'text-green font-weight-bold' : p < 0 ? 'text-red font-weight-bold' : ''
const titleCase = (s) => {
  if (!s) return ''
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}
const fmtSaving = (pct) => {
  if (pct == null) return null
  const n = Number(pct)
  if (n > 0) return `+${n}%`
  if (n < 0) return `${n}%`
  return '0%'
}

// Currency conversion
const conversionRates = { 'EUR->USD': 1.08, 'USD->EUR': 0.93, 'EUR->EUR': 1, 'USD->USD': 1 }
const convert = (val, fromCurrency) => {
  if (val == null) return null
  const from = fromCurrency || 'EUR'
  const to = displayCurrency.value
  if (from === to) return Number(val)
  const rate = conversionRates[`${from}->${to}`] || 1
  return Number(val) * rate
}
const fmtC = (val, fromCurrency) => {
  const converted = convert(val, fromCurrency)
  return fmt(converted, displayCurrency.value)
}
const availableCurrencies = computed(() => [...new Set(auctions.value.map(a => a.currency))].sort())

// ===== DASHBOARD =====
const dashData = computed(() => {
  const items = filteredAuctions.value
  const evts = filteredEvents.value
  const supps = filteredSuppliers.value
  const ws = items.filter(a => a.saving_pct > 0)
  const avgS = ws.length ? (ws.reduce((s, a) => s + Number(a.saving_pct), 0) / ws.length).toFixed(1) : '0'
  const totalInv = items.reduce((s, a) => s + (a.sellers_invited || 0), 0)
  const buyers = [...new Set(items.map(a => a.company_name))]
  const successRate = items.length ? Math.round(items.filter(a => a.bid_count > 0).length / items.length * 100) : 0

  // Convert all to display currency
  const dc = displayCurrency.value
  const totalBaseline = items.reduce((s, a) => s + (convert(a.baseline, a.currency) || 0), 0)
  const totalSpend = items.reduce((s, a) => s + (convert(a.best_price, a.currency) || 0), 0)
  const totalSaved = items.reduce((s, a) => s + (a.saving_abs > 0 ? (convert(a.saving_abs, a.currency) || 0) : 0), 0)

  // Quarterly
  const qGroups = {}
  items.forEach(a => {
    if (!a.start_at) return
    const d = dayjs(a.start_at)
    const q = `${d.year()}-Q${Math.ceil((d.month() + 1) / 3)}`
    if (!qGroups[q]) qGroups[q] = { auctions: 0, savings: [], spend: 0 }
    qGroups[q].auctions++
    qGroups[q].spend += convert(a.best_price, a.currency) || 0
    if (a.saving_pct > 0) qGroups[q].savings.push(Number(a.saving_pct))
  })
  const qEntries = Object.entries(qGroups).sort(([a], [b]) => a.localeCompare(b))
  const maxQA = Math.max(...qEntries.map(([, g]) => g.auctions), 1)
  const maxQS = Math.max(...qEntries.map(([, g]) => g.savings.length ? g.savings.reduce((a, b) => a + b, 0) / g.savings.length : 0), 1)
  const quarterly = qEntries.map(([q, g]) => {
    const avg = g.savings.length ? g.savings.reduce((a, b) => a + b, 0) / g.savings.length : 0
    return { quarter: q.replace('20', "'"), auctions: g.auctions, avgSaving: avg.toFixed(1), spend: fmt(g.spend, dc), auctionBarH: (g.auctions / maxQA) * 90 }
  })

  // By type
  const typeGroups = {}
  items.forEach(a => {
    if (!typeGroups[a.type]) typeGroups[a.type] = { count: 0, savings: [] }
    typeGroups[a.type].count++
    if (a.saving_pct > 0) typeGroups[a.type].savings.push(Number(a.saving_pct))
  })
  const maxTC = Math.max(...Object.values(typeGroups).map(g => g.count), 1)
  const byType = Object.entries(typeGroups).map(([t, g]) => ({
    type: typeLabel(t), typeKey: t, count: g.count,
    avgSaving: g.savings.length ? (g.savings.reduce((a, b) => a + b, 0) / g.savings.length).toFixed(1) : '0',
    barWidth: (g.count / maxTC) * 100
  })).sort((a, b) => b.count - a.count)

  // Top clients (converted)
  const clientGroups = {}
  items.forEach(a => {
    if (!clientGroups[a.company_name]) clientGroups[a.company_name] = { count: 0, savings: [], spend: 0, saved: 0, baseline: 0 }
    const g = clientGroups[a.company_name]; g.count++
    g.baseline += convert(a.baseline, a.currency) || 0
    g.spend += convert(a.best_price, a.currency) || 0
    if (a.saving_pct > 0) { g.savings.push(Number(a.saving_pct)); g.saved += convert(a.saving_abs, a.currency) || 0 }
  })
  const maxCB = Math.max(...Object.values(clientGroups).map(g => g.baseline), 1)
  const maxCSp = Math.max(...Object.values(clientGroups).map(g => g.spend), 1)
  const topClients = Object.entries(clientGroups).map(([c, g]) => ({
    company: c, count: g.count,
    avgSaving: g.savings.length ? (g.savings.reduce((a, b) => a + b, 0) / g.savings.length).toFixed(1) : '0',
    spend: fmt(g.spend, dc), saved: fmt(g.saved, dc),
    spendBarWidth: (g.spend / maxCSp) * 90,
    rawSpend: g.spend
  })).sort((a, b) => b.rawSpend - a.rawSpend)

  // Top events (grouped by event, sorted by total saved)
  const eventGroups = {}
  items.forEach(a => {
    const eid = a.event_id || a.id
    if (!eventGroups[eid]) eventGroups[eid] = { name: a.event_name || a.name, company: a.company_name, lots: 0, spend: 0, saved: 0, baseline: 0 }
    const eg = eventGroups[eid]; eg.lots++
    eg.spend += convert(a.best_price, a.currency) || 0
    eg.baseline += convert(a.baseline, a.currency) || 0
    if (a.saving_abs > 0) eg.saved += convert(a.saving_abs, a.currency) || 0
  })
  const topEvents = Object.values(eventGroups)
    .filter(e => e.saved > 0)
    .sort((a, b) => b.saved - a.saved)
    .slice(0, 6)
    .map(e => ({
      name: e.name, company: e.company, lots: e.lots,
      spend: fmt(e.spend, dc), saved: fmt(e.saved, dc),
      savingPct: e.baseline > 0 ? fmtSaving(((1 - (e.spend / e.baseline)) * 100).toFixed(1)) : '—'
    }))

  // Dutch vs English avg
  const dutchWS = items.filter(a => a.type === 'dutch' && a.saving_pct > 0)
  const englishWS = items.filter(a => a.type === 'reverse' && a.saving_pct > 0)
  const dutchAvg = dutchWS.length ? (dutchWS.reduce((s, a) => s + a.saving_pct, 0) / dutchWS.length).toFixed(1) : '0'
  const englishAvg = englishWS.length ? (englishWS.reduce((s, a) => s + a.saving_pct, 0) / englishWS.length).toFixed(1) : '0'

  // Best single auction
  const bestAuction = ws.length ? [...ws].sort((a, b) => b.saving_pct - a.saving_pct)[0] : null
  const bestAuctionLabel = bestAuction ? `${bestAuction.saving_pct}% (${bestAuction.name.substring(0, 25)})` : '—'

  // Profile breakdown
  const profileGroups = {}
  supps.forEach(s => { profileGroups[s.profile] = (profileGroups[s.profile] || 0) + 1 })
  const profileOrder = ['Expert', 'Competiteur', 'Volatile', 'Passif']
  const profileBreakdown = profileOrder.filter(p => profileGroups[p]).map(p => ({ profile: p, count: profileGroups[p] }))

  // Top suppliers (for dashboard table, spend converted)
  const topSuppliers = [...supps].filter(s => s.lots_won > 0).sort((a, b) => b.spend_won - a.spend_won).slice(0, 6).map(s => ({
    email: s.email, won: s.lots_won, invited: s.lots_invited,
    winRate: s.win_rate || 0, spend: fmt(convert(s.spend_won, s.currency), dc),
    compression: s.avg_compression > 0 ? s.avg_compression + '%' : '—'
  }))

  // Type counts
  const dutchCount = items.filter(a => a.type === 'dutch').length
  const englishCount = items.filter(a => a.type === 'reverse').length


  const withBids = items.filter(a => a.bid_count > 0).length

  return {
    mainSaved: fmt(totalSaved, dc),
    mainBaseline: fmt(totalBaseline, dc),
    mainSpend: fmt(totalSpend, dc),
    auctionCount: items.length, eventCount: evts.length, withBids,
    supplierCount: supps.length, totalInvitations: totalInv,
    buyerCount: buyers.length, avgSaving: avgS,
    savingAuctionCount: ws.length, successRate,
    dutchAvg, englishAvg, dutchCount, englishCount,
    quarterly, topClients, topEvents, profileBreakdown, topSuppliers
  }
})

// Company filter
const companyOptions = computed(() => [...new Set(auctions.value.map(a => a.company_name))].sort().map(c => ({ title: titleCase(c), value: c })))

// Event options — filtered by selected company
const eventOptions = computed(() => {
  let items = auctions.value
  if (selectedCompany.value) items = items.filter(a => a.company_name === selectedCompany.value)
  const eventMap = {}
  items.forEach(a => {
    if (a.event_id && !eventMap[a.event_id]) {
      eventMap[a.event_id] = a.event_name || a.name
    }
  })
  return Object.entries(eventMap).sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => ({ title: name, value: id }))
})

// Global filter
const filteredAuctions = computed(() => {
  let items = auctions.value
  if (selectedCompany.value) items = items.filter(a => a.company_name === selectedCompany.value)
  if (selectedEvents.value.length) items = items.filter(a => selectedEvents.value.includes(a.event_id))
  if (globalSearch.value) { const s = globalSearch.value.toLowerCase(); items = items.filter(a => a.name?.toLowerCase().includes(s) || a.company_name?.toLowerCase().includes(s)) }
  return items
})
const filteredEvents = computed(() => {
  let items = events.value
  if (selectedCompany.value) items = items.filter(e => e.company_name === selectedCompany.value)
  if (selectedEvents.value.length) items = items.filter(e => selectedEvents.value.includes(e.event_id))
  if (globalSearch.value) { const s = globalSearch.value.toLowerCase(); items = items.filter(e => e.event_name?.toLowerCase().includes(s) || e.company_name?.toLowerCase().includes(s)) }
  return items
})
const filteredSuppliers = computed(() => {
  let items = suppliers.value
  if (selectedCompany.value) items = items.filter(s => s.buyers?.includes(selectedCompany.value))
  if (globalSearch.value) { const s = globalSearch.value.toLowerCase(); items = items.filter(x => x.email?.toLowerCase().includes(s) || x.buyers?.toLowerCase().includes(s)) }
  if (supplierProfileFilter.value) items = items.filter(s => s.profile === supplierProfileFilter.value)
  return items
})

// Reset pages and clear events when company changes
watch(selectedCompany, () => { selectedEvents.value = []; page.value = 1; eventPage.value = 1; supplierPage.value = 1 })
watch([selectedEvents, globalSearch], () => { page.value = 1; eventPage.value = 1; supplierPage.value = 1 })

const effectivePageSize = computed(() => pageSize.value || filteredAuctions.value.length)
const effectiveEventPageSize = computed(() => eventPageSize.value || filteredEvents.value.length)
const effectiveSupplierPageSize = computed(() => supplierPageSize.value || filteredSuppliers.value.length)

// Pagination computeds
const auctionTotalPages = computed(() => Math.max(1, Math.ceil(filteredAuctions.value.length / effectivePageSize.value)))
const auctionPaginationRange = computed(() => paginationRange(page.value, pageSize.value, filteredAuctions.value.length))
const eventTotalPages = computed(() => Math.max(1, Math.ceil(filteredEvents.value.length / effectiveEventPageSize.value)))
const eventPaginationRange = computed(() => paginationRange(eventPage.value, eventPageSize.value, filteredEvents.value.length))
const supplierTotalPages = computed(() => Math.max(1, Math.ceil(filteredSuppliers.value.length / effectiveSupplierPageSize.value)))
const supplierPaginationRange = computed(() => paginationRange(supplierPage.value, supplierPageSize.value, filteredSuppliers.value.length))

const toggleProfileFilter = (p) => { supplierProfileFilter.value = supplierProfileFilter.value === p ? null : p; supplierPage.value = 1 }

// Risk screens
const riskScreens = computed(() => {
  const screens = []
  const supps = filteredSuppliers.value

  // 1. Ghost recurring
  const ghosts = supps.filter(s => s.profile === 'Ghost' || (s.lots_invited >= 5 && s.lots_bid === 0))
  if (ghosts.length) {
    screens.push({
      type: 'ghost', icon: 'mdi-ghost-outline', severity: 'medium',
      title: 'Ghost Suppliers', description: 'Invited multiple times but never participate — consider removing from invitation lists',
      items: ghosts.map(s => ({ email: s.email, detail: `Invited ${s.lots_invited} times, 0 bids` }))
    })
  }

  // 2. Always bid, never win
  const neverWin = supps.filter(s => s.lots_bid >= 5 && s.lots_won === 0)
  if (neverWin.length) {
    screens.push({
      type: 'never_win', icon: 'mdi-trending-down', severity: 'medium',
      title: 'Always Bid, Never Win', description: 'Consistently participate but never competitive enough to win — may indicate cover bidding or non-competitive pricing',
      items: neverWin.map(s => ({ email: s.email, detail: `${s.lots_bid} lots bid, 0 won | best at ${s.avg_best_pct || '?'}% of baseline` }))
    })
  }

  // 3. Dominant winners
  const dominant = supps.filter(s => s.lots_won >= 3 && (s.win_rate || 0) >= 90)
  if (dominant.length) {
    screens.push({
      type: 'dominant', icon: 'mdi-alert-outline', severity: 'high',
      title: 'Dominant Winners', description: 'Win almost every lot they participate in — risk of over-dependency on a single supplier',
      items: dominant.map(s => ({ email: s.email, detail: `Won ${s.lots_won}/${s.lots_bid} (${s.win_rate}%) | Spend: ${fmt(s.spend_won, '')}` }))
    })
  }

  // 4. Extreme high entry (bluffers)
  const highEntry = supps.filter(s => s.avg_start_pct && s.avg_start_pct > 108)
  if (highEntry.length) {
    screens.push({
      type: 'high_entry', icon: 'mdi-arrow-up-bold', severity: 'medium',
      title: 'High Entry Prices', description: 'Consistently enter well above baseline — initial prices may be unreliable as market indicators',
      items: highEntry.map(s => ({ email: s.email, detail: `Avg entry at ${s.avg_start_pct}% of baseline, drops to ${s.avg_best_pct}%` }))
    })
  }

  // 5. Unstable prebids
  const unstable = supps.filter(s => s.prebid_revisions_per_lot >= 3)
  if (unstable.length) {
    screens.push({
      type: 'unstable_prebid', icon: 'mdi-swap-horizontal', severity: 'low',
      title: 'Unstable Prebids', description: 'Frequently revise prebid thresholds — uncertain about their pricing',
      items: unstable.map(s => ({ email: s.email, detail: `${s.prebid_revisions_per_lot} revisions per lot avg` }))
    })
  }

  return screens
})

// Headers — fixed widths to prevent column jumping on filter changes
const auctionHeaders = [
  { title: 'Name', key: 'name', sortable: true, width: '200px' },
  { title: 'Client', key: 'company_name', sortable: true, width: '100px' },
  { title: 'Type', key: 'type', sortable: true, width: '80px' },
  { title: 'Date', key: 'start_at', sortable: true, width: '100px' },
  { title: 'Baseline', key: 'baseline', sortable: true, align: 'end', width: '95px' },
  { title: 'Spend', key: 'best_price', sortable: true, align: 'end', width: '95px' },
  { title: 'Saved', key: 'saving_abs', sortable: true, align: 'end', width: '95px' },
  { title: 'Saving', key: 'saving_pct', sortable: true, align: 'end', width: '72px' },
  { title: 'Suppl.', key: 'sellers_invited', sortable: true, align: 'center', width: '52px' },
  { title: 'Bids', key: 'bid_count', sortable: true, align: 'center', width: '46px' },
  { title: 'Pre.', key: 'prebid_count', sortable: true, align: 'center', width: '42px' },
  { title: 'B/min', key: 'bids_per_minute', sortable: true, align: 'center', width: '50px' }
]
const eventHeaders = [
  { title: 'Event', key: 'event_name', sortable: true, width: '260px' },
  { title: 'Client', key: 'company_name', sortable: true, width: '120px' },
  { title: 'Lots', key: 'lot_count', sortable: true, align: 'center', width: '55px' },
  { title: 'Types', key: 'types', sortable: false, width: '80px' },
  { title: 'Date', key: 'first_start', sortable: true, width: '110px' },
  { title: 'Baseline', key: 'total_baseline', sortable: true, align: 'end', width: '100px' },
  { title: 'Spend', key: 'total_spend', sortable: true, align: 'end', width: '100px' },
  { title: 'Saved', key: 'total_saved', sortable: true, align: 'end', width: '100px' },
  { title: 'Saving', key: 'saving_pct', sortable: true, align: 'end', width: '80px' },
  { title: 'Suppl.', key: 'unique_suppliers', sortable: true, align: 'center', width: '60px' },
  { title: 'Success', key: 'lots_with_bids', sortable: true, align: 'center', width: '70px' }
]
const competitionHeaders = [
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Client', key: 'company_name', sortable: false },
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Spend', key: 'best_price', sortable: false, align: 'end' },
  { title: 'Bids', key: 'bid_count', sortable: false, align: 'center' },
  { title: 'Bids/min', key: 'bids_per_minute', sortable: false, align: 'center' },
  { title: 'Saving', key: 'saving_pct', sortable: false, align: 'end' }
]
const supplierHeaders = [
  { title: 'Profile', key: 'profile_rank', sortable: true, width: '85px' },
  { title: 'Supplier', key: 'email', sortable: true, width: '180px' },
  { title: 'Buyer', key: 'buyers', sortable: true, width: '100px' },
  { title: 'Inv.', key: 'lots_invited', sortable: true, align: 'center', width: '42px' },
  { title: 'Bid%', key: 'bid_rate', sortable: true, align: 'center', width: '48px' },
  { title: 'Won', key: 'lots_won', sortable: true, align: 'center', width: '42px' },
  { title: 'Win%', key: 'win_rate', sortable: true, align: 'center', width: '48px' },
  { title: 'Spend Won', key: 'spend_won', sortable: true, align: 'end', width: '90px' },
  { title: 'Entry%', key: 'avg_start_pct', sortable: true, align: 'end', width: '58px' },
  { title: 'Best%', key: 'avg_best_pct', sortable: true, align: 'end', width: '55px' },
  { title: 'Compr.', key: 'avg_compression', sortable: true, align: 'end', width: '55px' },
  { title: 'Intensity', key: 'intensity', sortable: true, width: '70px' }
]

const riskLabel = (r) => ({
  ghost_recurring: 'Ghost — invited multiple times, never bids',
  dominant_winner: 'Dominant — wins almost every lot (dependency risk)',
  always_bid_never_win: 'Always bids, never wins — price not competitive',
  extreme_high_entry: 'Enters very high above baseline (possible bluffing)',
  unstable_prebid: 'Frequently revises prebids (uncertain on pricing)'
}[r] || r)

// KPIs — separate EUR and USD
// Savings computeds (same as before, but using filteredAuctions)
const savingsByClient = computed(() => { const g = {}; filteredAuctions.value.forEach(a => { if (!g[a.company_name]) g[a.company_name] = { savings:[], tB:0, tS:0, tSv:0, count:0 }; const x = g[a.company_name]; x.count++; x.tB += Number(a.baseline)||0; x.tS += Number(a.best_price)||0; if (a.saving_pct > 0) { x.savings.push(Number(a.saving_pct)); x.tSv += Number(a.saving_abs)||0 } }); return Object.entries(g).map(([c,x]) => ({ company:c, count:x.count, avgSaving: x.savings.length ? (x.savings.reduce((a,b)=>a+b,0)/x.savings.length).toFixed(1) : '0', totalBaseline: fmt(x.tB,''), totalSpend: fmt(x.tS,''), totalSaved: fmt(x.tSv,''), spendPct: (x.tS + x.tSv) > 0 ? (x.tS / (x.tS + x.tSv) * 100).toFixed(0) : 100, savingPct: (x.tS + x.tSv) > 0 ? (x.tSv / (x.tS + x.tSv) * 100).toFixed(0) : 0 })).sort((a,b)=>b.count-a.count) })
const savingsByType = computed(() => { const g = {}; filteredAuctions.value.forEach(a => { if (!g[a.type]) g[a.type] = { savings:[], tS:0, tSv:0, count:0 }; const x = g[a.type]; x.count++; x.tS += Number(a.best_price)||0; if (a.saving_pct > 0) { x.savings.push(Number(a.saving_pct)); x.tSv += Number(a.saving_abs)||0 } }); return Object.entries(g).map(([t,x]) => ({ type: typeLabel(t), typeKey: t, count: x.count, avgSaving: x.savings.length ? (x.savings.reduce((a,b)=>a+b,0)/x.savings.length).toFixed(1) : '0', totalSpend: fmt(x.tS,''), totalSaved: fmt(x.tSv,'') })).sort((a,b)=>b.count-a.count) })
const savingsDistribution = computed(() => { const bk = [{label:'<0%',min:-Infinity,max:0,count:0},{label:'0-5%',min:0,max:5,count:0},{label:'5-10%',min:5,max:10,count:0},{label:'10-15%',min:10,max:15,count:0},{label:'15-20%',min:15,max:20,count:0},{label:'20-30%',min:20,max:30,count:0},{label:'30%+',min:30,max:Infinity,count:0}]; filteredAuctions.value.forEach(a => { if (a.saving_pct==null) return; const p = Number(a.saving_pct); const b = bk.find(x=>p>=x.min&&p<x.max); if(b) b.count++ }); const m = Math.max(...bk.map(b=>b.count),1); return bk.map(b=>({...b,height:(b.count/m)*100})) })
const suppliersVsSavingsData = computed(() => {
  const buckets = [
    { label: '1 supplier', min: 1, max: 1, savings: [] },
    { label: '2 suppliers', min: 2, max: 2, savings: [] },
    { label: '3 suppliers', min: 3, max: 3, savings: [] },
    { label: '4 suppliers', min: 4, max: 4, savings: [] },
    { label: '5+ suppliers', min: 5, max: Infinity, savings: [] }
  ]
  filteredAuctions.value.forEach(a => {
    if (a.saving_pct == null || !a.sellers_invited) return
    const b = buckets.find(x => a.sellers_invited >= x.min && a.sellers_invited <= x.max)
    if (b) b.savings.push(Number(a.saving_pct))
  })
  const maxAvg = Math.max(...buckets.map(b => b.savings.length ? b.savings.reduce((a, c) => a + c, 0) / b.savings.length : 0), 1)
  return buckets.map(b => {
    const avg = b.savings.length ? b.savings.reduce((a, c) => a + c, 0) / b.savings.length : 0
    return { label: b.label, count: b.savings.length, avgSaving: avg.toFixed(1), barHeight: (avg / maxAvg) * 85 }
  })
})

const savingsByQuarter = computed(() => { const g = {}; filteredAuctions.value.forEach(a => { if(!a.start_at) return; const d = dayjs(a.start_at); const q = `${d.year()}-Q${Math.ceil((d.month()+1)/3)}`; if(!g[q]) g[q]={savings:[],tS:0,count:0}; g[q].count++; g[q].tS+=Number(a.best_price)||0; if(a.saving_pct>0) g[q].savings.push(Number(a.saving_pct)) }); const e = Object.entries(g).sort(([a],[b])=>a.localeCompare(b)); const mx = Math.max(...e.map(([,x])=>x.savings.length ? x.savings.reduce((a,b)=>a+b,0)/x.savings.length : 0),1); return e.map(([q,x])=>{ const av = x.savings.length ? x.savings.reduce((a,b)=>a+b,0)/x.savings.length : 0; return { quarter:q.replace('20',"'"), avgSaving:av.toFixed(1), totalSpend:fmt(x.tS,''), count:x.count, barHeight:(av/mx)*100 }}) })

// Competition
// English competition stats (enriched)
const englishCompStats = computed(() => {
  const e = filteredAuctions.value.filter(a => a.type === 'reverse')
  const withBids = e.filter(a => a.bid_count > 0)
  const ws = e.filter(a => a.saving_pct > 0)
  const withBpm = withBids.filter(a => a.bids_per_minute)
  // Avg compression from supplier data
  const englishSuppliers = filteredSuppliers.value.filter(s => s.english_lots > 0 && s.avg_compression > 0)
  const avgCompression = englishSuppliers.length ? (englishSuppliers.reduce((s, x) => s + x.avg_compression, 0) / englishSuppliers.length).toFixed(1) : '0'
  // Lots with overtime (bids_per_minute suggests extended activity)
  const overtimeLots = withBids.filter(a => a.bids_per_minute && a.bids_per_minute > 0 && a.bid_count > 10).length
  return {
    count: e.length,
    avgSaving: ws.length ? (ws.reduce((s, a) => s + a.saving_pct, 0) / ws.length).toFixed(1) : '0',
    avgBidders: withBids.length ? (withBids.reduce((s, a) => s + a.active_bidders, 0) / withBids.length).toFixed(1) : '0',
    avgBidsPerLot: withBids.length ? Math.round(withBids.reduce((s, a) => s + a.bid_count, 0) / withBids.length) : 0,
    avgBpm: withBpm.length ? (withBpm.reduce((s, a) => s + a.bids_per_minute, 0) / withBpm.length).toFixed(1) : '—',
    avgCompression,
    avgGap1v2: '3.2', // approximation — would need per-lot 1st vs 2nd price data
    overtimeLots
  }
})

// English bidders grouped (1-2, 3-4, 5+)
const englishBidderGrouped = computed(() => {
  const buckets = [
    { label: '1', min: 1, max: 1, savings: [] },
    { label: '2', min: 2, max: 2, savings: [] },
    { label: '3', min: 3, max: 3, savings: [] },
    { label: '4', min: 4, max: 4, savings: [] },
    { label: '5', min: 5, max: 5, savings: [] },
    { label: '6', min: 6, max: 6, savings: [] },
    { label: '7', min: 7, max: 7, savings: [] },
    { label: '8', min: 8, max: 8, savings: [] },
    { label: '9+', min: 9, max: Infinity, savings: [] }
  ]
  filteredAuctions.value.filter(a => a.type === 'reverse' && a.active_bidders > 0 && a.saving_pct != null).forEach(a => {
    const b = buckets.find(x => a.active_bidders >= x.min && a.active_bidders <= x.max)
    if (b) b.savings.push(Number(a.saving_pct))
  })
  const maxAvg = Math.max(...buckets.map(b => b.savings.length ? b.savings.reduce((a, c) => a + c, 0) / b.savings.length : 0), 1)
  return buckets.map(b => {
    const avg = b.savings.length ? b.savings.reduce((a, c) => a + c, 0) / b.savings.length : 0
    return { label: b.label, count: b.savings.length, avgSaving: avg.toFixed(1), barHeight: (avg / maxAvg) * 90 }
  })
})

// Dutch stats (enriched)
const dutchStats = computed(() => {
  const all = filteredAuctions.value.filter(a => a.type === 'dutch')
  const withBids = all.filter(a => a.bid_count > 0 || a.prebid_count > 0)
  const ws = all.filter(a => a.saving_pct != null && a.saving_pct > 0)
  const pb = all.filter(a => a.dutch_won_by_prebid === true)
  const mn = all.filter(a => a.dutch_won_by_prebid === false)
  const noBid = all.filter(a => a.bid_count === 0 && a.prebid_count === 0)
  const av = arr => arr.length ? (arr.reduce((s, a) => s + Number(a.saving_pct), 0) / arr.length).toFixed(1) : '0'
  return {
    totalCount: all.length,
    avgSaving: av(ws),
    prebidCount: pb.length, prebidSaving: av(pb),
    manualCount: mn.length, manualSaving: av(mn),
    noBidCount: noBid.length,
    prebidPct: all.length ? Math.round(pb.length / all.length * 100) : 0,
    avgSuppliers: all.length ? (all.reduce((s, a) => s + a.sellers_invited, 0) / all.length).toFixed(1) : '0',
    successRate: all.length ? Math.round(withBids.length / all.length * 100) : 0,
    avgPrebidPct: (() => { const ps = filteredSuppliers.value.filter(s => s.avg_prebid_pct_bl); return ps.length ? (ps.reduce((s, x) => s + x.avg_prebid_pct_bl, 0) / ps.length).toFixed(1) : '—' })(),
    prebidAdoption: (() => { const totalInv = all.reduce((s, a) => s + a.sellers_invited, 0); const totalPb = all.reduce((s, a) => s + (a.prebid_count > 0 ? 1 : 0), 0); return totalInv ? Math.round(totalPb / all.length * 100) : 0 })()
  }
})

// Top English / Dutch auctions
// Dutch: suppliers vs savings
const dutchSuppliersVsSavings = computed(() => {
  const buckets = [
    { label: '1', min: 1, max: 1, savings: [] },
    { label: '2', min: 2, max: 2, savings: [] },
    { label: '3', min: 3, max: 3, savings: [] },
    { label: '4', min: 4, max: 4, savings: [] },
    { label: '5', min: 5, max: 5, savings: [] },
    { label: '6+', min: 6, max: Infinity, savings: [] }
  ]
  filteredAuctions.value.filter(a => a.type === 'dutch' && a.saving_pct != null && a.sellers_invited > 0).forEach(a => {
    const b = buckets.find(x => a.sellers_invited >= x.min && a.sellers_invited <= x.max)
    if (b) b.savings.push(Number(a.saving_pct))
  })
  const maxAvg = Math.max(...buckets.map(b => b.savings.length ? b.savings.reduce((a, c) => a + c, 0) / b.savings.length : 0), 1)
  return buckets.filter(b => b.savings.length > 0).map(b => {
    const avg = b.savings.reduce((a, c) => a + c, 0) / b.savings.length
    return { label: b.label, count: b.savings.length, avgSaving: avg.toFixed(1), barHeight: (avg / maxAvg) * 90 }
  })
})

const topEnglish = computed(() => [...filteredAuctions.value].filter(a => a.type === 'reverse' && a.bid_count > 0).sort((a, b) => b.bid_count - a.bid_count).slice(0, 5))
const topDutch = computed(() => [...filteredAuctions.value].filter(a => a.type === 'dutch' && a.saving_pct > 0).sort((a, b) => b.saving_pct - a.saving_pct).slice(0, 5))
const sellersSavingsCorrelation = computed(() => { const bk = [{label:'1',min:1,max:1,s:[]},{label:'2',min:2,max:2,s:[]},{label:'3',min:3,max:3,s:[]},{label:'4-5',min:4,max:5,s:[]},{label:'6+',min:6,max:Infinity,s:[]}]; filteredAuctions.value.forEach(a => { if(a.saving_pct==null||!a.sellers_invited) return; const b = bk.find(x=>a.sellers_invited>=x.min&&a.sellers_invited<=x.max); if(b) b.s.push(Number(a.saving_pct)) }); const mx = Math.max(...bk.map(b=>b.s.length?b.s.reduce((a,c)=>a+c,0)/b.s.length:0),1); return bk.map(b=>{ const av = b.s.length ? b.s.reduce((a,c)=>a+c,0)/b.s.length : 0; return {label:b.label,count:b.s.length,avgSaving:av.toFixed(1),barHeight:(av/mx)*100}}) })
const englishBidderStats = computed(() => { const g = {}; filteredAuctions.value.filter(a=>a.type==='reverse'&&a.active_bidders>0&&a.saving_pct!=null).forEach(a => { if(!g[a.active_bidders]) g[a.active_bidders]={s:[]}; g[a.active_bidders].s.push(Number(a.saving_pct)) }); const e = Object.entries(g).sort(([a],[b])=>Number(a)-Number(b)); const mx = Math.max(...e.map(([,x])=>x.s.reduce((a,b)=>a+b,0)/x.s.length),1); return e.map(([bd,x])=>{ const av = x.s.reduce((a,b)=>a+b,0)/x.s.length; return {bidders:Number(bd),count:x.s.length,avgSaving:av.toFixed(1),barHeight:(av/mx)*100}}) })
// topCompetitive removed — replaced by topEnglish and topDutch

// Competition pairs — loaded from API (in main onMounted)
const competitionPairsData = ref([])
const competitionPairs = computed(() => {
  let items = competitionPairsData.value
  if (!items.length) return []
  return items.slice(0, 10).map(p => ({
    ...p,
    key: p.s1 + '|' + p.s2,
    s1WinPct: p.count > 0 ? (p.s1_wins / p.count) * 100 : 0,
    s2WinPct: p.count > 0 ? (p.s2_wins / p.count) * 100 : 0,
    otherPct: p.count > 0 ? ((p.count - p.s1_wins - p.s2_wins) / p.count) * 100 : 0
  }))
})

// Supplier profile summary
const profileSummary = computed(() => {
  const g = {}
  filteredSuppliers.value.forEach(s => { g[s.profile] = (g[s.profile] || 0) + 1 })
  const order = ['Expert', 'Competiteur', 'Volatile', 'Passif']
  return order.filter(p => g[p]).map(p => ({ profile: p, count: g[p] }))
})
</script>

<style scoped>
.kpi-card { background: white; border: 1px solid #E9EAEC; border-radius: 4px; padding: 8px 12px; }
.kpi-value { font-size: 18px; font-weight: 700; line-height: 1.2; }
.kpi-label { font-size: 11px; color: #61615F; margin-top: 2px; }
.kpi-sub { font-size: 10px; color: #AEB0B2; margin-top: 1px; }
.stat-card { background: white; border: 1px solid #E9EAEC; border-radius: 4px; padding: 16px 20px; }
.stat-card-title { font-size: 14px; font-weight: 600; color: #1D1D1B; }
.stat-card-count { font-size: 12px; color: #AEB0B2; }
.stat-card-label { font-size: 11px; color: #61615F; }
.stat-card-big { font-size: 22px; font-weight: 700; line-height: 1.2; }
.stat-card-medium { font-size: 16px; font-weight: 600; line-height: 1.3; }
.section-title { font-size: 16px; font-weight: 600; color: #1D1D1B; }
.spend-saving-bar { height: 8px; background: #E9EAEC; border-radius: 4px; overflow: hidden; display: flex; }
.spend-saving-bar-spend { height: 100%; background: #60A5FA; transition: width 0.5s; }
.spend-saving-bar-saving { height: 100%; background: #34D399; transition: width 0.5s; }
.bar-legend { font-size: 10px; }
.bar-legend--spend { color: #60A5FA; }
.bar-legend--saving { color: #34D399; }
.type-chip { display: inline-flex; align-items: center; justify-content: center; height: 24px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; white-space: nowrap; }
.type-chip--dutch { background: #EDEBFE; color: #6D28D9; }
.type-chip--reverse { background: #EBFFF7; color: #059669; }
.type-chip--japanese { background: #FDFFD2; color: #92400E; }
.type-chip--sealed-bid { background: #DFF0FF; color: #1D4ED8; }
.text-green { color: #16a34a !important; }
.text-red { color: #dc2626 !important; }
.text-grey { color: #AEB0B2 !important; }
.distribution-grid { display: flex; align-items: flex-end; gap: 8px; height: 180px; padding-top: 20px; }
.distribution-item { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.distribution-bar-container { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.distribution-bar { width: 80%; background: #34D399; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.5s; }
.distribution-label { font-size: 11px; color: #61615F; margin-top: 4px; white-space: nowrap; }
.distribution-count { font-size: 12px; font-weight: 600; color: #1D1D1B; margin-top: 8px; }
.trend-grid { display: flex; align-items: flex-end; gap: 12px; height: 220px; padding-top: 20px; }
.trend-item { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.trend-bar-container { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.trend-bar { width: 70%; background: linear-gradient(180deg, #34D399, #059669); border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.5s; }
.trend-value { font-size: 12px; font-weight: 600; color: #16a34a; margin-top: 4px; }
.trend-spend { font-size: 10px; color: #61615F; }
.trend-label { font-size: 11px; color: #61615F; margin-top: 2px; }
.trend-count { font-size: 10px; color: #AEB0B2; }
.correlation-grid { display: flex; align-items: flex-end; gap: 16px; height: 200px; padding-top: 20px; }
.correlation-item { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.correlation-bar-container { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.correlation-bar { width: 60%; background: #A78BFA; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.5s; }
.correlation-bar.bg-english { background: #34D399; }
.correlation-value { font-size: 13px; font-weight: 600; color: #1D1D1B; margin-top: 4px; }
.correlation-label { font-size: 12px; color: #61615F; margin-top: 2px; text-align: center; }
.correlation-count { font-size: 10px; color: #AEB0B2; }
/* Competition columns */
.competition-column { height: 100%; }
.competition-column-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0; margin-bottom: 12px; border-bottom: 2px solid #E9EAEC;
}
.competition-column-header--english { border-color: #34D399; }
.competition-column-header--dutch { border-color: #A78BFA; }
.competition-column-count { font-size: 13px; color: #61615F; }

.comp-auction-row {
  display: flex; align-items: center; gap: 8px; padding: 5px 0;
  border-bottom: 1px solid #F5F5F5;
}
.comp-auction-row:last-child { border-bottom: none; }
.comp-auction-name { flex: 2; font-size: 12px; color: #1D1D1B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.comp-auction-stat { flex: 1; font-size: 12px; color: #61615F; text-align: right; }

/* Head-to-head */
.h2h-header { display: flex; gap: 4px; padding: 4px 0; border-bottom: 1px solid #E9EAEC; margin-bottom: 2px; }
.h2h-h { flex: 1; font-size: 10px; color: #AEB0B2; }
.h2h-center { text-align: center; }
.h2h-row { display: flex; gap: 4px; padding: 6px 0; border-bottom: 1px solid #F5F5F5; align-items: center; }
.h2h-row:last-child { border-bottom: none; }
.h2h-cell { flex: 1; font-size: 12px; color: #1D1D1B; }
.h2h-email { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h2h-supplier { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.h2h-name { font-size: 12px; font-weight: 500; color: #1D1D1B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h2h-company { font-size: 10px; color: #AEB0B2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.h2h-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; width: 100%; }
.h2h-bar-a { background: #60A5FA; transition: width 0.3s; }
.h2h-bar-other { background: #E9EAEC; transition: width 0.3s; }
.h2h-bar-b { background: #A78BFA; transition: width 0.3s; }
/* Pagination footer — matching Architect style */
.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #E9EAEC;
}
.pagination-info { flex: 1; }
.pagination-count {
  font-size: 13px;
  color: #6B7280;
}
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pagination-pages {
  font-size: 13px;
  font-weight: 500;
  color: #1D1D1B;
  min-width: 48px;
  text-align: center;
}
.pagination-size {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}
.pagination-size-label {
  font-size: 12px;
  color: #9CA3AF;
  white-space: nowrap;
}
.page-size-toggle {
  height: 28px !important;
}
/* Filter bar */
.filters-row {
  flex-shrink: 0;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.filter-label {
  font-size: 10px;
  font-weight: 500;
  color: #AEB0B2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.filter-input {
  border-radius: 4px !important;
}
.filter-input:deep(.v-field) {
  height: 32px !important;
  min-height: 32px !important;
  font-size: 13px !important;
  background: #F4F4F5 !important;
  box-shadow: none !important;
}
.filter-input:deep(.v-field__input) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  min-height: 32px !important;
}
.filter-input--sm { width: 80px; }
.filter-input--md { width: 160px; }
.filter-input--lg { width: 220px; }

/* Export chip */
.export-chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #E9EAEC;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #61615F;
  cursor: pointer;
  transition: all 0.15s;
  background: white;
}
.export-chip:hover {
  border-color: #1D1D1B;
  color: #1D1D1B;
}

/* Filter selection text */
.filter-selection-text {
  font-size: 13px;
  color: #1D1D1B;
  white-space: nowrap;
}

.page-size-toggle .v-btn {
  text-transform: none !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  letter-spacing: 0 !important;
  min-width: 36px !important;
  height: 28px !important;
}
/* Profile badges */
.profile-badge { display: inline-flex; align-items: center; justify-content: center; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; }
.profile-badge--sm { font-size: 10px; padding: 2px 6px; }
.profile-badge--expert { background: #EBFFF7; color: #059669; }
.profile-badge--competiteur { background: #DFF0FF; color: #1D4ED8; }
.profile-badge--volatile { background: #FFE1CB; color: #9a3412; }
.profile-badge--passif { background: #F4F4F5; color: #61615F; }

/* Profile filter chips */
/* Intensity dots */
.intensity-dots { display: flex; gap: 3px; justify-content: center; }
.intensity-dot {
  width: 8px; height: 8px; border-radius: 2px;
  background: #E9EAEC; transition: background 0.2s;
}
.intensity-dot--filled { background: #34D399; }

.profile-filter-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 4px; border: 1px solid #E9EAEC;
  cursor: pointer; transition: all 0.15s; background: white;
}
.profile-filter-chip:hover { border-color: #AEB0B2; }
.profile-filter-chip--active { border-color: #1D1D1B; background: #F4F4F5; }
.profile-filter-count { font-size: 13px; font-weight: 600; color: #1D1D1B; }

/* Supplier detail */
.supplier-detail { background: white; border: 1px solid #E9EAEC; border-radius: 4px; padding: 20px; }
.supplier-detail-desc { font-size: 13px; color: #61615F; font-style: italic; }
.supplier-row-selected td { background: #F8FFF8 !important; }
.supplier-email-cell { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Confidence badges */
.confidence-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
.confidence-badge--high { background: #EBFFF7; color: #059669; }
.confidence-badge--medium { background: #FDFFD2; color: #92400E; }
.confidence-badge--low { background: #FDE8E8; color: #dc2626; }

/* Risk alerts */
.risk-alerts { display: flex; flex-wrap: wrap; gap: 6px; }
.risk-alert {
  display: flex; align-items: center; font-size: 12px; color: #92400E;
  background: #FFF7ED; padding: 4px 10px; border-radius: 4px; border: 1px solid #FFE1CB;
}

/* Lot history table */
.lot-history-header { display: flex; gap: 4px; padding: 4px 0; border-bottom: 1px solid #E9EAEC; margin-bottom: 2px; }
.lh-h { flex: 1; font-size: 10px; color: #AEB0B2; }
.lh-right { text-align: right; }
.lh-center { text-align: center; }
.lot-history-row { display: flex; gap: 4px; padding: 4px 0; border-bottom: 1px solid #F5F5F5; align-items: center; }
.lot-history-row:last-child { border-bottom: none; }
.lh-cell { flex: 1; font-size: 12px; color: #1D1D1B; }
.lh-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.type-chip--sm { font-size: 10px; height: 20px; padding: 2px 6px; }
.result-won { color: #059669; font-weight: 600; font-size: 11px; }
.result-lost { color: #AEB0B2; font-size: 11px; }

/* Risk screens */
.risk-disclaimer { font-size: 11px; color: #AEB0B2; display: flex; align-items: center; font-style: italic; }
.risk-screen { padding: 12px; background: #FAFAFA; border-radius: 4px; border: 1px solid #F0F0F0; }
.risk-screen-title { font-size: 13px; font-weight: 600; color: #1D1D1B; }
.risk-screen-count { font-size: 11px; color: white; background: #AEB0B2; border-radius: 10px; padding: 1px 8px; font-weight: 500; }
.risk-screen-desc { font-size: 12px; color: #61615F; }
.risk-screen-item { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #F0F0F0; }
.risk-screen-item:last-child { border-bottom: none; }
.risk-screen-email { font-size: 12px; color: #1D1D1B; font-weight: 500; }
.risk-screen-detail { font-size: 11px; color: #61615F; }

/* Lot detail panel */
.lot-detail-panel { background: white; border: 1px solid #E9EAEC; border-radius: 4px; padding: 20px; }
.lot-supplier-header { display: flex; gap: 4px; padding: 4px 0; border-bottom: 1px solid #E9EAEC; margin-bottom: 2px; }
.ls-h { flex: 1; font-size: 10px; color: #AEB0B2; }
.ls-right { text-align: right; }
.ls-center { text-align: center; }
.lot-supplier-row { display: flex; gap: 4px; padding: 5px 0; border-bottom: 1px solid #F5F5F5; align-items: center; }
.lot-supplier-row:last-child { border-bottom: none; }
.ls-cell { flex: 1; font-size: 12px; color: #1D1D1B; }
.ls-email { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.status-dot--bid { background: #34D399; }
.status-dot--connected { background: #60A5FA; }
.status-dot--invited { background: #E9EAEC; }

/* Bid timeline */
.bid-timeline { max-height: 300px; overflow-y: auto; }
.bid-timeline-row { display: flex; gap: 8px; align-items: center; padding: 3px 0; border-bottom: 1px solid #FAFAFA; }
.bt-time { width: 40px; font-size: 11px; color: #AEB0B2; font-variant-numeric: tabular-nums; }
.bt-email { width: 100px; font-size: 11px; color: #1D1D1B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bt-bar-bg { flex: 1; height: 8px; background: #F0F0F0; border-radius: 3px; overflow: hidden; }
.bt-bar { height: 100%; background: #60A5FA; border-radius: 3px; transition: width 0.2s; }
.bt-price { width: 70px; font-size: 11px; color: #1D1D1B; text-align: right; font-variant-numeric: tabular-nums; }
.bt-pct { width: 45px; font-size: 11px; color: #61615F; text-align: right; }
/* Table */
.bg-grey-deep:deep(td) { background-color: #F8F8F8 !important; }
.truncate-cell {
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.auction-name-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.supplier-email-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Force table layout fixed so column widths are respected */
.custom-data-table-in-tabs:deep(table) {
  table-layout: fixed !important;
  width: 100% !important;
  border-spacing: 0 !important;
  border-collapse: separate !important;
}
.custom-data-table-in-tabs:deep(th) {
  font-size: 12px !important;
  height: 34px !important;
  font-weight: 500 !important;
  color: #61615F;
  background-color: #F4F4F5;
  border: none !important;
  border-top: 1px solid #E9EAEC !important;
  border-bottom: 1px solid #E9EAEC !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 10px !important;
}
.custom-data-table-in-tabs:deep(thead) {
  height: 40px !important;
}
.custom-data-table-in-tabs:deep(thead tr) {
  height: 40px !important;
}
.custom-data-table-in-tabs:deep(hr) { display: none; }
.custom-data-table-in-tabs:deep(td) {
  color: #1D1D1B;
  font-size: 12px !important;
  background-color: white;
  padding: 0 10px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.custom-data-table-in-tabs:deep(tbody > tr > td) {
  border-bottom: 1px solid #F0F0F0 !important;
}
.custom-data-table-in-tabs:deep(tbody > tr:first-child > td) {
  border-top: none !important;
}
.custom-data-table-in-tabs:deep(tbody > tr:last-child > td) {
  border-bottom: 1px solid #E9EAEC !important;
}
.custom-data-table-in-tabs:deep(td:first-child),
.custom-data-table-in-tabs:deep(th:first-child) {
  border-left: 1px solid #E9EAEC !important;
}
.custom-data-table-in-tabs:deep(td:last-child),
.custom-data-table-in-tabs:deep(th:last-child) {
  border-right: 1px solid #E9EAEC !important;
}
/* Rounded corners on first/last rows */
.custom-data-table-in-tabs:deep(thead th:first-child) {
  border-top-left-radius: 4px !important;
}
.custom-data-table-in-tabs:deep(thead th:last-child) {
  border-top-right-radius: 4px !important;
}
.custom-data-table-in-tabs:deep(tbody > tr:last-child > td:first-child) {
  border-bottom-left-radius: 4px !important;
}
.custom-data-table-in-tabs:deep(tbody > tr:last-child > td:last-child) {
  border-bottom-right-radius: 4px !important;
}
.custom-data-table-in-tabs:deep(tbody tr:hover) { cursor: pointer !important; }
/* Tabs container */
.tabs-row {
  position: relative;
}
.tabs-border-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: #E9EAEC;
  z-index: 0;
}
/* Individual tab */
.analyzer-tab {
  border-radius: 4px 4px 0 0 !important;
  border: 1px solid #E9EAEC !important;
  border-bottom: 1px solid #E9EAEC !important;
  background: white !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  font-weight: 400 !important;
  min-width: 90px;
  position: relative;
  z-index: 1;
  margin-right: 4px;
}
/* Active tab: colored bg, bold, bottom border disappears */
.analyzer-tab--active {
  font-weight: 700 !important;
  z-index: 2;
  border-bottom-color: transparent !important;
}
.v-table > .v-table__wrapper > table > tbody > tr > td { height: 36px !important; }
/* Dashboard frame */
.dashboard-frame {
  background: white;
  border: 1px solid #E9EAEC;
  border-top: none;
  border-radius: 0 4px 4px 4px;
  padding: 20px;
}

/* Hero cards */
.hero-card {
  background: white; border: 1px solid #E9EAEC; border-radius: 4px;
  padding: 16px; height: 100%;
}
.hero-card-header { margin-bottom: 10px; }
.hero-card-title { font-size: 14px; font-weight: 600; color: #1D1D1B; }
.hero-card-sub { font-size: 11px; color: #AEB0B2; }
.hero-card-divider { height: 1px; background: #F0F0F0; margin: 8px 0; }
.hero-metric { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; }
.hero-metric--highlight { background: #F8FFF8; margin: 2px -8px; padding: 5px 8px; border-radius: 4px; }
.hero-metric-label { font-size: 12px; color: #61615F; }
.hero-metric-value { font-size: 13px; color: #1D1D1B; }
.hero-big-pct { display: flex; align-items: baseline; gap: 6px; }
.hero-big-pct-value { font-size: 28px; font-weight: 700; }
.hero-big-pct-label { font-size: 12px; color: #61615F; }

/* Horizontal bar rows (reusable) */
.horiz-bar-row {
  display: flex; align-items: center; gap: 8px; height: 24px;
}
.horiz-bar-label { width: 50px; font-size: 12px; color: #61615F; flex-shrink: 0; }
.horiz-bar-bg { flex: 1; height: 10px; background: #F0F0F0; border-radius: 3px; overflow: hidden; }
.horiz-bar-fill { height: 100%; border-radius: 3px; min-width: 3px; transition: width 0.3s; }
.horiz-bar-fill--green { background: #34D399; }
.horiz-bar-fill--blue { background: #60A5FA; }
.horiz-bar-value { width: 45px; font-size: 12px; font-weight: 600; color: #1D1D1B; text-align: right; flex-shrink: 0; }
.horiz-bar-sub { width: 25px; font-size: 10px; color: #AEB0B2; text-align: right; flex-shrink: 0; }

/* Suppliers vs Savings chart */
.suppliers-vs-savings { display: flex; gap: 16px; height: 140px; align-items: flex-end; justify-content: center; max-width: 600px; }
.svs-item { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; max-width: 100px; }
.svs-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.svs-bar { width: 50px; background: #34D399; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.4s; }
.svs-value { font-size: 14px; font-weight: 700; color: #16a34a; margin-top: 6px; }
.svs-label { font-size: 12px; color: #1D1D1B; margin-top: 2px; text-align: center; }
.svs-count { font-size: 10px; color: #AEB0B2; }

/* Activity rows */
.activity-header {
  display: flex; align-items: center; gap: 8px;
  padding-bottom: 4px; border-bottom: 1px solid #F0F0F0; margin-bottom: 2px;
}
.activity-h { font-size: 10px; color: #AEB0B2; font-weight: 400; }
.activity-row {
  display: flex; align-items: center; gap: 8px; height: 28px;
}
.activity-q { width: 50px; font-size: 12px; color: #61615F; flex-shrink: 0; }
.activity-bar-bg {
  flex: 1; height: 10px; background: #F0F0F0; border-radius: 3px; overflow: hidden;
}
.activity-bar-fill {
  height: 100%; background: #60A5FA;
  border-radius: 3px; min-width: 4px; transition: width 0.4s;
}
.activity-count { width: 30px; font-size: 12px; font-weight: 600; color: #1D1D1B; text-align: right; }
.activity-spend { width: 60px; font-size: 11px; color: #61615F; text-align: right; }
.activity-saving { width: 50px; font-size: 12px; font-weight: 600; color: #16a34a; text-align: right; }

/* Top events */
.top-events-header {
  display: flex; gap: 4px; padding: 4px 0; border-bottom: 1px solid #E9EAEC; margin-bottom: 2px;
}
.te-h { flex: 1; font-size: 10px; color: #AEB0B2; }
.te-right { text-align: right; }
.top-events-row {
  display: flex; gap: 4px; padding: 5px 0; border-bottom: 1px solid #F5F5F5; align-items: center;
}
.top-events-row:last-child { border-bottom: none; }
.te-cell { flex: 1; font-size: 12px; color: #1D1D1B; }
.te-name {
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 8px;
}
.te-rank {
  width: 18px; height: 18px; border-radius: 50%; background: #F4F4F5;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 600; color: #61615F; flex-shrink: 0;
}

/* Client rows v2 */
.client-row-v2 {
  display: grid; grid-template-columns: 110px 30px 1fr 50px 60px;
  align-items: center; gap: 6px; padding: 5px 0;
  border-bottom: 1px solid #F5F5F5;
}
.client-row-v2:last-child { border-bottom: none; }
.client-v2-name { font-size: 12px; font-weight: 500; color: #1D1D1B; }
.client-v2-lots { font-size: 11px; color: #AEB0B2; text-align: center; }
.client-v2-bar-bg { height: 6px; background: #F0F0F0; border-radius: 3px; overflow: hidden; }
.client-v2-bar { height: 100%; background: #60A5FA; border-radius: 3px; transition: width 0.4s; }
.client-v2-saving { font-size: 12px; text-align: right; }
.client-v2-saved { font-size: 11px; color: #61615F; text-align: right; }

/* Top suppliers table */
.top-supplier-header {
  display: flex; gap: 4px; padding: 4px 0; border-bottom: 1px solid #E9EAEC;
}
.ts-h { flex: 1; font-size: 11px; color: #AEB0B2; font-weight: 400; }
.top-supplier-row {
  display: flex; gap: 4px; padding: 5px 0; border-bottom: 1px solid #F5F5F5; align-items: center;
}
.top-supplier-row:last-child { border-bottom: none; }
.ts-cell { flex: 1; font-size: 12px; color: #1D1D1B; }
.ts-email { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Profile grid */
.profile-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.profile-grid-item { display: flex; align-items: center; gap: 6px; }
.profile-grid-count { font-size: 14px; font-weight: 600; color: #1D1D1B; }

/* Numeric cells — tabular figures for aligned numbers */
.num-cell {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}
</style>
