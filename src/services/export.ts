import { Task, Project, TeamMember, WorkspaceData, TaskStatus, TaskPriority } from '../types';

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'In Review',
  done: 'Completed',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const STATUS_HEX: Record<TaskStatus, string> = {
  backlog: '#94a3b8',
  todo: '#64748b',
  in_progress: '#3b82f6',
  review: '#8b5cf6',
  done: '#10b981',
};

export const downloadBlob = (filename: string, content: BlobPart, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const csvCell = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export const exportToCsv = (tasks: Task[], projects: Project[], filename = 'syncteam-tasks.csv') => {
  const projMap = new Map(projects.map(p => [p.id, p.name]));
  const headers = [
    'Project',
    'Task Title',
    'Status',
    'Priority',
    'Assignee',
    'Due Date',
    'Subtasks Total',
    'Subtasks Done',
    'Progress %',
    'Est. Hours',
    'Tags',
    'Description',
  ];

  const rows = tasks.map(t => {
    const subDone = t.subtasks.filter(s => s.completed).length;
    const pct = t.status === 'done' ? 100 : (t.subtasks.length ? Math.round((subDone / t.subtasks.length) * 100) : 0);
    return [
      projMap.get(t.projectId) || 'General',
      t.title,
      STATUS_LABELS[t.status],
      PRIORITY_LABELS[t.priority],
      t.assignee || 'Unassigned',
      t.dueDate || 'None',
      t.subtasks.length,
      subDone,
      pct,
      t.estimatedHours || 0,
      t.tags.join(', '),
      t.description || '',
    ];
  });

  const content = [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
  downloadBlob(filename, content, 'text/csv;charset=utf-8;');
};

export const exportToJson = (workspace: WorkspaceData, filename = 'syncteam-workspace-backup.json') => {
  const jsonStr = JSON.stringify(workspace, null, 2);
  downloadBlob(filename, jsonStr, 'application/json');
};

/* ------------------------------------------------------------------ */
/* Tiny Zip & Excel (.xlsx) writer without heavy dependencies          */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const zipStore = (files: { name: string; data: string }[]) => {
  const enc = new TextEncoder();
  const u16 = (n: number) => [n & 255, (n >>> 8) & 255];
  const u32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  const parts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((f) => {
    const name = enc.encode(f.name);
    const data = enc.encode(f.data);
    const crc = crc32(data);
    const local = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0),
    ]);
    parts.push(local, name, data);
    centralParts.push(
      new Uint8Array([
        0x50, 0x4b, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
        ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length),
        ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
      ]),
      name
    );
    offset += local.length + name.length + data.length;
  });

  const centralSize = centralParts.reduce((n, p) => n + p.length, 0);
  const end = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
    ...u32(centralSize), ...u32(offset), ...u16(0),
  ]);

  const all = [...parts, ...centralParts, end];
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let pos = 0;
  all.forEach((p) => {
    out.set(p, pos);
    pos += p.length;
  });
  return out;
};

const xmlEsc = (s: string) =>
  String(s ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string));

