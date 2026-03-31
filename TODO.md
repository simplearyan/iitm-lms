# IITM-LMS Optimization TODO List 🚀

This file tracks technical debt and performance optimization goals to make the LMS lighter and faster.

## 📉 Bundle Size & Performance
- [ ] **Dynamic Imports (Code Splitting)**
    - [ ] Lazy load `KaTeX` only when math is detected in the note content.
    - [ ] Lazy load `Highlight.js` for code-heavy pages.
    - [ ] Separate `InstructorDashboard` from the main `Learner` bundle.
- [ ] **Asset Optimization**
    - [ ] Convert `social-preview.png` and `hero.png` to WebP/AVIF format.
    - [ ] Sub-set KaTeX fonts to only include WOFF2.
- [ ] **Off-main-thread Parsing**
    - [ ] Move `marked` and `dompurify` logic into a Web Worker to prevent UI jank during long notes.

## 🏛️ Content Management & AI-Readiness
- [x] Decommission `data.json`
- [x] Verification
    - [x] Network tab check: manifest + chunks loading
    - [x] Full navigation test through all courses
    - [x] Dynamic user name binding (ARYAN)
- [ ] **AI-Ready Metadata Integration**
    - [ ] Enforce a schema for new questions that includes `ai_metadata` (topic, difficulty, concept).
    - [ ] Create a "Dataset Exporter" script to generate JSONL files for RAG fine-tuning.
    - [ ] Map questions to specific **Learning Competencies** for precise student performance tracking.

## 🎨 UI/UX Improvements
- [ ] **Skeleton Loaders**
    - [ ] Add smooth skeleton placeholders while math/code is being rendered.
- [ ] **Prefetching**
    - [ ] Implement hover-based prefetching for the "Next" lesson in the syllabus.

## 🛠️ Architecture
- [ ] **Static Generation**
    - [ ] Explore pre-rendering static content during build time to reduce client-side parsing overhead.
