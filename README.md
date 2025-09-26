# Duplicate File Detector

An advanced AI-powered duplicate file detection tool built with Next.js, TypeScript, and modern web technologies.

## Features

- 🔍 **Advanced Detection**: AI-powered content normalization for precise duplicate detection
- 📁 **Folder Support**: Upload entire folders and analyze directory structures
- 🚀 **High Performance**: Optimized for analyzing 1000+ files with batch processing
- 🎨 **Modern UI**: Beautiful glassmorphism design with responsive layout
- 📊 **Analytics Dashboard**: Private admin dashboard to track app performance
- 🔐 **Secure**: Password-protected analytics with local data storage
- ⚡ **Fast Processing**: Parallel file processing with progress tracking

## Supported File Types

- **Programming**: .js, .ts, .jsx, .tsx, .py, .java, .cpp, .c, .h, .php, .rb, .go, .rs, .swift, .kt, .scala
- **Web**: .html, .css, .json, .xml, .yml, .yaml
- **Documentation**: .txt, .md, .ini, .cfg, .conf, .toml
- **Scripts**: .sh and more

## How It Works

1. **Upload & Scan**: Drag & drop files or folders for analysis
2. **AI Normalization**: Advanced content normalization removes formatting differences
3. **Cryptographic Hash**: Generates SHA-256 hashes for precise comparison
4. **Smart Analysis**: Groups duplicates with detailed insights and preview capabilities

## Project Structure

```
duplicate-file-detector/
├── app/
│   ├── globals.css                 # Global styles and Tailwind CSS
│   ├── layout.tsx                  # Root layout with metadata
│   ├── loading.tsx                 # Loading component
│   ├── page.tsx                    # Main duplicate detector interface
│   ├── analytics/
│   │   └── page.tsx               # Private analytics dashboard
│   └── api/
│       └── process-files/
│           └── route.ts           # File processing API endpoint
├── components/
│   ├── theme-provider.tsx         # Dark theme provider
│   └── ui/                        # Reusable UI components (Radix UI)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── tabs.tsx
│       └── [other UI components]
├── hooks/
│   └── use-toast.ts              # Toast notification hook
├── lib/
│   ├── analytics.ts              # Analytics tracking utilities
│   └── utils.ts                  # Utility functions and helpers
├── public/                       # Static assets
├── styles/
│   └── globals.css              # Additional global styles
├── .env.local                   # Environment variables (git ignored)
├── .gitignore                   # Git ignore rules
├── components.json              # Radix UI configuration
├── next.config.mjs              # Next.js configuration
├── package.json                 # Dependencies and scripts
├── README.md                    # Project documentation
├── tailwind.config.ts           # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        string session_id PK
        datetime session_start
        string user_agent
        int files_analyzed
        int duplicates_found
    }
    
    FILE {
        string file_id PK
        string name
        string path
        int size
        string type
        datetime last_modified
        string hash
        boolean is_from_folder
        string original_content
        string normalized_content
    }
    
    DUPLICATE_GROUP {
        string group_id PK
        string hash
        int file_count
        datetime created_at
    }
    
    ANALYTICS {
        string analytics_id PK
        int total_files_analyzed
        int total_sessions
        int total_duplicates_found
        datetime last_analysis_date
        float average_files_per_session
    }
    
    DAILY_STATS {
        string date PK
        int files_processed
        int sessions_count
        int duplicates_found
        datetime created_at
    }
    
    FILE_TYPE_STATS {
        string extension PK
        int count
        datetime last_updated
    }
    
    PROCESSING_RESULT {
        string result_id PK
        int total_files
        int duplicate_count
        int unique_count
        int duplicate_groups_count
        datetime processed_at
    }

    %% Relationships
    USER ||--o{ FILE : uploads
    FILE ||--o{ DUPLICATE_GROUP : "belongs to"
    USER ||--o{ ANALYTICS : generates
    ANALYTICS ||--o{ DAILY_STATS : contains
    FILE ||--o{ FILE_TYPE_STATS : "contributes to"
    USER ||--o{ PROCESSING_RESULT : creates
    PROCESSING_RESULT ||--o{ DUPLICATE_GROUP : contains
    PROCESSING_RESULT ||--o{ FILE : processes
```

## Data Flow Architecture

```mermaid
flowchart TD
    A[User Uploads Files] --> B[File Validation]
    B --> C[Content Reading]
    C --> D[AI Normalization]
    D --> E[SHA-256 Hash Generation]
    E --> F[Duplicate Detection]
    F --> G[Group Formation]
    G --> H[Results Generation]
    H --> I[Analytics Tracking]
    I --> J[Local Storage]
    
    K[Analytics Dashboard] --> L[Authentication]
    L --> M[Data Retrieval]
    M --> N[Statistics Display]
    
    O[Session Tracking] --> J
    P[File Type Analysis] --> J
    Q[Performance Metrics] --> J
    
    style A fill:#e1f5fe
    style H fill:#f3e5f5
    style J fill:#e8f5e8
    style K fill:#fff3e0
```

## Technology Stack

- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Processing**: Web APIs (File API, FormData, Crypto)

## Performance

- **Batch Processing**: Handles large file sets efficiently (50 files per batch)
- **Parallel Processing**: Uses Promise.all for concurrent file analysis
- **Memory Optimization**: 5MB file size limit with streaming processing
- **Progress Tracking**: Real-time feedback during analysis

## License

This project is licensed under the MIT License.
