<script setup>
import { ref, computed } from 'vue'
import { useSegmenterStore } from '../stores/segmenter'

const store = useSegmenterStore()

const presets = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 },
]

const customDuration = ref(store.segmentDuration)
const showCustomInput = ref(false)

const isCustomSelected = computed(() => {
  return !presets.some(p => p.value === store.segmentDuration)
})

function selectPreset(value) {
  store.setSegmentDuration(value)
  showCustomInput.value = false
}

function selectCustom() {
  showCustomInput.value = true
}

function applyCustomDuration() {
  const duration = parseInt(customDuration.value)
  if (duration >= 5 && duration <= 300) {
    store.setSegmentDuration(duration)
  }
}

function handleCustomInput(e) {
  customDuration.value = e.target.value
  applyCustomDuration()
}
</script>

<template>
  <div class="card p-6">
    <h3 class="font-semibold text-white mb-4">Segment Duration</h3>

    <!-- Preset buttons -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="preset in presets"
        :key="preset.value"
        @click="selectPreset(preset.value)"
        :class="[
          'px-4 py-2 rounded-lg font-medium text-sm transition-all',
          store.segmentDuration === preset.value && !showCustomInput
            ? 'bg-primary-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        ]"
        :disabled="store.isProcessing"
      >
        {{ preset.label }}
      </button>

      <!-- Custom button -->
      <button
        @click="selectCustom"
        :class="[
          'px-4 py-2 rounded-lg font-medium text-sm transition-all',
          showCustomInput || isCustomSelected
            ? 'bg-primary-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        ]"
        :disabled="store.isProcessing"
      >
        Custom
      </button>
    </div>

    <!-- Custom input -->
    <div v-if="showCustomInput || isCustomSelected" class="mt-4">
      <div class="flex items-center gap-3">
        <input
          type="number"
          :value="store.segmentDuration"
          @input="handleCustomInput"
          min="5"
          max="300"
          class="input-field w-32"
          placeholder="Seconds"
          :disabled="store.isProcessing"
        />
        <span class="text-gray-400">seconds (5-300)</span>
      </div>
    </div>

    <!-- Info text -->
    <p class="mt-4 text-sm text-gray-500">
      Using stream copy for lossless splitting - no quality loss, maximum speed
    </p>
  </div>
</template>
