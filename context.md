# Resume Context: Datacom Automation & AI Accelerator

## Instructions for Gemini
Please read this context document to understand the "Datacom Automation & AI Accelerator" project. Use this information to generate 3-4 highly impactful bullet points for my resume in LaTeX format. Emphasize quantifiable metrics (e.g., O(1) time complexity, saving 10 mins/order, 99.5% accuracy, 100% SLA compliance), the specific stack used, and the business value delivered. Focus on action verbs and STAR methodology.

---

## Project Overview
**Title:** Datacom Automation & AI Accelerator
**Role:** AI Architect / Full-Stack Developer
**Core Technologies:** Python, React, Vite, TailwindCSS, Next.js, Flask, SQLAlchemy, Google Gemini API (`@google/genai`), Firebase, PyTest/Unittest, Mermaid JS

This portfolio project consists of three major phases combining backend optimization, full-stack AI development, and autonomous agent system architecture. 

### Phase 1: Data Pipeline Optimization (Python)
- **Problem:** A critical nightly data processing script (`process_data.py`) was constantly crashing with an `AttributeError` and failing to meet its Service Level Agreement (SLA) due to inefficient \(O(N^2)\) nested loops parsing customer transactions.
- **Action:** 
  - Analyzed the codebase and refactored the logic to use \(O(1)\) dictionary lookups, significantly optimizing processing time.
  - Built targeted unit test suites (`TEST_CASES.py`) validating the specific crash condition (a corrupted mock object masquerading as a dictionary), proving the fix.
- **Impact:** Restored SLA compliance, ensured dataset integrity across JSON/CSV exports, and eliminated runtime crashes through robust error handling.

### Phase 2: Full-Stack Feature Development (Kudos System)
- **Problem:** An ambiguous product requirement asked for a way "for people to give kudos to each other."
- **Action:** 
  - Served as the AI Architect to transform the vague requirement into a formal `SPECIFICATION.md` with explicit database schema expansions and a content moderation feature flow.
  - Built a modern web application consisting of a React/Vite front-end (`kudos-connect`) integrated with the Google Gemini AI API (`@google/genai`) and Firebase.
  - Paired the front-end with a Python Flask + SQLAlchemy backend system that provided robust session management, database migrations, and administrative moderation logic (visibility toggling).
- **Impact:** Delivered a production-ready internal platform that allows employees to seamlessly submit, view, and moderate peer recognition messages.

### Phase 3: Autonomous AI Agent Architecture (OrderBot)
- **Problem:** A manual hardware order process was acting as a bottleneck, requiring operators to manually parse PDFs, check Salesforce and Google Sheets, and draft decision emails (taking 10 minutes per order).
- **Action:** 
  - Designed "OrderBot," an Autonomous AI Agent utilizing API tool integrations to eliminate the manual interventions.
  - Architected a webhook-based process connecting a Perception layer (Inbox API, PDF Parsing, Salesforce/G-Sheets APIs) to an autonomous Planning logic layer that triggers appropriate Actions (Auto-email customer, alert warehouse, or reject).
  - Drafted comprehensive technical pitch decks using Mermaid JS flowcharts (HTML/PPTX/Markdown formats) and outlined a 3-phase rollout plan.
- **Impact:** The designed architecture scales to process 100% of orders autonomously, driving cycle time down from 10 minutes/order to under 5 minutes with a projected 99.5% systemic accuracy, eliminating human bottlenecks during peak volume seasons.
