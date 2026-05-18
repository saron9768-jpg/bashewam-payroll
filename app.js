/**
 * Bashewam School — Payroll Management
 * Staff and payroll runs persist in the browser (localStorage).
 */

const STORAGE_KEY = "bashewam-payroll-v1";

/** Monthly base salary range (ETB) aligned with school budget. */
const MIN_BASE_SALARY = 10000;
const MAX_BASE_SALARY = 15000;

function clampBaseSalary(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return MIN_BASE_SALARY;
  return Math.min(MAX_BASE_SALARY, Math.max(MIN_BASE_SALARY, Math.round(v)));
}

const SCHOOL_SECTIONS = [
  { id: "kg", label: "Kindergarten", short: "KG" },
  { id: "g14", label: "Grades 1–4", short: "G1–4" },
  { id: "g58", label: "Grades 5–8", short: "G5–8" },
  { id: "g912", label: "Grades 9–12", short: "G9–12" },
];

function validSection(id) {
  return SCHOOL_SECTIONS.some((s) => s.id === id);
}

function sectionLabel(id) {
  const s = SCHOOL_SECTIONS.find((x) => x.id === id);
  return s ? s.label : "—";
}

function sectionShort(id) {
  const s = SCHOOL_SECTIONS.find((x) => x.id === id);
  return s ? s.short : "—";
}

function migrateEmployees(list) {
  const order = ["kg", "g14", "g58", "g912"];
  return list.map((e, i) => ({
    ...e,
    section: validSection(e.section) ? e.section : order[i % 4],
    baseSalary: clampBaseSalary(e.baseSalary),
  }));
}

function buildDefaultRoster() {
  const rows = [
    ["kg", "Tigist Alem", "Teacher", "Early literacy & stories", 10000, 800],
    ["kg", "Yonatan G/Michael", "Teacher", "Play, motor skills & routines", 10200, 850],
    ["kg", "Hanna Bekele", "Co-teacher", "Numeracy readiness", 10400, 900],
    ["kg", "Samuel Tadesse", "Teacher", "Creative arts & music", 10600, 950],
    ["kg", "Rahel Demeke", "Teacher", "Science discovery (KG)", 10800, 1000],
    ["g14", "Biruk Assefa", "Teacher", "English language arts", 11000, 1100],
    ["g14", "Marta Yohannes", "Teacher", "Mathematics", 11200, 1150],
    ["g14", "Elias Tekle", "Teacher", "Amharic / mother tongue", 11400, 1200],
    ["g14", "Saron Alemayehu", "Teacher", "Social studies", 11600, 1250],
    ["g14", "Kidist Haile", "Teacher", "Science & environment", 11800, 1300],
    ["g58", "Daniel Worku", "Teacher", "Mathematics", 12000, 1400],
    ["g58", "Meron Haile", "Senior teacher", "Integrated science", 12500, 1500],
    ["g58", "Getachew Birhanu", "Teacher", "English", 12800, 1550],
    ["g58", "Liya Mesfin", "Teacher", "Citizenship & civics", 13100, 1600],
    ["g58", "Natnael Solomon", "Teacher", "ICT & digital skills", 13400, 1650],
    ["g912", "Alemayehu Tesfaye", "Teacher", "Mathematics (secondary)", 13800, 1800],
    ["g912", "Eden Kassaye", "Teacher", "Physics", 14100, 1850],
    ["g912", "Yared Tesfaye", "Teacher", "Chemistry", 14400, 1900],
    ["g912", "Nardos Gebru", "Teacher", "Biology", 14700, 1950],
    ["g912", "Hailemariam Desta", "Career counselor", "Guidance & university prep", 15000, 2000],
  ];
  return rows.map(([section, name, role, department, baseSalary, allowance], idx) => ({
    id: `emp-${idx + 1}`,
    section,
    name,
    role,
    department,
    baseSalary,
    allowance,
  }));
}

