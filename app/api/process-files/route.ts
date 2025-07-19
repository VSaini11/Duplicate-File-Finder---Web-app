import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

interface FileInfo {
  name: string
  size: number
  type: string
  content: string
  normalizedContent: string
  hash: string
  lastModified: number
  path?: string
  isFromFolder?: boolean
}

interface DuplicateGroup {
  hash: string
  files: FileInfo[]
  count: number
}

interface ProcessingResult {
  duplicateGroups: DuplicateGroup[]
  uniqueFiles: FileInfo[]
  totalFiles: number
  duplicateCount: number
}

// Function to normalize file content
function normalizeContent(content: string): string {
  return (
    content
      // Normalize line endings (CRLF -> LF, CR -> LF)
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Remove all whitespace (spaces, tabs, newlines)
      .replace(/\s+/g, "")
      // Convert to lowercase for case-insensitive comparison
      .toLowerCase()
      // Remove BOM if present
      .replace(/^\uFEFF/, "")
  )
}

// Function to detect text encoding and convert to UTF-8
function normalizeEncoding(buffer: Buffer): string {
  // Try to decode as UTF-8 first
  try {
    const utf8Content = buffer.toString("utf8")
    // Check if it's valid UTF-8 by looking for replacement characters
    if (!utf8Content.includes("\uFFFD")) {
      return utf8Content
    }
  } catch (error) {
    // UTF-8 failed, try other encodings
  }

  // Try Latin-1 (ISO-8859-1) as fallback
  try {
    return buffer.toString("latin1")
  } catch (error) {
    // If all else fails, use UTF-8 with replacement characters
    return buffer.toString("utf8")
  }
}

// Function to compute hash of normalized content
function computeHash(normalizedContent: string): string {
  return crypto.createHash("sha256").update(normalizedContent, "utf8").digest("hex")
}

// Function to check if file is likely a text file
function isTextFile(filename: string, content: string): boolean {
  const textExtensions = [
    ".txt",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".html",
    ".css",
    ".json",
    ".xml",
    ".md",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".h",
    ".php",
    ".rb",
    ".go",
    ".rs",
    ".swift",
    ".kt",
    ".scala",
    ".sh",
    ".yml",
    ".yaml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
  ]

  const hasTextExtension = textExtensions.some((ext) => filename.toLowerCase().endsWith(ext))

  if (hasTextExtension) return true

  // Check if content appears to be text (heuristic)
  const nonPrintableChars = content.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g)
  const nonPrintableRatio = nonPrintableChars ? nonPrintableChars.length / content.length : 0

  return nonPrintableRatio < 0.1 // Less than 10% non-printable characters
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const paths = formData.getAll("paths") as string[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    console.log(`Processing ${files.length} files...`)

    const processedFiles: FileInfo[] = []
    const fileHashMap = new Map<string, FileInfo[]>()
    const BATCH_SIZE = 50 // Process files in batches to avoid memory issues
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB limit per file

    // Process files in batches for better performance
    for (let batchStart = 0; batchStart < files.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, files.length)
      const batch = files.slice(batchStart, batchEnd)
      
      console.log(`Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)}`)

      // Process batch with Promise.all for parallel processing
      const batchPromises = batch.map(async (file, batchIndex) => {
        const fileIndex = batchStart + batchIndex
        const filePath = paths[fileIndex] || file.name

        try {
          // Skip files that are too large
          if (file.size > MAX_FILE_SIZE) {
            console.log(`Skipping large file: ${file.name} (${file.size} bytes)`)
            return null
          }

          const buffer = Buffer.from(await file.arrayBuffer())
          const originalContent = normalizeEncoding(buffer)

          // Skip non-text files
          if (!isTextFile(file.name, originalContent)) {
            return null
          }

          // Skip files with content that's too large after normalization
          if (originalContent.length > MAX_FILE_SIZE) {
            console.log(`Skipping file with large content: ${file.name}`)
            return null
          }

          const normalizedContent = normalizeContent(originalContent)
          const hash = computeHash(normalizedContent)

          const fileInfo: FileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            content: originalContent,
            normalizedContent: normalizedContent,
            hash: hash,
            lastModified: file.lastModified,
            path: filePath,
            isFromFolder: filePath.includes("/") && filePath !== file.name,
          }

          return fileInfo
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
          return null
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      
      // Add successful results to processed files
      for (const fileInfo of batchResults) {
        if (fileInfo) {
          processedFiles.push(fileInfo)

          // Group files by hash
          if (!fileHashMap.has(fileInfo.hash)) {
            fileHashMap.set(fileInfo.hash, [])
          }
          fileHashMap.get(fileInfo.hash)!.push(fileInfo)
        }
      }
    }

    console.log(`Successfully processed ${processedFiles.length} files`)

    // Separate duplicates from unique files
    const duplicateGroups: DuplicateGroup[] = []
    const uniqueFiles: FileInfo[] = []

    for (const [hash, files] of fileHashMap.entries()) {
      if (files.length > 1) {
        duplicateGroups.push({
          hash,
          files,
          count: files.length,
        })
      } else {
        uniqueFiles.push(files[0])
      }
    }

    // Sort duplicate groups by count (descending)
    duplicateGroups.sort((a, b) => b.count - a.count)

    // Calculate statistics
    const duplicateCount = duplicateGroups.reduce((sum, group) => sum + group.count, 0)

    const result: ProcessingResult = {
      duplicateGroups,
      uniqueFiles,
      totalFiles: processedFiles.length,
      duplicateCount,
    }

    console.log(`Analysis complete: ${duplicateGroups.length} duplicate groups, ${uniqueFiles.length} unique files`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing files:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
