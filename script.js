/* ---------- Edit this block ---------- */
const CONFIG = {
  username: "agent-pjb",
  name: "Pj B.",
  tagline: "Software Developer | Python, Web Development & Automation",
  about:
    "I build solutions, not just lines of code. I turn coffee, curiosity, and occasionally stubborn bugs into working software.",
  hideForks: true,
  hideArchived: true,
  maxRepos: 40,
  pinned: [],
  links: [{ label: "GitHub", href: "https://github.com/agent-pjb" }],
};
/* ------------------------------------- */

const $ = (s) => document.querySelector(s);
const el = (t, c, x) => {
  const n = document.createElement(t);
  if (c) n.className = c;
  if (x != null) n.textContent = x;
  return n;
};
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const THEMES = ["dusk", "teal", "blue"];
const hash = (s) =>
  Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
document.title = CONFIG.name + ", Software Developer | Python, Web Development & Automation";

/* Repos */
let repos = [],
  failed = false;
const ready = (async () => {
  try {
    const r = await fetch(
      `https://api.github.com/users/${encodeURIComponent(CONFIG.username)}/repos?per_page=100&sort=pushed`,
    );
    if (!r.ok) throw new Error(r.status);
    const me = CONFIG.username.toLowerCase();
    repos = (await r.json())
      .filter(
        (x) =>
          !(CONFIG.hideForks && x.fork) &&
          !(CONFIG.hideArchived && x.archived) &&
          ![me, me + ".github.io"].includes(x.name.toLowerCase()),
      )
      .sort((a, b) => {
        const pa = CONFIG.pinned.indexOf(a.name),
          pb = CONFIG.pinned.indexOf(b.name);
        if (pa !== pb) return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
        return (
          b.stargazers_count - a.stargazers_count ||
          new Date(b.pushed_at) - new Date(a.pushed_at)
        );
      })
      .slice(0, CONFIG.maxRepos);
  } catch (e) {
    failed = true;
  }
})();
const stars = () => repos.reduce((a, r) => a + r.stargazers_count, 0);
const when = (r) =>
  new Date(r.pushed_at).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

/* Window manager */
const wins = {};
let zTop = 10,
  count = 0;
