<template>
  <v-container
    class="bg-white border rounded-lg mb-2 px-10 py-8"
    :data-auction-id="auction?.id || ''"
  >
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-2">
        {{ t('termsPage.commercialTerms') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" :md="docs?.length > 0 ? 7 : 12">
        <div class="commercial-html" v-html="auction.commercials_terms" />
      </v-col>
      <v-spacer />
      <v-col v-if="docs?.length > 0" cols="12" md="5">
        <div :class="docs?.length > 4 ? 'max-files-list-height' : ''">
          <v-row v-for="file in docs" :key="file.name">
            <v-col cols="12" xl="10" class="d-flex justify-space-between align-center ga-1">
              <div class="d-flex ga-2">
                <v-img :src="defineIcon(file.type)" height="20" width="20" />
                <a :href="file.url" target="_blank" class="text-decoration-none">
                  {{ shortenFileName(file.name) }}
                </a>
              </div>
              <span class="d-flex align-center ga-2">
                <div class="d-flex ga-2 text-grey">
                  <span class="text-truncate text-break">
                    {{ dayjs(file.updated_at).format('LL') }} -
                    {{
                      file.size >= 100000
                        ? `${(file.size / 1000000).toFixed(1)} MB`
                        : `${(file.size / 1000).toFixed(1)} KB`
                    }}
                  </span>
                  <v-hover>
                    <template #default="{ isHovering, props }">
                      <v-img
                        v-bind="props"
                        src="/icons/download.svg"
                        height="20"
                        width="20"
                        :class="isHovering ? 'bg-grey-lighten-2' : ''"
                        class="cursor-pointer rounded-lg"
                        @click="downloadFile(file.url)"
                      />
                    </template>
                  </v-hover>
                </div>
              </span>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
    <!-- TODO Uncomment when  we decide on zip manager -->
    <!--
      <v-row class="mt-4 d-flex justify-end">
      <v-hover>
      <template #default="{ isHovering, props }">
      <span
      class="d-flex align-center ga-2 rounded-lg cursor-pointer px-4 py-2 text-decoration-underline"
      v-bind="props"
      :class="isHovering ? 'bg-grey-lighten-2' : ''"
      >
      <v-img
      v-bind="props"
      src="/icons/download.svg"
      height="30"
      width="30"
      :class="isHovering ? 'bg-grey-lighten-2' : ''"
      class="cursor-pointer rounded-lg"
      @click="downloadFile(file.url)"
      />
      Download all
      </span>
      </template>
      </v-hover>
      </v-row>
    -->
  </v-container>
</template>

<script setup>
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import advancedFormat from 'dayjs/plugin/advancedFormat'

const props = defineProps(['auction'])

const { t } = useTranslations()

dayjs.extend(localizedFormat)
dayjs.extend(advancedFormat)

//TODO: this could be not blocking - I already had the case where
const { commercials_files: docs } = await useAuctionDocuments(props.auction.id)

// console.log('docs', docs.value.length)
function shortenFileName(fileName) {
  if (fileName.length <= 30) {
    return fileName
  } else {
    // const extension = fileName.split('.').pop()
    const shortenedName = fileName.substring(0, 30) + '...'
    return shortenedName
  }
}

function defineIcon(type) {
  if (type === 'application/pdf') {
    return '/icons/pdf_icon.png'
  } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return '/icons/docx_icon.png'
  } else {
    return '/icons/xls_icon.png'
  }
}

function downloadFile(url) {
  window.open(url, '_blank')
}
</script>

<style scoped>
.max-files-list-height {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
<style>
.commercial-html ul {
  margin-left: 20px !important;
}
</style>
