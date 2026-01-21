<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSegmenterStore } from './stores/segmenter'
import ffmpegService from './services/ffmpeg'
import { createZipFromSegments } from './services/zipper'

import FileDropZone from './components/FileDropZone.vue'
import VideoInfo from './components/VideoInfo.vue'
import DurationSelector from './components/DurationSelector.vue'
import ProgressBar from './components/ProgressBar.vue'
import SegmentList from './components/SegmentList.vue'

const store = useSegmenterStore()
const isZipping = ref(false)

// Check for SharedArrayBuffer support (required for multithreading)
const hasSharedArrayBuffer = computed(() => {
  return typeof SharedArrayBuffer !== 'undefined'
})

onMounted(async () => {
  // Initialize FFmpeg on mount
  if (hasSharedArrayBuffer.value) {
    await loadFFmpeg()
  }
})

onUnmounted(() => {
  // Cleanup
  store.clearSegments()
  ffmpegService.terminate()
})

async function loadFFmpeg() {
  if (store.isFFmpegLoaded || store.isFFmpegLoading) return

  store.setFFmpegLoading(true)
  store.setStatusMessage('Loading FFmpeg...')

  try {
    await ffmpegService.load((progress) => {
      store.setStatusMessage(progress.message || 'Loading FFmpeg...')
    })
    store.setFFmpegLoaded(true)
    store.setStatusMessage('FFmpeg ready')
  } catch (error) {
    store.setError(`Failed to load FFmpeg: ${error.message}`)
  } finally {
    store.setFFmpegLoading(false)
  }
}

async function handleFileSelected(file) {
  store.setVideoFile(file)
  store.setStatusMessage('Analyzing video...')

  try {
    const info = await ffmpegService.getVideoInfo(file)
    store.setVideoInfo(info)
    store.setStatusMessage('Ready to split')
  } catch (error) {
    store.setError(`Failed to analyze video: ${error.message}`)
  }
}

function handleRemoveFile() {
  store.clearSegments()
  store.reset()
}

async function startSplitting() {
  if (!store.videoFile || store.isProcessing) return

  store.startProcessing()

  try {
    await ffmpegService.splitVideo(
      store.videoFile,
      store.segmentDuration,
      // On segment complete
      (segment) => {
        store.addSegment(segment)
      },
      // On progress
      (progress) => {
        if (progress.type === 'segment_start' || progress.type === 'segment_complete') {
          store.updateProgress(progress.current, progress.total, progress.message)
        } else if (progress.type === 'status') {
          store.setStatusMessage(progress.message)
          if (progress.totalSegments) {
            store.updateProgress(0, progress.totalSegments, progress.message)
          }
        } else if (progress.type === 'complete') {
          store.finishProcessing()
        }
      }
    )
  } catch (error) {
    store.setError(`Splitting failed: ${error.message}`)
  }
}

async function downloadAllAsZip() {
  if (store.segments.length === 0) return

  isZipping.value = true
  store.setStatusMessage('Creating ZIP file...')

  try {
    const baseName = store.videoFile.name.replace(/\.[^/.]+$/, '')
    await createZipFromSegments(store.segments, `${baseName}_segments.zip`)
    store.setStatusMessage('ZIP download started')
  } catch (error) {
    store.setError(`Failed to create ZIP: ${error.message}`)
  } finally {
    isZipping.value = false
  }
}

function resetAll() {
  store.clearSegments()
  store.reset()
}
</script>

<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <header class="border-b border-gray-800">
      <div class="max-w-5xl mx-auto px-6 py-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-white">Video Segmenter</h1>
            <p class="text-sm text-gray-400">Local-first, lossless video splitting</p>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-8">
      <!-- SharedArrayBuffer warning -->
      <div v-if="!hasSharedArrayBuffer" class="card p-6 mb-6 border-yellow-500/50 bg-yellow-500/10">
        <div class="flex gap-3">
          <svg class="w-6 h-6 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 class="font-semibold text-yellow-500">Cross-Origin Isolation Required</h3>
            <p class="text-sm text-gray-300 mt-1">
              This application requires SharedArrayBuffer for multithreaded processing.
              Please ensure the server is configured with proper COOP/COEP headers.
            </p>
          </div>
        </div>
      </div>

      <!-- FFmpeg loading state -->
      <div v-if="store.isFFmpegLoading" class="card p-6 mb-6">
        <div class="flex items-center gap-4">
          <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <p class="font-medium text-white">Loading FFmpeg</p>
            <p class="text-sm text-gray-400">{{ store.statusMessage || 'Initializing...' }}</p>
          </div>
        </div>
      </div>

      <!-- Error display -->
      <div v-if="store.error" class="card p-6 mb-6 border-red-500/50 bg-red-500/10">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="font-semibold text-red-500">Error</h3>
            <p class="text-sm text-gray-300 mt-1">{{ store.error }}</p>
          </div>
          <button @click="store.error = null" class="text-gray-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Main content -->
      <div v-if="store.isFFmpegLoaded && hasSharedArrayBuffer" class="space-y-6">
        <!-- File drop zone (when no file selected) -->
        <FileDropZone v-if="!store.hasVideo" @file-selected="handleFileSelected" />

        <!-- Video controls (when file selected) -->
        <template v-else>
          <!-- Video info -->
          <VideoInfo @remove="handleRemoveFile" />

          <!-- Duration selector -->
          <DurationSelector />

          <!-- Progress bar (during processing) -->
          <div v-if="store.isProcessing" class="card p-6">
            <ProgressBar
              :progress="store.progress"
              :current="store.currentSegment"
              :total="store.totalSegments"
              :message="store.statusMessage"
            />
          </div>

          <!-- Action buttons -->
          <div class="flex gap-4">
            <button
              v-if="!store.isProcessing && store.segments.length === 0"
              @click="startSplitting"
              :disabled="!store.videoInfo"
              class="btn-primary flex-1"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                Start Splitting
              </span>
            </button>

            <button
              v-if="store.segments.length > 0 && !store.isProcessing"
              @click="resetAll"
              class="btn-secondary"
            >
              Process Another Video
            </button>
          </div>

          <!-- Segment list -->
          <SegmentList
            v-if="store.segments.length > 0 || store.isProcessing"
            @download-all="downloadAllAsZip"
          />
        </template>
      </div>

      <!-- Features section -->
      <div v-if="!store.hasVideo && store.isFFmpegLoaded" class="mt-12">
        <h2 class="text-lg font-semibold text-white mb-6 text-center">Features</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="card p-6 text-center">
            <div class="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="font-semibold text-white mb-2">100% Local</h3>
            <p class="text-sm text-gray-400">All processing happens in your browser. Your videos never leave your device.</p>
          </div>

          <div class="card p-6 text-center">
            <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="font-semibold text-white mb-2">Lightning Fast</h3>
            <p class="text-sm text-gray-400">Stream copy mode means no re-encoding. Split videos in seconds, not minutes.</p>
          </div>

          <div class="card p-6 text-center">
            <div class="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 class="font-semibold text-white mb-2">Lossless Quality</h3>
            <p class="text-sm text-gray-400">Using -c copy flag preserves original video quality with zero degradation.</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-800 mt-12">
      <div class="max-w-5xl mx-auto px-6 py-6">
        <p class="text-center text-sm text-gray-500">
          Built with Vue 3, FFmpeg.wasm, and Tailwind CSS. All processing is done locally in your browser.
        </p>
      </div>
    </footer>
  </div>
</template>