function focusWin(o) {
  Object.values(wins).forEach((x) => {
    x.el.classList.remove("active");
    x.tb.classList.remove("on");
  });
  o.el.style.zIndex = ++zTop;
  o.el.classList.add("active");
  o.tb.classList.add("on");
}
function minWin(o) {
  o.el.classList.add("min");
  o.el.classList.remove("active");
  o.tb.classList.remove("on");
}
function closeWin(o) {
  o.cleanup && o.cleanup();
  o.el.remove();
  o.tb.remove();
  delete wins[o.id];
}
function dragWin(bar, w) {
  bar.addEventListener("pointerdown", (e) => {
    if (
      e.target.closest("button") ||
      w.classList.contains("max") ||
      innerWidth < 700
    )
      return;
    const r = w.getBoundingClientRect(),
      dx = e.clientX - r.left,
      dy = e.clientY - r.top;
    bar.setPointerCapture(e.pointerId);
    const mv = (ev) => {
      w.style.left =
        Math.min(Math.max(ev.clientX - dx, 80 - r.width), innerWidth - 80) +
        "px";
      w.style.top =
        Math.min(Math.max(ev.clientY - dy, 0), innerHeight - 90) + "px";
    };
    const up = () => {
      bar.removeEventListener("pointermove", mv);
      bar.removeEventListener("pointerup", up);
    };
    bar.addEventListener("pointermove", mv);
    bar.addEventListener("pointerup", up);
  });
  bar.addEventListener("dblclick", (e) => {
    if (!e.target.closest("button")) w.classList.toggle("max");
  });
}
/* App splash screens: an Office-style loading card with the app's title before each window opens */
const SPLASH = {
  // ms = how long it runs, repos = wait for the GitHub data, msgs = status lines (the last one shows when done)
  terminal: {
    ms: 1100,
    repos: true,
    msgs: ["Starting shell...", "Loading commands...", "Ready"],
  },
  files: {
    ms: 1200,
    repos: true,
    msgs: ["Mounting ~/repos...", "Reading repositories...", "Ready"],
  },
  about: { ms: 800, repos: true, msgs: ["Opening profile...", "Ready"] },
};
const loading = {};
async function openApp(id) {
  if (wins[id] || reduce.matches) return createApp(id); // already open, or reduced motion: no splash
  if (loading[id]) return;
  loading[id] = true;
  await showSplash(id);
  delete loading[id];
  createApp(id);
}
function showSplash(id) {
  return new Promise((resolve) => {
    const a = APPS[id],
      s = SPLASH[id] || { ms: 800, msgs: ["Loading...", "Ready"] },
      card = el("div", "splash"),
      ico = el("b", "ico", a.i);
    ico.style.background = a.c;
    card.style.setProperty("--c", a.c);
    card.setAttribute("role", "status");
    card.setAttribute("aria-label", "Opening " + a.t);
    const bar = el("div", "sp-bar"),
      msg = el("span", "", s.msgs[0]),
      foot = el("div", "sp-msg"),
      main = el("div", "sp-main");
    for (let i = 0; i < 20; i++) bar.append(el("i"));
    main.append(ico, el("h2", "", a.t));
    foot.append(msg, el("span", "", CONFIG.name));
    card.append(el("div", "sp-brand", "PortfolioOS"), main, bar, foot);
    document.body.append(card);
    const segs = [...bar.children];
    let n = 0,
      waiting = !!s.repos,
      done = false,
      iv;
    if (waiting)
      Promise.race([ready, new Promise((r) => setTimeout(r, 2500))]).then(
        () => {
          waiting = false;
        },
      );
    const onKey = (e) => {
      if (e.key === "Escape") finish();
    };
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(iv);
      removeEventListener("keydown", onKey);
      segs.forEach((x) => x.classList.add("on"));
      msg.textContent = s.msgs[s.msgs.length - 1];
      setTimeout(() => {
        card.classList.add("out");
        setTimeout(() => {
          card.remove();
          resolve();
        }, 170);
      }, 180);
    };
    addEventListener("keydown", onKey);
    card.addEventListener("pointerdown", finish); // click or Escape skips ahead
    iv = setInterval(() => {
      if (n < (waiting ? 18 : 20)) {
        segs[n++].classList.add("on");
        msg.textContent =
          s.msgs[
            Math.min(
              s.msgs.length - 2,
              Math.floor((n / 20) * (s.msgs.length - 1)),
            )
          ];
      } else if (!waiting) finish();
    }, s.ms / 20);
  });
}
function createApp(id) {
  let o = wins[id];
  if (o) {
    o.el.classList.remove("min");
    focusWin(o);
    o.focusEl && o.focusEl.focus();
    return;
  }
  const a = APPS[id],
    w = el("section", "win"),
    n = count++ % 8;
  w.setAttribute("role", "dialog");
  w.setAttribute("aria-label", a.t);
  const bar = el("header", "bar"),
    ttl = el("span", "ttl"),
    ico = el("b", "ico", a.i);
  ico.style.background = a.c;
  ttl.append(ico, document.createTextNode(a.t));
  const bt = el("span", "btns");
  [
    ["–", "Minimize", () => minWin(o)],
    ["▢", "Maximize", () => w.classList.toggle("max")],
    ["✕", "Close", () => closeWin(o)],
  ].forEach(([s, l, f]) => {
    const b = el("button", "", s);
    b.type = "button";
    b.title = l;
    b.setAttribute("aria-label", l);
    b.onclick = (e) => {
      e.stopPropagation();
      f();
    };
    bt.append(b);
  });
  bar.append(ttl, bt);
  const body = el("div", "body");
  w.append(bar, body);
  Object.assign(w.style, {
    width: Math.min(a.w, innerWidth - 16) + "px",
    height: Math.min(a.h, innerHeight - 70) + "px",
    left: Math.max(8, Math.min(120 + n * 30, innerWidth - a.w - 8)) + "px",
    top: 24 + n * 30 + "px",
  });
  $("#desk").append(w);
  const tb = el("button", "task", a.t);
  tb.type = "button";
  tb.onclick = () => {
    if (w.classList.contains("min")) {
      w.classList.remove("min");
      focusWin(o);
    } else if (w.classList.contains("active")) minWin(o);
    else focusWin(o);
  };
  $("#tasks").append(tb);
  o = wins[id] = { el: w, tb, id, body };
  dragWin(bar, w);
  w.addEventListener("pointerdown", () => focusWin(o));
  a.run(body, o);
  focusWin(o);
  o.focusEl && o.focusEl.focus();
}

