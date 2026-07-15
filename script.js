const storeTree = {
  code: "7222",
  name: "首都T3门店",
  manager: "李晓楠",
  teams: [
    { name: "T3香化", groups: ["72222201", "72222401", "72221301", "72222501"] },
    { name: "T3烟酒", groups: ["72221201", "72221501", "72222301", "72222901"] },
    { name: "T3精品专卖", groups: ["72221601", "72221602", "72221603", "72221604", "72221605", "72221607", "72221801", "72221704", "72222801", "72222802", "72222803", "72222804", "72222805", "72222806"] },
    { name: "T3精品综合", groups: ["72221401", "72221606", "72221701", "72221702", "72221802", "72221901", "72221902", "72222601", "72222602", "72222603", "72222604", "72222701", "72222702", "72223001"] },
    { name: "T3入境", groups: ["72225101", "72225102", "72225103", "72225104"] }
  ]
};
const groups = storeTree.teams.flatMap(team => team.groups);
const groupToTeam = new Map(storeTree.teams.flatMap(team => team.groups.map(group => [group, team.name])));
const splitGroupCodes = new Set(["72225101", "72225104"]);
const splitAreas = ["烟区", "精品区", "酒水区", "香化A", "香化B"];
const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const employees = [
  { name: "陈亚琳", id: "26081021" }, { name: "唐伟", id: "26081022" }, { name: "蒙海晓", id: "26081023" }, { name: "胡巧菊", id: "26081024" },
  { name: "王一诺", id: "26081025" }, { name: "赵敏", id: "26081026" }, { name: "李明", id: "26081027" }, { name: "刘佳", id: "26081028" },
  { name: "周晴", id: "26081029" }, { name: "吴越", id: "26081030" }, { name: "孙晨", id: "26081031" }, { name: "黄静", id: "26081032" }
];
const allowedImportGroups = new Set(groups.slice(0, 18));
const months = ["2026-07", "2026-06", "2026-05", "2026-04"];
let records = createRecords();
let filteredRecords = [...records];
let selectedIds = new Set();
let currentPage = 1;
let pageSize = 30;
let editingId = null;
let pickedFileName = "";
let selectedStoreFilter = { type: "", value: "" };
let selectedMonthRange = { start: "", end: "" };
let monthPanelYear = 2026;

const $ = selector => document.querySelector(selector);
const body = $("#tableBody");

function createRecords() {
  const editors = ["蒙海晓", "唐伟", "陈亚琳", "胡巧菊"];
  return Array.from({ length: 96 }, (_, index) => {
    const employee = employees[index % employees.length];
    const group = groups[index % groups.length];
    const month = months[Math.floor(index / 24) % months.length];
    return { id: `target-${index + 1}`, group, employeeName: employee.name, employeeId: employee.id, month, attendanceDays: 22 + (index % 5), amount: index % 11 === 0 ? 0 : 20000 + (index % 17) * 3500 + Math.floor(index / 8) * 1000, updatedBy: editors[index % editors.length], updatedAt: `2026-07-${String(3 - Math.min(2, Math.floor(index / 36))).padStart(2, "0")} ${String(10 + (index % 7)).padStart(2, "0")}:${String(16 + (index % 40)).padStart(2, "0")}:24` };
  });
}

function formatAmount(value) { return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 0 }); }
function escapeHtml(value = "") { return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])); }
function optionHtml(items, getValue, getLabel, selected) { return items.map(item => `<option value="${escapeHtml(getValue(item))}" ${getValue(item) === selected ? "selected" : ""}>${escapeHtml(getLabel(item))}</option>`).join(""); }
function baseGroup(value = "") { return String(value).split("-")[0]; }
function groupNeedsArea(group) { return splitGroupCodes.has(baseGroup(group)); }
function recordUniqueKey(record) { return [record.month, baseGroup(record.group), record.employeeName, record.employeeId].join("|"); }
function isEightDigitEmployeeId(value) { return /^\d{8}$/.test(String(value || "")); }
function alertDuplicate(message) { alert(message); }

function fillOptions() {
  renderStoreCascade();
  renderMonthPicker();
}

function storeFilterLabel() {
  if (!selectedStoreFilter.value) return "请选择门店/团队/柜组";
  return selectedStoreFilter.value;
}

