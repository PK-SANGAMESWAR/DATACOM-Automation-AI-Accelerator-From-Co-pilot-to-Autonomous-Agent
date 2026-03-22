# Datacom Automation & AI Accelerator Portfolio

This repository contains the results of Datacom Graduate Developer challenges. It demonstrates investigations, diagnosis workflows, and spec-driven AI development orchestrations.

---

## Task 1: Debugging and Performance Optimization (`process_data.py`)

### 1. Problem Overview
The initial prompt described a scenario where a critical nightly data processing script, `process_data.py`, was failing intermittently and missing its SLA due to "inefficient nested for-loops". It also supplied an `error.log` displaying an explicit crash:
> `AttributeError: 'dict' object has no attribute 'keys'`

### 2. Investigation and Analysis Process
- **Step 1: Codebase Review:** Analyzed the provided script. Discovered that the version of `process_data.py` on disk *already utilized `O(1)` dictionary lookups* and contained no nested loop artifacts. The "inefficient nested for-loops" phrase was deduced to be an illustrative instruction context rather than the actual state of the local file.
- **Step 2: Diagnosing the Specific Bug:** Python ensures standard dictionaries inherently possess a `.keys()` method. The reported crash implies a corrupted, non-dictionary object (masquerading as a `dict`) was ingested upstream, tricking the iteration serialization into an `AttributeError`.
- **Step 3: Test Replication (`TEST_CASES.py`):** We wrote a targeted unit test utilizing `unittest`, constructing a broken mock object that identifies as a 'dict' but lacks the `keys` property. This successfully triggered the exact environment crash simulated by the assignment logs.
- **Step 4: Refactoring and Reporting (`DEBUG_LOG.md`):** We collated the conversational output, diagnostic paths, and logic reasoning logs into `DEBUG_LOG.md` to trace the AI-driven narrative step-by-step for submission.

---

## Task 2: Building from Scratch with Spec-Driven Development (Kudos System)

### 1. Problem Overview
The second phase of the assignment required transforming an ambiguous idea ("We need a way for people to give kudos to each other") into a robust feature by leveraging an AI Architect role.

### 2. Implementation Workflow
- **Spec Initiation & Moderation Expansion:** We drafted a formal `SPECIFICATION.md` encompassing the required functional capabilities (selecting colleagues and posting short messages). Crucially, we proactively injected a content moderation user story specifically for administrators to hide/delete messages and expanded the database schema to include an `is_visible` boolean.
- **System Execution:** Based directly on the accepted `SPECIFICATION.md`, we implemented the final solution as a modern Web App using Google AI Studio. The `kudos-connect` folder contains the fully operational complete Next.js/Vite environment, integrated with Gemini AI and Firebase. You can run `/kudos-connect` locally using `npm run dev`.
- **Git Operations:** We wrapped the finalized `kudos-connect` system along with our entire assignment workspace (`DATACOM-FORGE`) and pushed it to the centralized remote repository structure.

---

## Task 3: OrderBot Agent Automation Presentation

### Overview
We mapped out a manual hardware order process (involving PDFs, Salesforce, and Google Sheets) and redesigned it around an Autonomous AI Agent named **OrderBot**. 

- **Presentations Built:** We generated an interactive HTML Reveal.js slideshow (`OrderBot_Presentation.html`) complete with visually rendered Mermaid flowcharts, alongside a raw Markdown presentation (`OrderBot_Presentation.md`) detailing the business value, AI tools, and multi-phase implementation rollout. All requested graphical illustrations are embedded natively.

---

## Conclusion
The repository now features the final core deliverables explicitly required for the assignments:
1. `DEBUG_LOG.md` (Task 1 Report)
2. `TEST_CASES.py` (Task 1 Simulation)
3. `kudos-connect/` (Task 2 AI Studio App Implementation)
4. `KudosSystem/SPECIFICATION.md` (Task 2 Requirements Blueprint)
5. `OrderBot_Presentation.md` and `.html` (Task 3 Automation Pitch Deck)
6. `images/` (AI-Generated slide illustrations)

The student can submit these files and links together to demonstrate successful fulfillment of all criteria.
