# AI.md - Feature/Component Context Guide

> **IMPORTANT**: This file is a *Contextual AI.md* to guide AI agents in detail regarding the feature or component within this directory. Replace all bracketed `[...]` text with actual information. All documentation must be written in English.

## 🎯 Business Purpose
[Briefly explain why this feature/folder/component exists. What problem does it solve for the user?]

## 🏗️ Architecture & Data Flow
[Explain how the components inside this folder interact with each other. Where does the data come from and where does it go?]

## 🔗 Dependencies
- **External Components**: [List external UI components or Services imported here]
- **Core Data Types**: [List the location of interfaces from `src/types/` or `models/` used here]

## 🌐 API Endpoints (Backend/BFF Only)
[Leave empty if this is a pure UI component]
- `GET /api/v1/...` -> [Endpoint Purpose]
- `POST /api/v1/...` -> [Endpoint Purpose]

## 🎨 UI Components (Frontend Only)
[Leave empty if this is a backend folder]
- `[File Name 1].tsx`: [Its function]
- `[File Name 2].tsx`: [Its function]
- **State Management**: [Explain if using URL parameters, local state, or specific Zustand stores]

## 🧪 Testing Guidelines
[Explain mandatory scenarios when executing tests for this feature. For example, "Ensure entering the wrong password triggers a specific Toast error".]

---
*Last Updated: [CURRENT DATE]*