function renderStoreCascade() {
  const panel = $("#storeFilter [data-cascade-panel]");
  const selectedTeam = selectedStoreFilter.type === "group" ? groupToTeam.get(selectedStoreFilter.value) : selectedStoreFilter.type === "team" ? selectedStoreFilter.value : "";
  const selectedGroups = selectedStoreFilter.type === "store" ? new Set(groups) : selectedStoreFilter.type === "team" ? new Set(storeTree.teams.find(team => team.name === selectedStoreFilter.value)?.groups || []) : selectedStoreFilter.type === "group" ? new Set([selectedStoreFilter.value]) : new Set();
  panel.innerHTML = `<div class="cascade-col store-col"><label class="cascade-option ${selectedStoreFilter.type === "store" ? "selected" : ""}" data-cascade-type="store" data-cascade-value="${storeTree.code}"><input type="checkbox" ${selectedStoreFilter.type === "store" ? "checked" : ""} /> <span>${storeTree.code}</span></label></div>
    <div class="cascade-col team-col">${storeTree.teams.map(team => `<label class="cascade-option ${selectedTeam === team.name ? "selected" : ""}" data-cascade-type="team" data-cascade-value="${escapeHtml(team.name)}"><input type="checkbox" ${selectedStoreFilter.type === "team" && selectedStoreFilter.value === team.name ? "checked" : ""} /> <span>${escapeHtml(team.name)}</span><em>›</em></label>`).join("")}</div>
    <div class="cascade-col group-col">${storeTree.teams.map(team => `<div class="cascade-group-list ${selectedTeam === team.name || !selectedTeam ? "active" : ""}" data-team="${escapeHtml(team.name)}">${team.groups.map(group => `<label class="cascade-option" data-cascade-type="group" data-cascade-value="${group}"><input type="checkbox" ${selectedGroups.has(group) ? "checked" : ""} /> <span>${group}</span></label>`).join("")}</div>`).join("")}</div>`;
  const trigger = $("#storeFilter [data-cascade-trigger]");
  $("#storeFilter [data-cascade-text]").textContent = storeFilterLabel();
  trigger.classList.toggle("placeholder", !selectedStoreFilter.value);
}

function setStoreFilter(type, value) {
  selectedStoreFilter = selectedStoreFilter.type === type && selectedStoreFilter.value === value ? { type: "", value: "" } : { type, value };
  renderStoreCascade();
}

function getFilterGroupCodes() {
  if (!selectedStoreFilter.value) return null;
  if (selectedStoreFilter.type === "store") return new Set(groups);
  if (selectedStoreFilter.type === "team") return new Set(storeTree.teams.find(team => team.name === selectedStoreFilter.value)?.groups || []);
  if (selectedStoreFilter.type === "group") return new Set([selectedStoreFilter.value]);
  return null;
}

function monthLabel(value) {
  if (!value) return "";
  const [year, month] = value.split("-");
  return `${year}/${month}`;
}

function formatMonthRangeLabel() {
  const { start, end } = selectedMonthRange;
  if (!start && !end) return "开始日期　-　结束日期";
  return `${monthLabel(start)}　-　${monthLabel(end || start)}`;
}

function shiftMonth(value, offset) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function setSelectedMonthRange(start, end = start) {
  selectedMonthRange = start && end && start > end ? { start: end, end: start } : { start, end };
  if (selectedMonthRange.start) monthPanelYear = Number(selectedMonthRange.start.slice(0, 4));
  renderMonthPicker();
}

function pickMonthRange(value) {
  const { start, end } = selectedMonthRange;
  if (!start || end) setSelectedMonthRange(value, "");
  else setSelectedMonthRange(start, value);
}

function shortcutMonthRange(type) {
  const now = "2026-07";
  const yearStart = `${now.slice(0, 4)}-01`;
  const quarterStart = `${now.slice(0, 4)}-${String(Math.floor((Number(now.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, "0")}`;
  const ranges = {
    current: [now, now],
    previous: [shiftMonth(now, -1), shiftMonth(now, -1)],
    recent3: [shiftMonth(now, -2), now],
    quarter: [quarterStart, now],
    year: [yearStart, now],
    lastYear: [`${Number(now.slice(0, 4)) - 1}-01`, `${Number(now.slice(0, 4)) - 1}-12`]
  };
  return ranges[type] || [now, now];
}

function monthButtonClass(value) {
  const { start, end } = selectedMonthRange;
  const isEdge = value === start || value === end;
  const inRange = start && end && value >= start && value <= end;
  return [isEdge ? "selected" : "", inRange && !isEdge ? "in-range" : ""].filter(Boolean).join(" ");
}

