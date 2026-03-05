<template>
  <v-data-table
    id="table"
    :headers="headers"
    :items="filteredCompanies"
    :hover="true"
    class="custom-data-table-in-tabs"
    :hide-default-footer="filteredCompanies.length <= 10"
  >
    <template #item.buyers="{ item }">
      <div class="d-flex justify-space-around align-center">
        <span class="semi-bold">{{ item.buyers }}</span>
        <v-btn
          :disabled="!item.buyers"
          size="x-small"
          icon
          variant="plain"
          class="bg-grey-lighten-3 border border-grey-lighten-2"
          :to="`/users?type=buyer&company=${item.id}`"
        >
          <img src="@/assets/icons/basic/Arrow.svg" height="24" width="24" />
        </v-btn>
      </div>
    </template>

    <template #item.superBuyers="{ item }">
      <div class="d-flex justify-space-around align-center">
        <span class="semi-bold">{{ item.superBuyers }}</span>
        <v-btn
          :disabled="!item.superBuyers"
          size="x-small"
          icon
          variant="plain"
          class="bg-grey-lighten-3 border border-grey-lighten-2"
          :to="`/users?type=super_buyer&company=${item.id}`"
        >
          <img src="@/assets/icons/basic/Arrow.svg" height="24" width="24" />
        </v-btn>
      </div>
    </template>

    <template #item.suppliers="{ item }">
      <div class="d-flex justify-space-around align-center">
        <span class="semi-bold">{{ item.suppliers }}</span>
        <v-btn
          :disabled="!item.suppliers"
          size="x-small"
          icon
          variant="plain"
          class="bg-grey-ligthen-3 border border-grey-lighten-2"
          :to="`/users?type=supplier&company=${item.id}`"
        >
          <img src="@/assets/icons/basic/Arrow.svg" height="24" width="24" />
        </v-btn>
      </div>
    </template>

    <template #item.isActive="{ item }">
      <div class="d-flex justify-center align-center">
        <v-chip
          class="chip-style text-body-2"
          :color="item.isActive ? 'green-light-3' : 'grey-ligthen-2'"
          label
          density="compact"
          variant="flat"
        >
          <span :class="item.isActive ? 'text-success-status' : 'text-primary'">
            {{ item.isActive ? t('status.active') : t('status.inactive') }}
          </span>
        </v-chip>
      </div>
    </template>
    <template #item.actions="{ item }">
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" color="grey-lighten-1" size="small">
            <v-img src="@/assets/icons/basic/Kebab_Vertical.svg" width="24" height="24" />
          </v-btn>
        </template>
        <v-list density="compact" class="py-0">
          <v-list-item
            :title="t('userManagement.profilesDataTable.menuItems.edit')"
            active-class="active-icon"
            @click="handleEdit(item)"
          >
            <template #prepend>
              <v-img src="@/assets/icons/basic/Edit_Line.svg" width="20" height="20" />
            </template>
          </v-list-item>
          <v-list-item
            :title="
              item.isActive
                ? t('userManagement.profilesDataTable.menuItems.deactivate')
                : t('userManagement.profilesDataTable.menuItems.activate')
            "
            active-class="active-icon"
            @click="handleToggleActive(item)"
          >
            <template #prepend>
              <v-img
                v-if="item.isActive"
                src="@/assets/icons/menu_icons/Deactivate.svg"
                width="20"
                height="20"
              />
              <v-img
                v-else
                src="@/assets/icons/activity-log/check-square-one.svg"
                width="20"
                height="20"
                style="filter: brightness(5)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-data-table>
</template>

