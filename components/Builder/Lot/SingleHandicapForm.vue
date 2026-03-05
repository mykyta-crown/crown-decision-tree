<template>
  <v-container class="bg-white border rounded-lg mb-1 px-10 py-8">
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-0">
        <v-responsive :width="`${groupName.length > 4 ? groupName.length : 6}.5rem`">
          <v-text-field
            v-model="groupName"
            class="font-weight-bold textfield"
            :variant="!isSelected ? 'plain' : 'outlined'"
            :rules="[nameRule]"
            @click.stop="titleFocus = true"
            @focus.stop="titleFocus = true"
            @blur.stop="titleFocus = false"
            @keyup.prevent
          >
            <template #append-inner>
              <v-img src="@/assets/icons/basic/Edit_Line.svg" width="20" height="20" />
            </template>
          </v-text-field>
        </v-responsive>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="pr-0 pt-0">
        <div class="supplier-container">
          <div class="supplier-row">
            <div
              v-for="({ options, company }, supplierEmail) in optionsBySuppliers"
              :key="supplierEmail"
              class="supplier-column"
            >
              <div class="pb-4">
                <div class="text-subtitle-1 font-weight-semibold mb-4 text-center">
                  {{ company || supplierEmail }}
                </div>

                <div class="d-flex flex-column gap-2">
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th class="name-field text-grey-darken-4">Option</th>
                        <th class="handicap-field text-grey-darken-4">Handicap</th>
                        <th width="48" />
                      </tr>
                    </thead>
                    <!-- <tbody> -->
                    <TransitionGroup name="list" tag="tbody">
                      <tr v-for="(option, index) in options" :key="index">
                        <td>
                          <v-text-field
                            v-model="option.option"
                            density="compact"
                            hide-details
                            class="name-field"
                          />
                        </td>
                        <td>
                          <v-text-field
                            v-model="option.amount"
                            type="number"
                            density="compact"
                            hide-details
                            class="handicap-field"
                          />
                        </td>
                        <td>
                          <v-btn
                            icon
                            size="x-small"
                            color="grey"
                            variant="text"
                            @click="removeOption(option)"
                          >
                            <v-icon>mdi-close</v-icon>
                          </v-btn>
                        </td>
                      </tr>
                    </TransitionGroup>
                    <!-- </tbody> -->
                  </v-table>
                  <v-btn
                    color="green"
                    variant="text"
                    density="compact"
                    prepend-icon="mdi-plus-circle-outline"
                    @click="addOption(supplierEmail)"
                  />
                </div>
              </div>
              <!--
                <v-divider
                v-if="supplier.id !== suppliers.length"
                color="grey-lighten-2"
                class="supplier-divider"
                vertical
                />
              -->
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { z } from 'zod'

const props = defineProps(['suppliers', 'handicapGroup', 'groupName'])

const emit = defineEmits(['update:groupName', 'addHandicap', 'deleteHandicap'])

const groupName = computed({
  get: () => props.groupName,
  set: (newVal) => {
    emit('update:groupName', newVal, props.groupName)
  }
})

const schemaToRule = useZodSchema()
const nameRule = computed(() => {
  const nameSchema = z.string().min(1, { message: 'Required' })
  return schemaToRule(nameSchema)
})

const titleFocus = ref(false)
const isSelected = true

const optionsBySuppliers = computed(() => {
  const groups = {}

  props.suppliers.forEach((supplier) => {
    groups[supplier.email] = {
      options: props.handicapGroup.filter((handicap) => handicap.supplier === supplier.email),
      company: supplier.company
    }
  })

  return groups
})

const addOption = (email) => {
  emit('addHandicap', {
    name: props.groupName,
    option: '',
    supplier: email,
    amount: 0
  })
}

const removeOption = (option) => {
  emit('deleteHandicap', option)
}
</script>

<style scoped>
.handicap-field {
  width: 100%;
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
  flex: 0 0 400px;
  position: relative;
  padding: 0 8px;
}

.supplier-divider {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
}

:deep(.v-field__input) {
  font-size: 14px !important;
}

table > tbody > tr > td,
table > thead > tr > th {
  border-bottom: none !important;
  padding-inline: 8px !important;
  padding-bottom: 8px !important;
}

.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
}

/* Moved to main.css */
/* ::-webkit-scrollbar {
  width: 5px;
  } */
/* Track */
/* ::-webkit-scrollbar-track {
  border: 7px solid white;
  background: #C5C7C9;
  height:50px;
} */

/* Handle */
/* ::-webkit-scrollbar-thumb {
  background-color: #C5C7C9;
    border: 6px solid transparent;
    border-radius: 9px;
    background-clip: content-box;

  } */

/* Handle on hover */
/* ::-webkit-scrollbar-thumb:hover {
    background: #7e8082;
    border: 5px solid transparent;
    height:2px;
    border-radius: 9px;
    background-clip: content-box;
} */
</style>
