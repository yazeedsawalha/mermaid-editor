export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  code: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "flowchart",
    name: "Flowchart",
    description: "Process flow diagram",
    icon: "GitBranch",
    code: `flowchart TD
    %% Entry
    Start([Start]) --> Input[/User Request/]
    Input --> Valid{Valid Input?}

    %% Validation branch
    Valid -- No --> ErrMsg[Show Error]
    ErrMsg --> Input
    Valid -- Yes --> Auth{Authenticated?}

    %% Auth branch
    Auth -- No --> Login(Login Page)
    Login --> Auth
    Auth -- Yes --> Process

    %% Processing subgraph
    subgraph Process[Data Processing]
        direction TB
        Fetch[(Query DB)] --> Hit{{Cache Hit?}}
        Hit -- Yes --> Cached[Return Cached]
        Hit -- No --> Compute[Compute Result]
        Compute ==> Store[(Persist Result)]
        Store --> Cached
        Compute -.-> Log[/Audit Log/]
    end

    %% Output
    Cached --> Notify((Notify User))
    Notify --> Done([Done])

    %% All node shapes reference
    subgraph Shapes[Node Shape Reference]
        direction LR
        s1[Rectangle] --- s2(Rounded)
        s2 --- s3([Stadium])
        s3 --- s4[[Subroutine]]
        s4 --- s5[(Database)]
        s5 --- s6((Circle))
        s6 --- s7{Diamond}
        s7 --- s8{{Hexagon}}
        s8 --- s9(((Double Circle)))
    end

    %% Link types reference
    subgraph Links[Arrow Type Reference]
        direction LR
        l1[Arrow] --> l2[Open] --- l3[Dotted] -.-> l4[Thick] ==> l5[Bidir] <--> l6[End]
    end

    %% Styles
    classDef green  fill:#22c55e,color:#fff,stroke:#16a34a
    classDef red    fill:#ef4444,color:#fff,stroke:#dc2626
    classDef blue   fill:#3b82f6,color:#fff,stroke:#2563eb
    classDef amber  fill:#f59e0b,color:#fff,stroke:#d97706
    classDef purple fill:#8b5cf6,color:#fff,stroke:#7c3aed

    class Start,Done green
    class Auth,Valid,Hit amber
    class Fetch,Store,Log blue
    class ErrMsg red
    class Notify purple`,
  },
  {
    id: "sequence",
    name: "Sequence",
    description: "Interaction over time",
    icon: "ArrowLeftRight",
    code: `sequenceDiagram
    autonumber
    actor User
    participant App as Frontend
    participant API as Backend
    participant DB as Database

    User->>App: Submit form
    App->>+API: POST /api/data
    API->>+DB: INSERT query
    DB-->>-API: Success
    API-->>-App: 200 OK
    App-->>User: Show confirmation`,
  },
  {
    id: "class",
    name: "Class Diagram",
    description: "OOP class structure",
    icon: "Box",
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
        +move() void
    }

    class Dog {
        +String breed
        +fetch() void
        +makeSound() void
    }

    class Cat {
        +bool isIndoor
        +purr() void
        +makeSound() void
    }

    Animal <|-- Dog
    Animal <|-- Cat`,
  },
  {
    id: "er",
    name: "ER Diagram",
    description: "Entity relationship",
    icon: "Database",
    code: `erDiagram
    USER {
        int id PK
        string name
        string email
        datetime created_at
    }

    POST {
        int id PK
        string title
        text content
        int user_id FK
        datetime published_at
    }

    COMMENT {
        int id PK
        text body
        int user_id FK
        int post_id FK
    }

    TAG {
        int id PK
        string name
    }

    USER ||--o{ POST : "writes"
    POST ||--o{ COMMENT : "has"
    USER ||--o{ COMMENT : "writes"
    POST }o--o{ TAG : "tagged with"`,
  },
  {
    id: "gantt",
    name: "Gantt Chart",
    description: "Project timeline",
    icon: "BarChart2",
    code: `gantt
    title Project Roadmap
    dateFormat  YYYY-MM-DD
    excludes weekends

    section Planning
    Requirements gathering   :done,    req,  2024-01-01, 2024-01-07
    Architecture design      :done,    arch, 2024-01-08, 5d

    section Development
    Backend API              :active,  api,  2024-01-15, 14d
    Frontend UI              :         ui,   2024-01-22, 14d
    Database schema          :done,    db,   2024-01-15, 5d

    section Testing
    Unit tests               :         unit, after api, 7d
    Integration tests        :         int,  after ui,  7d

    section Deployment
    Staging release          :         stg,  after int, 3d
    Production release       :         prd,  after stg, 2d`,
  },
  {
    id: "state",
    name: "State Diagram",
    description: "State machine transitions",
    icon: "Workflow",
    code: `stateDiagram-v2
    [*] --> Idle

    Idle --> Loading : fetch()
    Loading --> Success : onSuccess
    Loading --> Error : onError
    Error --> Loading : retry()
    Success --> Idle : reset()
    Error --> Idle : dismiss()

    state Loading {
        [*] --> Requesting
        Requesting --> Processing
        Processing --> [*]
    }`,
  },
  {
    id: "pie",
    name: "Pie Chart",
    description: "Data distribution",
    icon: "PieChart",
    code: `pie title Browser Market Share 2024
    "Chrome"    : 65.12
    "Safari"    : 19.08
    "Firefox"   : 3.01
    "Edge"      : 4.52
    "Others"    : 8.27`,
  },
  {
    id: "mindmap",
    name: "Mind Map",
    description: "Hierarchical ideas",
    icon: "Network",
    code: `mindmap
  root((Project))
    Planning
      Requirements
      Timeline
      Budget
    Development
      Frontend
        React
        TypeScript
      Backend
        Node.js
        PostgreSQL
    Testing
      Unit Tests
      E2E Tests
    Deployment
      CI/CD
      Cloud`,
  },
  {
    id: "git",
    name: "Git Graph",
    description: "Git branching model",
    icon: "GitMerge",
    code: `gitGraph
   commit id: "Initial commit"
   commit id: "Add README"

   branch develop
   checkout develop
   commit id: "Setup project"
   commit id: "Add auth module"

   branch feature/login
   checkout feature/login
   commit id: "Login UI"
   commit id: "Login API"

   checkout develop
   merge feature/login id: "Merge login"

   checkout main
   merge develop id: "Release v1.0" tag: "v1.0.0"`,
  },
  {
    id: "c4",
    name: "C4 Context",
    description: "System context diagram",
    icon: "Layers",
    code: `C4Context
    title System Context – Online Banking

    Person(customer, "Customer", "A bank customer")
    Person(admin, "Admin", "Bank administrator")

    System(bankSystem, "Online Banking", "Allows customers to manage accounts")

    System_Ext(emailSystem, "Email System", "Sends notifications")
    System_Ext(paymentGateway, "Payment Gateway", "Processes payments")

    Rel(customer, bankSystem, "Uses", "HTTPS")
    Rel(admin, bankSystem, "Manages", "HTTPS")
    Rel(bankSystem, emailSystem, "Sends emails", "SMTP")
    Rel(bankSystem, paymentGateway, "Processes payments", "API")`,
  },
  {
    id: "userJourney",
    name: "User Journey",
    description: "User experience flow",
    icon: "Route",
    code: `journey
    title Customer Onboarding Journey

    %% Sections represent phases of the journey.
    %% Task syntax:  Task name: score (1–5): Actor1, Actor2
    %% Score 1 = frustrating, 5 = delightful

    section Discovery
        Visit website        : 4 : Visitor
        Read feature list    : 3 : Visitor
        View pricing page    : 3 : Visitor
        Watch demo video     : 5 : Visitor

    section Sign Up
        Fill sign-up form    : 4 : User
        Verify email address : 2 : User, System
        Complete profile     : 3 : User

    section First Use
        Dashboard walkthrough: 5 : User, Support
        Create first project  : 3 : User
        Invite a team member  : 4 : User
        Connect integration   : 2 : User, Admin

    section Growth
        Daily check-in       : 5 : User
        Use advanced features : 4 : User
        Contact support      : 2 : User, Support
        Upgrade plan         : 5 : User, Sales`,
  },
];
