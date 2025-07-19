// Analytics tracking utilities for Duplicate File Analyzer

interface AnalyticsData {
  totalFilesAnalyzed: number
  totalSessions: number
  totalDuplicatesFound: number
  lastAnalysisDate: string
  dailyStats: Array<{
    date: string
    files: number
    sessions: number
    duplicates: number
  }>
  fileTypeStats: Record<string, number>
  averageFilesPerSession: number
}

const ANALYTICS_KEY = "duplicate-analyzer-analytics"

// Initialize analytics data structure
const getDefaultAnalytics = (): AnalyticsData => ({
  totalFilesAnalyzed: 0,
  totalSessions: 0,
  totalDuplicatesFound: 0,
  lastAnalysisDate: "Never",
  dailyStats: [],
  fileTypeStats: {},
  averageFilesPerSession: 0
})

// Get current analytics data
export const getAnalytics = (): AnalyticsData => {
  if (typeof window === "undefined") return getDefaultAnalytics()
  
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Error reading analytics:", error)
  }
  
  return getDefaultAnalytics()
}

// Save analytics data
const saveAnalytics = (data: AnalyticsData) => {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Error saving analytics:", error)
  }
}

// Get today's date string
const getTodayString = () => {
  return new Date().toISOString().split('T')[0]
}

// Track a new session
export const trackSession = () => {
  const analytics = getAnalytics()
  const today = getTodayString()
  
  analytics.totalSessions += 1
  
  // Update or create today's stats
  const todayStats = analytics.dailyStats.find(stat => stat.date === today)
  if (todayStats) {
    todayStats.sessions += 1
  } else {
    analytics.dailyStats.push({
      date: today,
      files: 0,
      sessions: 1,
      duplicates: 0
    })
  }
  
  saveAnalytics(analytics)
}

// Track file analysis
export const trackFileAnalysis = (
  filesAnalyzed: number, 
  duplicatesFound: number, 
  fileTypes: string[]
) => {
  const analytics = getAnalytics()
  const today = getTodayString()
  
  // Update totals
  analytics.totalFilesAnalyzed += filesAnalyzed
  analytics.totalDuplicatesFound += duplicatesFound
  analytics.lastAnalysisDate = new Date().toISOString()
  
  // Update file type stats
  fileTypes.forEach(fileType => {
    const extension = fileType.toLowerCase()
    analytics.fileTypeStats[extension] = (analytics.fileTypeStats[extension] || 0) + 1
  })
  
  // Update today's stats
  const todayStats = analytics.dailyStats.find(stat => stat.date === today)
  if (todayStats) {
    todayStats.files += filesAnalyzed
    todayStats.duplicates += duplicatesFound
  } else {
    analytics.dailyStats.push({
      date: today,
      files: filesAnalyzed,
      sessions: 0,
      duplicates: duplicatesFound
    })
  }
  
  // Calculate average files per session
  analytics.averageFilesPerSession = analytics.totalSessions > 0 
    ? analytics.totalFilesAnalyzed / analytics.totalSessions 
    : 0
  
  // Keep only last 30 days of daily stats
  analytics.dailyStats = analytics.dailyStats
    .filter(stat => {
      const statDate = new Date(stat.date)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return statDate >= thirtyDaysAgo
    })
    .sort((a, b) => a.date.localeCompare(b.date))
  
  saveAnalytics(analytics)
}

// Clear all analytics data
export const clearAnalytics = () => {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(ANALYTICS_KEY)
  } catch (error) {
    console.error("Error clearing analytics:", error)
  }
}

// Get file extension from filename
export const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return 'no-extension'
  return filename.slice(lastDot).toLowerCase()
}
