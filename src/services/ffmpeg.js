import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

class FFmpegService {
  constructor() {
    this.ffmpeg = null
    this.loaded = false
    this.progressCallback = null
  }

  async load(onProgress = null) {
    if (this.loaded && this.ffmpeg) {
      return true
    }

    this.ffmpeg = new FFmpeg()

    // Set up logging for progress tracking
    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message)
      if (this.progressCallback) {
        this.progressCallback({ type: 'log', message })
      }
    })

    this.ffmpeg.on('progress', ({ progress, time }) => {
      if (this.progressCallback) {
        this.progressCallback({
          type: 'progress',
          progress: Math.round(progress * 100),
          time
        })
      }
    })

    try {
      // Load FFmpeg with multithreading support
      const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'

      if (onProgress) {
        onProgress({ type: 'status', message: 'Loading FFmpeg core...' })
      }

      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      })

      this.loaded = true
      console.log('FFmpeg loaded with multithreading support')
      return true
    } catch (error) {
      console.error('Failed to load FFmpeg:', error)
      throw new Error(`Failed to load FFmpeg: ${error.message}`)
    }
  }

  setProgressCallback(callback) {
    this.progressCallback = callback
  }

  async getVideoInfo(file) {
    if (!this.loaded) {
      throw new Error('FFmpeg not loaded')
    }

    const inputName = 'input_probe' + this.getExtension(file.name)

    try {
      // Write file to FFmpeg virtual filesystem
      await this.ffmpeg.writeFile(inputName, await fetchFile(file))

      // Get video duration using ffprobe-like command
      let duration = 0
      let codec = ''
      let resolution = ''

      // Use ffmpeg to get info via stderr output
      const logMessages = []
      const originalCallback = this.progressCallback

      this.progressCallback = ({ type, message }) => {
        if (type === 'log') {
          logMessages.push(message)
        }
      }

      try {
        await this.ffmpeg.exec(['-i', inputName, '-f', 'null', '-t', '0.001', '-'])
      } catch (e) {
        // This is expected to "fail" but we get the info from logs
      }

      this.progressCallback = originalCallback

      // Parse duration from logs
      for (const log of logMessages) {
        // Duration: 00:01:30.50, start: 0.000000, bitrate: 1234 kb/s
        const durationMatch = log.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
        if (durationMatch) {
          const [, hours, minutes, seconds, centiseconds] = durationMatch
          duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(centiseconds) / 100
        }

        // Video: h264 (High), yuv420p, 1920x1080
        const videoMatch = log.match(/Video:\s*(\w+).*?,.*?(\d{2,5}x\d{2,5})/)
        if (videoMatch) {
          codec = videoMatch[1]
          resolution = videoMatch[2]
        }
      }

      // Clean up
      await this.ffmpeg.deleteFile(inputName)

      return {
        duration,
        codec,
        resolution,
        filename: file.name,
        size: file.size
      }
    } catch (error) {
      console.error('Error getting video info:', error)
      // Try to clean up
      try {
        await this.ffmpeg.deleteFile(inputName)
      } catch (e) {}
      throw error
    }
  }

  async splitVideo(file, segmentDuration, onSegmentComplete, onProgress) {
    if (!this.loaded) {
      throw new Error('FFmpeg not loaded')
    }

    const segments = []
    const extension = this.getExtension(file.name)
    const inputName = 'input' + extension
    const baseName = file.name.replace(/\.[^/.]+$/, '')

    try {
      onProgress?.({ type: 'status', message: 'Loading video into memory...' })

      // Write the input file to FFmpeg virtual filesystem
      const fileData = await fetchFile(file)
      await this.ffmpeg.writeFile(inputName, fileData)

      // Get video duration first
      const videoInfo = await this.getVideoInfoFromMemory(inputName)
      const totalDuration = videoInfo.duration
      const totalSegments = Math.ceil(totalDuration / segmentDuration)

      onProgress?.({
        type: 'status',
        message: `Splitting video into ${totalSegments} segments...`,
        totalSegments
      })

      // Process each segment using stream copy (no re-encoding)
      for (let i = 0; i < totalSegments; i++) {
        const startTime = i * segmentDuration
        const segmentNum = String(i + 1).padStart(3, '0')
        const outputName = `part_${segmentNum}${extension}`

        onProgress?.({
          type: 'segment_start',
          current: i + 1,
          total: totalSegments,
          message: `Processing segment ${i + 1} of ${totalSegments}...`
        })

        // FFmpeg command with stream copy (lossless, fast)
        const args = [
          '-ss', String(startTime),           // Seek to start position
          '-i', inputName,                     // Input file
          '-t', String(segmentDuration),       // Duration
          '-c', 'copy',                        // Stream copy (no re-encoding)
          '-avoid_negative_ts', 'make_zero',   // Fix timestamp issues
          '-map', '0',                         // Copy all streams
          '-y',                                // Overwrite output
          outputName
        ]

        await this.ffmpeg.exec(args)

        // Read the output file
        const data = await this.ffmpeg.readFile(outputName)
        const blob = new Blob([data.buffer], { type: this.getMimeType(extension) })
        const url = URL.createObjectURL(blob)

        const segment = {
          name: `${baseName}_${outputName}`,
          blob,
          url,
          size: blob.size,
          index: i + 1
        }

        segments.push(segment)
        onSegmentComplete?.(segment)

        // Clean up segment file from memory
        await this.ffmpeg.deleteFile(outputName)

        onProgress?.({
          type: 'segment_complete',
          current: i + 1,
          total: totalSegments,
          message: `Completed segment ${i + 1} of ${totalSegments}`
        })
      }

      // Clean up input file
      await this.ffmpeg.deleteFile(inputName)

      onProgress?.({
        type: 'complete',
        message: 'All segments processed successfully!',
        totalSegments: segments.length
      })

      return segments
    } catch (error) {
      console.error('Error splitting video:', error)

      // Clean up on error
      try {
        await this.ffmpeg.deleteFile(inputName)
      } catch (e) {}

      // Clean up any segment URLs
      segments.forEach(seg => {
        if (seg.url) URL.revokeObjectURL(seg.url)
      })

      throw error
    }
  }

  async getVideoInfoFromMemory(inputName) {
    const logMessages = []
    const originalCallback = this.progressCallback

    this.progressCallback = ({ type, message }) => {
      if (type === 'log') {
        logMessages.push(message)
      }
    }

    try {
      await this.ffmpeg.exec(['-i', inputName, '-f', 'null', '-t', '0.001', '-'])
    } catch (e) {
      // Expected
    }

    this.progressCallback = originalCallback

    let duration = 0
    for (const log of logMessages) {
      const durationMatch = log.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
      if (durationMatch) {
        const [, hours, minutes, seconds, centiseconds] = durationMatch
        duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(centiseconds) / 100
        break
      }
    }

    return { duration }
  }

  getExtension(filename) {
    const match = filename.match(/\.[^/.]+$/)
    return match ? match[0].toLowerCase() : '.mp4'
  }

  getMimeType(extension) {
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.m4v': 'video/x-m4v',
      '.flv': 'video/x-flv',
      '.wmv': 'video/x-ms-wmv',
      '.ts': 'video/mp2t',
      '.mts': 'video/mp2t'
    }
    return mimeTypes[extension] || 'video/mp4'
  }

  terminate() {
    if (this.ffmpeg) {
      this.ffmpeg.terminate()
      this.ffmpeg = null
      this.loaded = false
    }
  }
}

// Export singleton instance
export const ffmpegService = new FFmpegService()
export default ffmpegService
