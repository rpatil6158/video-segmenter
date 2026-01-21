<script setup>
import { ref } from 'vue'

const emit = defineEmits(['file-selected'])

const isDragging = ref(false)
const fileInput = ref(null)

const supportedFormats = [
  'video/mp4',
  'video/webm',
  'video/x-matroska',
  'video/x-msvideo',
  'video/quicktime',
  'video/x-m4v',
  'video/x-flv',
  'video/x-ms-wmv',
  'video/mp2t'
]

const supportedExtensions = ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.m4v', '.flv', '.wmv', '.ts', '.mts']

function handleDragEnter(e) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave(e) {
  e.preventDefault()
  isDragging.value = false
}

function handleDragOver(e) {
  e.preventDefault()
}

function handleDrop(e) {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer.files
  if (files.length > 0) {
    validateAndEmit(files[0])
  }
}

function handleFileInput(e) {
  const files = e.target.files
  if (files.length > 0) {
    validateAndEmit(files[0])
  }
  // Reset input so same file can be selected again
  e.target.value = ''
}

function validateAndEmit(file) {
  const extension = file.name.toLowerCase().match(/\.[^/.]+$/)?.[0]

  if (!supportedFormats.includes(file.type) && !supportedExtensions.includes(extension)) {
    alert(`Unsupported file format. Please use: ${supportedExtensions.join(', ')}`)
    return
  }

  // Check file size (2GB limit)
  const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
  if (file.size > maxSize) {
    alert('File size exceeds 2GB limit.')
    return
  }

  emit('file-selected', file)
}

function triggerFileInput() {
  fileInput.value?.click()
}
</script>

<template>
  <div
    class="relative"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <input
      ref="fileInput"
      type="file"
      accept="video/*,.mkv,.avi,.mov,.m4v,.flv,.wmv,.ts,.mts"
      class="hidden"
      @change="handleFileInput"
    />

    <div
      :class="[
        'border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer',
        isDragging
          ? 'border-primary-400 bg-primary-900/30 scale-[1.02]'
          : 'border-gray-600 hover:border-primary-500 hover:bg-gray-800/50'
      ]"
      @click="triggerFileInput"
    >
      <div class="flex flex-col items-center gap-4">
        <!-- Upload Icon -->
        <div
          :class="[
            'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300',
            isDragging ? 'bg-primary-600 scale-110' : 'bg-gray-700'
          ]"
        >
          <svg
            class="w-10 h-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <!-- Text -->
        <div>
          <p class="text-xl font-semibold text-gray-200">
            {{ isDragging ? 'Drop your video here' : 'Drag & drop your video' }}
          </p>
          <p class="mt-2 text-gray-400">
            or <span class="text-primary-400 hover:underline">browse files</span>
          </p>
        </div>

        <!-- Supported formats -->
        <div class="mt-4 text-sm text-gray-500">
          <p>Supported: MP4, WebM, MKV, AVI, MOV, and more</p>
          <p class="mt-1">Max file size: 2GB</p>
        </div>
      </div>
    </div>
  </div>
</template>
