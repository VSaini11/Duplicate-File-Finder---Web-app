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
    %% Main Flow
    A["🔄 User Uploads Files"] --> B["✓ File Validation"]
    B --> C["📖 Content Reading"]
    C --> D["🧠 AI Normalization"]
    D --> E["🔐 SHA-256 Hash Generation"]
    E --> F["🔍 Duplicate Detection"]
    F --> G["📊 Group Formation"]
    G --> H["📋 Results Generation"]
    H --> I["📈 Analytics Tracking"]
    I --> J["💾 Local Storage"]
    
    %% Analytics Flow
    K["📊 Analytics Dashboard"] --> L["🔒 Authentication"]
    L --> M["📥 Data Retrieval"]
    M --> N["📊 Statistics Display"]
    
    %% Additional Tracking
    O["⏱️ Session Tracking"] --> J
    P["📁 File Type Analysis"] --> J
    Q["⚡ Performance Metrics"] --> J
    
    %% Styling for better visibility
    style A fill:#e1f5fe,stroke:#0277bd,stroke-width:2px,color:#000000
    style B fill:#fff,stroke:#333,stroke-width:2px,color:#000000
    style C fill:#fff,stroke:#333,stroke-width:2px,color:#000000
    style D fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000000
    style E fill:#fff,stroke:#333,stroke-width:2px,color:#000000
    style F fill:#e1f5fe,stroke:#0277bd,stroke-width:2px,color:#000000
    style G fill:#fff,stroke:#333,stroke-width:2px,color:#000000
    style H fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px,color:#000000
    style I fill:#fff,stroke:#333,stroke-width:2px,color:#000000
    style J fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px,color:#000000
    style K fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000000
    style L fill:#fff,stroke:#333,stroke-width:2px,color:#000000
    style M fill:#fff,stroke:#333,stroke-width:2px,color:#000000
    style N fill:#fff,stroke:#333,stroke-width:2px,color:#000000
    style O fill:#fff,stroke:#333,stroke-width:2px,color:#000000
    style P fill:#fff,stroke:#333,stroke-width:2px,color:#000000
    style Q fill:#fff,stroke:#333,stroke-width:2px,color:#000000
```
### 5. User Interface Design Layout

```mermaid
flowchart TB
    subgraph UI["App Interface"]
        direction TB
        
        subgraph HEADER["Summary Dashboard"]
            S1["📊 Files Scanned"]
            S2["⚠️ Duplicates Found"]
            S3["💾 Potential Savings"]
            S1 --- S2 --- S3
        end
        
        UPLOAD["📁 Upload Area<br/>Drag & Drop Files/Folders"]
        
        subgraph RESULTS["Analysis Results"]
            TABLE["📄 Results Table<br/>Showing Duplicate Groups"]
            
            subgraph ACTIONS["Action Bar"]
                DEL["🗑️ Delete<br/>Duplicates"]
                EXP["📥 Export<br/>Data"]
                DEL --- EXP
            end
            
            TABLE --> ACTIONS
        end

        HEADER --> UPLOAD
        UPLOAD --> RESULTS
    end

    %% Styling
    style UI fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style HEADER fill:#f8f9fa,stroke:#666666,stroke-width:1px,color:#000000
    style UPLOAD fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000000
    style RESULTS fill:#f8f9fa,stroke:#666666,stroke-width:1px,color:#000000
    style ACTIONS fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style S1 fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style S2 fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style S3 fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style TABLE fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style DEL fill:#e3f2fd,stroke:#1565c0,stroke-width:1px,color:#000000
    style EXP fill:#e3f2fd,stroke:#1565c0,stroke-width:1px,color:#000000
```

### 4.1 Use Case Diagram

```mermaid
graph LR
    User((👤 User))

    subgraph DFD["Duplicate File Detector System"]
        UC1["📁 Upload File"]
        UC2["🔍 Detect Duplicates"]
        UC3["👀 Review Duplicates"]
        UC4["🗑️ Delete Duplicates"]
        UC5["📥 Export Cleaned Data"]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5

    %% Styling for better visibility
    style User fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style DFD fill:#f8f9fa,stroke:#666666,stroke-width:2px,color:#000000
    style UC1 fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000000
    style UC2 fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000000
    style UC3 fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000000
    style UC4 fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000000
    style UC5 fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000000
```

### 4.3 System Flow Diagram

```mermaid
flowchart TD
    A([Start]) --> B[/Upload Dataset/Files/]
    B --> C[Parse Data]
    C --> D[Preprocess Data]
    D --> E[AI Content Normalization]
    E --> F[Generate SHA-256 Hash Values]
    F --> G{Detect Duplicates}
    G -->|Compare Hashes| H[Identify Duplicate Groups]
    H --> I[Display Duplicate Records]
    I --> J[/User Confirms Actions/]
    J --> K[Export Cleaned Data]
    K --> L([End])

    style A fill:#f9f9f9,stroke:#333,stroke-width:2px,color:#000
    style B fill:#fff,stroke:#333,stroke-width:2px,color:#000
    style C fill:#fff,stroke:#333,stroke-width:2px,color:#000
    style D fill:#fff,stroke:#333,stroke-width:2px,color:#000
    style E fill:#e8f5e9,stroke:#2e7d32,color:#000
    style F fill:#fff,stroke:#333,stroke-width:2px,color:#000
    style G fill:#e1f5fe,stroke:#01579b,color:#000
    style H fill:#fff,stroke:#333,stroke-width:2px,color:#000
    style I fill:#fff,stroke:#333,stroke-width:2px,color:#000
    style J fill:#fff,stroke:#333,stroke-width:2px,color:#000
    style K fill:#fff,stroke:#333,stroke-width:2px,color:#000
    style L fill:#f9f9f9,stroke:#333,stroke-width:2px,color:#000
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