/* Apps */
function terminal(body, o) {
  body.classList.add("term");
  const out = el("div"),
    row = el("label", "row"),
    inp = el("input"),
    user = CONFIG.username.toLowerCase(),
    t0 = Date.now();
  const ps = el("span", "ps", user + "@portfolio:~$");
  inp.spellcheck = false;
  inp.autocomplete = "off";
  inp.autocapitalize = "off";
  inp.setAttribute("aria-label", "Terminal input");
  row.append(ps, inp);
  body.append(out, row);
  o.focusEl = inp;
  body.onclick = () => {
    if (!getSelection().toString()) inp.focus();
  };
  const p = (t = "", c) => {
    out.append(el("div", c || "", t));
    body.scrollTop = body.scrollHeight;
  };
  const find = (n) =>
    repos.find((r) => r.name.toLowerCase() === (n || "").toLowerCase());
  const C = {
    help() {
      [
        "help          list commands",
        "about         who am I",
        "ls [-l]        list repositories",
        "cat <repo>     show a repository",
        "open <repo>    open it on GitHub",
        "neofetch      system info",
        "theme          change wallpaper",
        "clear          clear the screen",
        "exit           close this window",
      ].forEach((l) => p(l));
    },
    about() {
      p(CONFIG.name, "hl");
      p(CONFIG.about);
    },
    whoami() {
      p(user);
    },
    ls(a) {
      if (failed)
        return p(
          "Couldn't reach GitHub. Check the username in CONFIG or try again later.",
        );
      if (!repos.length) return p("(no public repositories)");
      if (a[0] === "-l")
        repos.forEach((r) =>
          p(
            String(r.stargazers_count).padStart(4) +
              " stars  " +
              (r.language || "-").padEnd(12) +
              r.name,
          ),
        );
      else p(repos.map((r) => r.name).join("  "));
    },
    cat(a) {
      const r = find(a[0]);
      if (!r) return p("cat: " + (a[0] || "") + ": no such repository");
      p(r.name, "hl");
      p(r.description || "No description yet.");
      p(
        [
          r.language,
          r.stargazers_count + " stars",
          r.forks_count + " forks",
          "updated " + when(r),
        ]
          .filter(Boolean)
          .join("  |  "),
        "cmd",
      );
      p(r.html_url, "cmd");
    },
    open(a) {
      const r = find(a[0]);
      if (!r) return p("open: " + (a[0] || "") + ": no such repository");
      window.open(r.html_url, "_blank", "noopener");
      p("Opening " + r.name + "...");
    },
    neofetch() {
      const langs = [...new Set(repos.map((r) => r.language).filter(Boolean))];
      [
        user + "@portfolio",
        "-------------------",
        "OS: PortfolioOS (runs in your browser)",
        "Shell: js-sh 1.0",
        "Repos: " + repos.length,
        "Stars: " + stars(),
        "Languages: " + (langs.join(", ") || "n/a"),
        "Uptime: " + Math.round((Date.now() - t0) / 1000) + "s",
      ].forEach((l, i) => p(l, i < 2 ? "hl" : ""));
    },
    theme() {
      cycleTheme();
      p("Wallpaper: " + document.body.dataset.theme);
    },
    clear() {
      out.replaceChildren();
    },
    exit() {
      closeWin(o);
    },
    sudo() {
      p("Nice try. This incident will be reported to nobody.");
    },
    rm() {
      p("rm: permission denied. Your repos are safe.");
    },
  };
  const H = [];
  let hi = 0;
  inp.addEventListener("keydown", async (e) => {
    if (e.key === "ArrowUp" && H.length) {
      hi = Math.max(0, hi - 1);
      inp.value = H[hi];
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      hi = Math.min(H.length, hi + 1);
      inp.value = H[hi] || "";
      e.preventDefault();
    } else if (e.key === "Enter") {
      const line = inp.value.trim();
      inp.value = "";
      p(ps.textContent + " " + line, "cmd");
      if (!line) return;
      H.push(line);
      hi = H.length;
      await ready;
      const [c, ...a] = line.split(/\s+/),
        f = C[c.toLowerCase()];
      f && Object.hasOwn(C, c.toLowerCase())
        ? f(a)
        : p(c + ": command not found. Type help.");
    }
  });
  p(
    "Welcome to " + CONFIG.name + "'s desktop. Type help to get started.",
    "hl",
  );
}

