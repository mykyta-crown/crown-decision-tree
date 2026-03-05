<template>
  <v-btn
    color="primary-ligthen-1"
    variant="outlined"
    class="custom-border btn-text d-flex"
    block
    @click="isOpen = !isOpen"
    @blur="isOpen = false"
  >
    <span class="text-body-1 text-grey-lighten-1">
      {{ selectedCompany ? selectedCompany.name : t('common.allCompanies') }}
    </span>
    <v-spacer />

    <v-menu
      contained
      max-height="300"
      :location="'bottom'"
      location-strategy="connected"
      activator="parent"
    >
      <v-list class="bg-primary-ligthen-1 text-start py-0 my-0">
        <v-list-item
          v-for="(item, index) in companiesList"
          :key="index"
          :value="index"
          class="item-list px-2"
          @click="selectCompany(item)"
        >
          <v-list-item-title>
            {{ item.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <template #append>
      <v-img
        src="@/assets/icons/basic/Chevron_down.svg"
        width="20"
        height="20"
        style="filter: brightness(1.5)"
        :style="{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }"
      />
    </template>
  </v-btn>
</template>
<script setup>
const props = defineProps({
  companies: {
    type: Array,
    default: () => []
  }
})

const isOpen = ref(false)

const router = useRouter()
const route = useRoute()
const { t } = useTranslations()

const companiesList = computed(() => {
  return [{ name: t('common.allCompanies'), id: null }, ...props.companies]
})

const selectedCompany = ref(null)

watch(
  () => route.query.company,
  () => {
    selectedCompany.value = props.companies.find((c) => c?.id === route.query.company)
  },
  { immediate: true }
)

const selectCompany = (item) => {
  selectedCompany.value = item

  if (item.id) {
    router.push({ query: { company: item.id } })
  } else {
    const query = { ...router.currentRoute.value.query }
    delete query.company
    router.replace({ query })
  }
}
</script>
<style scoped>
.custom-border:deep() {
  border-color: rgb(var(--v-theme-primary-ligthen-1));
}
.item-list:hover {
  background-color: #4a4a48 !important;
  color: white !important;
}
.btn-text:deep(.v-btn__content) {
  width: 100%;
}
.btn-text:deep() {
  padding-left: 8px !important;
  padding-right: 8px !important;
}
</style>
