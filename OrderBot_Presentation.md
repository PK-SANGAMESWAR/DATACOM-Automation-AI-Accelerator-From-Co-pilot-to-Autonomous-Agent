# OrderBot AI: Automating Fulfillment
**Prepared for the Head of Operations**

---

## Slide 1: The Problem - Our Current Order Process Is a Bottleneck
![Process Bottleneck](images/bottleneck_process.png)

The manual intervention required for every incoming order slows us down and scales poorly.

**Pain Points Identified:**
- **Manual Data Entry:** Reading PDFs leads to high overhead and transcription errors.
- **Context Switching:** Bouncing between Email, Salesforce, and Sheets disrupts focus.
- **Long Delays:** Problematic orders bottleneck in an operations inbox rather than bouncing back to Sales instantly.

### Current Process Flow
```mermaid
graph TD
    A(Shared Inbox) --> B{Ops Human}
    B -->|Manual PDF Read| C[Check Salesforce]
    C -->|Check Status| D[Check G-Sheets Inventory]
    D --> E{Decision}
    E -->|Manual Draft| F[Email Customer]
    E -->|Manual Draft| G[Email Warehouse]
    E -->|Delay| H[Email Sales Rep exception]
    
    style B fill:#f9d0c4,stroke:#e74c3c
    style C fill:#f9d0c4,stroke:#e74c3c
    style D fill:#f9d0c4,stroke:#e74c3c
    style F fill:#f9d0c4,stroke:#e74c3c
```

---

## Slide 2: The Solution - Introducing 'OrderBot'
![OrderBot AI](images/orderbot_ai.png)

OrderBot is an **Autonomous AI Agent** that connects directly to our systems via API tools to instantly execute the decision tree 24/7.

**Architecture Overview:**
- **Goal:** Autonomously process 100% of new hardware orders within 5 minutes at 99.5% accuracy.
- **Perception (Tools):** Inbox API, PDF Parsing Tool, Salesforce API, Google Sheets API.
- **Planning:** Parse -> Query -> Decide -> Act.
- **Action (Tools):** Automated Email Sender, Salesforce Updater, Sheets Decrement.
- **Memory/Learning:** Logging outcomes to flag consistently problematic sales reps for human review.

### OrderBot Process Flow
```mermaid
graph TD
    A(Shared Inbox) -->|Webhook| B{OrderBot Agent}
    B -->|Perception Tool| C[Extract PDF API]
    C -->|Perception Tool| D[Query Salesforce API]
    D -->|Perception Tool| E[Query Sheets API]
    E -->|Planning logic| F{AI Decision Engine}
    F -->|Action Tool| G[Send Automated Customer email]
    F -->|Action Tool| H[Send Automated Warehouse email]
    F -->|Action Tool| I[Send Instant Sales Reject]
    
    style B fill:#d4edda,stroke:#28a745
    style C fill:#d4edda,stroke:#28a745
    style D fill:#d4edda,stroke:#28a745
    style E fill:#d4edda,stroke:#28a745
```

---

## Slide 3: Business Impact & Recommended Next Steps
![Business Success](images/business_success.png)

### Target Business Outcomes
- **Reduced Costs:** Operations staff time drops from 10 minutes per order to 0.
- **Speed:** SLA drops from hours/days to < 5 minutes.
- **No Errors:** System-to-system translation guarantees 99.5% accuracy.
- **Scale:** Unlimited throughput during peak sales seasons.

### Recommended Next Steps
We propose a low-risk, gradual integration approach to ensure trust and accuracy:
1. **Phase 1: Read-Only PoC (2 weeks)**
   Deploy OrderBot to "Shadow Mode" to passively read emails and draft responses without actually sending them. Operations humans verify the drafts for accuracy.
2. **Phase 2: Hybrid Rollout**
   OrderBot handles unambiguous "Happy Path" orders autonomously; exceptions or edge-cases route to humans.
3. **Phase 3: Autonomous Tuning**
   Enable Memory components so OrderBot proactively coaches sales reps on bad PDF forms.