function renderMonthPicker() {
  const picker = $("#monthFilter");
  const trigger = picker.querySelector("[data-month-trigger]");
  const text = picker.querySelector("[data-month-text]");
  text.textContent = formatMonthRangeLabel();
  trigger.classList.toggle("placeholder", !selectedMonthRange.start);
  picker.querySelector("[data-month-panel]").innerHTML = `<div class="quick-months">
    <button type="button" data-month-shortcut="current">本月</button>
    <button type="button" data-month-shortcut="previous">上月</button>
    <button type="button" data-month-shortcut="recent3">近3个月</button>
    <button type="button" data-month-shortcut="quarter">本季</button>
    <button type="button" data-month-shortcut="year">今年</button>
    <button type="button" data-month-shortcut="lastYear">去年</button>
  </div><div class="month-grid-wrap">
    <div class="month-year"><button type="button" data-month-year="prev">«</button><strong>${monthPanelYear} 年</strong><button type="button" data-month-year="next">»</button></div>
    <div class="month-grid">${monthNames.map((name, index) => {
      const value = `${monthPanelYear}-${String(index + 1).padStart(2, "0")}`;
      return `<button type="button" class="${monthButtonClass(value)}" data-month-value="${value}">${name}</button>`;
    }).join("")}</div>
  </div>`;
}

function closeMonthPicker() { $("#monthFilter").classList.remove("open"); }

function normalizeRecordForForm(record = {}) {
  const rawGroup = record.group || "";
  const group = baseGroup(rawGroup);
  const area = record.area || (String(rawGroup).includes("-") ? String(rawGroup).split("-").slice(1).join("-") : "");
  return { ...record, group, area, groups: group ? [group] : [], employeeIds: record.employeeId ? [record.employeeId] : [] };
}

function normalizeSelected(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function formatMultiText(labels, placeholder) {
  if (!labels.length) return placeholder;
  return labels.length > 2 ? `${labels.slice(0, 2).join("、")} 等${labels.length}项` : labels.join("、");
}

function createMultiSelect(field, items, selectedValues, placeholder, getValue, getLabel, getShortLabel = getLabel) {
  const selected = new Set(normalizeSelected(selectedValues));
  const selectedLabels = items.filter(item => selected.has(getValue(item))).map(item => getShortLabel(item));
  return `<div class="multi-select" data-multi="${field}" data-placeholder="${escapeHtml(placeholder)}">
    <button type="button" class="multi-trigger ${selectedLabels.length ? "" : "placeholder"}" data-multi-trigger><span data-multi-text>${escapeHtml(formatMultiText(selectedLabels, placeholder))}</span><b>⌄</b></button>
    <div class="multi-menu">
      <div class="multi-menu-head"><span>${escapeHtml(placeholder)}</span><button type="button" data-clear-multi>清空</button></div>
      ${items.map(item => {
        const value = getValue(item);
        const label = getLabel(item);
        return `<label><input type="checkbox" data-field="${field}" data-short-label="${escapeHtml(getShortLabel(item))}" value="${escapeHtml(value)}" ${selected.has(value) ? "checked" : ""} /><span>${escapeHtml(label)}</span></label>`;
      }).join("")}
    </div>
  </div>`;
}

function createSingleSelect(field, items, selectedValue, placeholder, getValue, getLabel = getValue) {
  return `<select data-field="${field}"><option value="">${escapeHtml(placeholder)}</option>${optionHtml(items, getValue, getLabel, selectedValue || "")}</select>`;
}

function formatEmployeeInput(data = {}) {
  if (data.employeeText) return data.employeeText;
  const ids = normalizeSelected(data.employeeIds || data.employeeId);
  return ids.map(employeeId => {
    const employee = employees.find(item => item.id === employeeId);
    return employee ? `${employee.name} / ${employee.id}` : employeeId;
  }).join("\n");
}

function parseEmployeeInput(value = "") {
  return value.split(/[\n,，]+/).map(item => item.trim()).filter(Boolean).map(item => {
    const match = item.match(/^(.+?)\s*[\/／]\s*(\d+)$/);
    return match ? { employeeName: match[1].trim(), employeeId: match[2].trim() } : { raw: item };
  });
}

function updateMultiSelect(multi) {
  const labels = [...multi.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.dataset.shortLabel || input.value);
  const text = multi.querySelector("[data-multi-text]");
  const trigger = multi.querySelector("[data-multi-trigger]");
  text.textContent = formatMultiText(labels, multi.dataset.placeholder);
  trigger.classList.toggle("placeholder", !labels.length);
}

function closeMultiSelects(except = null) {
  document.querySelectorAll(".multi-select.open").forEach(multi => { if (multi !== except) multi.classList.remove("open"); });
}

function closeStoreCascade() { $("#storeFilter").classList.remove("open"); }

function parseMultiValueText(value = "") {
  return value.split(/[\n,，]+/).map(item => item.trim()).filter(Boolean);
}

function updateMultiValueCount() {
  $("#multiValueCount").textContent = parseMultiValueText($("#multiValueInput").value).length;
}

function openEmployeeIdMultiValue() {
  const values = parseMultiValueText($("#employeeIdFilter").value);
  $("#multiValueInput").value = values.join("\n");
  updateMultiValueCount();
  openModal("#multiValueModal");
  $("#multiValueInput").focus();
}

function confirmEmployeeIdMultiValue() {
  const values = parseMultiValueText($("#multiValueInput").value);
  $("#employeeIdFilter").value = values.join("，");
  closeModals();
}

function clearMultiSelect(multi) {
  multi.querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = false);
  updateMultiSelect(multi);
  const line = multi.closest("[data-form-line]");
  if (line && multi.dataset.multi === "group") syncAreaSelect(line);
}