const colName = (i: number) => {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

type Cell = string | number;

const sheetXml = (rows: Cell[][], widths: number[]) => {
  const cols = `<cols>${widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('')}</cols>`;
  const body = rows
    .map((r, ri) => {
      const cells = r
        .map((v, ci) => {
          const ref = `${colName(ci)}${ri + 1}`;
          const style = ri === 0 ? ' s="1"' : ' s="2"';
          return typeof v === 'number'
            ? `<c r="${ref}"${style}><v>${v}</v></c>`
            : `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
        })
        .join('');
      return `<row r="${ri + 1}">${cells}</row>`;
    })
    .join('');
  const lastCol = colName(widths.length - 1);
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${body}</sheetData>` +
    `<autoFilter ref="A1:${lastCol}${rows.length}"/></worksheet>`
  );
};

export const exportToExcel = (workspace: WorkspaceData, activeProjectId?: string) => {
  const { projects, tasks, teamMembers } = workspace;
  const filteredTasks = activeProjectId && activeProjectId !== 'all'
    ? tasks.filter(t => t.projectId === activeProjectId)
    : tasks;

  const projMap = new Map(projects.map(p => [p.id, p.name]));

  // Sheet 1: Tasks
  const taskSheet: Cell[][] = [
    ['Project', 'Task Title', 'Status', 'Priority', 'Assignee', 'Due Date', 'Progress %', 'Subtasks Done', 'Subtasks Total', 'Est. Hours', 'Tags', 'Description'],
    ...filteredTasks.map((t): Cell[] => {
      const subDone = t.subtasks.filter(s => s.completed).length;
      const pct = t.status === 'done' ? 100 : (t.subtasks.length ? Math.round((subDone / t.subtasks.length) * 100) : 0);
      return [
        projMap.get(t.projectId) || 'General',
        t.title,
        STATUS_LABELS[t.status],
        PRIORITY_LABELS[t.priority],
        t.assignee || 'Unassigned',
        t.dueDate || 'None',
        pct,
        subDone,
        t.subtasks.length,
        t.estimatedHours || 0,
        t.tags.join(', '),
        t.description,
      ];
    }),
  ];

  // Sheet 2: Team Workload
  const memberRows = buildTeamWorkloadData(filteredTasks, teamMembers);
  const workloadSheet: Cell[][] = [
    ['Team Member', 'Role', 'Total Tasks', 'Backlog', 'To Do', 'In Progress', 'In Review', 'Done', 'Overdue', 'Completion %', 'Load Status'],
    ...memberRows.map((m): Cell[] => [
      m.name,
      m.role,
      m.total,
      m.byStatus.backlog,
      m.byStatus.todo,
      m.byStatus.in_progress,
      m.byStatus.review,
      m.byStatus.done,
      m.overdue,
      m.total ? Math.round((m.byStatus.done / m.total) * 100) : 0,
      m.loadStatus,
    ]),
  ];

  // Sheet 3: Subtasks Breakdown
  const subtaskSheet: Cell[][] = [
    ['Project', 'Parent Task', 'Subtask Item', 'Assignee', 'Completed'],
  ];
  filteredTasks.forEach(t => {
    t.subtasks.forEach(s => {
      subtaskSheet.push([
        projMap.get(t.projectId) || 'General',
        t.title,
        s.title,
        s.assignee || t.assignee || 'Unassigned',
        s.completed ? 'Yes' : 'No',
      ]);
    });
  });

  const sheets = [
    { name: 'All Tasks', xml: sheetXml(taskSheet, [25, 40, 14, 12, 18, 14, 12, 14, 14, 12, 22, 45]) },
    { name: 'Team Workload', xml: sheetXml(workloadSheet, [20, 24, 12, 10, 10, 13, 12, 10, 11, 14, 16]) },
    { name: 'Subtasks', xml: sheetXml(subtaskSheet, [25, 38, 42, 18, 12]) },
  ];

  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const relNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const head = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`;

  const contentTypes =
    `${head}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
      )
      .join('') +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`;

  const rootRels =
    `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="${relNs}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

  const workbook =
    `${head}<workbook xmlns="${ns}" xmlns:r="${relNs}"><sheets>` +
    sheets.map((s, i) => `<sheet name="${s.name}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
    `</sheets></workbook>`;

  const workbookRels =
    `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    sheets
      .map((_, i) => `<Relationship Id="rId${i + 1}" Type="${relNs}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
      .join('') +
    `<Relationship Id="rId${sheets.length + 1}" Type="${relNs}/styles" Target="styles.xml"/></Relationships>`;

  const styles =
    `${head}<styleSheet xmlns="${ns}">` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>` +
    `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>` +
    `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/><bgColor indexed="64"/></patternFill></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="3">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
    `</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  const zip = zipStore([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'xl/workbook.xml', data: workbook },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRels },
    { name: 'xl/styles.xml', data: styles },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: s.xml })),
  ]);

  downloadBlob(
    `syncteam-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
    zip,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
};

/* ------------------------------------------------------------------ */
/* Vector PDF Report Generator                                         */
/* ------------------------------------------------------------------ */

const hexRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255).toFixed(3)).join(' ');
};

const pdfSafe = (s: string) =>
  String(s ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

export const exportToPdf = (workspace: WorkspaceData, activeProjectId?: string) => {
  const { projects, tasks, teamMembers } = workspace;
  const filteredTasks = activeProjectId && activeProjectId !== 'all'
    ? tasks.filter(t => t.projectId === activeProjectId)
    : tasks;

  const currentProject = projects.find(p => p.id === activeProjectId);
  const title = currentProject ? currentProject.name : 'All Projects & Teams Executive Report';

  const W = 842; // A4 landscape
  const H = 595;
  const M = 40;
  let top = 40;
  const pages: string[] = [];
  let cur = '';

  const addPage = () => {
    pages.push(cur);
    cur = '';
    top = M;
  };

  const text = (x: number, yTop: number, str: string, size = 9, bold = false, color = '#0f172a') => {
    cur += `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${hexRgb(color)} rg ${x.toFixed(2)} ${(H - yTop).toFixed(2)} Td (${pdfSafe(str)}) Tj ET\n`;
  };

  const rect = (x: number, yTop: number, w: number, h: number, color: string) => {
    cur += `${hexRgb(color)} rg ${x.toFixed(2)} ${(H - yTop - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f\n`;
  };

  // Header Banner
  rect(M, top, W - 2 * M, 3, '#3b82f6');
  top += 16;
  text(M, top + 14, title, 20, true, '#0f172a');
  top += 26;

  const total = filteredTasks.length;
  const done = filteredTasks.filter(t => t.status === 'done').length;
  const inProg = filteredTasks.filter(t => t.status === 'in_progress').length;
  const overdue = filteredTasks.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate).getTime() < Date.now()).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  text(M, top + 8, `Report Generated: ${new Date().toLocaleDateString()} | Total Tasks: ${total} | Completed: ${done} (${pct}%) | Active: ${inProg} | Overdue: ${overdue}`, 9.5, false, '#64748b');
  top += 30;

  // KPI Metrics Boxes
  const kpis = [
    { label: 'Total Tasks', value: String(total), color: '#3b82f6' },
    { label: 'Completed', value: `${done} (${pct}%)`, color: '#10b981' },
    { label: 'In Progress', value: String(inProg), color: '#3b82f6' },
    { label: 'Overdue Items', value: String(overdue), color: overdue > 0 ? '#ef4444' : '#64748b' },
  ];

  const boxW = (W - 2 * M - 30) / 4;
  kpis.forEach((kpi, idx) => {
    const bx = M + idx * (boxW + 10);
    rect(bx, top, boxW, 50, '#f8fafc');
    rect(bx, top, 4, 50, kpi.color);
    text(bx + 12, top + 20, kpi.value, 16, true, '#0f172a');
    text(bx + 12, top + 36, kpi.label, 9, false, '#64748b');
  });
  top += 66;

  // Workload Section
  text(M, top + 12, 'Team Capacity & Workload Analysis', 13, true, '#0f172a');
  top += 22;

  const workload = buildTeamWorkloadData(filteredTasks, teamMembers);
  const tCols = [
    { h: 'Team Member', w: 160 },
    { h: 'Role', w: 150 },
    { h: 'Total', w: 50 },
    { h: 'In Progress', w: 75 },
    { h: 'Completed', w: 75 },
    { h: 'Overdue', w: 60 },
    { h: 'Completion %', w: 90 },
    { h: 'Capacity Status', w: 100 },
  ];

  // Table Header
  const totalTableW = tCols.reduce((acc, c) => acc + c.w, 0);
  rect(M, top, totalTableW, 20, '#1e293b');
  let cx = M;
  tCols.forEach(col => {
    text(cx + 6, top + 13.5, col.h, 8.5, true, '#ffffff');
    cx += col.w;
  });
  top += 20;

  workload.forEach((member, i) => {
    if (top > H - M - 30) {
      addPage();
    }
    const rowH = 18;
    if (i % 2 === 1) rect(M, top, totalTableW, rowH, '#f8fafc');

    let x = M;
    const memberPct = member.total ? Math.round((member.byStatus.done / member.total) * 100) : 0;
    const values = [
      member.name,
      member.role,
      String(member.total),
      String(member.byStatus.in_progress),
      String(member.byStatus.done),
      String(member.overdue),
      `${memberPct}%`,
      member.loadStatus,
    ];

    values.forEach((val, vi) => {
      const isOverdueCol = vi === 5 && member.overdue > 0;
      text(x + 6, top + 12, val, 8, vi === 0, isOverdueCol ? '#ef4444' : '#0f172a');
      x += tCols[vi].w;
    });

    top += rowH;
    rect(M, top, totalTableW, 0.5, '#e2e8f0');
  });

  top += 24;

  // Task List Section
  if (top > H - M - 80) addPage();
  text(M, top + 12, 'Active Task Deliverables & Status Details', 13, true, '#0f172a');
  top += 22;

  const taskCols = [
    { h: 'Task Title', w: 260 },
    { h: 'Status', w: 90 },
    { h: 'Priority', w: 75 },
    { h: 'Assignee', w: 120 },
    { h: 'Due Date', w: 85 },
    { h: 'Subtasks', w: 60 },
    { h: 'Est. Hours', w: 70 },
  ];
  const totalTaskW = taskCols.reduce((acc, c) => acc + c.w, 0);

  rect(M, top, totalTaskW, 20, '#1e293b');
  cx = M;
  taskCols.forEach(c => {
    text(cx + 6, top + 13.5, c.h, 8.5, true, '#ffffff');
    cx += c.w;
  });
  top += 20;

  filteredTasks.slice(0, 16).forEach((task, idx) => {
    if (top > H - M - 25) {
      addPage();
      rect(M, top, totalTaskW, 20, '#1e293b');
      cx = M;
      taskCols.forEach(c => {
        text(cx + 6, top + 13.5, c.h, 8.5, true, '#ffffff');
        cx += c.w;
      });
      top += 20;
    }
    const rowH = 18;
    if (idx % 2 === 1) rect(M, top, totalTaskW, rowH, '#f8fafc');

    const subDone = task.subtasks.filter(s => s.completed).length;
    const vals = [
      task.title.length > 40 ? task.title.slice(0, 38) + '...' : task.title,
      STATUS_LABELS[task.status],
      PRIORITY_LABELS[task.priority],
      task.assignee || 'Unassigned',
      task.dueDate || '-',
      `${subDone}/${task.subtasks.length}`,
      `${task.estimatedHours || 0} hrs`,
    ];

    let x = M;
    vals.forEach((v, vi) => {
      text(x + 6, top + 12, v, 8, vi === 0, vi === 1 ? STATUS_HEX[task.status] : '#0f172a');
      x += taskCols[vi].w;
    });

    top += rowH;
    rect(M, top, totalTaskW, 0.5, '#e2e8f0');
  });

  pages.push(cur);

  // Build PDF structure
  const n = pages.length;
  const objs: string[] = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${n} >>`;
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

  pages.forEach((content, i) => {
    const pageNumStr = `BT /F1 8 Tf 0.45 0.5 0.6 rg ${(W - M - 60).toFixed(2)} 20.00 Td (Page ${i + 1} of ${n}) Tj ET\n`;
    const fullContent = content + pageNumStr;
    const pid = 5 + i * 2;
    objs[pid] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pid + 1} 0 R >>`;
    objs[pid + 1] = `<< /Length ${fullContent.length} >>\nstream\n${fullContent}\nendstream`;
  });

  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = out.length;
    out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objs.length; i++) out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;

  downloadBlob(
    `syncteam-executive-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    bytes,
    'application/pdf'
  );
};

export interface TeamMemberWorkload {
  id: string;
  name: string;
  role: string;
  total: number;
  open: number;
  overdue: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  loadStatus: string;
}

export function buildTeamWorkloadData(tasks: Task[], teamMembers: TeamMember[]): TeamMemberWorkload[] {
  const map = new Map<string, TeamMemberWorkload>();

  teamMembers.forEach(m => {
    map.set(m.name, {
      id: m.id,
      name: m.name,
      role: m.role,
      total: 0,
      open: 0,
      overdue: 0,
      byStatus: { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 },
      byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
      loadStatus: 'Balanced',
    });
  });

  // Track unassigned
  map.set('Unassigned', {
    id: 'unassigned',
    name: 'Unassigned',
    role: 'Open Task Pool',
    total: 0,
    open: 0,
    overdue: 0,
    byStatus: { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 },
    byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
    loadStatus: 'Needs Assignment',
  });

  tasks.forEach(t => {
    const assignee = t.assignee || 'Unassigned';
    if (!map.has(assignee)) {
      map.set(assignee, {
        id: `custom-${assignee}`,
        name: assignee,
        role: 'Collaborator',
        total: 0,
        open: 0,
        overdue: 0,
        byStatus: { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 },
        byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
        loadStatus: 'Balanced',
      });
    }
    const r = map.get(assignee)!;
    r.total += 1;
    r.byStatus[t.status] = (r.byStatus[t.status] || 0) + 1;
    r.byPriority[t.priority] = (r.byPriority[t.priority] || 0) + 1;
    if (t.status !== 'done') r.open += 1;
    if (t.dueDate && t.status !== 'done' && new Date(t.dueDate).getTime() < Date.now()) {
      r.overdue += 1;
    }
  });

  const list = Array.from(map.values()).filter(m => m.total > 0 || m.name !== 'Unassigned');
  const avgOpen = list.length ? list.reduce((a, b) => a + b.open, 0) / list.length : 0;

  list.forEach(m => {
    if (m.name === 'Unassigned') {
      m.loadStatus = m.open > 0 ? 'Needs Assignment' : 'All Assigned';
    } else if (m.open >= 4 && m.open > avgOpen * 1.4) {
      m.loadStatus = 'Heavy Load';
    } else if (m.open === 0) {
      m.loadStatus = 'Available Capacity';
    } else {
      m.loadStatus = 'Balanced Load';
    }
  });

  return list.sort((a, b) => b.open - a.open);
}
