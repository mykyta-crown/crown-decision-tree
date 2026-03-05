<template>
  <v-card height="110px">
    <v-container class="fill-height py-0">
      <v-row>
        <v-col class="d-flex align-start">
          <div
            v-if="icon || customIcon"
            class="d-flex align-center justify-center rounded px-auto"
            :class="`bg-${iconColor}`"
            style="width: 35px; min-width: 35px; height: 35px"
          >
            <v-icon v-if="icon" :icon="icon" size="x-large" color="primary" />
            <slot v-else name="custom-icon" />
          </div>

          <div class="ml-4">
            <div class="d-flex flex-column ga-1">
              <span class="text-grey-darken-1">{{ label }}</span>
              <span class="text-h4 font-weight-bold" :class="supplierTextStyle">{{ number }}</span>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script setup>
defineProps(['icon', 'customIcon', 'iconColor', 'label', 'number', 'supplierTextStyle'])
</script>