function syncAreaSelect(line) {
  const areaSelect = line.querySelector('[data-field="area"]');
  const group = line.querySelector('[data-field="group"]').value;
  const enabled = groupNeedsArea(group);
  areaSelect.disabled = !enabled;
  if (!enabled) areaSelect.value = "";
  areaSelect.options[0].textContent = enabled ? "请选择分区" : "无需选择分区";
}

function syncFormLineState() {
  document.querySelectorAll("[data-multi]").forEach(updateMultiSelect);
  document.querySelectorAll("[data-form-line]").forEach(syncAreaSelect);
}

function createFormLine(data = {}, canRemove = false) {
  const selectedGroup = normalizeSelected(data.groups || data.group)[0] || "";
  const employeeText = formatEmployeeInput(data);
  const month = data.month || "";
  const amount = data.amount ?? "";
  const attendanceDays = data.attendanceDays ?? "";
  const area = data.area || "";
  const areaEnabled = groupNeedsArea(selectedGroup);
  return `<div class="add-row" data-form-line>
    ${createSingleSelect("group", groups, selectedGroup, "请选择柜组", item => item, item => item)}
    <select data-field="area" ${areaEnabled ? "" : "disabled"}><option value="">${areaEnabled ? "请选择分区" : "无需选择分区"}</option>${optionHtml(splitAreas, item => item, item => item, area)}</select>
    <input data-field="employeeText" placeholder="请输入员工姓名 / 工号" value="${escapeHtml(employeeText)}" title="按“姓名 / 工号”输入，例如：陈亚琳 / 26081021" />
    <select data-field="month"><option value="">请选择月份</option>${optionHtml(months, item => item, item => item, month)}</select>
    <input data-field="attendanceDays" type="number" min="0" max="31" placeholder="出勤天数" value="${escapeHtml(attendanceDays)}" />
    <input data-field="amount" type="number" min="0" placeholder="请输入目标销售额（元）" value="${escapeHtml(amount)}" />
    <div class="row-actions">
      <button class="round-plus" data-add-line title="增加一行">＋</button>
      ${canRemove ? `<button class="round-minus" data-remove-line title="删除此行">−</button>` : ""}
    </div>
  </div>`;
}

function resetFormLines(seed = {}) {
  $("#formLines").innerHTML = createFormLine(seed, false);
  $("#formTip").textContent = "";
  syncFormLineState();
}

function readFormLines() {
  const rows = [];
  const errors = [];
  const lines = [...document.querySelectorAll("[data-form-line]")];
  lines.forEach((line, index) => {
    const prefix = lines.length > 1 ? `第${index + 1}行：` : "";
    const selectedGroup = line.querySelector('[data-field="group"]').value;
    const employeeEntries = parseEmployeeInput(line.querySelector('[data-field="employeeText"]').value);
    const month = line.querySelector('[data-field="month"]').value;
    const area = line.querySelector('[data-field="area"]').value;
    const attendanceText = line.querySelector('[data-field="attendanceDays"]').value.trim();
    const attendanceDays = Number(attendanceText);
    const amountText = line.querySelector('[data-field="amount"]').value.trim();
    const amount = Number(amountText);
    if (!selectedGroup) errors.push(`${prefix}请选择柜组`);
    if (!employeeEntries.length) errors.push(`${prefix}请输入员工信息`);
    if (!month) errors.push(`${prefix}请选择月份`);
    if (!attendanceText) errors.push(`${prefix}请输入出勤天数`);
    if (attendanceText && (Number.isNaN(attendanceDays) || attendanceDays < 0 || attendanceDays > 31)) errors.push(`${prefix}出勤天数需为0-31之间的数字`);
    if (!amountText) errors.push(`${prefix}请输入目标销售额`);
    if (amountText && Number.isNaN(amount)) errors.push(`${prefix}请输入正确的目标销售额`);
    if (errors.length) return;
    employeeEntries.forEach(entry => {
      if (entry.raw) errors.push(`${prefix}员工信息需按“姓名 / 工号”格式输入`);
      else if (!isEightDigitEmployeeId(entry.employeeId)) errors.push(`${prefix}${entry.employeeName}的工号必须为8位数字`);
      else rows.push({ group: selectedGroup, employeeName: entry.employeeName, employeeId: entry.employeeId, month, area, attendanceDays, amount });
    });
  });
  return { rows, errors };
}

