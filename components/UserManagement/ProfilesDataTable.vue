<template>
  <v-data-table
    id="table"
    :headers="headers"
    :items="items"
    :hover="true"
    class="custom-data-table-in-tabs"
    :hide-default-footer="items.length <= 10"
  >
    <template #item.is_active="{ item }">
      <div class="d-flex justify-center align-center">
        <v-chip
          class="chip-style text-body-2"
          :color="item.is_active ? 'green-light-3' : 'grey-ligthen-2'"
          label
          density="compact"
          variant="flat"
        >
          <span :class="item.is_active ? 'text-success-status' : 'text-primary'">
            {{ item.is_active ? t('status.active') : t('status.inactive') }}
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
            :title="t('userManagement.profilesDataTable.menuItems.assign')"
            active-class="active-icon"
            @click="handleAssign(item)"
          >
            <template #prepend>
              <v-img src="@/assets/icons/menu_icons/Assign.svg" width="20" height="20" />
            </template>
          </v-list-item>
          <v-list-item
            :title="
              item.is_active
                ? t('userManagement.profilesDataTable.menuItems.deactivate')
                : t('userManagement.profilesDataTable.menuItems.activate')
            "
            active-class="active-icon"
            @click="handleToggleStatus(item)"
          >
            <template #prepend>
              <v-img
                v-if="item.is_active"
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
          <v-list-item
            :title="t('userManagement.profilesDataTable.menuItems.delete')"
            active-class="active-icon"
            @click="handleDelete(item)"
          >
            <template #prepend>
              <v-img src="@/assets/icons/menu_icons/Bin.svg" width="20" height="20" />
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-data-table>

  <ProfileEditDialog v-model="showEditDialog" :profile-id="selectedProfileId" />
  <ProfileAssignDialog v-model="showAssignDialog" :profile-id="selectedProfileId" />
  <ProfileDeleteDialog v-model="showDeleteDialog" :profile-id="selectedProfileId" />
</template>

<script setup>
import ProfileEditDialog from './ProfileEditDialog.vue'
import ProfileAssignDialog from './ProfileAssignDialog.vue'
import ProfileDeleteDialog from './ProfileDeleteDialog.vue'

const props = defineProps({
  profiles: {
    type: Array,
    required: true
  }
})

// Use translations
const { t } = useTranslations()

const supabase = useSupabaseClient()

const showEditDialog = ref(false)
const showAssignDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedProfileId = ref(null)

const headers = computed(() => [
  {
    title: t('userManagement.profilesDataTable.headers.name'),
    key: 'name'
  },
  {
    title: t('forms.fields.companyName'),
    key: 'company.name'
  },
  {
    title: t('userManagement.profilesDataTable.headers.email'),
    key: 'email'
  },
  {
    title: t('userManagement.profilesDataTable.headers.phone'),
    key: 'phone'
  },
  {
    title: t('userManagement.profilesDataTable.headers.position'),
    key: 'position'
  },
  {
    title: t('userManagement.profilesDataTable.headers.status'),
    key: 'is_active',
    align: 'center',
    sortable: false
  },
  {
    title: t('forms.fields.actions'),
    key: 'actions',
    align: 'end'
  }
])

const items = computed(() => {
  return props.profiles.map((profile) => {
    return {
      ...profile,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`,
      company: profile.companies
    }
  })
})

function handleEdit(profile) {
  selectedProfileId.value = profile?.id
  showEditDialog.value = true
}

function handleAssign(profile) {
  selectedProfileId.value = profile?.id
  showAssignDialog.value = true
}

async function handleToggleStatus(item) {
  await supabase
    .from('profiles')
    .update({
      is_active: !item.is_active
    })
    .eq('id', item.id)
}

function handleDelete(item) {
  selectedProfileId.value = item?.id
  showDeleteDialog.value = true
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
