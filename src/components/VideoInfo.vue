<script setup>
import { useSegmenterStore } from '../stores/segmenter'

const store = useSegmenterStore()

const emit = defineEmits(['remove'])

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let size = bytes
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}
</script>

<template>
  <div class="card p-6">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-4">
        <!-- Video icon -->
        <div class="w-14 h-14 bg-primary-600/20 rounded-xl flex items-center justify-center">
          <svg class="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        <!-- File info -->
        <div>
          <h3 class="font-semibold text-lg text-white truncate max-w-md" :title="store.videoFile?.name">
            {{ store.videoFile?.name }}
          </h3>
          <div class="flex gap-4 mt-1 text-sm text-gray-400">
            <span>{{ store.formattedFileSize }}</span>
            <span v-if="store.videoInfo?.duration">{{ store.formattedDuration }}</span>
            <span v-if="store.videoInfo?.resolution">{{ store.videoInfo.resolution }}</span>
            <span v-if="store.videoInfo?.codec" class="uppercase">{{ store.videoInfo.codec }}</span>
          </div>
        </div>
      </div>

      <!-- Remove button -->
      <button
        v-if="!store.isProcessing"
        @click="emit('remove')"
        class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
        title="Remove file"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Segment preview -->
    <div v-if="store.videoInfo?.duration" class="mt-4 pt-4 border-t border-gray-700">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-400">Estimated segments:</span>
        <span class="font-medium text-white">{{ store.estimatedSegments }} parts</span>
      </div>
      <div class="flex items-center justify-between text-sm mt-1">
        <span class="text-gray-400">Segment duration:</span>
        <span class="font-medium text-white">{{ store.segmentDuration }}s each</span>
      </div>
    </div>
  </div>
</template>