function files(body, o) {
  body.classList.add("files");
  const bar = el("div", "fbar"),
    sel = el("select"),
    grid = el("div", "fgrid"),
    det = el("div", "fdet", "Loading repositories...");
  sel.setAttribute("aria-label", "Filter by language");
  bar.append(el("span", "", "~/" + CONFIG.username + "/repos"), sel);
  body.append(bar, grid, det);
  function show(r, b) {
    grid
      .querySelectorAll(".fitem")
      .forEach((x) => x.setAttribute("aria-selected", x === b));
    const a = el("a", "btn", "Open on GitHub");
    a.href = r.html_url;
    a.target = "_blank";
    a.rel = "noopener";
    det.replaceChildren(
      el("b", "", r.name),
      el("p", "", r.description || "No description yet."),
      el(
        "p",
        "",
        [
          r.language,
          r.stargazers_count + " stars",
          r.forks_count + " forks",
          "updated " + when(r),
        ]
          .filter(Boolean)
          .join("  |  "),
      ),
      a,
    );
  }
  function draw() {
    grid.replaceChildren();
    repos
      .filter((r) => !sel.value || r.language === sel.value)
      .forEach((r) => {
        const b = el("button", "fitem"),
          f = el("span", "folder");
        f.style.setProperty("--h", hash(r.name) % 360);
        b.type = "button";
        b.append(f, document.createTextNode(r.name));
        b.onclick = () => show(r, b);
        b.ondblclick = () => window.open(r.html_url, "_blank", "noopener");
        grid.append(b);
      });
  }
  ready.then(() => {
    if (failed) {
      det.textContent =
        "Couldn't reach GitHub. Check the username in CONFIG or try again later.";
      return;
    }
    [
      "All languages",
      ...[...new Set(repos.map((r) => r.language).filter(Boolean))].sort(),
    ].forEach((l, i) => {
      const op = el("option", "", l);
      op.value = i ? l : "";
      sel.append(op);
    });
    sel.onchange = draw;
    draw();
    det.textContent = repos.length
      ? "Select a repository. Double-click to open it."
      : "No public repositories to show yet.";
  });
}

function about(body) {
  body.classList.add("about");
  const st = el("p", "sub"),
    lk = el("div", "lk");
  body.append(
    el(
      "div",
      "av",
      CONFIG.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    ),
    el("h2", "", CONFIG.name),
    el("p", "sub", CONFIG.tagline),
    el("p", "", CONFIG.about),
    st,
    lk,
  );
  CONFIG.links.forEach((l) => {
    const a = el("a", "btn", l.label);
    a.href = l.href;
    if (!l.href.startsWith("mailto:")) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    lk.append(a);
  });
  ready.then(() => {
    st.textContent = failed
      ? ""
      : `${repos.length} public repositories, ${stars()} stars`;
  });
}

const APPS = {
  terminal: {
    t: "Terminal",
    i: ">_",
    c: "#5FD3A0",
    w: 620,
    h: 400,
    run: terminal,
  },
  files: { t: "Files", i: "▤", c: "#3DAEE9", w: 640, h: 440, run: files },
  about: { t: "About me", i: "i", c: "#F6A845", w: 440, h: 380, run: about },
};

/* Icons, start menu, clock */
const icons = $("#icons"),
  menu = $("#menu");
