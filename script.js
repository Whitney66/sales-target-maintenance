const groups = ["[68681054]茅台专卖店(YS)-BL1", "[68680506]Coach-AL1", "[68681234]香化精品-BL2", "[68681299]香化精品-BL2", "[68680718]腕表集合店-A03", "[68680988]精品烟酒-A12", "[68681126]cdf会员服务台-C01", "[68681308]数码电器体验区-D02"];
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

const $ = selector => document.querySelector(selector);
const body = $("#tableBody");

function createRecords() {
  const editors = ["蒙海晓", "唐伟", "陈亚琳", "胡巧菊"];
  return Array.from({ length: 96 }, (_, index) => {
    const employee = employees[index % employees.length];
    const group = groups[index % groups.length];
    const month = months[Math.floor(index / 24) % months.length];
    return {
      id: `target-${index + 1}`,
      group,
      employeeName: employee.name,
      employeeId: employee.id,
      month,
      amount: index % 11 === 0 ? 0 : 20000 + (index % 17) * 3500 + Math.floor(index / 8) * 1000,
      updatedBy: editors[index % editors.length],
      updatedAt: `2026-07-${String(3 - Math.min(2, Math.floor(index / 36))).padStart(2, "0")} ${String(10 + (index % 7)).padStart(2, "0")}:${String(16 + (index % 40)).padStart(2, "0")}:24`
    };
  });
}

function formatAmount(value) {
  return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 0 });
}

function fillOptions() {
  groups.forEach(group => $("#storeFilter").insertAdjacentHTML("beforeend", `<option value="${group}">${group}</option>`));
  months.forEach(month => {
    $("#monthFilter").insertAdjacentHTML("beforeend", `<option value="${month}">${month}</option>`);
    $("#formMonth").insertAdjacentHTML("beforeend", `<option value="${month}">${month}</option>`);
  });
  groups.forEach(group => $("#formGroup").insertAdjacentHTML("beforeend", `<option value="${group}">${group}</option>`));
  employees.forEach(employee => $("#formEmployee").insertAdjacentHTML("beforeend", `<option value="${employee.id}">${employee.name} / ${employee.id}</option>`));
}

function render() {
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const pageRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  body.innerHTML = pageRecords.map(record => `<tr class="${selectedIds.has(record.id) ? "selected" : ""}">
    <td><input type="checkbox" data-select="${record.id}" ${selectedIds.has(record.id) ? "checked" : ""} /></td>
    <td title="${record.group}">${record.group}</td>
    <td>${record.employeeName}</td>
    <td>${record.employeeId}</td>
    <td>${record.month}</td>
    <td>${formatAmount(record.amount)}</td>
    <td>${record.updatedBy}</td>
    <td>${record.updatedAt}</td>
    <td><div class="ops"><a href="#" data-copy="${record.id}">复制</a><a href="#" data-edit="${record.id}">修改</a><a href="#" data-delete="${record.id}">删除</a></div></td>
  </tr>`).join("");
  $("#emptyState").hidden = filteredRecords.length > 0;
  $("#totalText").textContent = `共 ${filteredRecords.length} 条`;
  $("#jumpPage").value = currentPage;
  $("#prevPage").disabled = currentPage <= 1;
  $("#nextPage").disabled = currentPage >= totalPages;
  renderPages(totalPages);
  syncSelectionState(pageRecords);
}

function renderPages(totalPages) {
  const pageNumbers = $("#pageNumbers");
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1, 2, 3]);
  const sorted = [...pages].filter(page => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  let previous = 0;
  pageNumbers.innerHTML = sorted.map(page => {
    const gap = page - previous > 1 ? `<button class="page-btn" disabled>...</button>` : "";
    previous = page;
    return `${gap}<button class="page-btn ${page === currentPage ? "current" : ""}" data-page="${page}">${page}</button>`;
  }).join("");
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
  const store = $("#storeFilter").value;
  const name = $("#nameFilter").value.trim();
  const employeeId = $("#employeeIdFilter").value.trim();
  const month = $("#monthFilter").value;
  const min = Number($("#minAmount").value || 0);
  const max = Number($("#maxAmount").value || Number.MAX_SAFE_INTEGER);
  const keyword = $("#globalSearch").value.trim();
  filteredRecords = records.filter(record =>
    (!store || record.group === store) &&
    (!name || record.employeeName.includes(name)) &&
    (!employeeId || record.employeeId.includes(employeeId)) &&
    (!month || record.month === month) &&
    record.amount >= min && record.amount <= max &&
    (!keyword || [record.group, record.employeeName, record.employeeId, record.month, record.updatedBy].some(value => String(value).includes(keyword)))
  );
  currentPage = 1;
  selectedIds.clear();
  render();
  toast(`查询完成，共 ${filteredRecords.length} 条数据`);
}

function resetFilters() {
  ["#storeFilter", "#nameFilter", "#employeeIdFilter", "#monthFilter", "#minAmount", "#maxAmount", "#globalSearch"].forEach(selector => $(selector).value = "");
  filteredRecords = [...records];
  selectedIds.clear();
  currentPage = 1;
  render();
  toast("筛选条件已重置");
}

