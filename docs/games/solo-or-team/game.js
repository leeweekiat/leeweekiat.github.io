/* Presentation and playback only. Decisions and accounting live in simulation.js. */
(function () {
  "use strict";
  const S = window.TeamSimulation;
  const app = document.getElementById("app");
  const announcement = document.getElementById("announcement");
  if (!S) {
    app.innerHTML = "<section class='loading'><h1>The marketplace could not load.</h1><p>Please reload this page with its simulation.js file available.</p></section>";
    return;
  }
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const money = n => Number(n).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
  const signed = n => (n >= 0 ? "+" : "−") + money(Math.abs(n));
  const pct = n => Math.round(n * 100) + "%";
  const policyName = id => S.POLICIES.find(p => p.id === id).name;
  function newCode() {
    const numbers = new Uint32Array(1);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(numbers);
    else numbers[0] = Date.now() >>> 0;
    return "TEAM-" + numbers[0].toString(36).toUpperCase();
  }
  const supplied = new URLSearchParams(window.location.search).get("seed");
  let seed = supplied ? supplied.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) : newCode();
  if (!seed) seed = newCode();
  function updateSeedURL() {
    // Keep fresh visits varied and every displayed marketplace reproducible.
    try { const url = new URL(window.location.href); url.searchParams.set("seed", seed); window.history.replaceState(null,"",url); } catch (_) { /* file previews may disallow history changes */ }
  }
  updateSeedURL();
  let marketplace = S.createMarketplace(seed);
  let roundIndex = 0;
  let rounds = [];
  let settings = { policy:"case", s:0.4, x:0.35 };
  let activeRound = null;
  let eventIndex = 0;
  let stepIndex = 0;
  let timer = null;
  let paused = false;
  let screen = "welcome";
  let completedEvents = [];
  let comparisonOpen = false;
  const STEP_MS = 980;
  const STOP_MS = 1400;
  const brief = [
    "Most jobs fit the lead, and first attempts are usually reliable. Extra participation could help the occasional mismatch—but it also brings exposure and administration.",
    "More jobs need a different skill, and first attempts are less reliable. Think about the difference between adding a transaction and rescuing one already underway.",
    "The conditions now include an unofficial route. Workers weigh approval, liability and detection. Choose rules before their private circumstances are revealed."
  ];
  const captions = {
    posted:"A new opportunity", assess:"Does the job fit?", "lead-attempt":"Lead at work",
    "lead-success":"✓ Completed", "lead-failure":"! Backup needed",
    reassignment:"↗ Reassignment", backup:"↻ Backup needed",
    blocked:"⊘ Not authorized", "no-fit":"No matching worker", nominate:"→ Request sent",
    "decline-nomination":"No proposal", "consent-approved":"✓ Client consents",
    "consent-denied":"Client declines", authorize:"✓ Authorized",
    hidden:"⋯ Unofficial route", detected:"! Detected", "secondary-attempt":"Secondary at work",
    "secondary-success":"✓ Completed", "secondary-failure":"× Attempt failed",
    unformed:"— No transaction", failed:"× Transaction failed", settled:"Account settled",
    "decline-team":"No secondary attempt"
  };
  function focusHeading() {
    const heading = app.querySelector("h1");
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll:true }); }
    app.scrollIntoView({ block:"start", behavior:"instant" });
  }
  function stopTimer() { if (timer !== null) window.clearTimeout(timer); timer = null; }
  function enter(nextScreen, html, focus = true) {
    stopTimer();
    screen = nextScreen;
    app.innerHTML = html;
    if (focus) focusHeading();
  }
  function codeLine() { return `<p class="seed-line">Marketplace code <code>${esc(seed)}</code> · ${marketplace.challenges.reduce((total, c) => total + c.opportunities.length, 0)} opportunities · identical draws on replay</p>`; }
  function track(index) {
    return `<ol class="round-track" aria-label="Marketplace challenges">${S.CHALLENGES.map((c,i) => `<li ${i === index ? 'aria-current="step"' : ""}><b>${String(i+1).padStart(2,"0")}</b><span>${esc(c.title)}</span></li>`).join("")}</ol>`;
  }
  function settingsText(r) {
    return policyName(r.settings.policy) +
      (r.settings.policy === "case" ? ` · requirements ${pct(r.settings.s)}` : "") +
      (r.hidden ? (r.settings.oversightApplicable ? ` · oversight ${pct(r.settings.x)}` : " · oversight N/A") : "");
  }
  function welcome() {
    enter("welcome", `
      <section class="welcome">
        <div><p class="eyebrow">An animated platform governance game</p>
          <h1>Solo<br>or <em>Team?</em></h1>
          <p class="lead">Set the rules.<br>Watch the Market.</p>
          <p class="intro">One account. Two workers. Who gets to take the job?<br>Run a little marketplace and discover what happens when your rules meet real choices.</p>
          <button class="button" data-action="start">Run my marketplace <span aria-hidden="true">→</span></button>
          <p class="welcome-meta">3 challenges · about 3–5 minutes · no timer pressure</p>
        </div>
        <div class="welcome-art"><span class="art-note">A little help changes the picture.</span><img src="assets/marketplace.svg?v=20261020-glow" alt="An otter lead worker, cat teammate and rabbit client connected through a miniature marketplace." width="960" height="440"><span class="art-note">Permission? It’s your call.</span></div>
      </section>
      <div class="teach-strip">
        <div class="teach-item"><span class="teach-number">01</span><div><h2>Choose the rules</h2><p>Block, approve case by case, or recognize a formal team.</p></div></div>
        <div class="teach-item"><span class="teach-number">02</span><div><h2>Watch them respond</h2><p>Workers decide. Clients consent. Every choice has a consequence.</p></div></div>
        <div class="teach-item"><span class="teach-number">03</span><div><h2>Try a different policy</h2><p>Replay the same opportunities. Compare outcomes and profit.</p></div></div>
      </div>
      <p class="disclaimer">Inspired by <em>When Should Gig Platforms Allow Teams?</em> · A stylized teaching simulation, not a reproduction of the paper’s model or results.</p>${codeLine()}`, false);
  }
  function policyCard(id, title, copy, badge) {
    return `<label class="policy-card" data-policy="${id}">
      <input type="radio" name="policy" value="${id}" ${settings.policy === id ? "checked" : ""}>
      <span class="policy-icon" aria-hidden="true"><img src="assets/lead.svg" alt="">${id === "team" ? '<img src="assets/secondary.svg" alt="">' : ""}<span>${badge}</span></span>
      <strong>${title}</strong><p>${copy}</p></label>`;
  }
  function policyScreen() {
    const c = marketplace.challenges[roundIndex];
    comparisonOpen = false;
    enter("policy", `${track(roundIndex)}
      <div class="round-heading"><div><p class="eyebrow">Challenge ${roundIndex+1} / 3</p><h1>${esc(c.title)}</h1><p>${brief[roundIndex]}</p></div><span class="tag">${c.opportunities.length} opportunities</span></div>
      <p class="commit-note"><strong>Set the rules before the jobs arrive.</strong> Individual capabilities, private costs and outcomes are revealed only after you commit.${rounds[roundIndex] ? " This is a replay of the same opportunities; you have already seen this sample." : ""}</p>
      <fieldset class="policy-fieldset"><legend>How will your platform handle collaboration?</legend><div class="policy-grid">
        ${policyCard("block","Block","Only the lead is authorized. A job that needs another worker may go unserved.","⊘")}
        ${policyCard("case","Case-by-Case Approval","Workers can propose a substitute. The client must consent before authorization.","?")}
        ${policyCard("team","Formal Team","Both workers are preauthorized. A capable teammate can step in without a new request.","✓")}
      </div></fieldset>
      <div class="controls-panel">
        <div class="slider-panel" id="approval-controls" ${settings.policy !== "case" ? "hidden" : ""}>
          <label for="approval">Approval Requirements <output id="approval-value" for="approval">${pct(settings.s)}</output></label>
          <input type="range" min="0" max="100" step="5" value="${Math.round(settings.s*100)}" id="approval" aria-describedby="approval-description">
          <div class="scale-labels"><span>Light</span><span>Moderate</span><span>Demanding</span></div>
          <p id="approval-description">More demanding requirements reassure clients but make it more costly for workers to seek approval.</p>
        </div>
        <div class="slider-panel" id="oversight-controls" ${!c.hidden || settings.policy === "team" ? "hidden" : ""}>
          <label for="oversight">Oversight Intensity <output id="oversight-value" for="oversight">${pct(settings.x)}</output></label>
          <input type="range" min="0" max="100" step="5" value="${Math.round(settings.x*100)}" id="oversight" aria-describedby="oversight-description">
          <div class="scale-labels"><span>Light</span><span>Moderate</span><span>Intensive</span></div>
          <p id="oversight-description">Stronger liability enforcement and detection, with a higher platform cost. The effect on hidden backup is not one-way.</p>
        </div>
        <p class="oversight-na" id="oversight-na" ${!c.hidden || settings.policy !== "team" ? "hidden" : ""}><strong>Oversight: not applicable.</strong><br>The known secondary worker is already authorized under Formal Team. There is no hidden-use oversight cost in this regime.</p>
      </div>
      <div class="commit-row"><button class="button" data-action="commit">Commit &amp; open the marketplace <span aria-hidden="true">→</span></button><p>Workers and clients make their own decisions.<br>You can pause or skip the animation.</p></div>`);
  }
  function sceneMarkup() {
    const count = marketplace.challenges[roundIndex].opportunities.length;
    return `<div class="stage-wrap">
      <div class="stage-top"><span>LIVE MARKETPLACE</span><span id="job-counter">Opportunity 1 / ${count}</span></div>
      <progress id="round-progress" value="0" max="${count}" aria-label="Completed opportunities"></progress>
      <div class="scene" id="scene" data-actor="client" data-tone="normal">
        <svg class="links" viewBox="0 0 1000 540" preserveAspectRatio="none" aria-hidden="true"><path class="lead-link" d="M170 260 Q240 110 500 135"/><path class="client-link" d="M830 260 Q760 110 500 135"/><path class="secondary-link" d="M500 145 L500 390"/><path class="hidden-link" d="M170 275 Q200 430 480 410"/></svg>
        <div class="hub" aria-hidden="true"><img src="assets/hub.svg" alt=""></div>
        <div class="actor lead-actor"><img src="assets/lead.svg" alt="Otter lead worker"><span class="actor-label">Lead worker</span></div>
        <div class="actor secondary-actor"><img src="assets/secondary.svg" alt="Cat secondary worker"><span class="actor-label">Secondary worker</span></div>
        <div class="actor client-actor"><img src="assets/client.svg" alt="Rabbit client"><span class="actor-label">Client</span></div>
        <div class="job-token" id="job-token" aria-hidden="true">JOB 01</div><div class="scene-stamp" id="scene-stamp" aria-hidden="true">New opportunity</div>
      </div>
      <div class="stage-legend"><span><i class="legend-dot"></i>✓ Success</span><span><i class="legend-dot orange"></i>→ Assistance / approval</span><span><i class="legend-dot red"></i>× Failure</span><span><i class="legend-dot purple"></i>⋯ Unauthorized</span></div>
    </div>`;
  }
  function beginRound() {
    const scenario = marketplace.challenges[roundIndex];
    activeRound = S.runRound(scenario, settings);
    eventIndex = 0; stepIndex = 0; completedEvents = []; paused = false;
    enter("play", `<div class="play-top"><div><p class="eyebrow">Challenge ${roundIndex+1} / 3 · Policy committed</p><h1>${esc(scenario.title)}</h1><p>${esc(settingsText(activeRound))}</p></div><span class="tag">Observer view</span></div>
      <div class="scoreboard" aria-label="Settled outcomes"><div class="score"><span>Profit · illustrative credits</span><strong id="live-profit">0.00</strong></div><div class="score"><span>Succeeded</span><strong id="live-success">0</strong></div><div class="score"><span>Failed</span><strong id="live-failed">0</strong></div><div class="score"><span>Unformed</span><strong id="live-unformed">0</strong></div></div>
      <div class="play-layout">${sceneMarkup()}<section class="narrator" aria-label="Current opportunity"><p class="eyebrow" id="event-kind">Opportunity revealed</p><h2 id="event-title"></h2><p id="event-narration"></p><ul class="step-list" id="step-list"></ul></section></div>
      <div class="actions playback"><div class="actions"><button class="quiet-button" data-action="pause" id="pause-button" aria-pressed="false">Pause</button><button class="quiet-button" data-action="next-job">Next job →</button></div><button class="quiet-button" data-action="skip">Skip to results</button></div>
      <p class="observer-note">You are now seeing decisions unfold, including private and hidden choices. This information was not available to the platform when it committed. Scores include settled jobs only.</p>`);
    showStep();
  }
  function toneFor(step, event) {
    if (step.type === "hidden" || (event.unauthorized && ["secondary-attempt","detected"].includes(step.type))) return "hidden";
    if (["lead-failure","secondary-failure","failed","consent-denied"].includes(step.type)) return "failure";
    if (["nominate","consent-approved","authorize","backup","reassignment"].includes(step.type)) return "approval";
    return "normal";
  }
  function showStep() {
    if (screen !== "play") return;
    const event = activeRound.events[eventIndex];
    const step = event.steps[stepIndex];
    const scene = document.getElementById("scene");
    scene.dataset.actor = ["lead","secondary","client"].includes(step.actor) ? step.actor : "platform";
    scene.dataset.tone = toneFor(step, event);
    document.getElementById("job-counter").textContent = `Opportunity ${eventIndex+1} / ${activeRound.events.length}`;
    document.getElementById("job-token").textContent = "JOB " + String(eventIndex+1).padStart(2,"0");
    document.getElementById("scene-stamp").textContent = captions[step.type] || "Decision unfolds";
    document.getElementById("event-title").textContent = event.task;
    document.getElementById("event-narration").textContent = step.text;
    // Do not reveal a future failure or capability mismatch before its event step.
    const revealedSteps = event.steps.slice(0, stepIndex+1);
    const kind = revealedSteps.some(s => s.type === "backup") ? "Backup — Can someone save the job?"
      : revealedSteps.some(s => s.type === "reassignment") ? "Reassignment — Can someone else take the job?"
      : "Opportunity " + (eventIndex+1);
    document.getElementById("event-kind").textContent = kind;
    document.getElementById("step-list").innerHTML = revealedSteps.slice(-4,-1).map(s => `<li><span aria-hidden="true">•</span>${esc(s.text)}</li>`).join("");
    announcement.textContent = `Opportunity ${eventIndex+1}. ${step.text}`;
    if (step.type === "settled") {
      completedEvents = activeRound.events.slice(0,eventIndex+1);
      updateLiveMetrics();
    }
    if (!paused) timer = window.setTimeout(advanceStep, step.type === "settled" ? STOP_MS : STEP_MS);
  }
  function updateLiveMetrics() {
    const m = S.metricsForEvents(completedEvents).metrics;
    document.getElementById("live-profit").textContent = money(m.profit);
    document.getElementById("live-success").textContent = m.successes;
    document.getElementById("live-failed").textContent = m.failures;
    document.getElementById("live-unformed").textContent = m.unformed;
    document.getElementById("round-progress").value = completedEvents.length;
  }
  function advanceStep() {
    stopTimer();
    if (screen !== "play" || paused) return;
    stepIndex += 1;
    if (stepIndex >= activeRound.events[eventIndex].steps.length) { eventIndex += 1; stepIndex = 0; }
    if (eventIndex >= activeRound.events.length) finishRound();
    else showStep();
  }
  function pausePlayback() {
    if (screen !== "play") return;
    paused = !paused;
    stopTimer();
    const button = document.getElementById("pause-button");
    button.textContent = paused ? "Resume" : "Pause";
    button.setAttribute("aria-pressed", String(paused));
    document.getElementById("scene").classList.toggle("paused", paused);
    announcement.textContent = paused ? "Playback paused." : "Playback resumed.";
    if (!paused) timer = window.setTimeout(advanceStep, STEP_MS);
  }
  function nextJob() {
    stopTimer();
    completedEvents = activeRound.events.slice(0, eventIndex+1);
    updateLiveMetrics();
    eventIndex += 1; stepIndex = 0;
    if (eventIndex === activeRound.events.length) finishRound();
    else showStep();
  }
  function finishRound() {
    stopTimer();
    rounds[roundIndex] = activeRound;
    resultScreen();
  }
  function metricGrid(m) {
    const items = [
      [m.successes,"Successful transactions"], [m.failures,"Failed transactions"],
      [m.reassignments,"Reassignments","new transactions attempted"], [m.successfulBackups,"Successful backups","existing transactions rescued"],
      [m.authorizedAttempts,"Authorized secondary attempts"], [m.unauthorizedAttempts,"Unauthorized attempts"],
      [m.undetectedUnauthorized,"Undetected hidden attempts"], [m.unformed,"Unformed opportunities","not counted as failures"]
    ];
    return `<div class="metric-grid">${items.map(([value,label,note]) => `<div class="metric"><strong>${value}</strong><span>${label}</span>${note ? `<small>${note}</small>` : ""}</div>`).join("")}</div>`;
  }
  function insightsMarkup(r) {
    return `<section class="insight-box"><h2>What happened?</h2>${r.insights.what.map(t => `<p>${esc(t)}</p>`).join("")}<h2>Why did it happen?</h2><ul>${r.insights.why.map(t => `<li>${esc(t)}</li>`).join("")}</ul></section>`;
  }
  function compareMarkup(allRounds) {
    let comparisons;
    if (allRounds) {
      comparisons = S.POLICIES.map(policy => {
        const simulated = marketplace.challenges.map((c,i) => S.runRound(c,{...rounds[i].settings,policy:policy.id}));
        return { ...S.summarizeRounds(simulated), name:policy.name, settingsNote:"One policy across all 3 challenges" };
      });
    } else {
      comparisons = S.comparePolicies(marketplace.challenges[roundIndex], activeRound.settings)
        .map(r => ({...r,name:policyName(r.settings.policy),settingsNote:r.settings.policy === "case" ? `Requirements ${pct(r.settings.s)}` : "No repeated approval"}));
    }
    const max = Math.max(...comparisons.map(r => r.metrics.profit));
    const comparisonS = allRounds ? rounds.map((r,i) => `challenge ${i+1}: ${pct(r.settings.s)}`).join(", ") : pct(activeRound.settings.s);
    const comparisonX = allRounds ? rounds[2].settings.x : activeRound.settings.x;
    const showOversight = allRounds || activeRound.hidden;
    return `<details class="comparison-panel" id="comparison" ${comparisonOpen ? "open" : ""}><summary>Compare policies on this same marketplace</summary>
      <p>${allRounds ? "Each row uses the same policy across all three challenges. Your report above uses your chosen mix." : `These are counterfactual replays of the same ${activeRound.events.length} opportunities, including the policies you did not choose.`} The highest realized profit in this sample is shaded.</p>
      <div class="table-scroll"><table><caption>Identical capabilities, costs and outcome draws. No resampling or policy bonuses.</caption><thead><tr><th scope="col">Policy</th><th scope="col">Profit</th><th scope="col">Successes</th><th scope="col">Failures</th><th scope="col">Reassigned</th><th scope="col">Saved by backup</th><th scope="col">Hidden attempts</th></tr></thead><tbody>
      ${comparisons.map(r => `<tr class="${r.metrics.profit === max ? "best" : ""}"><th scope="row">${esc(r.name)}</th><td>${money(r.metrics.profit)}</td><td>${r.metrics.successes}</td><td>${r.metrics.failures}</td><td>${r.metrics.reassignments}</td><td>${r.metrics.successfulBackups}</td><td>${r.metrics.unauthorizedAttempts}</td></tr>`).join("")}
      </tbody></table></div>
      <div class="comparison-explanations">${comparisons.map(r => `<p><strong>${esc(r.name)}</strong><br>Authorized secondary attempts: ${r.metrics.authorizedAttempts}; hidden attempts: ${r.metrics.unauthorizedAttempts}. ${r.metrics.secondaryFailures ? `Secondary failures added ${money(r.ledger.secondaryFailureLoss)} credits in losses.` : "No extra secondary-failure losses occurred."} Processing and oversight together cost ${money(r.ledger.approvalCosts+r.ledger.oversightCosts)} credits.${r.ledger.hiddenDamage ? ` Undetected participation added ${money(r.ledger.hiddenDamage)} in damage.` : ""}</p>`).join("")}</div>
      <p class="table-note">Case-by-Case requirements: ${comparisonS}. ${showOversight ? `Hidden Teams oversight: ${pct(comparisonX)} for Block and Case-by-Case; not applicable to Formal Team.` : "Hidden collaboration and oversight are not active in this challenge."} Settings are held fixed, not optimized. A different sample or setting may change the ranking.</p></details>`;
  }
  function eventLog(r) {
    return `<details class="event-log"><summary>Inspect all ${r.events.length} opportunities and decisions</summary><p>The full sequence is now revealed. A reassignment counts as an attempt to create a transaction; a successful backup counts only when an existing transaction is rescued.</p>
      ${r.events.map((e,i) => `<details class="log-entry"><summary><span>${String(i+1).padStart(2,"0")} · ${esc(e.task)}</span><span>${esc(e.kind)} · ${e.success ? "success" : e.failed ? "failed" : "unformed"}</span><b>${signed(e.profit)}</b></summary>
      <ol>${e.steps.map(s => `<li>${esc(s.text)}</li>`).join("")}</ol>${e.providerDecision ? `<p><strong>Worker’s calculation:</strong> ${esc(e.providerDecision)}</p>` : ""}
      <p>Contribution ${money(e.ledger.revenue)} · failure loss ${money(e.ledger.failureLoss)} · extra failure loss ${money(e.ledger.secondaryFailureLoss)} · approval ${money(e.ledger.approvalCosts)} · oversight ${money(e.ledger.oversightCosts)} · hidden damage ${money(e.ledger.hiddenDamage)}</p></details>`).join("")}</details>`;
  }
  function resultScreen() {
    const r = activeRound;
    enter("results", `${track(roundIndex)}
      <div class="result-hero"><div><p class="eyebrow">Challenge ${roundIndex+1} complete</p><h1>${esc(r.title)}</h1><p>${esc(settingsText(r))}</p></div><div class="profit-total"><span>Platform Profit (Illustrative Credits)</span><strong>${money(r.metrics.profit)}</strong></div></div>
      ${metricGrid(r.metrics)}${insightsMarkup(r)}
      <div class="actions result-actions"><button class="button" data-action="continue">${roundIndex === 2 ? "Your Marketplace Report" : "Next challenge"} <span aria-hidden="true">→</span></button><button class="button secondary" data-action="retry">Try Another Policy</button><button class="quiet-button" data-action="compare">Compare Policies ↓</button></div>
      <p class="seed-line">Trying another policy replays this exact challenge and replaces its contribution to your final report.</p>
      ${compareMarkup(false)}${eventLog(r)}${codeLine()}`);
  }
  function finalReport() {
    const total = S.summarizeRounds(rounds);
    const m = total.metrics;
    const lessons = [
      `Reassigned transactions: ${m.reassignments}. Successful backups: ${m.successfulBackups}. These are different sources of value: starting service versus rescuing service.`,
      `Approval processing cost ${money(total.ledger.approvalCosts)} credits and oversight cost ${money(total.ledger.oversightCosts)}. These costs count even when the corresponding governance rule does not deliver a successful job.`,
      m.unauthorizedAttempts ? `Unauthorized secondary attempts: ${m.unauthorizedAttempts}. Restricting permission did not eliminate participation in this marketplace.`
        : "No unauthorized attempt occurred under your chosen rules and this sample. That outcome does not imply that restrictions always eliminate hidden participation."
    ];
    enter("report", `<div class="result-hero"><div><p class="eyebrow">Three challenges. One marketplace.</p><h1>Your Marketplace Report</h1><p>Your selected policies, and the outcomes they produced.</p></div><div class="profit-total"><span>Total Platform Profit (Illustrative Credits)</span><strong>${money(m.profit)}</strong></div></div>
      <div class="round-choices">${rounds.map((r,i) => `<section class="choice-card"><p class="eyebrow">Challenge ${i+1} · ${esc(r.title)}</p><h2>${esc(policyName(r.settings.policy))}</h2><p>${esc(settingsText(r))}</p><p><strong>${money(r.metrics.profit)} credits</strong> · ${r.metrics.successes} successes</p></section>`).join("")}</div>
      ${metricGrid(m)}<section class="insight-box"><h2>Lessons from your marketplace</h2><ul>${lessons.map(t => `<li>${esc(t)}</li>`).join("")}</ul></section>
      <div class="actions result-actions"><button class="button" data-action="replay">Replay Same Marketplace</button><button class="button secondary" data-action="new">New Marketplace Challenge</button><button class="quiet-button" data-action="compare">Compare Policies ↓</button><a class="quiet-button" href="../../index.html#lab">Return to Website ↗</a></div>
      ${compareMarkup(true)}${codeLine()}
      <p class="closing">Platform rules influence not only which workers are permitted to collaborate, but also whether workers seek approval, when they provide backup, and whether participation remains hidden.</p>
      <p class="disclaimer">This game is a stylized educational simulation inspired by research in operations management. It uses illustrative assumptions and does not reproduce actual platform data or establish the results of the underlying research paper.</p>`);
  }
  function reset(newMarketplace) {
    if (newMarketplace) {
      seed = newCode(); marketplace = S.createMarketplace(seed);
      updateSeedURL();
    }
    rounds = []; roundIndex = 0; activeRound = null; comparisonOpen = false;
    settings = { policy:"case", s:0.4, x:0.35 };
    policyScreen();
  }
  app.addEventListener("click", e => {
    const button = e.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "start") policyScreen();
    if (action === "commit" && screen === "policy") beginRound();
    if (action === "pause") pausePlayback();
    if (action === "next-job" && screen === "play") nextJob();
    if (action === "skip" && screen === "play") finishRound();
    if (action === "retry") policyScreen();
    if (action === "continue") {
      if (roundIndex === 2) finalReport();
      else { roundIndex += 1; settings = {...settings}; policyScreen(); }
    }
    if (action === "compare") {
      const comparison = document.getElementById("comparison");
      comparison.open = true; comparisonOpen = true;
      comparison.querySelector("summary").focus();
      comparison.scrollIntoView({block:"start",behavior:"instant"});
    }
    if (action === "replay") reset(false);
    if (action === "new") reset(true);
  });
  app.addEventListener("change", e => {
    if (e.target.name !== "policy") return;
    settings.policy = e.target.value;
    document.getElementById("approval-controls").hidden = settings.policy !== "case";
    document.getElementById("oversight-controls").hidden = !marketplace.challenges[roundIndex].hidden || settings.policy === "team";
    document.getElementById("oversight-na").hidden = !marketplace.challenges[roundIndex].hidden || settings.policy !== "team";
  });
  app.addEventListener("input", e => {
    if (e.target.id === "approval") { settings.s = Number(e.target.value)/100; document.getElementById("approval-value").textContent = pct(settings.s); }
    if (e.target.id === "oversight") { settings.x = Number(e.target.value)/100; document.getElementById("oversight-value").textContent = pct(settings.x); }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && screen === "play" && !paused) pausePlayback(); });
  const c = S.CONFIG;
  document.getElementById("model-parameters").innerHTML = `<details><summary>The numerical assumptions</summary>
    <p>All three regimes share the same service values, capability fits and potential outcomes. First-attempt reliability is 87–97% in Business as Usual and 48–80% later; secondary reliability is 48–93%. The initial capability mix is ${c.opportunities - 4} both-fit, 2 lead-only, 1 secondary-only and 1 neither-fit; later rounds use ${c.opportunities - 5}, 1, 3 and 1. Order and all other characteristics are seeded. Failure realizations are not known when workers decide.</p>
    <pre>Client consent probability = clamp(base assurance + ${c.consentAssurance} × s, 0, 1)
Base assurance = 0.8 − 0.6 × private client concern
Worker proposal burden = private proposal cost + ${c.nominationBurden} × s
Platform cost per submitted proposal = ${c.approvalBaseCost} + ${c.approvalQuadraticCost} × s²
Hidden Teams liability rate = ${c.liabilityBase} + ${c.liabilityOversight} × x
Hidden Teams detection probability = ${c.detectionBase} + ${c.detectionOversight} × x
Platform oversight cost per opportunity = ${c.oversightQuadraticCost} × x²</pre>
    <p>Outside Hidden Teams, or for Formal Team, the liability rate is ${c.liabilityBase}, hidden participation is unavailable and oversight costs zero. For reassignment, the worker compares expected secondary earnings minus service cost and expected failure liability against no transaction. For backup, the alternative already carries failure liability; a rescue can avoid it. Formal preauthorization removes permission costs, but the worker still participates only if expected private value improves.</p>
    <p>A hidden attempt has the same service prospects, minus private coordination cost and expected detection penalty. Detection occurs after service; undetected attempts incur platform damage. A proposal’s expected value includes the available fallback after client refusal. The lead nominates only when this expected value, less proposal burden, beats the best alternative. Every submitted proposal costs the platform, including one the client declines.</p>
    <p>Per-opportunity ranges in illustrative credits: successful contribution 13–24; ordinary failure loss 14–25; extra secondary-failure loss 36–128; provider reward 11–21; potential provider liability 14–25; secondary service cost 3–9; private proposal cost 0.4–4.4; hidden coordination cost 0.3–4.5; detection penalty 7–18; undetected-use damage 5–14. Extra secondary-failure loss combines a job-specific 6–18 with a ${c.secondaryFailurePremiumMin}–${c.secondaryFailurePremiumMax} exposure amount drawn once for the marketplace and shared across all three challenges and policies. Contribution is already net of routine payment, so worker pay is not subtracted a second time.</p></details>`;
  welcome();
}());
