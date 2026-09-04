# Changelog

All notable changes to **notepadEZ** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-04

### ✨ Added
- **Windows 11 Fluent UI Header & Tabs**: Modern acrylic glass tabbed navigation with top accent indicators and rounded tabs.
- **One-Click PowerShell Installer (`irm`)**: Added `install.ps1` for automated single-command installation via Windows Terminal.
- **In-App Patch Notes Modal**: Added interactive "What's New / Patch Notes" dialog accessible via Header (`✨`) and Help menu.
- **Pure Rich Text WYSIWYG Editor**: Write naturally with direct visual formatting without markdown syntax tags cluttering the screen.
- **Smart Markdown Paste Auto-Conversion**: Automatically converts pasted Markdown (from ChatGPT/GitHub) into styled HTML elements.
- **Multi-Format Native Export**: Export notes directly to `.txt`, `.md`, `.html`, `.json`, and `.csv`.
- **Edge-to-Edge Distraction Free Mode**: Toggle full-screen writing canvas via `F11` or `Ctrl+Shift+F`.
- **Clickable Web Links & Win11 Link Modal**: Frosted glass link insertion modal (`LinkInsertModal`) with direct browser navigation.

### ⚡ Improved
- Real-time auto-save & session tab state restoration.
- Case-matching Find & Replace with live match counters (`Ctrl+F` / `Ctrl+H`).
- Character diff analytics and 1-click snapshot restoration.

### 🐛 Fixed
- Prevented potential data loss when closing unpersisted note tabs during unexpected session resets.
