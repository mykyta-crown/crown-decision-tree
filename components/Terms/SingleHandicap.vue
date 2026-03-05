<template>
  <v-sheet class="custom-border pt-4 w-100">
    <div class="supplier-container custom-scrollbar">
      <div class="supplier-row">
        <div
          v-for="(supplier, index) in handicapsBySuppliers"
          :key="supplier.id"
          class="supplier-column"
        >
          <div class="pb-4">
            <div class="text-body-1 font-weight-bold mb-4 text-center">
              {{ supplier.identifier }}
            </div>

            <v-table density="compact">
              <thead class="text-grey">
                <tr>
                  <th class="name-field">Option</th>
                  <th class="text-right handicap-field">Handicap</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="handicap in supplier.handicaps" :key="handicap.id">
                  <td>
                    <span class="name-field">{{ handicap.option_name }}</span>
                  </td>
                  <td class="text-right">
                    <span class="handicap-field">{{ formatNumber(handicap.amount) }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
          <v-divider
            v-if="index !== handicapsBySuppliers.length - 1"
            color="grey-lighten-2"
            class="supplier-divider"
            vertical
          />
        </div>
      </div>
    </div>
  </v-sheet>
</template>

<script setup>
const props = defineProps(['suppliers', 'handicaps'])

const handicapsBySuppliers = computed(() => {
  return props.suppliers.map((supplier) => {
    const supplierHandicaps = props.handicaps
      .filter((handicap) => {
        return handicap.seller_email === supplier.seller_email
      })
      .sort((a, b) => a.amount - b.amount)

    return {
      ...supplier,
      handicaps: supplierHandicaps
    }
  })
})
</script>

<style scoped>
.custom-border-radius {
  border-radius: 0 8px 8px 8px !important;
}

.handicap-field {
  max-width: 100px;
}

.name-field {
  min-width: 180px;
  max-width: 180px;
}

.supplier-container {
  overflow-x: auto;
  width: 100%;
}

.supplier-row {
  display: flex;
  min-width: min-content;
}

.supplier-column {
  flex: 0 0 350px;
  position: relative;
  padding: 0 16px;
}

.supplier-divider {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
}

table > tbody > tr > td,
table > thead > tr > th {
  border-bottom: none !important;
}

::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  border: 7px solid white;
  background: #c5c7c9;
  height: 50px;
}

::-webkit-scrollbar-thumb {
  background-color: #c5c7c9;
  border: 6px solid transparent;
  border-radius: 9px;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background: #7e8082;
  border: 5px solid transparent;
  border-radius: 9px;
  background-clip: content-box;
}
</style>