const defaultEmployees = buildDefaultRoster();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { employees: migrateEmployees([...defaultEmployees]), payrollRuns: [] };
    }
    const parsed = JSON.parse(raw);
    return {
      employees: migrateEmployees(
        Array.isArray(parsed.employees) ? parsed.employees : [...defaultEmployees]
      ),
      payrollRuns: Array.isArray(parsed.payrollRuns) ? parsed.payrollRuns : [],
    };
  } catch {
    return { employees: migrateEmployees([...defaultEmployees]), payrollRuns: [] };
  }
}

function saveState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ employees: state.employees, payrollRuns: state.payrollRuns })
  );
}

let state = loadState();

/** Last payroll summary shown on the Payroll tab (for print / CSV). */
let lastPayrollSnapshot = null;

/** Run currently open in the history modal. */
let modalRun = null;

function formatMoney(n) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(n);
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function setActivePanel(id) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === id));
  document.querySelectorAll(".nav-tabs button").forEach((b) => {
    b.classList.toggle("active", b.dataset.panel === id);
  });
}

function calcEmployeeRow(emp, taxPercent, pensionPercent) {
  const gross = emp.baseSalary + emp.allowance;
  const tax = Math.round((gross * taxPercent) / 100);
  const pension = Math.round((gross * pensionPercent) / 100);
  const net = gross - tax - pension;
  return { gross, tax, pension, net };
}

function renderDashboard() {
  const emps = state.employees;
  const totalMonthly = emps.reduce((s, e) => s + e.baseSalary + e.allowance, 0);
  const lastRun = state.payrollRuns[state.payrollRuns.length - 1];

  document.getElementById("stat-staff").textContent = String(emps.length);
  document.getElementById("stat-gross").textContent = formatMoney(totalMonthly);
  document.getElementById("stat-runs").textContent = String(state.payrollRuns.length);

  const lastEl = document.getElementById("stat-last");
  if (lastRun) {
    lastEl.textContent = lastRun.period + " · " + formatMoney(lastRun.totalNet);
  } else {
    lastEl.textContent = "No payroll run yet";
  }

  const secEl = document.getElementById("section-stats");
  if (secEl) {
    secEl.innerHTML = SCHOOL_SECTIONS.map((s) => {
      const n = emps.filter((e) => e.section === s.id).length;
      return `<div class="stat-card"><span>${s.label}</span><strong>${n}</strong><span class="stat-card-hint">on roster</span></div>`;
    }).join("");
  }
}

function renderEmployees() {
  const tbody = document.querySelector("#employee-table tbody");
  tbody.innerHTML = "";

  if (state.employees.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7"><div class="empty-state">No staff yet. Add employees below.</div></td></tr>';
    return;
  }

  const q = getStaffFilterQuery();
  const sec = getStaffSectionFilter();
  let list = state.employees;
  if (sec) list = list.filter((e) => e.section === sec);
  if (q) {
    list = list.filter((e) => {
      const dept = (e.department || "").toLowerCase();
      const secLab = sectionLabel(e.section).toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        dept.includes(q) ||
        secLab.includes(q)
      );
    });
  }

  if (list.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7"><div class="empty-state">No staff match your filters. Try clearing the section or search.</div></td></tr>';
    return;
  }

  for (const emp of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(emp.name)}</td>
      <td>${escapeHtml(sectionLabel(emp.section))}</td>
      <td>${escapeHtml(emp.role)}</td>
      <td>${escapeHtml(emp.department)}</td>
      <td>${formatMoney(emp.baseSalary)}</td>
      <td>${formatMoney(emp.allowance)}</td>
      <td class="actions">
        <button type="button" class="btn btn-ghost btn-sm" data-edit="${emp.id}">Edit</button>
        <button type="button" class="btn btn-danger btn-sm" data-del="${emp.id}">Remove</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(btn.getAttribute("data-edit")));
  });
  tbody.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => removeEmployee(btn.getAttribute("data-del")));
  });
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function getStaffFilterQuery() {
  const el = document.getElementById("staff-filter");
  return el ? el.value.trim().toLowerCase() : "";
}

function getStaffSectionFilter() {
  const el = document.getElementById("staff-section-filter");
  return el && el.value && validSection(el.value) ? el.value : "";
}

function lineSectionLabel(line) {
  if (line.section && validSection(line.section)) return sectionLabel(line.section);
  const e = state.employees.find((x) => x.id === line.empId);
  return e ? sectionLabel(e.section) : "—";
}