Object.entries(APPS).forEach(([id, a]) => {
  const b = el("button", "icon"),
    ic = el("b", "ico", a.i);
  ic.style.background = a.c;
  b.type = "button";
  b.append(ic, el("span", "", a.t));
  b.ondblclick = () => openApp(id);
  b.onclick = () => {
    if (matchMedia("(pointer: coarse)").matches) openApp(id);
  };
  b.onkeydown = (e) => {
    if (e.key === "Enter") openApp(id);
  };
  icons.append(b);
  const m = el("button"),
    mi = el("b", "ico", a.i);
  mi.style.background = a.c;
  mi.style.width = mi.style.height = "28px";
  m.type = "button";
  m.append(mi, document.createTextNode(a.t));
  m.onclick = () => {
    menu.hidden = true;
    openApp(id);
  };
  menu.append(m);
});
const gh = el("a", "icon"),
  gi = el("b", "ico", "GH");
gi.style.background = "#E6E9F2";
gh.href = "https://github.com/" + CONFIG.username;
gh.target = "_blank";
gh.rel = "noopener";
gh.append(gi, el("span", "", "GitHub"));
icons.append(gh);
const tm = el("button");
tm.type = "button";
tm.textContent = "Change wallpaper";
tm.onclick = () => {
  cycleTheme();
  menu.hidden = true;
};
const rs = el("button");
rs.type = "button";
rs.textContent = "Restart";
rs.onclick = () => {
  try {
    sessionStorage.removeItem("booted");
  } catch (e) {}
  location.reload();
};
menu.append(el("hr"), tm, rs);
$("#start").onclick = () => {
  menu.hidden = !menu.hidden;
};
document.addEventListener("pointerdown", (e) => {
  if (!e.target.closest("#menu,#start")) menu.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") menu.hidden = true;
});
function cycleTheme() {
  const b = document.body;
  b.dataset.theme =
    THEMES[(THEMES.indexOf(b.dataset.theme) + 1) % THEMES.length];
}
function tick() {
  const d = new Date();
  $("#clock").replaceChildren(
    el(
      "div",
      "",
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    ),
    el(
      "div",
      "",
      d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    ),
  );
}
tick();
setInterval(tick, 15000);

/* Wallpaper parallax follows the pointer */
if (!reduce.matches)
  addEventListener("pointermove", (e) => {
    const s = document.documentElement.style;
    s.setProperty("--mx", (e.clientX / innerWidth - 0.5) * 2);
    s.setProperty("--my", (e.clientY / innerHeight - 0.5) * 2);
  });

