import { TemplateType } from '../types/note';

export interface NoteTemplateDefinition {
  type: TemplateType;
  label: string;
  iconName: string;
  defaultTitle: string;
  defaultContent: string;
  folderId?: string;
  tags?: string[];
}

export const NOTE_TEMPLATES: NoteTemplateDefinition[] = [
  {
    type: 'blank',
    label: 'Blank Note',
    iconName: 'FileText',
    defaultTitle: 'Untitled Note',
    defaultContent: '',
  },
  {
    type: 'todo',
    label: 'Todo List',
    iconName: 'CheckSquare',
    defaultTitle: 'Task Checklist',
    defaultContent: `# Task Checklist 📝

### 🔴 High Priority
- [ ] Priority Task 1
- [ ] Priority Task 2

---

### 🟡 In Progress
- [x] Initial Planning
- [ ] Implementation

---

### 🟢 Quick Tasks & Notes
- [ ] Review documentation
- [ ] Send updates
`,
  },
  {
    type: 'meeting',
    label: 'Meeting Notes',
    iconName: 'Users',
    defaultTitle: 'Meeting Notes',
    defaultContent: `# Meeting Notes 🤝

**Date**: ${new Date().toLocaleDateString()}
**Time**: ${new Date().toLocaleTimeString()}
**Attendees**: 

---

### 📌 Agenda
1. Project Updates
2. Key Discussion Points
3. Blockers & Solutions

---

### 💡 Key Decisions
- Item A: 

---

### 🚀 Action Items
- [ ] Action item 1 (Owner: )
- [ ] Action item 2 (Owner: )
`,
  },
  {
    type: 'project',
    label: 'Project Notes',
    iconName: 'FolderGit2',
    defaultTitle: 'Project Documentation',
    defaultContent: `# Project Overview 🚀

> Brief project summary & goals.

---

### 🛠 Tech Stack & Architecture
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend / Platform**: Electron / Node.js
- **State**: Custom Hooks & LocalStorage

---

### 🎯 Key Milestones
- [x] Phase 1: Core setup
- [ ] Phase 2: Feature development
- [ ] Phase 3: Testing & Deployment

---

### 📝 Dev Notes & References
- Repo: 
- Docs: 
`,
  },
  {
    type: 'study',
    label: 'Study Notes',
    iconName: 'GraduationCap',
    defaultTitle: 'Study Notes',
    defaultContent: `# Study Notes 📚

**Subject / Course**: 
**Topic**: 
**Date**: ${new Date().toLocaleDateString()}

---

### 🔑 Key Concepts & Definitions
1. **Concept 1**: Description...
2. **Concept 2**: Description...

---

### 💡 Formulas / Examples
\`\`\`text
// Add code, formulas, or key algorithms here
\`\`\`

---

### 📌 Summary & Key Takeaways
> Summary of main points to remember for exams or projects.
`,
  },
  {
    type: 'journal',
    label: 'Daily Journal',
    iconName: 'BookOpen',
    defaultTitle: `Daily Journal — ${new Date().toLocaleDateString()}`,
    defaultContent: `# Daily Journal 🌅

**Date**: ${new Date().toLocaleDateString()}

---

### ☀️ Morning Intentions & Top 3 Goals
1. Goal 1
2. Goal 2
3. Goal 3

---

### 🧘 Highlights & Reflections
- What went well today?
- Key lessons learned:

---

### 🌙 Evening Gratitude
- I am grateful for: 
`,
  },
];
