<script setup>
import { computed } from 'vue'
import { useSegmenterStore } from '../stores/segmenter'

const store = useSegmenterStore()

const emit = defineEmits(['download-all', 'download-segment'])

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

function downloadSegment(segment) {
  const a = document.createElement('a')
  a.href = segment.url
  a.download = segment.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const totalSize = computed(() => {
  return store.segments.reduce((acc, seg) => acc + seg.size, 0)
})
</script>

<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-white">
        Processed Segments
        <span class="text-gray-400 font-normal">({{ store.segments.length }})</span>
      </h3>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-400">Total: {{ formatBytes(totalSize) }}</span>
        <button
          v-if="store.segments.length > 0"
          @click="emit('download-all')"
          class="btn-primary text-sm py-2"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All (ZIP)
          </span>
        </button>
      </div>
    </div>

    <!-- Segments list -->
    <div class="space-y-2 max-h-80 overflow-y-auto">
      <div
        v-for="segment in store.segments"
        :key="segment.index"
        class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div class="flex items-center gap-3">
          <!-- Segment number -->
          <div class="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center">
            <span class="text-sm font-medium text-primary-400">{{ segment.index }}</span>
          </div>

          <!-- Segment info -->
          <div>
            <p class="text-sm font-medium text-white">{{ segment.name }}</p>
            <p class="text-xs text-gray-400">{{ formatBytes(segment.size) }}</p>
          </div>
        </div>

        <!-- Download button -->
        <button
          @click="downloadSegment(segment)"
          class="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-400/10 rounded-lg transition-all"
          title="Download segment"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="store.segments.length === 0" class="text-center py-8 text-gray-500">
      <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p>Segments will appear here after processing</p>
    </div>
  </div>
</template>
