const storeTree = {
  code: "7222",
  name: "首都T3门店",
  manager: "李晓楠",
  teams: [
    { name: "T3香化", groups: ["7222201", "7222401", "7221301", "7222501"] },
    { name: "T3烟酒", groups: ["7221201", "7221501", "7222301", "7222901"] },
    { name: "T3精品专卖", groups: ["7221601", "7221602", "7221603", "7221604", "7221605", "7221607", "7221801", "7221704", "7222801", "7222802", "7222803", "7222804", "7222805", "7222806"] },
    { name: "T3精品综合", groups: ["7221401", "7221606", "7221701", "7221702", "7221802", "7221901", "7221902", "7222601", "7222602", "7222603", "7222604", "7222701", "7222702", "7223001"] },
    { name: "T3入境", groups: ["72225101", "72225102", "72225103", "72225104"] }
  ]
};
const groups = storeTree.teams.flatMap(team => team.groups);
const groupToTeam = new Map(storeTree.teams.flatMap(team => team.groups.map(group => [group, team.name])));
const splitGroupCodes = new Set(["72225101", "72225104"]);
const splitAreas = ["烟区", "精品区", "酒水区", "香化A", "香化B"];
const employees = [
  { name: "陈亚琳", id: "30202606081021" }, { name: "唐伟", id: "30202606081022" }, { name: "蒙海晓", id: "30202606081023" }, { name: "胡巧菊", id: "30202606081024" },
  { name: "王一诺", id: "30202606081025" }, { name: "赵敏", id: "30202606081026" }, { name: "李明", id: "30202606081027" }, { name: "刘佳", id: "30202606081028" },
  { name: "周晴", id: "30202606081029" }, { name: "吴越", id: "30202606081030" }, { name: "孙晨", id: "30202606081031" }, { name: "黄静", id: "30202606081032" }
];
const months = ["2026-07", "2026-06", "2026-05", "2026-04"];
let records = createRecords();
let filteredRecords = [...records];
let selectedIds = new Set();
let currentPage = 1;
let pageSize = 30;
let editingId = null;
let pickedFileName = "";
let selectedStoreFilter = { type: "", value: "" };

const $ = selector => document.querySelector(selector);
const body = $("#tableBody");

function createRecords() {
  const editors = ["蒙海晓", "唐伟", "陈亚琳", "胡巧菊"];
  return Array.from({ length: 96 }, (_, index) => {
    const employee = employees[index % employees.length];
    const group = groups[index % groups.length];
    const month = months[Math.floor(index / 24) % months.length];
    return { id: `target-${index + 1}`, group, employeeName: employee.name, employeeId: employee.id, month, amount: index % 11 === 0 ? 0 : 20000 + (index % 17) * 3500 + Math.floor(index / 8) * 1000, updatedBy: editors[index % editors.length], updatedAt: `2026-07-${String(3 - Math.min(2, Math.floor(index / 36))).padStart(2, "0")} ${String(10 + (index % 7)).padStart(2, "0")}:${String(16 + (index % 40)).padStart(2, "0")}:24` };
  });
}

function formatAmount(value) { return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 0 }); }
function escapeHtml(value = "") { return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])); }
function optionHtml(items, getValue, getLabel, selected) { return items.map(item => `<option value="${escapeHtml(getValue(item))}" ${getValue(item) === selected ? "selected" : ""}>${escapeHtml(getLabel(item))}</option>`).join(""); }
function baseGroup(value = "") { return String(value).split("-")[0]; }
function groupNeedsArea(group) { return splitGroupCodes.has(baseGroup(group)); }

