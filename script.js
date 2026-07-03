const names = ["陈亚琳", "唐伟", "蒙海晓", "胡巧菊", "张艺", "李明", "王一诺", "赵敏"];
const groups = ["[68681054]茅台专卖店(YS)-BL1", "[68680506]Coach-AL1", "[68681234]香化精品-BL2", "[68680718]腕表集合店-A03", "[68680988]精品烟酒-A12"];
const body = document.getElementById("tableBody");

function mask(seed, len = 7) {
  return Array.from({ length: len }, (_, index) => String((seed * 7 + index * 3) % 10)).join("").replace(/\d/g, "█");
}

function renderRows() {
  const rows = Array.from({ length: 18 }, (_, index) => {
    const name = names[index % names.length];
    const group = groups[index % groups.length];
    const amount = index % 5 === 0 ? "0" : `${(index + 2) * 10000}`.replace(/\d/g, "█");
    const day = index < 2 ? "03" : "02";
    const time = index < 1 ? "13:34:54" : index < 7 ? "10:16:24" : "10:16:23";
    return `<tr>
      <td><input type="checkbox" /></td>
      <td title="${group}">${group}</td>
      <td>${mask(index + 2, 6)}</td>
      <td>${mask(index + 8, 5)}</td>
      <td>2026-07</td>
      <td>${amount}</td>
      <td>${name}</td>
      <td>2026-07-${day} ${time}</td>
      <td><div class="ops"><a href="#" data-edit>修改</a><a href="#">删除</a></div></td>
    </tr>`;
  }).join("");
  body.innerHTML = rows;
}

function openModal(id) {
  document.getElementById(id).hidden = false;
}

function closeModals() {
  document.querySelectorAll(".modal-mask").forEach(modal => modal.hidden = true);
}

renderRows();

document.getElementById("importBtn").addEventListener("click", () => openModal("importModal"));
document.getElementById("addBtn").addEventListener("click", () => openModal("addModal"));
document.addEventListener("click", event => {
  if (event.target.matches("[data-close]")) closeModals();
  if (event.target.matches("[data-edit]")) {
    event.preventDefault();
    openModal("addModal");
    document.querySelector("#addModal h2").textContent = "修改";
  }
});

document.querySelectorAll(".modal-mask").forEach(maskEl => {
  maskEl.addEventListener("click", event => {
    if (event.target === maskEl) closeModals();
  });
});

const filters = document.getElementById("filters");
document.getElementById("collapseBtn").addEventListener("click", () => {
  filters.classList.toggle("collapsed");
  document.getElementById("collapseBtn").textContent = filters.classList.contains("collapsed") ? "⌄" : "⌃";
});

const dropZone = document.getElementById("dropZone");
["dragenter", "dragover"].forEach(type => dropZone.addEventListener(type, event => {
  event.preventDefault();
  dropZone.classList.add("drag");
}));
["dragleave", "drop"].forEach(type => dropZone.addEventListener(type, event => {
  event.preventDefault();
  dropZone.classList.remove("drag");
}));
