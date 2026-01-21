import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSegmenterStore = defineStore('segmenter', () => {
  // State
  const videoFile = ref(null)
  const videoInfo = ref(null)
  const segmentDuration = ref(60) // Default 60 seconds
  const isProcessing = ref(false)
  const isFFmpegLoaded = ref(false)
  const isFFmpegLoading = ref(false)
  const progress = ref(0)
  const currentSegment = ref(0)
  const totalSegments = ref(0)
  const segments = ref([])
  const error = ref(null)
  const statusMessage = ref('')

  // Computed
  const hasVideo = computed(() => videoFile.value !== null)

  const estimatedSegments = computed(() => {
    if (!videoInfo.value?.duration) return 0
    return Math.ceil(videoInfo.value.duration / segmentDuration.value)
  })

  const progressPercentage = computed(() => {
    if (totalSegments.value === 0) return 0
    return Math.round((currentSegment.value / totalSegments.value) * 100)
  })

  const formattedFileSize = computed(() => {
    if (!videoFile.value) return ''
    const bytes = videoFile.value.size
    const units = ['B', 'KB', 'MB', 'GB']
    let unitIndex = 0
    let size = bytes
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  })

  const formattedDuration = computed(() => {
    if (!videoInfo.value?.duration) return ''
    const totalSeconds = Math.floor(videoInfo.value.duration)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  })

  // Actions
  function setVideoFile(file) {
    videoFile.value = file
    error.value = null
    segments.value = []
    progress.value = 0
    currentSegment.value = 0
    totalSegments.value = 0
    statusMessage.value = ''
  }

  function setVideoInfo(info) {
    videoInfo.value = info
  }

  function setSegmentDuration(duration) {
    segmentDuration.value = Math.max(5, Math.min(300, duration))
  }

  function setFFmpegLoaded(loaded) {
    isFFmpegLoaded.value = loaded
  }

  function setFFmpegLoading(loading) {
    isFFmpegLoading.value = loading
  }

  function startProcessing() {
    isProcessing.value = true
    progress.value = 0
    currentSegment.value = 0
    segments.value = []
    error.value = null
    statusMessage.value = 'Starting video segmentation...'
  }

  function updateProgress(current, total, message = '') {
    currentSegment.value = current
    totalSegments.value = total
    progress.value = total > 0 ? (current / total) * 100 : 0
    if (message) {
      statusMessage.value = message
    }
  }

  function addSegment(segment) {
    segments.value.push(segment)
  }

  function finishProcessing() {
    isProcessing.value = false
    progress.value = 100
    statusMessage.value = 'Processing complete!'
  }

  function setError(errorMessage) {
    error.value = errorMessage
    isProcessing.value = false
    statusMessage.value = ''
  }

  function setStatusMessage(message) {
    statusMessage.value = message
  }

  function reset() {
    videoFile.value = null
    videoInfo.value = null
    isProcessing.value = false
    progress.value = 0
    currentSegment.value = 0
    totalSegments.value = 0
    segments.value = []
    error.value = null
    statusMessage.value = ''
  }

  function clearSegments() {
    segments.value.forEach(segment => {
      if (segment.url) {
        URL.revokeObjectURL(segment.url)
      }
    })
    segments.value = []
  }

  return {
    // State
    videoFile,
    videoInfo,
    segmentDuration,
    isProcessing,
    isFFmpegLoaded,
    isFFmpegLoading,
    progress,
    currentSegment,
    totalSegments,
    segments,
    error,
    statusMessage,
    // Computed
    hasVideo,
    estimatedSegments,
    progressPercentage,
    formattedFileSize,
    formattedDuration,
    // Actions
    setVideoFile,
    setVideoInfo,
    setSegmentDuration,
    setFFmpegLoaded,
    setFFmpegLoading,
    startProcessing,
    updateProgress,
    addSegment,
    finishProcessing,
    setError,
    setStatusMessage,
    reset,
    clearSegments
  }
})
