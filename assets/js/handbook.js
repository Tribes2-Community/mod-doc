/* ---------------------------------------------------------------------------
   Tribes 2 Mod Development Handbook — progressive enhancement.

   Everything here is optional: with JS disabled the pages remain fully
   readable. Mermaid is fetched only on pages that actually contain a diagram.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";

  /* --- Mobile contents toggle ------------------------------------------- */
  var toggle = document.getElementById("navToggle");
  var sidebar = document.getElementById("sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", function () {
      var open = sidebar.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* --- Keep the current sidebar entry in view --------------------------- */
  var current = document.querySelector(".sidebar a.current");
  if (current && current.scrollIntoView) {
    current.scrollIntoView({ block: "center" });
  }

  /* --- Evidence markers -------------------------------------------------
     Source markdown writes them as **[binary]**, **[script]** and so on, which
     Kramdown renders to <strong>[binary]</strong>. Tag those so the stylesheet
     can colour them using the game's own sensorColor values.               */
  var KNOWN = {
    "binary": 1, "script": 1, "patch-script": 1, "support-script": 1,
    "mod-script": 1, "community": 1, "inferred": 1
  };
  Array.prototype.forEach.call(document.querySelectorAll("article strong"), function (el) {
    var m = /^\[([a-z-]+)\]$/.exec(el.textContent.trim());
    if (m && KNOWN[m[1]]) {
      el.classList.add("marker", "m-" + m[1]);
      el.setAttribute("title", "Evidence: " + m[1]);
    }
  });

  /* --- Wrap wide tables so they scroll instead of breaking the layout --- */
  Array.prototype.forEach.call(document.querySelectorAll("article table"), function (t) {
    if (t.parentNode && t.parentNode.classList.contains("table-wrap")) return;
    var wrap = document.createElement("div");
    wrap.className = "table-wrap";
    t.parentNode.insertBefore(wrap, t);
    wrap.appendChild(t);
  });

  /* --- Mermaid ----------------------------------------------------------
     Kramdown + Rouge emit ```mermaid fences as a <code> element carrying a
     language-mermaid class, sometimes inside a .highlight wrapper. Convert
     each to a bare <div class="mermaid"> holding the original text.        */
  var blocks = document.querySelectorAll(
    "article code.language-mermaid, article .language-mermaid > code, article pre > code.mermaid"
  );
  if (!blocks.length) return;

  var nodes = [];
  Array.prototype.forEach.call(blocks, function (code) {
    var source = code.textContent;
    var host = code.closest(".highlight") || code.closest("pre") || code;
    var div = document.createElement("div");
    div.className = "mermaid";
    div.textContent = source;
    host.parentNode.replaceChild(div, host);
    nodes.push(div);
  });

  import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs")
    .then(function (mod) {
      var mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: "Segoe UI, system-ui, sans-serif",
        /* Palette lifted from the game's GUI profiles and HUD — see
           assets/css/style.scss for the provenance of each value. */
        themeVariables: {
          background:        "#04090a",
          primaryColor:      "#0a1a1f",
          primaryTextColor:  "#a9d7fa",
          primaryBorderColor:"#00ff00",
          secondaryColor:    "#194438",
          tertiaryColor:     "#071a22",
          lineColor:         "#42dbea",
          textColor:         "#a9d7fa",
          mainBkg:           "#0a1a1f",
          nodeBorder:        "#00d42d",
          clusterBkg:        "rgba(0,64,100,0.31)",
          clusterBorder:     "#3c8c8c",
          titleColor:        "#06f5d7",
          edgeLabelBackground:"#04090a",
          noteBkgColor:      "#194438",
          noteTextColor:     "#06f5d7",
          noteBorderColor:   "#ffc209"
        }
      });
      return mermaid.run({ nodes: nodes });
    })
    .catch(function (err) {
      /* Leave the source text visible rather than hiding a failed diagram. */
      nodes.forEach(function (n) { n.style.visibility = "visible"; });
      if (window.console) console.warn("Mermaid failed to load:", err);
    });
})();
