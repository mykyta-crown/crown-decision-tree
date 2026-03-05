<template>
  <v-tabs v-model="tabs" hide-slider class="w-100">
    <v-tab
      v-for="(handicapGroup, name, i) in handicapGroups"
      :key="i"
      :value="i"
      class="text-primary rounded-tab d-flex align-center justify-space-between"
      rounded="0"
      :class="{
        'bg-orange-light': i % 4 === 0,
        'bg-blue': i % 4 === 1,
        'bg-green-light': i % 4 === 2,
        'bg-purple': i % 4 === 3,
        'focused-tab font-weight-bold': i === tabs
      }"
    >
      <span class="mr-4">
        {{ name }}
      </span>
      <v-icon
        v-if="Object.keys(handicapGroups).length > 1"
        icon="mdi-close"
        :color="hoveredDelete === i ? 'grey' : ''"
        :class="hoveredDelete === i ? 'bg-grey-lighten-3 rounded-circle' : ''"
        @click.stop="deleteHandicapGroup(name)"
        @mouseover="ishovered(i)"
        @mouseleave="hoveredDelete = null"
      />
    </v-tab>
    <v-btn
      class="text-primary text-subtitle-1 ml-1"
      color="primary"
      size="large"
      variant="text"
      prepend-icon="mdi-plus-circle-outline"
      @click.stop="addHandicapGroup"
    >
      Add Value
    </v-btn>
  </v-tabs>
  <v-tabs-window v-model="tabs" class="w-100">
    <v-tabs-window-item v-for="(handicapGroup, name, i) in handicapGroups" :key="i" :value="i">
      <BuilderLotSingleHandicapForm
        :handicap-group="handicapGroup"
        :group-name="name"
        :suppliers="props.suppliers"
        @update:group-name="updateGroupName"
        @add-handicap="addHandicap"
        @delete-handicap="deleteHandicap"
      />
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<script setup>
import { groupBy } from 'lodash'

const props = defineProps(['suppliers'])
const handicaps = defineModel('handicaps')

// When suppliers are removed from the parent list, clean up handicaps
watchEffect(() => {
  if (!handicaps.value || !props.suppliers) return

  // Get the list of valid supplier emails
  const validEmails = new Set(props.suppliers.map((s) => s.email))

  // Filter out any handicaps for suppliers that are no longer in the parent list
  const filteredHandicaps = handicaps.value.filter((h) => validEmails.has(h.supplier))

  // Only update if there's a change to avoid infinite loops
  if (filteredHandicaps.length !== handicaps.value.length) {
    handicaps.value = filteredHandicaps
  }
})

const handicapGroups = computed(() => {
  return groupBy(handicaps.value, 'name')
})

if (handicaps.value.length === 0) {
  addHandicapGroup()
}

const tabs = ref(null)

function addHandicapGroup() {
  const nbGroups = Object.keys(handicapGroups.value).length

  let newGroupName = 'Dynamic Handicap 1'
  let groupNumber = 1

  while (handicapGroups.value[newGroupName]) {
    groupNumber += 1
    newGroupName = `Dynamic Handicap ${groupNumber}`
  }

  props.suppliers.forEach((supplier) => {
    handicaps.value.push({
      name: newGroupName,
      option: '',
      supplier: supplier.email,
      amount: 0
    })
  })

  setTimeout(() => {
    tabs.value = nbGroups
  }, 100)
}

function deleteHandicapGroup(groupName) {
  handicaps.value = handicaps.value.filter((handicap) => handicap.name !== groupName)

  if (handicaps.value.length === 0) {
    addHandicapGroup()
  }

  const nbGroups = Object.keys(handicapGroups.value).length

  if (tabs.value === nbGroups) {
    tabs.value = nbGroups - 1
  } else {
    tabs.value = nbGroups
  }
}

function updateGroupName(newVal, oldVal) {
  handicaps.value.forEach((handicap) => {
    if (handicap.name === oldVal) {
      handicap.name = newVal
    }
  })
}

function addHandicap(handicap) {
  handicaps.value.push(handicap)
}

function deleteHandicap(handicap) {
  const indexToDelete = handicaps.value.findIndex((h) => {
    return (
      h.name === handicap.name && h.amount === handicap.amount && h.supplier === handicap.supplier
    )
  })

  if (indexToDelete !== -1) {
    handicaps.value.splice(indexToDelete, 1)
  }
}

const hoveredDelete = ref(false)
const ishovered = () => {
  hoveredDelete.value = true
}
</script>
<style>
.v-expansion-panel-text__wrapper {
  padding: 0 0 0 30px !important;
}
.rounded-tab {
  border-radius: 10px 10px 0 0 !important;
}
.focused-tab {
  z-index: 10 !important;
  box-shadow: 0px 40px 15px 10px rgba(0, 0, 0, 0.2) !important;
  border-top: 1px solid #ffffff !important;
  font-weight: bold;
  transition: all 0.3s ease-in-out;
}
</style>
