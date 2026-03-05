<template>
  <v-card class="mb-1">
    <v-card-title class="px-10 pt-8">
      <div class="text-h6 font-weight-semibold">
        {{ t('lots.commercialTerms') }}
      </div>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row justify="space-between">
          <v-col cols="12" md="7">
            <div class="quill px-2">
              <QuillEditor
                v-model:content="model.commercials_terms"
                style="min-height: 178px"
                theme="snow"
                content-type="html"
                :placeholder="t('lots.defaultCommercialTerms')"
              />
              <span v-if="!isValid" class="text-error">
                {{ t('validation.required') }}
              </span>
            </div>
          </v-col>
          <v-col cols="12" md="4" class="mt-10 mt-md-0 px-5">
            <div class="d-flex justify-space-between align-end mb-2">
              <span class="font-weight-regular text-body-1">{{ t('lots.uploadDocuments') }}</span>
              <span class="text-grey-lighten-2 text-body-2">PDF DOCX TXT >10 MB</span>
            </div>
            <div>
              <v-sheet
                ref="dropZoneRef"
                class="d-flex justify-center align-center rounded-lg bg-purple"
                height="153"
              >
                <div class="d-flex">
                  <label
                    :for="'inputFile' + model.name"
                    class="d-flex flex-column align-center text-primary text-body-1 cursor-pointer"
                  >
                    <div class="pa-2 mb-2 bg-white rounded-circle">
                      <v-img
                        src="@/assets/icons/basic/Folder_Simple_Download.svg"
                        width="30"
                        height="30"
                      />
                    </div>
                    {{ t('lots.clickToUpload') }}
                  </label>
                  <input
                    :id="'inputFile' + model.name"
                    type="file"
                    class="text-primary visually-hidden"
                    multiple
                    @change="(e) => onDrop(e.target.files, true)"
                  />
                </div>
              </v-sheet>

              <div
                v-for="(file, index) in filesData"
                :key="index"
                class="text-left ma-2 text-body-2"
              >
                <p>
                  <a v-if="file.url" target="_blank" :href="file.url">
                    {{ shortenFileName(file.name) }}
                  </a>
                  <span v-else>
                    {{ shortenFileName(file.name) }}
                  </span>
                  <v-icon size="20" class="ml-2 text-primary" @click="deleteFile(index)">
                    mdi-close
                  </v-icon>
                </p>
              </div>
              <div v-if="fileErrorMessage" class="text-error text-center ma-2 text-subtitle-4">
                {{ fileErrorMessage }}
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { useDropZone } from '@vueuse/core'

// Use translations
const { t } = useTranslations()

const model = defineModel()

const supabase = useSupabaseClient()

const fileErrorMessage = ref()
const filesData = ref([])

const dropZoneRef = ref()

const isValid = computed(() => {
  return model.value.commercials_terms !== '<p><br></p>'
})

if (model.value.commercials_docs) {
  filesData.value = model.value.commercials_docs
}
function onDrop(droppedFiles, input) {
  // console.log('droppedFiles', droppedFiles)
  let draggedFiles = null
  if (input) {
    draggedFiles = Array.from(droppedFiles)
  } else {
    draggedFiles = droppedFiles
  }
  draggedFiles.forEach(async (file) => {
    if (file.size > 10000000) {
      return (fileErrorMessage.value = t('validation.fileTooBig'))
    } else if (
      file.type !== 'application/pdf' &&
      file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
      file.type !== 'text/plain'
    ) {
      return (fileErrorMessage.value = t('validation.invalidFileType'))
    }
    filesData.value.push(file)
    fileErrorMessage.value = ''
  })
  model.value.commercials_docs = filesData.value
}

useDropZone(dropZoneRef, {
  onDrop
})

function shortenFileName(fileName) {
  if (fileName.length <= 30) {
    return fileName
  } else {
    const extension = fileName.split('.').pop()
    const shortenedName = fileName.substring(0, 22) + '...'
    return shortenedName + '.' + extension
  }
}

async function deleteFile(index) {
  if (model.value.commercials_docs[index] && model.value.id) {
    const { data, error } = await supabase.storage
      .from('commercials_docs')
      .remove(
        `${model.value.commercials_docs[index].groupId}/${model.value.id}/${model.value.commercials_docs[index].name}`
      )
    console.log('RemovedFiled', data, 'error removing file', error)
  }
  filesData.value.splice(index, 1)
}
</script>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
