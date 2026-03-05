<template>
  <AuctionsInputsPublishDialog v-model="publishDialog" :auction="auction" />
  <AuctionsInputsArchiveDialog v-model="archiveDialog" :auction="auction" />
  <BuilderDuplicateAuctionDialog
    v-model="duplicateDialog"
    :loading="duplicateLoading"
    :disabled="duplicateLoading"
    @duplicate-choice="handleDuplicateChoice"
  />
  <v-menu v-if="profile.admin">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon size="24" variant="plain" rounded="50%">
        <v-img :src="MenuIcon" width="24" height="24" />
      </v-btn>
    </template>
    <v-list class="pa-0">
      <v-list-item
        v-if="auction.usage !== 'real'"
        :to="`/builder?auction_id=${auction.auction_id}`"
        @mouseover="isOver = 1"
      >
        <v-list-item-title
          :class="isOver === 1 ? 'text-primary' : 'text-grey'"
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
          {{ t('actions.edit') }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item v-if="!auction.published" @mouseover="isOver = 2" @click="publishDialog = true">
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
              d="M1.66669 13.8335C1.66669 11.8844 1.66669 10.9099 2.11374 10.1984C2.34686 9.82739 2.66058 9.51367 3.03159 9.28055C3.74308 8.8335 4.71761 8.8335 6.66669 8.8335H13.3334C15.2824 8.8335 16.257 8.8335 16.9684 9.28055C17.3395 9.51367 17.6532 9.82739 17.8863 10.1984C18.3334 10.9099 18.3334 11.8844 18.3334 13.8335C18.3334 15.7826 18.3334 16.7571 17.8863 17.4686C17.6532 17.8396 17.3395 18.1533 16.9684 18.3864C16.257 18.8335 15.2824 18.8335 13.3334 18.8335H6.66669C4.71761 18.8335 3.74308 18.8335 3.03159 18.3864C2.66058 18.1533 2.34686 17.8396 2.11374 17.4686C1.66669 16.7571 1.66669 15.7826 1.66669 13.8335Z"
              :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M16.6666 8.83333C16.6666 7.66656 16.6666 7.08317 16.4396 6.63752C16.2398 6.24552 15.9211 5.92681 15.5291 5.72707C15.0835 5.5 14.5001 5.5 13.3333 5.5H6.66665C5.49987 5.5 4.91648 5.5 4.47083 5.72707C4.07883 5.92681 3.76012 6.24552 3.56038 6.63752C3.33331 7.08317 3.33331 7.66656 3.33331 8.83333"
              :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15 5.50033C15 3.92898 15 3.1433 14.5118 2.65515C14.0237 2.16699 13.238 2.16699 11.6667 2.16699H8.33333C6.76198 2.16699 5.97631 2.16699 5.48816 2.65515C5 3.1433 5 3.92898 5 5.50033"
              :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12.5 12.167C12.5 13.0875 11.7538 13.8337 10.8333 13.8337H9.16667C8.24619 13.8337 7.5 13.0875 7.5 12.167"
              :stroke="isOver === 2 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
            />
          </svg>
          {{ t('actions.publish') }}
        </v-list-item-title>
      </v-list-item>
      <!--
        <v-list-item @mouseover="isOver = 3">
        <v-list-item-title :class="isOver === 3 ? 'text-primary' : 'text-grey'">
        <v-icon
        class="mr-2"
        icon="mdi-content-duplicate"
        />
        Duplicate
        </v-list-item-title>
        </v-list-item>
      -->
      <v-list-item @click="archiveDialog = true" @mouseover="isOver = 4">
        <v-list-item-title
          :class="isOver === 4 ? 'text-primary' : 'text-grey'"
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
              d="M1.66669 13.8335C1.66669 11.8844 1.66669 10.9099 2.11374 10.1984C2.34686 9.82739 2.66058 9.51367 3.03159 9.28055C3.74308 8.8335 4.71761 8.8335 6.66669 8.8335H13.3334C15.2824 8.8335 16.257 8.8335 16.9684 9.28055C17.3395 9.51367 17.6532 9.82739 17.8863 10.1984C18.3334 10.9099 18.3334 11.8844 18.3334 13.8335C18.3334 15.7826 18.3334 16.7571 17.8863 17.4686C17.6532 17.8396 17.3395 18.1533 16.9684 18.3864C16.257 18.8335 15.2824 18.8335 13.3334 18.8335H6.66669C4.71761 18.8335 3.74308 18.8335 3.03159 18.3864C2.66058 18.1533 2.34686 17.8396 2.11374 17.4686C1.66669 16.7571 1.66669 15.7826 1.66669 13.8335Z"
              :stroke="isOver === 4 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M16.6666 8.83333C16.6666 7.66656 16.6666 7.08317 16.4396 6.63752C16.2398 6.24552 15.9211 5.92681 15.5291 5.72707C15.0835 5.5 14.5001 5.5 13.3333 5.5H6.66665C5.49987 5.5 4.91648 5.5 4.47083 5.72707C4.07883 5.92681 3.76012 6.24552 3.56038 6.63752C3.33331 7.08317 3.33331 7.66656 3.33331 8.83333"
              :stroke="isOver === 4 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15 5.50033C15 3.92898 15 3.1433 14.5118 2.65515C14.0237 2.16699 13.238 2.16699 11.6667 2.16699H8.33333C6.76198 2.16699 5.97631 2.16699 5.48816 2.65515C5 3.1433 5 3.92898 5 5.50033"
              :stroke="isOver === 4 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12.5 12.167C12.5 13.0875 11.7538 13.8337 10.8333 13.8337H9.16667C8.24619 13.8337 7.5 13.0875 7.5 12.167"
              :stroke="isOver === 4 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
            />
          </svg>
          {{ t('actions.archive') }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        @click="duplicateDialog = true"
        @mouseover="isOver = 5"
        :disabled="duplicateLoading"
      >
        <v-list-item-title
          :class="isOver === 5 ? 'text-primary' : 'text-grey'"
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
              d="M17.3573 11.2175C17.5 10.873 17.5 10.4361 17.5 9.5625C17.5 8.68886 17.5 8.25204 17.3573 7.90747C17.167 7.44804 16.802 7.08303 16.3425 6.89273C15.998 6.75 15.5611 6.75 14.6875 6.75H9.25C8.1999 6.75 7.67485 6.75 7.27377 6.95436C6.92096 7.13413 6.63413 7.42096 6.45436 7.77377C6.25 8.17485 6.25 8.6999 6.25 9.75V15.1875C6.25 16.0611 6.25 16.498 6.39273 16.8425C6.58303 17.302 6.94804 17.667 7.40747 17.8573C7.75204 18 8.18886 18 9.0625 18C9.93614 18 10.373 18 10.7175 17.8573M17.3573 11.2175C17.167 11.677 16.802 12.042 16.3425 12.2323C15.998 12.375 15.5611 12.375 14.6875 12.375C13.8139 12.375 13.377 12.375 13.0325 12.5177C12.573 12.708 12.208 13.073 12.0177 13.5325C11.875 13.877 11.875 14.3139 11.875 15.1875C11.875 16.0611 11.875 16.498 11.7323 16.8425C11.542 17.302 11.177 17.667 10.7175 17.8573M17.3573 11.2175C16.447 14.3573 14.0211 16.8303 10.8994 17.8007L10.7175 17.8573M13.75 6.75L13.75 6C13.75 4.9499 13.75 4.42485 13.5456 4.02377C13.3659 3.67096 13.079 3.38413 12.7262 3.20436C12.3251 3 11.8001 3 10.75 3H5.5C4.4499 3 3.92485 3 3.52377 3.20436C3.17096 3.38413 2.88413 3.67096 2.70436 4.02377C2.5 4.42485 2.5 4.9499 2.5 6V11.25C2.5 12.3001 2.5 12.8251 2.70436 13.2262C2.88413 13.579 3.17096 13.8659 3.52377 14.0456C3.92485 14.25 4.45008 14.25 5.50055 14.25H6.25"
              :stroke="isOver === 5 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ t('actions.duplicate') }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="(auction.usage !== 'real' || 'training') && isHome"
        @click="handleDelete"
        @mouseover="isOver = 6"
      >
        <v-list-item-title
          :class="isOver === 6 ? 'text-primary' : 'text-grey'"
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
              :stroke="isOver === 6 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M3.33331 6.3335H4.81479H16.6666"
              :stroke="isOver === 6 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8.33331 9.6665V13.8332"
              :stroke="isOver === 6 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M11.6667 9.6665V13.8332"
              :stroke="isOver === 6 ? '#1D1D1B' : '#8E8E8E'"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ t('actions.delete') }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import MenuIcon from '~/assets/icons/basic/Kebab_Vertical.svg'

const { auction, isHome } = defineProps({
  auction: { type: Object, required: true },
  isHome: { type: Boolean, default: false }
})

const emit = defineEmits(['delete', 'cancel', 'duplicated'])

// Use translations
const { t } = useTranslations()

const router = useRouter()
const toast = useToast()

const redirectTocopy = () => {
  router.push(`/builder?auction_id=${auction.auction_id}&copy=true`)
}

const { profile } = useUser()

const publishDialog = ref(false)
const archiveDialog = ref(false)
const deleteBtn = ref(false)
const duplicateDialog = ref(false)
const duplicateLoading = ref(false)

const isOver = ref(null)

const handleDelete = () => {
  deleteBtn.value = true
  emit('delete', auction.id)
}

// Duplication logic avec dialog pour choisir le mode
const { prepareDuplication } = useDuplicateAuctionState()
const { duplicateAuction } = useAuctionDuplication()

const handleDuplicateChoice = async (choice) => {
  try {
    duplicateLoading.value = true

    if (choice === 'builder') {
      // Dupliquer vers le builder pour édition
      await prepareDuplication(auction.auction_id, router)
      duplicateDialog.value = false
    } else if (choice === 'training') {
      // Créer des formations directement
      const result = await duplicateAuction(auction.auction_id, 'training')
      duplicateDialog.value = false

      const count = result.auctionIds.length
      toast.success(`${count} enchère(s) de formation créée(s) avec succès`)

      emit('duplicated')
    }
  } catch (err) {
    console.error('Erreur de duplication:', err)
    toast.error('Échec de la duplication. Veuillez réessayer.')
  } finally {
    duplicateLoading.value = false
  }
}
</script>
