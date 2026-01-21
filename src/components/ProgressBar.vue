<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  },
  current: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  message: {
    type: String,
    default: ''
  }
})

const progressWidth = computed(() => {
  return Math.min(100, Math.max(0, props.progress))
})

const displayProgress = computed(() => {
  if (props.total > 0) {
    return `${props.current} / ${props.total}`
  }
  return `${Math.round(props.progress)}%`
})
</script>

<template>
  <div class="w-full">
    <!-- Progress info -->
    <div class="flex justify-between items-center mb-2">
      <span class="text-sm text-gray-300">{{ message }}</span>
      <span class="text-sm font-medium text-primary-400">{{ displayProgress }}</span>
    </div>

    <!-- Progress bar container -->
    <div class="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
      <!-- Progress bar fill -->
      <div
        class="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-300 ease-out relative"
        :style="{ width: `${progressWidth}%` }"
      >
        <!-- Animated shine effect -->
        <div
          v-if="progressWidth > 0 && progressWidth < 100"
          class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
        ></div>
      </div>
    </div>

    <!-- Segment indicators -->
    <div v-if="total > 0 && total <= 20" class="flex gap-1 mt-3">
      <div
        v-for="i in total"
        :key="i"
        :class="[
          'h-2 flex-1 rounded-full transition-all duration-200',
          i <= current ? 'bg-primary-500' : 'bg-gray-700'
        ]"
      ></div>
    </div>
  </div>
</template>
