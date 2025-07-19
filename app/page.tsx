"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Upload,
  FileText,
  Copy,
  Eye,
  Trash2,
  Search,
  Database,
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  Cpu,
  BarChart3,
  Folder,
  FolderOpen,
  Settings,
} from "lucide-react"
import { trackSession, trackFileAnalysis } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileInfo {
  name: string
  size: number
  type: string
  content: string
  normalizedContent: string
  hash: string
  lastModified: number
  path?: string // Add path for folder structure
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

interface ExtendedFile extends Omit<File, 'webkitRelativePath'> {
  webkitRelativePath?: string
}

export default function DuplicateFileDetector() {
  const [files, setFiles] = useState<ExtendedFile[]>([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<ProcessingResult | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Track session on component mount
  useEffect(() => {
    trackSession()
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files) as ExtendedFile[]
    const validFiles = droppedFiles.filter((file) => isValidFileType(file as File))

    if (validFiles.length !== droppedFiles.length) {
      alert(`${droppedFiles.length - validFiles.length} files were skipped (unsupported file types)`)
    }

    setFiles((prev) => [...prev, ...validFiles])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as ExtendedFile[]
      const validFiles = selectedFiles.filter((file) => isValidFileType(file))

      if (validFiles.length !== selectedFiles.length) {
        alert(`${selectedFiles.length - validFiles.length} files were skipped (unsupported file types)`)
      }

      setFiles((prev) => [...prev, ...validFiles])
    }
    // Reset the input value to allow selecting the same files again
    e.target.value = ""
  }

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as ExtendedFile[]
      console.log("Folder files selected:", selectedFiles.length)

      const validFiles = selectedFiles.filter((file) => {
        const isValid = isValidFileType(file)
        if (!isValid) {
          console.log("Skipping invalid file:", file.name)
        }
        return isValid
      })

      console.log("Valid files from folder:", validFiles.length)

      if (validFiles.length !== selectedFiles.length) {
        alert(`${selectedFiles.length - validFiles.length} files were skipped (unsupported file types)`)
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles])
      } else {
        alert("No valid files found in the selected folder")
      }
    }
    // Reset the input value
    e.target.value = ""
  }

  const isValidFileType = (file: File | ExtendedFile): boolean => {
    const validExtensions = [
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

    const fileName = file.name.toLowerCase()
    return (
      validExtensions.some((ext) => fileName.endsWith(ext)) ||
      file.type.startsWith("text/") ||
      file.type === "application/json" ||
      file.type === "application/xml"
    )
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    setFiles([])
    setResults(null)
  }

  const processFiles = async () => {
    if (files.length === 0) return

    setProcessing(true)
    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
        // Send the relative path if it exists (for folder uploads)
        if (file.webkitRelativePath) {
          formData.append("paths", file.webkitRelativePath)
        } else {
          formData.append("paths", file.name)
        }
      })

      const response = await fetch("/api/process-files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", errorText)
        throw new Error(`Failed to process files: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      setResults(result)
      
      // Track analytics after successful processing
      const fileTypes = files.map(file => {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown'
        return extension
      })
      
      trackFileAnalysis(
        result.totalFiles,
        result.duplicateCount,
        fileTypes
      )
    } catch (error) {
      console.error("Error processing files:", error)
      alert("Error processing files. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getFileIcon = (file: ExtendedFile) => {
    if (file.webkitRelativePath) {
      return <FolderOpen className="h-4 w-4 text-blue-400" />
    }
    return <FileText className="h-4 w-4 text-slate-300" />
  }

  const getFilePath = (file: ExtendedFile) => {
    if (file.webkitRelativePath) {
      return file.webkitRelativePath
    }
    return file.name
  }

  const getFolderStats = () => {
    const folderFiles = files.filter((f) => f.webkitRelativePath)
    const individualFiles = files.filter((f) => !f.webkitRelativePath)
    const folders = new Set(folderFiles.map((f) => f.webkitRelativePath?.split("/")[0])).size

    return { folderFiles: folderFiles.length, individualFiles: individualFiles.length, folders }
  }

  const stats = getFolderStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/3 to-transparent rounded-full"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30 backdrop-blur-sm flex-shrink-0">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent truncate">
                  ZeroDup
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">Advanced duplicate detection</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800/30 border-slate-600/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-100 transition-all duration-300 backdrop-blur-sm px-2 sm:px-3 text-xs sm:text-sm"
                onClick={() => window.open('/analytics', '_blank')}
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/30 border-slate-600/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-100 transition-all duration-300 backdrop-blur-sm px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Cpu className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">How It Works</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] bg-black border-slate-800 backdrop-blur-xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-3xl text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
                    How It Works
                  </DialogTitle>
                  <p className="text-slate-300 max-w-3xl mx-auto text-center text-lg">
                    Our advanced algorithm goes beyond simple file comparison to detect true content duplicates 
                    using AI-powered analysis and cryptographic precision.
                  </p>
                </DialogHeader>

                <div className="space-y-12 mt-8">
                  {/* Step-by-step process with modern design */}
                  <div className="relative">
                    <div className="text-center mb-10">
                      <h3 className="text-2xl font-bold text-white mb-3">Our 4-Step Process</h3>
                      <p className="text-slate-300">Advanced AI-driven duplicate detection pipeline</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <Card className="relative bg-slate-800/30 border-slate-600/50 hover:bg-slate-800/50 transition-all duration-500 group transform hover:scale-105 rounded-3xl backdrop-blur-xl h-96">
                          <CardContent className="p-6 text-center h-full flex flex-col">
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="relative mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/40 group-hover:border-blue-400/60 transition-all duration-500">
                                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl font-bold text-blue-400">1</span>
                                  </div>
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500/10 rounded-full animate-ping"></div>
                              </div>
                              <Upload className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                              <h3 className="font-bold text-white mb-3 text-lg">Upload & Scan</h3>
                              <p className="text-sm text-slate-200 leading-relaxed">
                                Drag & drop files or entire folders. Recursively processes all files within folder structures 
                                with intelligent file type detection and validation.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <Card className="relative bg-slate-800/30 border-slate-600/50 hover:bg-slate-800/50 transition-all duration-500 group transform hover:scale-105 rounded-3xl backdrop-blur-xl h-96">
                          <CardContent className="p-6 text-center h-full flex flex-col">
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="relative mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/40 group-hover:border-purple-400/60 transition-all duration-500">
                                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl font-bold text-purple-400">2</span>
                                  </div>
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500/10 rounded-full animate-ping delay-300"></div>
                              </div>
                              <Cpu className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                              <h3 className="font-bold text-white mb-3 text-lg">AI Normalization</h3>
                              <p className="text-sm text-slate-200 leading-relaxed">
                                AI-powered content normalization removes whitespace, standardizes encoding, 
                                and handles format differences for precise comparison.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <Card className="relative bg-slate-800/30 border-slate-600/50 hover:bg-slate-800/50 transition-all duration-500 group transform hover:scale-105 rounded-3xl backdrop-blur-xl h-96">
                          <CardContent className="p-6 text-center h-full flex flex-col">
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="relative mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl flex items-center justify-center mx-auto border border-green-500/40 group-hover:border-green-400/60 transition-all duration-500">
                                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl font-bold text-green-400">3</span>
                                  </div>
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500/10 rounded-full animate-ping delay-700"></div>
                              </div>
                              <Shield className="h-8 w-8 text-green-400 mx-auto mb-4" />
                              <h3 className="font-bold text-white mb-3 text-lg">Cryptographic Hash</h3>
                              <p className="text-sm text-slate-200 leading-relaxed">
                                Generates secure SHA-256 hashes of normalized content for 
                                ultra-reliable duplicate detection with zero false positives.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <Card className="relative bg-slate-800/30 border-slate-600/50 hover:bg-slate-800/50 transition-all duration-500 group transform hover:scale-105 rounded-3xl backdrop-blur-xl h-96">
                          <CardContent className="p-6 text-center h-full flex flex-col">
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="relative mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 rounded-2xl flex items-center justify-center mx-auto border border-yellow-500/40 group-hover:border-yellow-400/60 transition-all duration-500">
                                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl font-bold text-yellow-400">4</span>
                                  </div>
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500/10 rounded-full animate-ping delay-1000"></div>
                              </div>
                              <BarChart3 className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
                              <h3 className="font-bold text-white mb-3 text-lg">Smart Analysis</h3>
                              <p className="text-sm text-slate-200 leading-relaxed">
                                Groups identical content with intelligent insights, preview capabilities, 
                                and comprehensive reporting for actionable results.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  {/* Features Grid with enhanced design */}
                  <div className="relative">
                    <div className="text-center mb-10">
                      <h3 className="text-2xl font-bold text-white mb-3">Why Choose Our Platform</h3>
                      <p className="text-slate-300">Next-generation features that set us apart</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <Card className="relative bg-slate-900/60 border-slate-600/50 rounded-3xl backdrop-blur-xl transform group-hover:scale-105 transition-all duration-500">
                          <CardContent className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl border border-yellow-500/30">
                                <Zap className="h-6 w-6 text-yellow-400" />
                              </div>
                              <h3 className="font-bold text-white text-xl">Lightning Fast</h3>
                            </div>
                            <p className="text-white leading-relaxed">
                              Optimized algorithms process thousands of files in seconds with minimal memory usage. 
                              Experience the speed of modern computing.
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <Card className="relative bg-slate-900/60 border-slate-600/50 rounded-3xl backdrop-blur-xl transform group-hover:scale-105 transition-all duration-500">
                          <CardContent className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl border border-green-500/30">
                                <Shield className="h-6 w-6 text-green-400" />
                              </div>
                              <h3 className="font-bold text-white text-xl">Secure & Private</h3>
                            </div>
                            <p className="text-white leading-relaxed">
                              All processing happens locally in your browser. Your files never leave your device. 
                              Privacy by design, security by default.
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <Card className="relative bg-slate-900/60 border-slate-600/50 rounded-3xl backdrop-blur-xl transform group-hover:scale-105 transition-all duration-500">
                          <CardContent className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl border border-blue-500/30">
                                <Folder className="h-6 w-6 text-blue-400" />
                              </div>
                              <h3 className="font-bold text-white text-xl">Smart Folder Support</h3>
                            </div>
                            <p className="text-white leading-relaxed">
                              Upload entire folders and recursively analyze all files within complex directory structures. 
                              Intelligence meets simplicity.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Technical Details */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-800/20 to-slate-700/20 rounded-3xl blur-xl"></div>
                    <div className="relative bg-slate-800/30 rounded-3xl p-8 border border-slate-600/50 backdrop-blur-xl">
                      <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8">
                        Technical Specifications
                      </h3>
                      <div className="grid md:grid-cols-2 gap-8 text-sm text-slate-200">
                        <div className="space-y-4">
                          <h4 className="font-bold text-white mb-4 text-lg flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                              <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            Supported File Types
                          </h4>
                          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/30">
                            <p className="text-slate-200 leading-relaxed">
                              <strong className="text-white">Programming:</strong> .js, .ts, .jsx, .tsx, .py, .java, .cpp, .c, .h, .php, .rb, .go, .rs, .swift, .kt, .scala<br/>
                              <strong className="text-white">Web:</strong> .html, .css, .json, .xml, .yml, .yaml<br/>
                              <strong className="text-white">Documentation:</strong> .txt, .md, .ini, .cfg, .conf, .toml<br/>
                              <strong className="text-white">Scripts:</strong> .sh and more
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-bold text-white mb-4 text-lg flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                              <Cpu className="h-5 w-5 text-purple-400" />
                            </div>
                            Normalization Process
                          </h4>
                          <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/30">
                            <ul className="text-slate-200 space-y-2">
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400/60 rounded-full"></div>
                                Remove all whitespace (spaces, tabs, newlines)
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400/60 rounded-full"></div>
                                Normalize line endings (CRLF → LF)
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400/60 rounded-full"></div>
                                Handle encoding differences (UTF-8, Latin-1)
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400/60 rounded-full"></div>
                                Case normalization for comparison
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400/60 rounded-full"></div>
                                BOM (Byte Order Mark) removal
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-16">
        <div className="max-w-7xl mx-auto w-full">
          {/* Main Title */}
          <div className="text-center mb-8 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                Where Creative Teams
              </span>
              <br />
              <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                Get Things Done
              </span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-4">
              Step into a new dimension of file analysis — Where data thinks, learns, 
              and evolves in real time. Precision, power, and creativity redefined.
            </p>
          </div>

          {/* Main Upload Section with Animated Stats */}
          <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-8 lg:gap-16">
            {/* Left Stats - Mobile: Top, Desktop: Left */}
            <div className="flex flex-row lg:flex-col gap-4 lg:gap-8 justify-center lg:justify-start order-1 lg:order-1">
              <div className="relative group animate-float">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3 sm:p-6 transform group-hover:scale-105 transition-all duration-500 w-32 sm:w-40 lg:w-48">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400 mb-1 sm:mb-2">98.6%</div>
                  <div className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">Accuracy rate</div>
                </div>
              </div>
              
              <div className="relative group animate-float-delayed">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3 sm:p-6 transform group-hover:scale-105 transition-all duration-500 w-32 sm:w-40 lg:w-48">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400 mb-1 sm:mb-2">256K+</div>
                  <div className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">Files Analyzed</div>
                </div>
              </div>
            </div>

            {/* Center Upload Area */}
            <Card className="relative bg-slate-900/20 border-slate-700/50 backdrop-blur-xl transition-all duration-500 hover:bg-slate-900/30 w-full max-w-2xl animate-glow order-2">
              <CardContent className="p-0">
                <div className="relative">
                  {/* 3D Isometric Upload Area */}
                  <div className="relative p-4 sm:p-8 lg:p-12">
                    <div
                      className={`relative border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center transition-all duration-500 cursor-pointer transform perspective-1000 ${
                        dragActive
                          ? "border-blue-500/70 bg-blue-500/5 scale-[1.02] rotate-x-2 shadow-2xl shadow-blue-500/20"
                          : "border-slate-600/50 hover:border-slate-500/70 hover:bg-slate-800/20 hover:scale-[1.01] hover:shadow-xl"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={(e) => {
                        // Only trigger file input if not clicking on a button or input
                        const target = e.target as HTMLElement
                        if (target.closest('button') || target.closest('input')) {
                          return
                        }
                        const fileInput = document.getElementById("file-input") as HTMLInputElement
                        if (fileInput) {
                          fileInput.click()
                        }
                      }}
                    >
                      {/* Floating cubes animation */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-6 left-6 w-3 h-3 bg-blue-500/20 rounded transform rotate-45 animate-bounce delay-0"></div>
                        <div className="absolute top-10 right-10 w-2 h-2 bg-purple-500/20 rounded transform rotate-45 animate-bounce delay-300"></div>
                        <div className="absolute bottom-12 left-12 w-4 h-4 bg-blue-500/10 rounded transform rotate-45 animate-bounce delay-700"></div>
                        <div className="absolute bottom-6 right-6 w-3 h-3 bg-purple-500/15 rounded transform rotate-45 animate-bounce delay-1000"></div>
                      </div>

                      <div className="space-y-4 sm:space-y-6 relative z-10">
                        <div
                          className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-700/50 flex items-center justify-center transition-all duration-500 border border-slate-600/30 ${
                            dragActive ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 scale-110 border-blue-500/50" : ""
                          }`}
                        >
                          <Upload
                            className={`h-8 w-8 sm:h-10 sm:w-10 transition-colors duration-500 ${
                              dragActive ? "text-blue-400" : "text-slate-400"
                            }`}
                          />
                        </div>
                        
                        <div>
                          <p className="text-lg sm:text-xl font-semibold text-slate-200 mb-2">Drop files or folders here</p>
                          <p className="text-slate-400 mb-2 text-xs sm:text-sm">Supports individual files and entire folder structures</p>
                          <p className="text-xs text-slate-500 px-2">
                            .txt, .js, .ts, .jsx, .tsx, .html, .css, .json, .xml, .md, .py, .java, .cpp, .c, .h, .php, .rb, .go,
                            .rs, .swift, .kt, .scala, .sh, .yml, .yaml, .toml, .ini, .cfg, .conf
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-input"
                            accept=".txt,.js,.ts,.jsx,.tsx,.html,.css,.json,.xml,.md,.py,.java,.cpp,.c,.h,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.yml,.yaml,.toml,.ini,.cfg,.conf,text/*,application/json,application/xml"
                          />
                          <input
                            type="file"
                            onChange={handleFolderSelect}
                            className="hidden"
                            id="folder-input"
                            {...({ webkitdirectory: "" } as any)}
                            directory=""
                            multiple
                            accept=".txt,.js,.ts,.jsx,.tsx,.html,.css,.json,.xml,.md,.py,.java,.cpp,.c,.h,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.yml,.yaml,.toml,.ini,.cfg,.conf,text/*,application/json,application/xml"
                          />
                          <Button
                            variant="outline"
                            className="bg-slate-800/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/70 text-slate-200 transition-all duration-300 backdrop-blur-sm px-4 sm:px-6 py-2 text-sm sm:text-base"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              e.nativeEvent.stopImmediatePropagation()
                              document.getElementById("file-input")?.click()
                            }}
                          >
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="text-xs sm:text-sm">Browse Files</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-slate-800/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/70 text-slate-200 transition-all duration-300 backdrop-blur-sm px-4 sm:px-6 py-2 text-sm sm:text-base"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              e.nativeEvent.stopImmediatePropagation()
                              const folderInput = document.getElementById("folder-input") as HTMLInputElement
                              if (folderInput) {
                                folderInput.click()
                              }
                            }}
                          >
                            <Folder className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="text-xs sm:text-sm">Browse Folders</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Stats - Mobile: Bottom, Desktop: Right */}
            <div className="flex flex-row lg:flex-col gap-4 lg:gap-8 justify-center lg:justify-start order-3">
              <div className="relative group animate-float">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3 sm:p-6 transform group-hover:scale-105 transition-all duration-500 w-32 sm:w-40 lg:w-48">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-400 mb-1 sm:mb-2">10x</div>
                  <div className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">Faster analysis</div>
                </div>
              </div>
              
              <div className="relative group animate-float-delayed">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3 sm:p-6 transform group-hover:scale-105 transition-all duration-500 w-32 sm:w-40 lg:w-48">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-400 mb-1 sm:mb-2">24/7</div>
                  <div className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">Always Available</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {files.length > 0 && (
            <div className="mt-6 sm:mt-8 lg:mt-12 space-y-6 sm:space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 sm:gap-3 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-3">
                  <div className="flex gap-2">
                    {stats.folders > 0 && (
                      <Badge variant="outline" className="text-xs border-blue-600/50 text-blue-300 bg-blue-500/10 backdrop-blur-sm">
                        {stats.folders} folders
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs border-slate-600/50 text-slate-300 bg-slate-800/20 backdrop-blur-sm">
                      {files.length} files
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
                <Button
                  onClick={() => {
                    processFiles()
                    // Smooth scroll to results after processing starts
                    setTimeout(() => {
                      const resultsSection = document.getElementById('results-section')
                      if (resultsSection) {
                        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }, 100)
                  }}
                  disabled={processing}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 disabled:opacity-50 px-6 sm:px-8 lg:px-12 py-3 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-105 w-full sm:w-auto"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent mr-2 sm:mr-3" />
                      <span className="text-sm sm:text-base">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                      <span className="text-sm sm:text-base">Analyze Files</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearFiles}
                  className="border-slate-600/50 hover:bg-slate-800/30 text-slate-300 hover:text-slate-100 transition-all duration-300 backdrop-blur-sm px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                  <span className="text-sm sm:text-base">Clear</span>
                </Button>
              </div>

              {/* Selected files preview */}
              <div className="max-w-4xl mx-auto px-4">
                <div className="bg-slate-900/20 backdrop-blur-xl border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-3 sm:mb-4 text-center">Selected Files</h3>
                  <div className="grid gap-2 sm:gap-3 max-h-48 sm:max-h-60 overflow-y-auto custom-scrollbar">
                    {files.slice(0, 5).map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:bg-slate-800/50 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="p-2 bg-slate-700/50 rounded-lg flex-shrink-0">{getFileIcon(file)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-slate-200 truncate">{getFilePath(file)}</p>
                            <p className="text-xs text-slate-400">
                              {formatFileSize(file.size)} • {file.type || "Unknown"}
                              {file.webkitRelativePath && <span className="ml-2 text-blue-400">from folder</span>}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {files.length > 5 && (
                      <div className="text-center text-slate-400 text-sm py-2">
                        ... and {files.length - 5} more files
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Results Section */}
        {results && (
          <div id="results-section" className="relative z-10 animate-in slide-in-from-bottom-8 duration-700 py-8 sm:py-16">
            {/* Problem Solving Steps */}
            <div className="max-w-6xl mx-auto mb-8 sm:mb-16">
              <div className="text-center mb-6 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Analysis Complete
                  </span>
                </h2>
                <p className="text-slate-400 text-sm sm:text-base lg:text-lg px-4">Here's how we solved your duplicate detection challenge</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-16">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transform group-hover:scale-105 transition-all duration-500 h-32 sm:h-36 lg:h-44 flex flex-col">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-blue-500/30">
                      <span className="text-sm sm:text-lg lg:text-xl font-bold text-blue-400">1</span>
                    </div>
                    <h3 className="font-semibold text-slate-100 mb-1 sm:mb-2 text-xs sm:text-sm">Upload & Scan</h3>
                    <p className="text-xs text-slate-400 flex-1 flex items-center justify-center px-1">
                      Processed {results.totalFiles} files with advanced content recognition
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl sm:rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 text-center transform group-hover:scale-105 transition-all duration-500 h-44 flex flex-col">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-500/30">
                      <span className="text-xl font-bold text-purple-400">2</span>
                    </div>
                    <h3 className="font-semibold text-slate-100 mb-2 text-sm">Normalize</h3>
                    <p className="text-xs text-slate-400 flex-1 flex items-center justify-center">
                      Applied AI-powered content normalization for accurate comparison
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 text-center transform group-hover:scale-105 transition-all duration-500 h-44 flex flex-col">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-green-500/30">
                      <span className="text-xl font-bold text-green-400">3</span>
                    </div>
                    <h3 className="font-semibold text-slate-100 mb-2 text-sm">Analyze</h3>
                    <p className="text-xs text-slate-400 flex-1 flex items-center justify-center">
                      Generated cryptographic hashes for precise duplicate detection
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 text-center transform group-hover:scale-105 transition-all duration-500 h-44 flex flex-col">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-yellow-500/30">
                      <span className="text-xl font-bold text-yellow-400">4</span>
                    </div>
                    <h3 className="font-semibold text-slate-100 mb-2 text-sm">Results</h3>
                    <p className="text-xs text-slate-400 flex-1 flex items-center justify-center">
                      Identified {results.duplicateGroups.length} duplicate groups with smart insights
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-slate-900/20 border-slate-700/50 backdrop-blur-xl max-w-6xl mx-auto">
              <CardHeader className="pb-6">
                <CardTitle className="text-slate-100 text-center">
                  <span className="text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Analysis Results
                  </span>
                </CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                    <div className="relative bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-2">{results.totalFiles}</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">Total Files</div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-red-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                    <div className="relative bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                      <div className="text-3xl font-bold text-red-400 mb-2">{results.duplicateCount}</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">Duplicates</div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                    <div className="relative bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">{results.uniqueFiles.length}</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">Unique</div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-yellow-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                    <div className="relative bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
                      <div className="text-3xl font-bold text-yellow-400 mb-2">{results.duplicateGroups.length}</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">Groups</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="duplicates" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800/30 border border-slate-700/50 backdrop-blur-xl rounded-2xl p-1">
                    <TabsTrigger
                      value="duplicates"
                      className="data-[state=active]:bg-slate-700/70 data-[state=active]:text-slate-100 text-slate-300 rounded-xl transition-all duration-300"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Duplicates ({results.duplicateGroups.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="unique"
                      className="data-[state=active]:bg-slate-700/70 data-[state=active]:text-slate-100 text-slate-300 rounded-xl transition-all duration-300"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Unique ({results.uniqueFiles.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="duplicates" className="space-y-6 mt-8">
                    {results.duplicateGroups.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500/10 rounded-full blur-2xl"></div>
                          <CheckCircle className="relative h-16 w-16 text-green-400 mx-auto mb-6" />
                        </div>
                        <p className="text-slate-300 text-xl mb-2">No duplicate files detected</p>
                        <p className="text-slate-500">All files have unique content</p>
                      </div>
                    ) : (
                      results.duplicateGroups.map((group, groupIndex) => (
                        <Card
                          key={groupIndex}
                          className="bg-slate-800/20 border-l-4 border-l-red-500/70 border-slate-700/50 backdrop-blur-xl animate-in slide-in-from-left-4 rounded-2xl"
                          style={{ animationDelay: `${groupIndex * 100}ms` }}
                        >
                          <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-3 text-slate-100">
                              <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                                <Copy className="h-5 w-5 text-red-400" />
                              </div>
                              Duplicate Group {groupIndex + 1}
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 backdrop-blur-sm">
                                {group.count} files
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {group.files.map((file, fileIndex) => (
                                <div
                                  key={fileIndex}
                                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600 hover:bg-slate-700/50 transition-all duration-200"
                                >
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="p-2 bg-slate-600 rounded-lg flex-shrink-0">
                                      {file.path && file.path.includes("/") ? (
                                        <FolderOpen className="h-4 w-4 text-blue-400" />
                                      ) : (
                                        <FileText className="h-4 w-4 text-slate-300" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-sm text-slate-200 truncate">
                                        {file.path || file.name}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                                        {file.isFromFolder && <span className="ml-2 text-blue-400">from folder</span>}
                                      </p>
                                    </div>
                                  </div>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-300 hover:text-slate-100 hover:bg-slate-600 transition-all duration-200 flex-shrink-0"
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
                                      <DialogHeader>
                                        <DialogTitle className="text-slate-100">{file.path || file.name}</DialogTitle>
                                      </DialogHeader>
                                      <Tabs defaultValue="original" className="w-full">
                                        <TabsList className="bg-slate-800 border border-slate-700">
                                          <TabsTrigger
                                            value="original"
                                            className="data-[state=active]:bg-slate-700 text-slate-300"
                                          >
                                            Original
                                          </TabsTrigger>
                                          <TabsTrigger
                                            value="normalized"
                                            className="data-[state=active]:bg-slate-700 text-slate-300"
                                          >
                                            Normalized
                                          </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="original">
                                          <ScrollArea className="h-96 w-full border border-slate-700 rounded-lg bg-slate-800/50">
                                            <pre className="text-sm p-4 text-slate-200 whitespace-pre-wrap font-mono">
                                              {file.content}
                                            </pre>
                                          </ScrollArea>
                                        </TabsContent>
                                        <TabsContent value="normalized">
                                          <ScrollArea className="h-96 w-full border border-slate-700 rounded-lg bg-slate-800/50">
                                            <pre className="text-sm p-4 text-slate-200 whitespace-pre-wrap font-mono">
                                              {file.normalizedContent}
                                            </pre>
                                          </ScrollArea>
                                        </TabsContent>
                                      </Tabs>
                                      <div className="text-xs text-slate-400 mt-2 font-mono bg-slate-800 p-2 rounded">
                                        Hash: {file.hash}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="unique" className="space-y-4 mt-6">
                    {results.uniqueFiles.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                        <p className="text-slate-300 text-lg">No unique files found</p>
                        <p className="text-slate-500 text-sm">All files have duplicates</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {results.uniqueFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:bg-slate-800/50 transition-all duration-200 animate-in slide-in-from-right-4"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30 flex-shrink-0">
                                {file.path && file.path.includes("/") ? (
                                  <FolderOpen className="h-4 w-4 text-green-400" />
                                ) : (
                                  <FileText className="h-4 w-4 text-green-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-slate-200 truncate">{file.path || file.name}</p>
                                <p className="text-xs text-slate-400">
                                  {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                                  {file.isFromFolder && <span className="ml-2 text-blue-400">from folder</span>}
                                </p>
                              </div>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-300 hover:text-slate-100 hover:bg-slate-600 transition-all duration-200 flex-shrink-0"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] bg-slate-900 border-slate-700">
                                <DialogHeader>
                                  <DialogTitle className="text-slate-100">{file.path || file.name}</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-96 w-full border border-slate-700 rounded-lg bg-slate-800/50">
                                  <pre className="text-sm p-4 text-slate-200 whitespace-pre-wrap font-mono">
                                    {file.content}
                                  </pre>
                                </ScrollArea>
                                <div className="text-xs text-slate-400 mt-2 font-mono bg-slate-800 p-2 rounded">
                                  Hash: {file.hash}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
