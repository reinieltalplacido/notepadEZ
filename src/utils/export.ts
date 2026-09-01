import { Note, Folder, Tag } from '../types/note';
import { renderMarkdown } from './markdown';

export function exportNoteAsMarkdown(note: Note) {
  const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8;' });
  downloadBlob(blob, sanitizeFilename(`${note.title || 'Untitled'}.md`));
}

export function exportNoteAsText(note: Note) {
  const blob = new Blob([note.content], { type: 'text/plain;charset=utf-8;' });
  downloadBlob(blob, sanitizeFilename(`${note.title || 'Untitled'}.txt`));
}

export function exportNoteAsHtml(note: Note) {
  const renderedContent = renderMarkdown(note.content);
  const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(note.title || 'Untitled Note')}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      background: #fafafa;
    }
    h1, h2, h3, h4, h5, h6 { color: #111827; margin-top: 1.5em; margin-bottom: 0.5em; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1em 0; padding-left: 1em; color: #4b5563; }
    pre { background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
    pre code { background: transparent; padding: 0; }
    hr { border: 0; border-top: 1px solid #e5e7eb; margin: 2em 0; }
    .task-item { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
    .footer { margin-top: 40px; font-size: 0.85em; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(note.title || 'Untitled Note')}</h1>
  <div class="content">
    ${renderedContent}
  </div>
  <div class="footer">
    Exported from <strong>notepadEZ</strong> on ${new Date(note.updatedAt).toLocaleString()}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8;' });
  downloadBlob(blob, sanitizeFilename(`${note.title || 'Untitled'}.html`));
}

export function exportFullBackupJSON(notes: Note[], folders: Folder[], tags: Tag[]) {
  const backupData = {
    app: 'notepadEZ',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    notes,
    folders,
    tags,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `notepadEZ_backup_${new Date().toISOString().split('T')[0]}.json`);
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[/\\?%*:|"<>]/g, '_');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
