/* 右侧型号编码说明：展开/收起（完整带线编码图见 modelcode.html） */
(function () {
  var panel = document.getElementById("codeLegend");
  var toggle = document.getElementById("codeLegendToggle");
  if (!panel || !toggle) return;

  function setOpen(open) {
    panel.classList.toggle("is-collapsed", !open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "收起型号说明" : "展开型号说明");
  }

  toggle.addEventListener("click", function () {
    setOpen(panel.classList.contains("is-collapsed"));
  });

  /* 宽屏默认展开 */
  if (window.innerWidth >= 1620) setOpen(true);
})();