function openModal(id) { $(id).hidden = false; }
function closeModals() { document.querySelectorAll(".modal-mask").forEach(modal => modal.hidden = true); $("#formTip").textContent = ""; }

function openEditor(record, copy = false) {
  editingId = record && !copy ? record.id : null;
  $("#editTitle").textContent = record && !copy ? "修改" : copy ? "复制" : "新增";
  const source = record || records[0];
  $("#formGroup").value = source.group;
  $("#formEmployee").value = source.employeeId;
  $("#formMonth").value = source.month;
  $("#formAmount").value = copy ? "" : source.amount;
  openModal("#editModal");
}

function saveRecord() {
  const employee = employees.find(item => item.id === $("#formEmployee").value);
  const amount = Number($("#formAmount").value);
  if (!amount && amount !== 0) { $("#formTip").textContent = "请输入目标销售额"; return; }
  if (amount < 0) { $("#formTip").textContent = "目标销售额不能小于 0"; return; }
  const payload = { group: $("#formGroup").value, employeeName: employee.name, employeeId: employee.id, month: $("#formMonth").value, amount, updatedBy: "当前用户", updatedAt: "2026-07-03 17:30:00" };
  if (editingId) {
    records = records.map(record => record.id === editingId ? { ...record, ...payload } : record);
    toast("修改成功");
  } else {
    records.unshift({ id: `target-${Date.now()}`, ...payload });
    toast("新增成功");
  }
  closeModals();
  filteredRecords = [...records];
  currentPage = 1;
  selectedIds.clear();
  render();
}

function deleteRecord(id) {
  const record = records.find(item => item.id === id);
  if (!record || !confirm(`确认删除 ${record.employeeName} ${record.month} 的销售目标？`)) return;
  records = records.filter(item => item.id !== id);
  filteredRecords = filteredRecords.filter(item => item.id !== id);
  selectedIds.delete(id);
  render();
  toast("删除成功");
}

function batchDelete() {
  if (!selectedIds.size || !confirm(`确认删除已选择的 ${selectedIds.size} 条数据？`)) return;
  records = records.filter(record => !selectedIds.has(record.id));
  filteredRecords = filteredRecords.filter(record => !selectedIds.has(record.id));
  selectedIds.clear();
  render();
  toast("批量删除成功");
}

function simulateImport() {
  const updateExisting = $("#updateExisting").checked;
  const imported = [
    { id: `import-${Date.now()}-1`, group: groups[1], employeeName: "测试员工A", employeeId: "30990000000001", month: "2026-07", amount: 68000, updatedBy: "导入用户", updatedAt: "2026-07-03 17:35:00" },
    { id: `import-${Date.now()}-2`, group: groups[2], employeeName: "测试员工B", employeeId: "30990000000002", month: "2026-07", amount: 72000, updatedBy: "导入用户", updatedAt: "2026-07-03 17:35:00" }
  ];
  records = updateExisting ? [...imported, ...records.slice(2)] : [...imported, ...records];
  filteredRecords = [...records];
  selectedIds.clear();
  currentPage = 1;
  closeModals();
  render();
  toast(`${pickedFileName || "测试数据"} 导入成功，新增 ${imported.length} 条`);
}

function exportCurrentPage() {
  const rows = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const csv = ["柜组,员工姓名,工号,月份,销售任务(元),最后更新人,最后更新时间", ...rows.map(row => [row.group, row.employeeName, row.employeeId, row.month, row.amount, row.updatedBy, row.updatedAt].join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "sales-target-current-page.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.hidden = true, 1800);
}

fillOptions();
render();
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
$("#selectAll").addEventListener("change", event => {
  filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize).forEach(record => event.target.checked ? selectedIds.add(record.id) : selectedIds.delete(record.id));
  render();
});

document.addEventListener("click", event => {
  if (event.target.matches("[data-close]")) closeModals();
  if (event.target.dataset.edit) { event.preventDefault(); openEditor(records.find(record => record.id === event.target.dataset.edit)); }
  if (event.target.dataset.copy) { event.preventDefault(); openEditor(records.find(record => record.id === event.target.dataset.copy), true); }
  if (event.target.dataset.delete) { event.preventDefault(); deleteRecord(event.target.dataset.delete); }
});
document.addEventListener("change", event => {
  if (event.target.dataset.select) {
    event.target.checked ? selectedIds.add(event.target.dataset.select) : selectedIds.delete(event.target.dataset.select);
    render();
  }
});
document.querySelectorAll(".modal-mask").forEach(maskEl => maskEl.addEventListener("click", event => { if (event.target === maskEl) closeModals(); }));

const dropZone = $("#dropZone");
["dragenter", "dragover"].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add("drag"); }));
["dragleave", "drop"].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove("drag"); pickedFileName = event.dataTransfer?.files?.[0]?.name || "拖拽文件"; $("#uploadText").innerHTML = `已选择：<span>${pickedFileName}</span>`; }));
$("#fileInput").addEventListener("change", event => { pickedFileName = event.target.files[0]?.name || ""; if (pickedFileName) $("#uploadText").innerHTML = `已选择：<span>${pickedFileName}</span>`; });
