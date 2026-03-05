<template>
  <v-expansion-panel bg-color="transparent" :class="isSelected ? '' : 'border-b-thin'">
    <v-expansion-panel-title class="px-2" hide-actions>
      <TermsStepTitle v-model="stepDone" :is-selected="props.isSelected" :builder="true">
        <template #numero> 2 </template>
        <template #title>
          <div class="d-flex align-center justify-space-between">
            <div>{{ t('suppliers.title') }}</div>
            <div v-if="isSelected" class="d-flex align-center">
              <v-autocomplete
                width="100"
                min-width="400"
                max-width="400"
                rounded="lg"
                density="compact"
                base-color="grey"
                class="text-grey"
                :placeholder="t('suppliers.search.placeholder')"
                variant="outlined"
                hide-details
                item-title="email"
                item-value="email"
                :menu-icon="null"
                :items="sortedExistingSuppliers"
                @click.stop
                @update:model-value="selectSupplier"
              >
                <template #selection />
                <template #prepend-inner>
                  <v-img src="@/assets/icons/basic/Search.svg" width="20" height="20" />
                </template>
                <template #append-inner>
                  <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
                </template>
              </v-autocomplete>
              <div>
                <v-btn
                  color="primary"
                  class="text-primary text-subtitle-1 font-weight-bold mx-4 px-8"
                  variant="outlined"
                  rounded="lg"
                  height="40"
                  @click.stop="openDialog(defaultItem, -1)"
                >
                  {{ t('suppliers.addNewSupplier') }}
                </v-btn>
              </div>
            </div>
          </div>
        </template>
      </TermsStepTitle>
    </v-expansion-panel-title>
    <v-expansion-panel-text class="my-4">
      <v-sheet>
        <v-row>
          <v-col cols="12" class="py-0">
            <v-data-table
              :no-data-text="t('suppliers.table.noData')"
              :items-per-page="-1"
              :items="suppliers"
              :headers="headers"
              class="datatable"
            >
              <template #bottom />
              <template #item="{ item, index }">
                <tr v-if="item.isNew">
                  <td colspan="1">-</td>
                  <td>
                    <v-tooltip location="top start" content-class="bg-white text-body-2 border">
                      <template #activator="{ props }">
                        <span v-bind="props" class="truncated-text" :title="item.phone">
                          {{ item.phone }}
                        </span>
                      </template>
                      <template #default>
                        {{ item.phone }}
                      </template>
                    </v-tooltip>
                  </td>
                  <td>
                    <v-tooltip location="top start" content-class="bg-white text-body-2 border">
                      <template #activator="{ props }">
                        <span v-bind="props" class="truncated-text" :title="item.email">
                          {{ item.email }}
                        </span>
                      </template>
                      <template #default>
                        {{ item.email }}
                      </template>
                    </v-tooltip>
                  </td>
                  <td colspan="4" class="text-center">
                    {{ t('suppliers.table.willReceiveInvitation') }}
                  </td>
                  <td class="">
                    <v-menu>
                      <template #activator="{ props }">
                        <v-btn v-bind="props" variant="plain" icon height="20" width="20">
                          <v-img
                            src="@/assets/icons/basic/Kebab_Vertical.svg"
                            width="20"
                            height="20"
                          />
                        </v-btn>
                      </template>
                      <v-list class="py-0">
                        <v-list-item @mouseover="isOver = 1" @click="openDialog(item, index)">
                          <v-list-item-title
                            class="d-flex align-center ga-2"
                            :class="isOver === 1 ? 'text-primary' : 'text-grey'"
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 21 21"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10.0811 16.7151L16.7476 16.6827"
                                :stroke="isOver === 1 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M13.4387 3.92231C13.6145 3.74484 13.8235 3.60372 14.0537 3.50702C14.284 3.41032 14.5311 3.35992 14.7809 3.35871C15.0306 3.35749 15.2782 3.40548 15.5094 3.49994C15.7406 3.5944 15.951 3.73347 16.1284 3.90922C16.3059 4.08497 16.447 4.29396 16.5437 4.52424C16.6404 4.75453 16.6908 5.00161 16.692 5.25137C16.6933 5.50113 16.6453 5.74869 16.5508 5.9799C16.4563 6.21112 16.3173 6.42147 16.1415 6.59893L7.1079 15.7209L3.41446 16.7475L4.40511 13.0442L13.4387 3.92231Z"
                                :stroke="isOver === 1 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                            {{ t('suppliers.actions.edit') }}
                          </v-list-item-title>
                        </v-list-item>
                        <v-list-item @mouseover="isOver = 2" @click="deleteItem(item)">
                          <v-list-item-title
                            :class="isOver === 2 ? 'text-primary' : 'text-grey'"
                            class="d-flex align-center ga-2"
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 21 21"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.14288 6.33333V4.5C7.14288 4.10218 7.29339 3.72064 7.5613 3.43934C7.82921 3.15804 8.19257 3 8.57145 3H11.4286C11.8075 3 12.1708 3.15804 12.4387 3.43934C12.7067 3.72064 12.8572 4.10218 12.8572 4.5V6.33333M15.8334 6.33333L15 16.5C15 16.8978 14.8495 17.2794 14.5816 17.5607C14.3137 17.842 13.9503 18 13.5714 18H6.42859C6.04971 18 5.68635 17.842 5.41844 17.5607C5.15053 17.2794 5.00002 16.8978 5.00002 16.5L4.16669 6.33333H15.8334Z"
                                :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M3.33331 6.3335H4.81479H16.6666"
                                :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M8.33331 9.6665V13.8332"
                                :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M11.6667 9.6665V13.8332"
                                :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                            {{ t('suppliers.actions.delete') }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </td>
                </tr>
                <tr v-else>
                  <td>
                    <v-tooltip location="top start" content-class="bg-white text-body-2 border">
                      <template #activator="{ props }">
                        <span
                          v-bind="props"
                          class="truncated-text"
                          :title="item.name ?? t('suppliers.table.notSpecified')"
                        >
                          {{ item.name ?? t('suppliers.table.notSpecified') }}
                        </span>
                      </template>
                      <template #default>
                        {{ item.name ?? t('suppliers.table.notSpecified') }}
                      </template>
                    </v-tooltip>
                  </td>
                  <td>
                    <v-tooltip location="top start" content-class="bg-white text-body-2 border">
                      <template #activator="{ props }">
                        <span v-bind="props" class="truncated-text" :title="item.company ?? '-'">
                          {{ item.company ?? '-' }}
                        </span>
                      </template>
                      <template #default>
                        {{ item.company ?? '-' }}
                      </template>
                    </v-tooltip>
                  </td>
                  <td>
                    <v-tooltip location="top start" content-class="bg-white text-body-2 border">
                      <template #activator="{ props }">
                        <span v-bind="props" class="truncated-text" :title="item.email">
                          {{ item.email }}
                        </span>
                      </template>
                      <template #default>
                        {{ item.email }}
                      </template>
                    </v-tooltip>
                  </td>
                  <td>
                    <v-tooltip location="top start" content-class="bg-white text-body-2 border">
                      <template #activator="{ props }">
                        <span v-bind="props" class="truncated-text" :title="item.phone">
                          {{ item.phone }}
                        </span>
                      </template>
                      <template #default>
                        {{ item.phone }}
                      </template>
                    </v-tooltip>
                  </td>
                  <td>
                    <v-tooltip location="top start" content-class="bg-white text-body-2 border">
                      <template #activator="{ props }">
                        <span v-bind="props" class="truncated-text" :title="item.country">
                          {{ item.country }}
                        </span>
                      </template>
                      <template #default>
                        {{ item.country }}
                      </template>
                    </v-tooltip>
                  </td>
                  <td>
                    <v-tooltip location="top start" content-class="bg-white text-body-2 border">
                      <template #activator="{ props }">
                        <span v-bind="props" class="truncated-text" :title="item.address">
                          {{ item.address }}
                        </span>
                      </template>
                      <template #default>
                        {{ item.address }}
                      </template>
                    </v-tooltip>
                  </td>
                  <td>
                    <v-tooltip location="top start" content-class="bg-white text-body-2 border">
                      <template #activator="{ props }">
                        <span v-bind="props" class="truncated-text" :title="item.position">
                          {{ item.position }}
                        </span>
                      </template>
                      <template #default>
                        {{ item.position }}
                      </template>
                    </v-tooltip>
                  </td>
                  <!-- <td>{{ item.id }}</td> -->
                  <td>
                    <v-menu>
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon height="20" width="20" variant="plain">
                          <v-img
                            src="@/assets/icons/basic/Kebab_Vertical.svg"
                            width="20"
                            height="20"
                          />
                        </v-btn>
                      </template>
                      <v-list class="py-0">
                        <v-list-item
                          disabled
                          @mouseover="isOver = 1"
                          @click="openDialog(item, index)"
                        >
                          <v-list-item-title
                            class="d-flex align-center ga-2"
                            :class="isOver === 1 ? 'text-primary' : 'text-grey'"
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 21 21"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10.0811 16.7151L16.7476 16.6827"
                                :stroke="isOver === 1 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M13.4387 3.92231C13.6145 3.74484 13.8235 3.60372 14.0537 3.50702C14.284 3.41032 14.5311 3.35992 14.7809 3.35871C15.0306 3.35749 15.2782 3.40548 15.5094 3.49994C15.7406 3.5944 15.951 3.73347 16.1284 3.90922C16.3059 4.08497 16.447 4.29396 16.5437 4.52424C16.6404 4.75453 16.6908 5.00161 16.692 5.25137C16.6933 5.50113 16.6453 5.74869 16.5508 5.9799C16.4563 6.21112 16.3173 6.42147 16.1415 6.59893L7.1079 15.7209L3.41446 16.7475L4.40511 13.0442L13.4387 3.92231Z"
                                :stroke="isOver === 1 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                            {{ t('suppliers.actions.edit') }}
                          </v-list-item-title>
                        </v-list-item>
                        <v-list-item @mouseover="isOver = 2" @click="deleteItem(item)">
                          <v-list-item-title
                            :class="isOver === 2 ? 'text-primary' : 'text-grey'"
                            class="d-flex align-center ga-2"
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 21 21"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.14288 6.33333V4.5C7.14288 4.10218 7.29339 3.72064 7.5613 3.43934C7.82921 3.15804 8.19257 3 8.57145 3H11.4286C11.8075 3 12.1708 3.15804 12.4387 3.43934C12.7067 3.72064 12.8572 4.10218 12.8572 4.5V6.33333M15.8334 6.33333L15 16.5C15 16.8978 14.8495 17.2794 14.5816 17.5607C14.3137 17.842 13.9503 18 13.5714 18H6.42859C6.04971 18 5.68635 17.842 5.41844 17.5607C5.15053 17.2794 5.00002 16.8978 5.00002 16.5L4.16669 6.33333H15.8334Z"
                                :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M3.33331 6.3335H4.81479H16.6666"
                                :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M8.33331 9.6665V13.8332"
                                :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M11.6667 9.6665V13.8332"
                                :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                            {{ t('suppliers.actions.delete') }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-col>
        </v-row>

        <v-dialog v-model="dialog" max-width="617px">
          <v-card elevation="0">
            <v-card-title class="px-6 pt-2">
              <div class="d-flex align-center justify-space-between text-h6 text-grey-ligthen-4">
                <div>
                  {{
                    editedIndex === -1 ? t('suppliers.dialog.invite') : t('suppliers.dialog.modify')
                  }}
                </div>
                <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false">
                  <v-img src="@/assets/icons/basic/Close.svg" width="24" height="24" />
                </v-btn>
              </div>
              <v-divider class="w-100" color="grey-lighten-4" />
            </v-card-title>

            <div class="custom-side-padding">
              <v-card-text class="px-2 py-0">
                <v-form v-model="isValidSupplier">
                  <v-container fluid>
                    <v-row justify="center">
                      <v-col cols="12" class="d-flex flex-column ga-5 px-0">
                        <div>
                          <div class="mb-2 text-body-2">Email*</div>
                          <v-text-field
                            v-model="editedItem.email"
                            variant="outlined"
                            rounded="lg"
                            :placeholder="t('suppliers.dialog.email.placeholder')"
                            :rules="[emailRule]"
                            hide-details
                          >
                            <template #append-inner>
                              <v-img src="@/assets/icons/basic/Mail.svg" width="20" height="20" />
                            </template>
                          </v-text-field>
                        </div>
                        <div>
                          <div class="mb-2 text-body-2">Phone*</div>
                          <v-text-field
                            v-model="editedItem.phone"
                            variant="outlined"
                            rounded="lg"
                            :placeholder="t('suppliers.dialog.phone.placeholder')"
                            hide-details
                          >
                            <template #append-inner>
                              <v-img src="@/assets/icons/basic/Phone.svg" width="20" height="20" />
                            </template>
                          </v-text-field>
                        </div>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-form>
              </v-card-text>

              <v-card-actions class="pt-0">
                <v-container class="d-flex justify-center">
                  <v-row>
                    <v-col cols="6" class="pl-0">
                      <v-btn-secondary
                        :text="t('suppliers.dialog.actions.cancel')"
                        block
                        color="primary"
                        variant="outlined"
                        height="40"
                        @click="dialog = false"
                      />
                    </v-col>
                    <v-col cols="6" class="pr-0">
                      <v-btn-primary
                        :disabled="!isValidSupplier"
                        width="50"
                        block
                        :text="
                          editedIndex === -1
                            ? t('suppliers.dialog.actions.invite')
                            : t('suppliers.dialog.actions.modify')
                        "
                        height="40"
                        @click="save"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-actions>
            </div>
          </v-card>
        </v-dialog>
      </v-sheet>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
import { z } from 'zod'
import { uniq } from 'lodash'
import { useRuntimeConfig } from 'nuxt/app'

const props = defineProps(['isSelected'])

// Use translations
const { t } = useTranslations()

const { contacts: existingSuppliers } = useContactList()
const config = useRuntimeConfig()

const model = defineModel()
const dialog = ref(false)
// const isNewSupplier = ref(false)

const sortedExistingSuppliers = computed(() => {
  if (config.public.vercelEnv !== 'production') {
    const suppliersList = existingSuppliers.value
      .filter((e) => e.email.includes('supplier+'))
      .sort((a, b) => a.email.localeCompare(b.email))
    const notSuppliersList = existingSuppliers.value.filter((e) => !e.email.includes('supplier+'))
    return [...suppliersList, ...notSuppliersList]
  } else {
    return uniq(existingSuppliers.value).sort((a, b) => a.email.localeCompare(b.email))
  }
})

const existingSuppliersItems = computed(() => {
  return existingSuppliers.value?.map((e) => ({
    phone: e.phone,
    email: e.email,
    company: e.companies?.name,
    address: e.companies?.address,
    country: e.companies?.country,
    name: e.last_name ? `${e.first_name} ${e.last_name}` : null,
    id: e.companies?.legal_id,
    position: e.position
  }))
})

const headers = computed(() => [
  { title: t('forms.fields.name'), value: 'name' },
  { title: t('forms.fields.companyName'), value: 'company' },
  { title: t('forms.fields.email'), value: 'email' },
  { title: t('forms.fields.phone'), value: 'phone' },
  { title: t('suppliers.headers.country'), value: 'country' },
  { title: t('suppliers.headers.address'), value: 'address' },
  { title: t('suppliers.headers.position'), value: 'position' }
  // { title: 'SIRET', value: 'id', align: 'start' },
  // { title: '', value: 'actions', sortable: false }
])
const suppliers = ref(model.value ?? [])
const stepDone = ref(!!suppliers.value.length)
const isValidSupplier = ref(false)

const editedIndex = ref(-1)
const editedItem = ref({
  phone: '',
  email: '',
  isNew: false
})

const defaultItem = ref({
  phone: '',
  email: '',
  isNew: true
})

function save() {
  if (editedIndex.value > -1) {
    Object.assign(suppliers.value[editedIndex.value], { ...editedItem.value, isNew: true })
  } else {
    suppliers.value.push(editedItem.value)
  }
  close()
}

function deleteItem(item) {
  suppliers.value = suppliers.value.filter((supplier) => supplier.email !== item.email)
}

function openDialog(item, index) {
  editedIndex.value = index
  editedItem.value = Object.assign({}, item)
  dialog.value = true
}

async function close() {
  dialog.value = false
  await nextTick()
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
}

watch(
  suppliers,
  (newVal) => {
    if (newVal) {
      if (newVal.length) {
        stepDone.value = true
      } else {
        stepDone.value = false
      }
      model.value = newVal
    } else {
      model.value = null
    }
  },
  { deep: true }
)

function selectSupplier(supplierEmail) {
  const supplier = existingSuppliersItems.value.find((s) => s.email === supplierEmail)

  if (supplier) {
    const isSelected = !!suppliers.value.find((s) => s.email === supplier.email)

    if (!isSelected) {
      suppliers.value.push({ ...supplier, isNew: false })
    }
  }
}

const schemaToRule = useZodSchema()

const emailRule = computed(() => {
  const emailSchema = z.string().email({ message: t('validation.invalidEmail') })
  return schemaToRule(emailSchema)
})

const isOver = ref(0)
</script>

<style scoped>
.v-table > .v-table__wrapper > table > tbody > tr > td {
  height: 44px !important;
}
.v-expansion-panel-text__wrapper {
  padding: 0 0 0 30px !important;
}

.datatable {
  background-color: rgb(var(--v-theme-background)) !important;
}
.datatable:deep(table > thead > tr > th) {
  font-size: 14px !important;
  font-weight: 400 !important;
  padding: 12px 12px !important;
  color: rgb(var(--v-theme-grey)) !important;
  border: none !important;
}
.datatable:deep(table > tbody > tr > td) {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  background-color: rgb(var(--v-theme-surface)) !important;
  padding: 12px 12px !important;
}

.datatable:deep(table > tbody > tr:first-child > td),
.datatable:deep(table > tbody > tr:first-child > th) {
  border-top: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.datatable:deep(table > tbody > tr > td:first-child) {
  border-left: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-radius: 4px 0 0 4px;
}
.datatable:deep(table > tbody > tr > td:last-child) {
  border-right: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-radius: 0 4px 4px 0;
  max-width: 50px;
  width: 50px;
}
.custom-side-padding {
  padding-inline: 92.5px !important;
  padding-bottom: 38px !important;
}

.truncated-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  max-width: 200px;
}
</style>