function csvEscapeCell(s) {
  const t = String(s);
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function payrollRunToCSV(run) {
  const meta = [
    `Period,${csvEscapeCell(run.period)}`,
    `Tax %,${run.taxPercent}`,
    `Pension %,${run.pensionPercent}`,
    "",
    "Name,Section,Gross (ETB),Tax (ETB),Pension (ETB),Net (ETB)",
  ];
  const rows = run.lines.map(
    (l) =>
      `${csvEscapeCell(l.name)},${csvEscapeCell(lineSectionLabel(l))},${l.gross},${l.tax},${l.pension},${l.net}`
  );
  return meta.concat(rows).join("\r\n");
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatRunDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function buildRunDetailHtml(run) {
  const rows = run.lines
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.name)}</td><td>${escapeHtml(lineSectionLabel(l))}</td><td>${formatMoney(l.gross)}</td><td>${formatMoney(l.tax)}</td><td>${formatMoney(l.pension)}</td><td><strong>${formatMoney(l.net)}</strong></td></tr>`
    )
    .join("");
  return `
    <p class="modal-meta">Saved ${run.createdAt ? formatRunDate(run.createdAt) : "—"} · Tax ${run.taxPercent}% · Pension ${run.pensionPercent}%</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Section</th><th>Gross</th><th>Tax</th><th>Pension</th><th>Net pay</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="modal-totals"><strong>Total gross:</strong> ${formatMoney(run.totalGross)} &nbsp;·&nbsp; <strong>Total net:</strong> ${formatMoney(run.totalNet)}</p>
  `;
}

function openRunModal(runId) {
  const run = state.payrollRuns.find((r) => r.id === runId);
  if (!run) return;
  modalRun = run;
  const root = document.getElementById("run-modal");
  document.getElementById("run-modal-title").textContent = `Payroll — ${run.period}`;
  document.getElementById("run-modal-body").innerHTML = buildRunDetailHtml(run);
  root.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeRunModal() {
  modalRun = null;
  const root = document.getElementById("run-modal");
  root.hidden = true;
  document.body.style.overflow = "";
}

function deleteModalRun() {
  if (!modalRun) return;
  if (!confirm(`Delete the payroll run for “${modalRun.period}”? This cannot be undone.`)) return;
  state.payrollRuns = state.payrollRuns.filter((r) => r.id !== modalRun.id);
  saveState(state);
  closeRunModal();
  renderHistory();
  renderDashboard();
  showToast("Payroll run deleted.");
}

function startEdit(id) {
  const emp = state.employees.find((e) => e.id === id);
  if (!emp) return;
  document.getElementById("emp-id").value = emp.id;
  document.getElementById("emp-name").value = emp.name;
  document.getElementById("emp-role").value = emp.role;
  document.getElementById("emp-dept").value = emp.department;
  document.getElementById("emp-section").value = validSection(emp.section) ? emp.section : "kg";
  document.getElementById("emp-base").value = emp.baseSalary;
  document.getElementById("emp-allow").value = emp.allowance;
  document.getElementById("emp-form-title").textContent = "Edit staff member";
  document.getElementById("emp-submit").textContent = "Save changes";
  document.getElementById("emp-cancel").style.display = "inline-flex";
  document.getElementById("employees").scrollIntoView({ behavior: "smooth" });
}

function cancelEdit() {
  document.getElementById("emp-id").value = "";
  document.getElementById("emp-form").reset();
  document.getElementById("emp-form-title").textContent = "Add staff member";
  document.getElementById("emp-submit").textContent = "Add to roster";
  document.getElementById("emp-cancel").style.display = "none";
}

function removeEmployee(id) {
  if (!confirm("Remove this staff member from the roster?")) return;
  state.employees = state.employees.filter((e) => e.id !== id);
  saveState(state);
  renderEmployees();
  renderDashboard();
  showToast("Staff member removed.");
}

function renderPayrollForm() {
  const sectionId = document.getElementById("payroll-section").value;
  const sel = document.getElementById("payroll-employee");
  const prev = sel.value;
  sel.innerHTML = '<option value="">— All in scope above —</option>';
  const pool = sectionId ? state.employees.filter((e) => e.section === sectionId) : state.employees;
  for (const e of pool) {
    const opt = document.createElement("option");
    opt.value = e.id;
    opt.textContent = `${e.name} (${sectionShort(e.section)})`;
    sel.appendChild(opt);
  }
  if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
}

function renderHistory() {
  const tbody = document.querySelector("#history-table tbody");
  tbody.innerHTML = "";

  if (state.payrollRuns.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5"><div class="empty-state">Run payroll from the Payroll tab to see history here.</div></td></tr>';
    return;
  }

  const reversed = [...state.payrollRuns].reverse();
  for (const run of reversed) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(run.period)}</td>
      <td>${run.lineCount} staff</td>
      <td>${formatMoney(run.totalGross)}</td>
      <td>${formatMoney(run.totalNet)}</td>
      <td class="no-print actions">
        <button type="button" class="btn btn-ghost btn-sm" data-view-run="${run.id}">View</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll("[data-view-run]").forEach((btn) => {
    btn.addEventListener("click", () => openRunModal(btn.getAttribute("data-view-run")));
  });
}

function runPayroll() {
  const period = document.getElementById("pay-period").value.trim();
  const taxP = Number(document.getElementById("tax-pct").value) || 0;
  const penP = Number(document.getElementById("pension-pct").value) || 0;
  const sectionId = document.getElementById("payroll-section").value;
  const filterId = document.getElementById("payroll-employee").value;

  if (!period) {
    showToast("Enter a pay period (e.g. March 2026).");
    return;
  }
  if (state.employees.length === 0) {
    showToast("Add staff before running payroll.");
    return;
  }

  let list = state.employees;
  if (sectionId && validSection(sectionId)) {
    list = list.filter((e) => e.section === sectionId);
  }
  if (filterId) {
    const one = state.employees.find((e) => e.id === filterId);
    if (!one) {
      showToast("Selected person was not found.");
      return;
    }
    if (sectionId && one.section !== sectionId) {
      showToast("That person is not in the selected section. Clear the section filter or choose another name.");
      return;
    }
    list = [one];
  }

  if (list.length === 0) {
    showToast("No staff in the selected section.");
    return;
  }

  const lines = list.map((emp) => {
    const { gross, tax, pension, net } = calcEmployeeRow(emp, taxP, penP);
    return {
      empId: emp.id,
      name: emp.name,
      section: emp.section,
      gross,
      tax,
      pension,
      net,
    };
  });

  const totalGross = lines.reduce((s, l) => s + l.gross, 0);
  const totalNet = lines.reduce((s, l) => s + l.net, 0);

  const runRecord = {
    id: uid(),
    period,
    taxPercent: taxP,
    pensionPercent: penP,
    lines,
    totalGross,
    totalNet,
    lineCount: lines.length,
    createdAt: new Date().toISOString(),
  };
  state.payrollRuns.push(runRecord);
  saveState(state);

  lastPayrollSnapshot = { ...runRecord };

  const out = document.getElementById("payroll-output");
  out.innerHTML = `
    <div class="payroll-output-toolbar no-print">
      <button type="button" class="btn btn-ghost btn-sm" id="btn-print-latest">Print summary</button>
      <button type="button" class="btn btn-ghost btn-sm" id="btn-csv-latest">Download CSV</button>
    </div>
    <h3 class="section-title" style="margin-top:0">Summary — ${escapeHtml(period)}</h3>
    <p style="color:var(--muted);margin-top:0;font-size:0.9rem">
      Applied rates for this run: tax ${taxP}% · pension ${penP}%
    </p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Section</th><th>Gross</th><th>Tax</th><th>Pension</th><th>Net pay</th></tr></thead>
        <tbody>
          ${lines
            .map(
              (l) =>
                `<tr><td>${escapeHtml(l.name)}</td><td>${escapeHtml(lineSectionLabel(l))}</td><td>${formatMoney(l.gross)}</td><td>${formatMoney(l.tax)}</td><td>${formatMoney(l.pension)}</td><td><strong>${formatMoney(l.net)}</strong></td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <p style="margin-top:1rem"><strong>Total net:</strong> ${formatMoney(totalNet)}</p>
  `;

  renderDashboard();
  renderHistory();
  showToast("Payroll run saved.");
}

function resetDemoData() {
  if (!confirm("Restore the default staff list and clear all saved payroll runs?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  cancelEdit();
  renderDashboard();
  renderEmployees();
  renderPayrollForm();
  renderHistory();
  document.getElementById("payroll-output").innerHTML = "";
  lastPayrollSnapshot = null;
  showToast("Default staff list restored.");
}

document.querySelectorAll(".nav-tabs button").forEach((btn) => {
  btn.addEventListener("click", () => setActivePanel(btn.dataset.panel));
});

document.getElementById("emp-form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const id = document.getElementById("emp-id").value;
  const name = document.getElementById("emp-name").value.trim();
  const section = document.getElementById("emp-section").value;
  const role = document.getElementById("emp-role").value.trim();
  const department = document.getElementById("emp-dept").value.trim();
  const baseSalary = Number(document.getElementById("emp-base").value);
  const allowance = Number(document.getElementById("emp-allow").value);

  if (!name || !role) {
    showToast("Name and role are required.");
    return;
  }
  if (!validSection(section)) {
    showToast("Choose a valid school section.");
    return;
  }
  if (Number.isNaN(baseSalary) || baseSalary < MIN_BASE_SALARY || baseSalary > MAX_BASE_SALARY) {
    showToast(`Base salary must be between ${formatMoney(MIN_BASE_SALARY)} and ${formatMoney(MAX_BASE_SALARY)}.`);
    return;
  }

  const allow = Number.isNaN(allowance) ? 0 : Math.max(0, allowance);

  if (id) {
    const idx = state.employees.findIndex((e) => e.id === id);
    if (idx >= 0) {
      state.employees[idx] = {
        ...state.employees[idx],
        name,
        section,
        role,
        department,
        baseSalary,
        allowance: allow,
      };
      showToast("Staff updated.");
    }
  } else {
    state.employees.push({
      id: uid(),
      name,
      section,
      role,
      department,
      baseSalary,
      allowance: allow,
    });
    showToast("Staff added.");
  }

  saveState(state);
  cancelEdit();
  renderEmployees();
  renderDashboard();
  renderPayrollForm();
});

document.getElementById("emp-cancel").addEventListener("click", cancelEdit);

document.getElementById("btn-run-payroll").addEventListener("click", runPayroll);

document.getElementById("btn-reset-demo").addEventListener("click", resetDemoData);

document.getElementById("staff-filter").addEventListener("input", () => renderEmployees());

document.getElementById("staff-section-filter").addEventListener("change", () => renderEmployees());

document.getElementById("payroll-section").addEventListener("change", () => renderPayrollForm());

document.getElementById("payroll-output").addEventListener("click", (e) => {
  if (e.target.closest("#btn-print-latest")) {
    document.body.classList.add("print-only-payroll");
    window.print();
  }
  if (e.target.closest("#btn-csv-latest") && lastPayrollSnapshot) {
    const safe = String(lastPayrollSnapshot.period).replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
    downloadTextFile(`bashewam-payroll-${safe || "export"}.csv`, payrollRunToCSV(lastPayrollSnapshot));
    showToast("CSV downloaded.");
  }
});

document.querySelectorAll("[data-close-run-modal]").forEach((el) => {
  el.addEventListener("click", closeRunModal);
});

document.getElementById("run-modal-print").addEventListener("click", () => {
  if (!modalRun) return;
  document.body.classList.add("print-only-runmodal");
  window.print();
});

document.getElementById("run-modal-csv").addEventListener("click", () => {
  if (!modalRun) return;
  const safe = String(modalRun.period).replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  downloadTextFile(`bashewam-payroll-${safe || "export"}.csv`, payrollRunToCSV(modalRun));
  showToast("CSV downloaded.");
});

document.getElementById("run-modal-delete").addEventListener("click", deleteModalRun);

window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-only-payroll", "print-only-runmodal");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.getElementById("run-modal").hidden) {
    closeRunModal();
  }
});

renderDashboard();
renderEmployees();
renderPayrollForm();
renderHistory();
