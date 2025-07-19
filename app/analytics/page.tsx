"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  BarChart3, 
  FileText, 
  Users, 
  Clock, 
  TrendingUp, 
  Database,
  Shield,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react"

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

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

export default function AnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check if already authenticated in this session
    const authStatus = sessionStorage.getItem("analytics-auth")
    if (authStatus === "true") {
      setIsAuthenticated(true)
      loadAnalytics()
    }
  }, [])

  const loadAnalytics = () => {
    try {
      const stored = localStorage.getItem("duplicate-analyzer-analytics")
      if (stored) {
        const data = JSON.parse(stored)
        setAnalytics(data)
      } else {
        // Initialize empty analytics
        const emptyAnalytics: AnalyticsData = {
          totalFilesAnalyzed: 0,
          totalSessions: 0,
          totalDuplicatesFound: 0,
          lastAnalysisDate: "Never",
          dailyStats: [],
          fileTypeStats: {},
          averageFilesPerSession: 0
        }
        setAnalytics(emptyAnalytics)
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
    }
  }

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem("analytics-auth", "true")
      loadAnalytics()
      setPassword("")
    } else {
      alert("Incorrect password!")
    }
  }

  const clearAnalytics = () => {
    if (confirm("Are you sure you want to clear all analytics data? This action cannot be undone.")) {
      localStorage.removeItem("duplicate-analyzer-analytics")
      loadAnalytics()
    }
  }

  const formatDate = (dateString: string) => {
    if (dateString === "Never") return dateString
    return new Date(dateString).toLocaleDateString()
  }

  const getTopFileTypes = () => {
    if (!analytics?.fileTypeStats) return []
    return Object.entries(analytics.fileTypeStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 sm:px-6">
        <Card className="w-full max-w-sm sm:max-w-md bg-slate-900/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl font-bold text-white mb-2">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-3 sm:mb-4 text-blue-400" />
              Analytics Dashboard
            </CardTitle>
            <p className="text-slate-400 text-sm sm:text-base">Enter password to access analytics</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                className="bg-slate-800/30 border-slate-600/50 text-white pr-12 text-sm sm:text-base"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
              </Button>
            </div>
            <Button 
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
              disabled={!password}
            >
              Access Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30 flex-shrink-0">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Analytics Dashboard</h1>
                <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">Duplicate File Analyzer Performance Metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Button
                variant="outline"
                onClick={clearAnalytics}
                className="border-red-600/50 text-red-400 hover:bg-red-500/10 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Clear Data</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/"}
                className="border-slate-600/50 text-slate-300 hover:bg-slate-800/30 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Back to App</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="bg-slate-900/20 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-center sm:text-left">
                  <p className="text-slate-400 text-xs sm:text-sm">Total Files Analyzed</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400">{analytics.totalFilesAnalyzed.toLocaleString()}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/20 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-center sm:text-left">
                  <p className="text-slate-400 text-xs sm:text-sm">Total Sessions</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400">{analytics.totalSessions.toLocaleString()}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/20 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-center sm:text-left">
                  <p className="text-slate-400 text-xs sm:text-sm">Duplicates Found</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-400">{analytics.totalDuplicatesFound.toLocaleString()}</p>
                </div>
                <Database className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/20 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-center sm:text-left">
                  <p className="text-slate-400 text-xs sm:text-sm">Avg Files/Session</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-400">{analytics.averageFilesPerSession.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Recent Activity */}
          <Card className="bg-slate-900/20 border-slate-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0">
                  <span className="text-slate-400 text-sm">Last Analysis:</span>
                  <span className="text-white text-sm">{formatDate(analytics.lastAnalysisDate)}</span>
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-medium text-sm sm:text-base">Recent Daily Stats:</h4>
                  {analytics.dailyStats.slice(-5).reverse().map((day, index) => (
                    <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-3 bg-slate-800/30 rounded-lg gap-2 sm:gap-0">
                      <span className="text-slate-300 text-sm">{formatDate(day.date)}</span>
                      <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-blue-400">{day.files} files</span>
                        <span className="text-green-400">{day.sessions} sessions</span>
                        <span className="text-red-400">{day.duplicates} duplicates</span>
                      </div>
                    </div>
                  ))}
                  {analytics.dailyStats.length === 0 && (
                    <p className="text-slate-500 text-center py-4 text-sm">No daily data available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Types */}
          <Card className="bg-slate-900/20 border-slate-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                Top File Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getTopFileTypes().map(([extension, count], index) => (
                  <div key={extension} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        #{index + 1}
                      </Badge>
                      <span className="text-white font-mono">{extension}</span>
                    </div>
                    <span className="text-slate-400">{count.toLocaleString()} files</span>
                  </div>
                ))}
                {getTopFileTypes().length === 0 && (
                  <p className="text-slate-500 text-center py-4">No file type data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="bg-slate-900/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  {analytics.totalSessions > 0 ? ((analytics.totalDuplicatesFound / analytics.totalFilesAnalyzed) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-slate-400 text-sm">Duplicate Detection Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {Object.keys(analytics.fileTypeStats).length}
                </div>
                <p className="text-slate-400 text-sm">Different File Types Processed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 mb-2">
                  {analytics.dailyStats.length}
                </div>
                <p className="text-slate-400 text-sm">Days of Data Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
