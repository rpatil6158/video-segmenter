import { downloadZip } from 'client-zip'

export async function createZipFromSegments(segments, filename = 'video_segments.zip') {
  // Prepare files for zipping
  const files = segments.map(segment => ({
    name: segment.name,
    input: segment.blob,
    lastModified: new Date()
  }))

  // Create ZIP using streaming
  const blob = await downloadZip(files).blob()

  // Trigger download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Clean up
  URL.revokeObjectURL(url)

  return blob.size
}

export async function createZipBlob(segments) {
  const files = segments.map(segment => ({
    name: segment.name,
    input: segment.blob,
    lastModified: new Date()
  }))

  return await downloadZip(files).blob()
}