/* Boot sequence: pixelated logo resolves, log scrolls, screen dissolves into pixels */
async function boot() {
  const root = $("#boot");
  let seen = false;
  try {
    seen = sessionStorage.getItem("booted");
  } catch (e) {}
  if (reduce.matches || seen) {
    root.remove();
    openApp("about");
    return;
  }
  try {
    sessionStorage.setItem("booted", "1");
  } catch (e) {}
  let skipped = false;
  const skip = () => {
    skipped = true;
  };
  addEventListener("keydown", skip);
  root.addEventListener("pointerdown", skip);
  const sleep = (ms) =>
    skipped ? Promise.resolve() : new Promise((r) => setTimeout(r, ms));

  const bg = $("#bootBg"),
    bg2 = bg.getContext("2d");
  bg.width = innerWidth;
  bg.height = innerHeight;
  bg2.fillStyle = "#05070C";
  bg2.fillRect(0, 0, bg.width, bg.height);

  /* Logo: draw the name once, then show it through ever-smaller pixel blocks */
  const lc = $("#bootLogo"),
    lg = lc.getContext("2d"),
    dpr = Math.min(devicePixelRatio || 1, 2),
    cw = Math.min(innerWidth - 40, 640),
    chh = 150;
  lc.width = cw * dpr;
  lc.height = chh * dpr;
  lc.style.width = cw + "px";
  lc.style.height = chh + "px";
  await Promise.race([document.fonts.ready, sleep(700)]);
  const big = document.createElement("canvas"),
    sm = document.createElement("canvas");
  big.width = lc.width;
  big.height = lc.height;
  const bx = big.getContext("2d"),
    font = (n) => `700 ${n}px "JetBrains Mono",monospace`;
  let fs = 96 * dpr;
  bx.font = font(fs);
  while (bx.measureText(CONFIG.name).width > big.width * 0.92 && fs > 16) {
    fs -= 4;
    bx.font = font(fs);
  }
  bx.textAlign = "center";
  bx.textBaseline = "middle";
  bx.fillStyle = "#3DAEE9";
  bx.fillText(CONFIG.name, big.width / 2 + 4 * dpr, big.height / 2 + 4 * dpr);
  bx.fillStyle = "#E6E9F2";
  bx.fillText(CONFIG.name, big.width / 2, big.height / 2);
  const showBlocks = (b) => {
    sm.width = Math.max(1, Math.ceil(big.width / b));
    sm.height = Math.max(1, Math.ceil(big.height / b));
    const s2 = sm.getContext("2d");
    s2.imageSmoothingEnabled = true;
    s2.drawImage(big, 0, 0, sm.width, sm.height);
    lg.clearRect(0, 0, lc.width, lc.height);
    lg.imageSmoothingEnabled = false;
    lg.drawImage(
      sm,
      0,
      0,
      sm.width,
      sm.height,
      0,
      0,
      sm.width * b,
      sm.height * b,
    );
  };
  const logo = (async () => {
    for (const b of [40, 24, 16, 10, 6, 3].map((x) => x * dpr).concat(1)) {
      showBlocks(b);
      await sleep(170);
    }
  })();

  /* Boot log + pixel progress bar */
  const log = $("#bootLog"),
    bar = $("#bootBar"),
    user = CONFIG.username.toLowerCase();
  let done = false;
  ready.then(() => {
    done = true;
  });
  for (let i = 0; i < 24; i++) bar.append(document.createElement("i"));
  const line = (t, c) => {
    log.append(el("div", c, t));
    while (log.children.length > 9) log.firstChild.remove();
  };
  const steps = [
    () => line("PortfolioOS 1.0 (pixel edition)"),
    () => line("[  OK  ] Started pixel renderer", "ok"),
    () => line(`[  OK  ] Mounted ~/${user}/repos`, "ok"),
    async () => {
      await Promise.race([ready, sleep(2500)]);
      if (failed) line("[ WARN ] api.github.com unreachable", "warn");
      else if (!done) line("[ WAIT ] Still talking to GitHub", "warn");
      else
        line(
          `[  OK  ] Found ${repos.length} ${repos.length === 1 ? "repository" : "repositories"}`,
          "ok",
        );
    },
    () => line("[  OK  ] Loaded desktop environment", "ok"),
    () => line("Welcome, " + CONFIG.name + "."),
  ];
  for (let i = 0; i < steps.length; i++) {
    await steps[i]();
    const n = Math.round(((i + 1) / steps.length) * 24);
    [...bar.children].forEach((b, j) => b.classList.toggle("on", j < n));
    await sleep(i === 0 ? 500 : 260);
  }
  await logo;
  await sleep(350);

  /* Dissolve the black screen away block by block */
  removeEventListener("keydown", skip);
  root.style.pointerEvents = "none";
  $("#bootBox").style.opacity = 0;
  const cell = Math.max(20, Math.ceil(innerWidth / 40)),
    cols = Math.ceil(bg.width / cell),
    rows = Math.ceil(bg.height / cell),
    order = [...Array(cols * rows).keys()];
  for (let i = order.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [order[i], order[j]] = [order[j], order[i]];
  }
  const dur = skipped ? 300 : 900,
    t0 = performance.now();
  let n = 0;
  await new Promise((res) => {
    (function f(now) {
      const k = Math.min(
        order.length,
        Math.max(0, Math.floor(((now - t0) / dur) * order.length)),
      );
      for (; n < k; n++) {
        const c = order[n];
        bg2.clearRect(
          (c % cols) * cell,
          Math.floor(c / cols) * cell,
          cell,
          cell,
        );
      }
      k < order.length ? requestAnimationFrame(f) : res();
    })(t0);
  });
  root.remove();
  openApp("about");
}
boot();
