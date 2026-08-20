const names = ["陈亚琳", "唐伟", "蒙海晓", "胡巧菊", "张艺", "李明", "王一诺", "赵敏"];
const stores = {
  "7222": { name: "中免集团(北京)免税品有限公司", groups: ["72225101", "72225104"], zones: ["烟区", "精品区", "酒水区", "香化A", "香化B", "-"] },
  "7223": { name: "中免集团北京大兴国际机场免税品有限公司", groups: ["72235101", "72235102", "72235201", "72235301"], zones: ["烟酒区", "香化区", "精品区", "-"] }
};
const teams = ["烟酒团队", "精品团队", "香化团队"];
const body = document.getElementById("tableBody");
const emptyState = document.getElementById("emptyState");
const storeFilter = document.getElementById("storeFilter");
const groupFilter = document.getElementById("groupFilter");
const zoneFilter = document.getElementById("zoneFilter");

function options(select, values, all = true) {
  select.innerHTML = (all ? '<option value="">全部</option>' : '') + values.map(value => `<option value="${value}">${value}</option>`).join("");
}
function refreshStoreOptions() {
  const store = stores[storeFilter.value];
  options(groupFilter, store.groups);
  options(zoneFilter, store.zones);
}
function seedRows() {
  const rows = [];
  Object.entries(stores).forEach(([storeCode, store], storeIndex) => store.groups.forEach((group, groupIndex) => {
    for (let i = 0; i < 3; i += 1) {
      const employeeIndex = (storeIndex * 3 + groupIndex * 3 + i) % names.length;
      rows.push({ storeCode, group, zone: storeCode === "7222" && ["72225101", "72225104"].includes(group) ? store.zones[(groupIndex + i) % 5] : store.zones[(groupIndex + i) % store.zones.length], name: names[employeeIndex], job: String(10000001 + employeeIndex * 17 + groupIndex).padStart(8, "0"), month: "2026-07", days: 20 + ((i + groupIndex) % 5), amount: (i + 2 + groupIndex) * 10000 });
    }
  }));
  return rows;
}
const allRows = seedRows();

function renderRows(rows = allRows) {
  body.innerHTML = rows.map(row => `<tr><td><input type="checkbox" /></td><td title="[${row.group}]${stores[row.storeCode].name}">[${row.group}]${stores[row.storeCode].name}</td><td>${row.zone}</td><td>${row.name}</td><td>${row.job}</td><td>${row.month}</td><td>${row.days}</td><td>${row.amount.toLocaleString("zh-CN")}</td><td><div class="ops"><a href="#" data-edit>修改</a><a href="#">删除</a></div></td></tr>`).join("");
  emptyState.hidden = rows.length > 0;
  document.getElementById("totalText").textContent = `共 ${rows.length} 条`;
}
function splitTerms(value) { return value.split(/[，,\s]+/).map(item => item.trim()).filter(Boolean); }
function queryRows() {
  const namesFilter = splitTerms(document.getElementById("nameFilter").value);
  const jobsFilter = splitTerms(document.getElementById("jobFilter").value);
  const start = document.getElementById("monthStart").value;
  const end = document.getElementById("monthEnd").value;
  const min = Number(document.getElementById("amountMin").value || 0);
  const maxValue = document.getElementById("amountMax").value;
  const max = maxValue === "" ? Infinity : Number(maxValue);
  renderRows(allRows.filter(row => (!storeFilter.value || row.storeCode === storeFilter.value) && (!groupFilter.value || row.group === groupFilter.value) && (!zoneFilter.value || row.zone === zoneFilter.value) && (!namesFilter.length || namesFilter.includes(row.name)) && (!jobsFilter.length || jobsFilter.includes(row.job)) && (!start || row.month >= start) && (!end || row.month <= end) && row.amount >= min && row.amount <= max));
}
function openModal(id) { document.getElementById(id).hidden = false; }
function closeModals() { document.querySelectorAll(".modal-mask").forEach(modal => { modal.hidden = true; }); }

const guidanceToggle = document.getElementById("guidanceToggle");
guidanceToggle.addEventListener("click", () => {
  const guidance = document.getElementById("guidance");
  guidance.classList.toggle("collapsed");
  document.getElementById("guidanceToggleText").textContent = guidance.classList.contains("collapsed") ? "点击展开" : "点击收起";
});

refreshStoreOptions();
renderRows();
storeFilter.addEventListener("change", refreshStoreOptions);
document.getElementById("queryBtn").addEventListener("click", queryRows);
document.getElementById("resetBtn").addEventListener("click", () => { document.querySelectorAll(".filters input").forEach(input => { input.value = ""; }); storeFilter.value = "7222"; refreshStoreOptions(); renderRows(); });
document.getElementById("importBtn").addEventListener("click", () => openModal("importModal"));
document.getElementById("addBtn").addEventListener("click", () => { document.querySelector("#addModal h2").textContent = "新增"; openModal("addModal"); });
document.addEventListener("click", event => { if (event.target.matches("[data-close]")) closeModals(); if (event.target.matches("[data-edit]")) { event.preventDefault(); openModal("addModal"); document.querySelector("#addModal h2").textContent = "修改"; } });
document.querySelectorAll(".modal-mask").forEach(mask => mask.addEventListener("click", event => { if (event.target === mask) closeModals(); }));
document.getElementById("collapseBtn").addEventListener("click", () => { const filters = document.getElementById("filters"); filters.classList.toggle("collapsed"); document.getElementById("collapseText").textContent = filters.classList.contains("collapsed") ? "展开" : "收起"; document.querySelector("#collapseBtn b").textContent = filters.classList.contains("collapsed") ? "⌄" : "⌃"; });
const dropZone = document.getElementById("dropZone");
["dragenter", "dragover"].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add("drag"); }));
["dragleave", "drop"].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove("drag"); }));