function findDuplicateRows(rows, ignoredId = null) {
  const existingKeys = new Map(records.filter(record => record.id !== ignoredId).map(record => [recordUniqueKey(record), record]));
  const inputKeys = new Map();
  const duplicateKeys = new Set();
  const messages = [];
  rows.forEach((row, index) => {
    const key = recordUniqueKey(row);
    if (inputKeys.has(key)) {
      duplicateKeys.add(key);
      messages.push(`第${inputKeys.get(key) + 1}行与第${index + 1}行重复：${row.month} / ${baseGroup(row.group)} / ${row.employeeName} / ${row.employeeId}`);
    } else inputKeys.set(key, index);
    if (existingKeys.has(key)) {
      duplicateKeys.add(key);
      messages.push(`第${index + 1}行与已有数据重复：${row.month} / ${baseGroup(row.group)} / ${row.employeeName} / ${row.employeeId}`);
    }
  });
  return { messages };
}

function expandSplitRows(rows, updatedAt) {
  return rows.flatMap(row => {
    if (!splitGroupCodes.has(row.group)) return [{ id: `target-${Date.now()}-${Math.random().toString(16).slice(2)}`, ...row, updatedBy: "当前用户", updatedAt }];
    if (row.area) return [{ id: `target-${Date.now()}-${Math.random().toString(16).slice(2)}`, ...row, group: `${row.group}-${row.area}`, updatedBy: "当前用户", updatedAt }];
    const base = Math.floor(row.amount / splitAreas.length);
    const remainder = row.amount - base * splitAreas.length;
    return splitAreas.map((area, index) => ({
      id: `target-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      ...row,
      group: `${row.group}-${area}`,
      amount: base + (index === splitAreas.length - 1 ? remainder : 0),
      updatedBy: "当前用户",
      updatedAt
    }));
  });
}

function render() {
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const pageRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  body.innerHTML = pageRecords.map(record => `<tr class="${selectedIds.has(record.id) ? "selected" : ""}"><td><input type="checkbox" data-select="${record.id}" ${selectedIds.has(record.id) ? "checked" : ""} /></td><td title="${record.group}">${record.group}</td><td>${record.employeeName}</td><td>${record.employeeId}</td><td>${record.month}</td><td>${record.attendanceDays ?? ""}</td><td>${formatAmount(record.amount)}</td><td>${record.updatedBy}</td><td>${record.updatedAt}</td><td><div class="ops"><a href="#" data-copy="${record.id}">复制</a><a href="#" data-edit="${record.id}">修改</a><a href="#" data-delete="${record.id}">删除</a></div></td></tr>`).join("");
  $("#emptyState").hidden = filteredRecords.length > 0;
  $("#totalText").textContent = `共 ${filteredRecords.length} 条`;
  $("#jumpPage").value = currentPage;
  $("#prevPage").disabled = currentPage <= 1;
  $("#nextPage").disabled = currentPage >= totalPages;
  renderPages(totalPages);
  syncSelectionState(pageRecords);
}

function renderPages(totalPages) {
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1, 2, 3]);
  const sorted = [...pages].filter(page => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  let previous = 0;
  $("#pageNumbers").innerHTML = sorted.map(page => { const gap = page - previous > 1 ? `<button class="page-btn" disabled>...</button>` : ""; previous = page; return `${gap}<button class="page-btn ${page === currentPage ? "current" : ""}" data-page="${page}">${page}</button>`; }).join("");
}

function syncSelectionState(pageRecords = []) {
  const selectedCount = selectedIds.size;
  $("#editSelectedBtn").disabled = selectedCount !== 1;
  $("#editSelectedBtn").classList.toggle("disabled", selectedCount !== 1);
  $("#batchDeleteBtn").disabled = selectedCount === 0;
  $("#batchDeleteBtn").classList.toggle("disabled", selectedCount === 0);
  $("#selectAll").checked = pageRecords.length > 0 && pageRecords.every(record => selectedIds.has(record.id));
}

function applyFilters() {
  const storeCodes = getFilterGroupCodes(), name = $("#nameFilter").value.trim(), employeeIds = parseMultiValueText($("#employeeIdFilter").value), { start: monthStart, end: monthEnd } = selectedMonthRange;
  const min = Number($("#minAmount").value || 0), max = Number($("#maxAmount").value || Number.MAX_SAFE_INTEGER), keyword = $("#globalSearch").value.trim();
  filteredRecords = records.filter(record => {
    const recordGroup = baseGroup(record.group);
    const teamName = groupToTeam.get(recordGroup) || "";
    const inMonthRange = !monthStart || record.month >= monthStart && record.month <= (monthEnd || monthStart);
    return (!storeCodes || storeCodes.has(recordGroup)) && (!name || record.employeeName.includes(name)) && (!employeeIds.length || employeeIds.some(employeeId => record.employeeId.includes(employeeId))) && inMonthRange && record.amount >= min && record.amount <= max && (!keyword || [record.group, teamName, storeTree.code, record.employeeName, record.employeeId, record.month, record.updatedBy].some(value => String(value).includes(keyword)));
  });
  currentPage = 1; selectedIds.clear(); render(); toast(`查询完成，共 ${filteredRecords.length} 条数据`);
}

function resetFilters() {
  selectedStoreFilter = { type: "", value: "" };
  selectedMonthRange = { start: "", end: "" };
  renderStoreCascade();
  renderMonthPicker();
  ["#nameFilter", "#employeeIdFilter", "#minAmount", "#maxAmount", "#globalSearch"].forEach(selector => $(selector).value = "");
  filteredRecords = [...records]; selectedIds.clear(); currentPage = 1; render(); toast("筛选条件已重置");
}

function openModal(id) { $(id).hidden = false; }
function closeModals() { document.querySelectorAll(".modal-mask").forEach(modal => modal.hidden = true); $("#formTip").textContent = ""; closeMultiSelects(); }

function openEditor(record, copy = false) {
  editingId = record && !copy ? record.id : null;
  $("#editTitle").textContent = record && !copy ? "修改" : copy ? "复制" : "新增";
  resetFormLines(record ? normalizeRecordForForm({ ...record, amount: copy ? "" : record.amount }) : {});
  openModal("#editModal");
}

function saveRecord() {
  const { rows, errors } = readFormLines();
  if (errors.length) { $("#formTip").textContent = errors[0]; return; }
  if (rows.some(row => row.amount < 0)) { $("#formTip").textContent = "目标销售额不能小于 0"; return; }
  if (editingId && rows.length !== 1) { $("#formTip").textContent = "修改时仅支持选择一个柜组和一名员工"; return; }
  const duplicateResult = findDuplicateRows(rows, editingId);
  if (duplicateResult.messages.length) {
    const message = `发现重复数据，唯一值为“月份 + 柜组 + 员工姓名 + 工号”。\n${duplicateResult.messages.slice(0, 4).join("\n")}`;
    $("#formTip").textContent = duplicateResult.messages[0];
    alertDuplicate(message);
    return;
  }
  const updatedAt = "2026-07-03 17:30:00";
  if (editingId) {
    const row = rows[0];
    const persistedRow = splitGroupCodes.has(row.group) && row.area ? { ...row, group: `${row.group}-${row.area}` } : row;
    records = records.map(record => record.id === editingId ? { ...record, ...persistedRow, updatedBy: "当前用户", updatedAt } : record);
    toast("修改成功");
  } else {
    const created = expandSplitRows(rows, updatedAt);
    records.unshift(...created);
    const splitCount = created.length - rows.length;
    toast(splitCount ? `新增成功，共 ${created.length} 条，已自动拆分 ${splitCount} 条区域数据` : `新增成功，共 ${created.length} 条`);
  }
  closeModals(); filteredRecords = [...records]; currentPage = 1; selectedIds.clear(); render();
}

function deleteRecord(id) {
  const record = records.find(item => item.id === id);
  if (!record || !confirm(`确认删除 ${record.employeeName} ${record.month} 的销售目标？`)) return;
  records = records.filter(item => item.id !== id); filteredRecords = filteredRecords.filter(item => item.id !== id); selectedIds.delete(id); render(); toast("删除成功");
}

function batchDelete() {
  if (!selectedIds.size || !confirm(`确认删除已选择的 ${selectedIds.size} 条数据？`)) return;
  records = records.filter(record => !selectedIds.has(record.id)); filteredRecords = filteredRecords.filter(record => !selectedIds.has(record.id)); selectedIds.clear(); render(); toast("批量删除成功");
}

function simulateImport() {
  const updateExisting = $("#updateExisting").checked;
  const importedRows = [
    { group: groups[0], employeeName: "陈亚琳", employeeId: "26081021", month: "2026-07", attendanceDays: 24, amount: 68000 },
    { group: groups[16], employeeName: "测试员工B", employeeId: "99000002", month: "2026-07", attendanceDays: 23, amount: 72000 }
  ];
  const permissionDenied = importedRows.filter(row => !allowedImportGroups.has(baseGroup(row.group)));
  const invalidEmployee = importedRows.find(row => !isEightDigitEmployeeId(row.employeeId));
  if (permissionDenied.length) { alert(`导入失败：存在无权限柜组 ${permissionDenied.map(row => row.group).join("、")}，数据权限需按柜组控制。`); return; }
  if (invalidEmployee) { alert(`导入失败：${invalidEmployee.employeeName} 的工号必须为8位数字。`); return; }
  const duplicateResult = updateExisting ? { messages: [] } : findDuplicateRows(importedRows);
  if (duplicateResult.messages.length) {
    alertDuplicate(`导入失败：发现重复数据。\n${duplicateResult.messages.slice(0, 4).join("\n")}`);
    closeModals();
    return;
  }
  const imported = importedRows.map((row, index) => ({ id: `import-${Date.now()}-${index + 1}`, ...row, updatedBy: "导入用户", updatedAt: "2026-07-03 17:35:00" }));
  records = updateExisting ? [...imported, ...records.filter(record => !new Set(imported.map(recordUniqueKey)).has(recordUniqueKey(record)))] : [...imported, ...records];
  filteredRecords = [...records]; selectedIds.clear(); currentPage = 1; closeModals(); render(); toast(`${pickedFileName || "测试数据"} 导入成功，新增 ${imported.length} 条`);
}

function downloadCsv(filename, csv) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); URL.revokeObjectURL(link.href);
}

function downloadTemplate() {
  const csv = [
    "月份,柜组,分区,员工姓名,工号,出勤天数,目标销售额（元）,规则说明",
    "2026-07,72222201,,陈亚琳,26081021,24,100000,数据权限按柜组控制；唯一值=月份+柜组+员工姓名+工号；工号必须为8位数字",
    "2026-07,72225101,烟区,唐伟,26081022,23,125000,分区仅柜组72225101和72225104填写；其他柜组留空",
    "2026-07,72225104,香化A,蒙海晓,26081023,22,68000,出勤天数必填且建议为0-31之间数字"
  ].join("\n");
  downloadCsv("员工-柜组导入模板.csv", csv);
}

function exportCurrentPage() {
  const rows = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const csv = ["柜组,员工姓名,工号,月份,出勤天数,目标销售额（元）,最后更新人,最后更新时间", ...rows.map(row => [row.group, row.employeeName, row.employeeId, row.month, row.attendanceDays ?? "", row.amount, row.updatedBy, row.updatedAt].join(","))].join("\n");
  downloadCsv("sales-target-current-page.csv", csv);
}

function toast(message) { const el = $("#toast"); el.textContent = message; el.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => el.hidden = true, 1800); }

fillOptions(); render();
$("#queryBtn").addEventListener("click", applyFilters);
$("#resetBtn").addEventListener("click", resetFilters);
$("#globalSearch").addEventListener("keydown", event => { if (event.key === "Enter") applyFilters(); });
$("#pageSize").addEventListener("change", event => { pageSize = Number(event.target.value); currentPage = 1; render(); });
$("#prevPage").addEventListener("click", () => { currentPage--; render(); });
$("#nextPage").addEventListener("click", () => { currentPage++; render(); });
$("#pageNumbers").addEventListener("click", event => { if (event.target.dataset.page) { currentPage = Number(event.target.dataset.page); render(); } });
$("#jumpPage").addEventListener("keydown", event => { if (event.key === "Enter") { currentPage = Number(event.target.value) || 1; render(); } });
$("#addBtn").addEventListener("click", () => openEditor(null));
$("#editSelectedBtn").addEventListener("click", () => openEditor(records.find(record => selectedIds.has(record.id))));
$("#importBtn").addEventListener("click", () => openModal("#importModal"));
$("#batchDeleteBtn").addEventListener("click", batchDelete);
$("#saveBtn").addEventListener("click", saveRecord);
$("#confirmImportBtn").addEventListener("click", simulateImport);
$("#exportBtn").addEventListener("click", exportCurrentPage);
$("#pickEmployeeBtn").addEventListener("click", openEmployeeIdMultiValue);
$("#multiValueInput").addEventListener("input", updateMultiValueCount);
$("#confirmMultiValueBtn").addEventListener("click", confirmEmployeeIdMultiValue);
$("#fullscreenBtn").addEventListener("click", () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
$("#collapseBtn").addEventListener("click", () => { $("#filters").classList.toggle("collapsed"); $("#collapseBtn").textContent = $("#filters").classList.contains("collapsed") ? "⌄" : "⌃"; });
$("#selectAll").addEventListener("change", event => { filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize).forEach(record => event.target.checked ? selectedIds.add(record.id) : selectedIds.delete(record.id)); render(); });
$("#storeFilter").addEventListener("click", event => {
  const trigger = event.target.closest("[data-cascade-trigger]");
  const option = event.target.closest("[data-cascade-type]");
  if (trigger) { event.preventDefault(); event.stopPropagation(); closeMultiSelects(); $("#storeFilter").classList.toggle("open"); }
  if (option) { event.preventDefault(); event.stopPropagation(); setStoreFilter(option.dataset.cascadeType, option.dataset.cascadeValue); }
});
$("#storeFilter").addEventListener("mouseover", event => {
  const teamOption = event.target.closest('[data-cascade-type="team"]');
  if (!teamOption) return;
  document.querySelectorAll(".cascade-group-list").forEach(list => list.classList.toggle("active", list.dataset.team === teamOption.dataset.cascadeValue));
  document.querySelectorAll(".team-col .cascade-option").forEach(option => option.classList.toggle("hover", option === teamOption));
});
$("#monthFilter").addEventListener("click", event => {
  const trigger = event.target.closest("[data-month-trigger]");
  const yearBtn = event.target.closest("[data-month-year]");
  const monthBtn = event.target.closest("[data-month-value]");
  const shortcut = event.target.closest("[data-month-shortcut]");
  if (trigger) { event.preventDefault(); event.stopPropagation(); closeStoreCascade(); closeMultiSelects(); $("#monthFilter").classList.toggle("open"); }
  if (yearBtn) { event.preventDefault(); event.stopPropagation(); monthPanelYear += yearBtn.dataset.monthYear === "prev" ? -1 : 1; renderMonthPicker(); $("#monthFilter").classList.add("open"); }
  if (monthBtn) {
    event.preventDefault(); event.stopPropagation();
    const wasPickingEnd = selectedMonthRange.start && !selectedMonthRange.end;
    pickMonthRange(monthBtn.dataset.monthValue);
    if (wasPickingEnd) closeMonthPicker();
  }
  if (shortcut) {
    event.preventDefault(); event.stopPropagation();
    const [start, end] = shortcutMonthRange(shortcut.dataset.monthShortcut);
    setSelectedMonthRange(start, end);
    closeMonthPicker();
  }
});
$("#formLines").addEventListener("change", event => {
  if (event.target.matches('[data-field="group"]')) {
    const line = event.target.closest("[data-form-line]");
    syncAreaSelect(line);
  }
});

$("#formLines").addEventListener("click", event => {
  const clearBtn = event.target.closest("[data-clear-multi]");
  if (clearBtn) { event.preventDefault(); event.stopPropagation(); clearMultiSelect(clearBtn.closest(".multi-select")); return; }
  const trigger = event.target.closest("[data-multi-trigger]");
  if (trigger) {
    event.preventDefault();
    event.stopPropagation();
    const multi = trigger.closest(".multi-select");
    const isOpen = multi.classList.contains("open");
    closeMultiSelects(multi);
    multi.classList.toggle("open", !isOpen);
    return;
  }
  if (event.target.matches("[data-add-line]")) { event.preventDefault(); $("#formLines").insertAdjacentHTML("beforeend", createFormLine({}, true)); syncFormLineState(); toast("已增加一行"); }
  if (event.target.matches("[data-remove-line]")) { event.preventDefault(); event.target.closest("[data-form-line]").remove(); }
});

document.addEventListener("click", event => {
  if (!event.target.closest(".multi-select")) closeMultiSelects();
  if (!event.target.closest("#storeFilter")) closeStoreCascade();
  if (!event.target.closest("#monthFilter")) closeMonthPicker();
  if (event.target.matches("[data-close]")) closeModals();
  if (event.target.dataset.edit) { event.preventDefault(); openEditor(records.find(record => record.id === event.target.dataset.edit)); }
  if (event.target.dataset.copy) { event.preventDefault(); openEditor(records.find(record => record.id === event.target.dataset.copy), true); }
  if (event.target.dataset.delete) { event.preventDefault(); deleteRecord(event.target.dataset.delete); }
});
document.addEventListener("change", event => { if (event.target.dataset.select) { event.target.checked ? selectedIds.add(event.target.dataset.select) : selectedIds.delete(event.target.dataset.select); render(); } });
document.querySelectorAll(".modal-mask").forEach(maskEl => maskEl.addEventListener("click", event => { if (event.target === maskEl) closeModals(); }));

const dropZone = $("#dropZone");
["dragenter", "dragover"].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add("drag"); }));
["dragleave", "drop"].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove("drag"); pickedFileName = event.dataTransfer?.files?.[0]?.name || "拖拽文件"; $("#uploadText").innerHTML = `已选择：<span>${pickedFileName}</span>`; }));
$("#fileInput").addEventListener("change", event => { pickedFileName = event.target.files[0]?.name || ""; if (pickedFileName) $("#uploadText").innerHTML = `已选择：<span>${pickedFileName}</span>`; });