function fillOptions() {
  renderStoreCascade();
  $("#monthFilter").innerHTML = `<option value="">请选择月份</option>${optionHtml(months, item => item, item => item, "")}`;
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

function getSelectedValues(line, field) {
  return [...line.querySelectorAll(`[data-field="${field}"]:checked`)].map(input => input.value);
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

function clearMultiSelect(multi) {
  multi.querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = false);
  updateMultiSelect(multi);
  const line = multi.closest("[data-form-line]");
  if (line && multi.dataset.multi === "group") syncAreaSelect(line);
}

function syncAreaSelect(line) {
  const areaSelect = line.querySelector('[data-field="area"]');
  const enabled = getSelectedValues(line, "group").some(groupNeedsArea);
  areaSelect.disabled = !enabled;
  if (!enabled) areaSelect.value = "";
  areaSelect.options[0].textContent = enabled ? "请选择分区" : "无需选择分区";
}

function syncFormLineState() {
  document.querySelectorAll("[data-multi]").forEach(updateMultiSelect);
  document.querySelectorAll("[data-form-line]").forEach(syncAreaSelect);
}

function createFormLine(data = {}, canRemove = false) {
  const selectedGroups = normalizeSelected(data.groups || data.group);
  const selectedEmployeeIds = normalizeSelected(data.employeeIds || data.employeeId);
  const month = data.month || "";
  const amount = data.amount ?? "";
  const area = data.area || "";
  const areaEnabled = selectedGroups.some(groupNeedsArea);
  return `<div class="add-row" data-form-line>
    ${createMultiSelect("group", groups, selectedGroups, "请选择柜组", item => item, item => item)}
    <select data-field="area" ${areaEnabled ? "" : "disabled"}><option value="">${areaEnabled ? "请选择分区" : "无需选择分区"}</option>${optionHtml(splitAreas, item => item, item => item, area)}</select>
    ${createMultiSelect("employeeId", employees, selectedEmployeeIds, "请选择员工", item => item.id, item => `${item.name} / ${item.id}`, item => item.name)}
    <select data-field="month"><option value="">请选择月份</option>${optionHtml(months, item => item, item => item, month)}</select>
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
    const selectedGroups = getSelectedValues(line, "group");
    const selectedEmployeeIds = getSelectedValues(line, "employeeId");
    const month = line.querySelector('[data-field="month"]').value;
    const area = line.querySelector('[data-field="area"]').value;
    const amountText = line.querySelector('[data-field="amount"]').value.trim();
    const amount = Number(amountText);
    if (!selectedGroups.length) errors.push(`${prefix}请选择柜组`);
    if (!selectedEmployeeIds.length) errors.push(`${prefix}请选择员工`);
    if (!month) errors.push(`${prefix}请选择月份`);
    if (!amountText) errors.push(`${prefix}请输入目标销售额`);
    if (amountText && Number.isNaN(amount)) errors.push(`${prefix}请输入正确的目标销售额`);
    if (errors.length) return;
    selectedGroups.forEach(group => {
      selectedEmployeeIds.forEach(employeeId => {
        const employee = employees.find(item => item.id === employeeId);
        rows.push({ group, employeeName: employee.name, employeeId, month, area, amount });
      });
    });
  });
  return { rows, errors };
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
  body.innerHTML = pageRecords.map(record => `<tr class="${selectedIds.has(record.id) ? "selected" : ""}"><td><input type="checkbox" data-select="${record.id}" ${selectedIds.has(record.id) ? "checked" : ""} /></td><td title="${record.group}">${record.group}</td><td>${record.employeeName}</td><td>${record.employeeId}</td><td>${record.month}</td><td>${formatAmount(record.amount)}</td><td>${record.updatedBy}</td><td>${record.updatedAt}</td><td><div class="ops"><a href="#" data-copy="${record.id}">复制</a><a href="#" data-edit="${record.id}">修改</a><a href="#" data-delete="${record.id}">删除</a></div></td></tr>`).join("");
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
  const storeCodes = getFilterGroupCodes(), name = $("#nameFilter").value.trim(), employeeId = $("#employeeIdFilter").value.trim(), month = $("#monthFilter").value;
  const min = Number($("#minAmount").value || 0), max = Number($("#maxAmount").value || Number.MAX_SAFE_INTEGER), keyword = $("#globalSearch").value.trim();
  filteredRecords = records.filter(record => {
    const recordGroup = baseGroup(record.group);
    const teamName = groupToTeam.get(recordGroup) || "";
    return (!storeCodes || storeCodes.has(recordGroup)) && (!name || record.employeeName.includes(name)) && (!employeeId || record.employeeId.includes(employeeId)) && (!month || record.month === month) && record.amount >= min && record.amount <= max && (!keyword || [record.group, teamName, storeTree.code, record.employeeName, record.employeeId, record.month, record.updatedBy].some(value => String(value).includes(keyword)));
  });
  currentPage = 1; selectedIds.clear(); render(); toast(`查询完成，共 ${filteredRecords.length} 条数据`);
}

function resetFilters() {
  selectedStoreFilter = { type: "", value: "" };
  renderStoreCascade();
  ["#nameFilter", "#employeeIdFilter", "#monthFilter", "#minAmount", "#maxAmount", "#globalSearch"].forEach(selector => $(selector).value = "");
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
  const imported = [{ id: `import-${Date.now()}-1`, group: groups[36], employeeName: "测试员工A", employeeId: "30990000000001", month: "2026-07", amount: 68000, updatedBy: "导入用户", updatedAt: "2026-07-03 17:35:00" }, { id: `import-${Date.now()}-2`, group: groups[37], employeeName: "测试员工B", employeeId: "30990000000002", month: "2026-07", amount: 72000, updatedBy: "导入用户", updatedAt: "2026-07-03 17:35:00" }];
  records = updateExisting ? [...imported, ...records.slice(2)] : [...imported, ...records]; filteredRecords = [...records]; selectedIds.clear(); currentPage = 1; closeModals(); render(); toast(`${pickedFileName || "测试数据"} 导入成功，新增 ${imported.length} 条`);
}

function exportCurrentPage() {
  const rows = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const csv = ["柜组,员工姓名,工号,月份,目标销售额（元）,最后更新人,最后更新时间", ...rows.map(row => [row.group, row.employeeName, row.employeeId, row.month, row.amount, row.updatedBy, row.updatedAt].join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "sales-target-current-page.csv"; link.click(); URL.revokeObjectURL(link.href);
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
$("#syncBtn").addEventListener("click", () => toast("任务拆分已更新"));
$("#pickEmployeeBtn").addEventListener("click", () => { $("#employeeIdFilter").value = employees[0].id; toast("已选择员工：陈亚琳"); });
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
$("#formLines").addEventListener("change", event => {
  if (event.target.matches('[data-field="group"]')) {
    const line = event.target.closest("[data-form-line]");
    updateMultiSelect(event.target.closest("[data-multi]"));
    syncAreaSelect(line);
  }
  if (event.target.matches('[data-field="employeeId"]')) updateMultiSelect(event.target.closest("[data-multi]"));
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