<script setup>
const props = defineProps({
  search: {
    type: String,
    default: ''
  },
  companies: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['refetchData', 'openEditDialog'])

// Use translations
const { t } = useTranslations()

const headers = computed(() => [
  {
    title: t('userManagement.profilesDataTable.headers.companyName') || 'Name',
    key: 'name'
  },
  {
    title: t('userManagement.profilesDataTable.headers.country') || 'Country',
    key: 'country'
  },
  {
    title: t('userManagement.profilesDataTable.headers.phone') || 'Phone',
    key: 'phone'
  },
  {
    title: t('userManagement.profilesDataTable.headers.buyers') || 'Buyers',
    key: 'buyers'
  },
  {
    title: t('userManagement.profilesDataTable.headers.superBuyers') || 'Super Buyers',
    key: 'superBuyers'
  },
  {
    title: t('userManagement.profilesDataTable.headers.suppliers') || 'Suppliers',
    key: 'suppliers'
  },
  {
    title: t('userManagement.profilesDataTable.headers.status'),
    key: 'isActive',
    align: 'center',
    sortable: false
  },
  {
    // title: t('forms.fields.actions'),
    key: 'actions',
    align: 'end'
  }
])

// Convert prop to ref for better reactivity
const filteredCompanies = computed(() => {
  if (!props.search) {
    return props.companies
  }

  const search = props.search.toLowerCase()
  return props.companies.filter((c) => c.name.toLowerCase().includes(search))
})

function handleEdit(company) {
  emit('openEditDialog', company)
}

const supabase = useSupabaseClient()

async function handleToggleActive(company) {
  const newStatus = !company.isActive

  await supabase
    .from('profiles')
    .update({
      is_active: newStatus
    })
    .eq('company_id', company.id)

  emit('refetchData')
}
</script>

<style scoped>
.bg-grey-deep:deep(td) {
  background-color: rgb(var(--v-theme-grey-ligthen-3)) !important;
}
.bg-none {
  background-color: transparent;
}
.custom-data-table-in-tabs:deep(tr > td) {
  height: 44px !important;
  max-height: 44px !important;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.custom-data-table-in-tabs:deep(th) {
  font-size: 14px !important;
  font-weight: 400;
  color: rgb(var(--v-theme-grey));
  border: none !important;
  white-space: nowrap;
}

.custom-data-table-in-tabs:deep(tbody > tr:last-child > td) {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.round-icon {
  border-radius: 5px;
}

.custom-data-table-in-tabs:deep(th) {
  font-size: 14px !important;
  height: 37px !important;
  font-weight: 400 !important;
  color: rgb(var(--v-theme-grey));
  background-color: white;
  border-top: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  white-space: nowrap;
}

.custom-data-table-in-tabs:deep(hr) {
  display: none;
}

.custom-data-table-in-tabs:deep(td) {
  color: rgb(var(--v-theme-primary));
  font-size: 14px !important;
  background-color: white;
}

.custom-data-table-in-tabs:deep(tbody > tr:first-child > td) {
  border-top: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.custom-data-table-in-tabs:deep(td:first-child),
.custom-data-table-in-tabs:deep(th:first-child) {
  border-top-left-radius: 4px !important;
  border-bottom-left-radius: 4px !important;
  border-left: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.custom-data-table-in-tabs:deep(th:first-child) {
  border-top-left-radius: 0px !important;
}

.custom-data-table-in-tabs:deep(td:last-child),
.custom-data-table-in-tabs:deep(th:last-child) {
  border-top-right-radius: 4px !important;
  border-bottom-right-radius: 4px !important;
  border-right: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.custom-data-table-in-tabs:deep(.v-data-table-footer) {
  background-color: rgb(var(--v-theme-background));
  justify-content: center;
}

.active-icon:deep(.v-list-item__prepend) {
  filter: brightness(100);
}
:deep(.v-list-item__prepend) {
  width: 20px !important;
  margin-right: 5px !important;
  display: flex;
  flex-direction: column;
  align-items: start;
}
:deep(.v-list-item) {
  /* height: 27px!important; */
  color: rgb(var(--v-theme-grey)) !important;
}
:deep(.v-list-item--active) {
  background-color: rgb(var(--v-theme-primary-ligthen-1)) !important;
  color: white !important;
}
</style>
