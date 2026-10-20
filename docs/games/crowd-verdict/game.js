/* UI and animation only. All draws, transitions and accounting live in simulation.js. */
(function () {
  "use strict";
  const S = window.CrowdSimulation;
  const Art = window.CrowdArt;
  const app = document.getElementById("app");
  const announcement = document.getElementById("announcement");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let session, welcome = true, revealed = 0, paused = false, timer = null, zoomed = false;
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const voteName = vote => vote === "refund" ? "Refund" : "No Refund";
  const signed = value => value > 0 ? "+" + value : value === 0 ? "0" : "−" + Math.abs(value);
  const button = (action, text, cls = "primary") => `<button class="btn ${cls}" data-action="${action}">${text}</button>`;
  function newSeed() {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(2); window.crypto.getRandomValues(values);
      return "JURY-" + Array.from(values, n => n.toString(36).toUpperCase()).join("-");
    }
    return "JURY-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  function setSeed(seed) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("seed", seed);
      window.history.replaceState(null, "", url.href);
    } catch (_) { /* Direct-file playback still works when history is unavailable. */ }
  }
  function reset(seed, showWelcome) {
    clearTimeout(timer); timer = null;
    session = S.createSession(S.generateScenario(seed));
    welcome = showWelcome; revealed = 0; paused = false; zoomed = false;
    setSeed(session.scenario.seed); render(!showWelcome);
  }
  function announce(text) { announcement.textContent = text; }
  function focusHeading() {
    const heading = app.querySelector("[data-focus]");
    if (heading) { heading.focus({ preventScroll: true }); heading.scrollIntoView({ block: "nearest", behavior: "auto" }); }
  }
  function render(focus) {
    if (welcome) app.innerHTML = welcomeView();
    else if (session.phase === "finished") app.innerHTML = reportView();
    else app.innerHTML = sessionHeader() + (session.phase === "locked" ? lockedView() : caseView()) + endRow();
    if (focus) focusHeading();
  }
  function welcomeView() {
    return `<section class="welcome">
      <div><p class="eyebrow">A crowd-judging game</p><h1 data-focus tabindex="-1">Crowd Verdict<span class="accent">.</span><br><span>Refund or Reject?</span></h1>
      <p class="lead">Examine the evidence. Cast your vote.<br>Will the crowd agree?</p>
      <p>One second-hand marketplace. A room full of opinions.<br>Your task: decide which disputes deserve a refund.</p>
      ${button("start", 'Enter the jury room <span aria-hidden="true">→</span>')}
      <p class="small">Start with 10 virtual tokens. Up to 10 cases.<br>No timer. You can stop whenever you like.</p></div>
      <div class="welcome-art"><img src="assets/jury-scene.svg?v=20261020-lens" width="600" height="380" alt="A colorful animal jury examining a disputed second-hand product."><span class="art-caption">The evidence speaks. The crowd decides.</span></div>
      </section>
      <div class="rule-strip"><div><span class="step">01</span><b>Pay 1 to inspect</b><p>Unlock a sealed case and examine the product.</p></div><div><span class="step">02</span><b>Cast your vote</b><p>Choose Refund or No Refund, then meet the jury.</p></div><div><span class="step">03</span><b>Agree? Receive 2</b><p>Join the majority to earn +1 token net.</p></div></div>
      <p class="small">Fictional game points only. No monetary value or redemption. Replay code: <strong>${esc(session.scenario.seed)}</strong></p>`;
  }
  function sessionHeader() {
    return `<div class="session-bar"><div><div class="session-brand">Crowd Verdict <span aria-hidden="true">/</span> Jury room</div><div class="seed">Replay code: ${esc(session.scenario.seed)}</div></div>
      <div class="stats"><div class="stat"><b>${session.index + 1}<small> / 10</small></b><span>Current case</span></div><div class="stat"><b>${session.history.filter(r => r.agreed).length}</b><span>Won</span></div><div class="stat"><b>${session.history.filter(r => !r.agreed).length}</b><span>Lost</span></div>
      <div class="wallet${session.phase === "evidence" ? " paid" : session.phase === "result" && session.pending.agreed ? " rewarded" : ""}"><span class="coin" aria-hidden="true">●</span><div><b id="wallet">${session.wallet}</b><small>virtual tokens</small></div></div></div></div>
      <div class="case-progress" aria-hidden="true">${session.scenario.cases.map((_, i) => `<span class="${i < session.history.length ? "done" : i === session.index ? "current" : ""}"></span>`).join("")}</div>`;
  }
  function caseTitle(title, note) {
    return `<div class="case-title"><div><p class="eyebrow">Case ${session.index + 1} of 10 · ${esc(session.scenario.cases[session.index].id)}</p><h2 data-focus tabindex="-1">${title}</h2></div><p class="small">${note}</p></div>`;
  }
  function lockedView() {
    return caseTitle("A new dispute is waiting.", "Evidence is sealed until you join. The jury’s votes stay private until you vote.") +
      `<section class="locked-room"><div class="sealed" aria-hidden="true"><div class="folder"><span class="seal">?</span></div><span class="sealed-label">SEALED EVIDENCE</span></div>
      <div><p class="eyebrow">Second-hand marketplace</p><h3>A buyer has requested a refund.</h3><p>The listing promised good condition. Inspect what arrived, hear the complaint and cast your ballot.</p>
      <div class="costs"><div><b>1 token</b><span>Participation fee</span></div><div><b>2 tokens</b><span>Reward if in majority</span></div></div>
      ${button("join", 'Pay 1 token &amp; view evidence <span aria-hidden="true">→</span>')}<p class="small">Your balance after joining: ${session.wallet - 1} tokens.</p></div></section>`;
  }
  function caseView() {
    const c = session.scenario.cases[session.index];
    return caseTitle(esc(c.title), session.phase === "evidence" ? "No time limit. Inspect the evidence before deciding." : "Your ballot is included. The majority settles this case.") +
      `<div class="case-layout"><section class="evidence-card"><div class="evidence-head"><p class="eyebrow">Evidence unlocked</p><span class="badge">Claimed: good condition</span></div>
      <div class="product-stage${zoomed ? " zoomed" : ""}" id="product-stage">${Art.product(c.product, c.severity)}
      <button class="inspect-button" data-action="inspect" aria-label="Magnify product evidence" aria-pressed="${zoomed}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M12 5v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>
      <div class="evidence-copy"><p class="label">The listing</p><p>${esc(c.listing)}</p><div class="complaint"><p class="label">The buyer’s complaint</p><p>“${esc(c.complaint)}”</p></div></div>
      <p class="payment-note">−1 token paid · Participation fee charged once</p></section>
      <section class="jury-card${paused ? " paused" : ""}" id="jury-card">${session.phase === "evidence" ? decisionView() : votingView()}</section></div>`;
  }
  function decisionView() {
    return `<div class="decision-intro"><p class="eyebrow">Your independent decision</p><h3>Would you refund it?</h3><p>The listing promised good condition. Does the evidence show substantial undisclosed damage?</p>
      <div class="jury-silhouettes" aria-hidden="true"><span>?</span><span>?</span><span>?</span><span>?</span></div>
      <div class="vote-choices"><button class="vote-btn" data-action="refund"><span aria-hidden="true">✓</span>Refund</button><button class="vote-btn reject" data-action="reject"><span aria-hidden="true">×</span>No Refund</button></div>
      <p class="decision-footnote">Your vote is final for this case. You haven’t seen the other jurors’ ballots yet. A majority decision may differ from the evidence benchmark.</p></div>`;
  }
  function votingView() {
    return `<div class="jury-title"><h3 id="jury-heading" tabindex="-1">The jury is voting.</h3><span class="small">${session.scenario.cases[session.index].jurors.length + 1} votes total</span></div>
      <div class="tally"><div><span>✓ Refund</span><b id="refund-count">0</b></div><div><span>× No Refund</span><b id="reject-count">0</b></div></div>
      <div class="jurors" id="jurors"></div><div id="vote-controls" class="jury-controls">${button("pause", paused ? "Resume animation" : "Pause animation", "secondary")}${button("skip", "Skip animation", "quiet")}</div>
      <p class="voting-status" id="voting-status"></p><div id="verdict"></div>`;
  }
  function updateVoting() {
    const c = session.scenario.cases[session.index];
    const result = session.pending || session.history[session.history.length - 1];
    const settled = session.phase === "result";
    const ballots = [{ vote: result.playerVote, animal: "cat", name: "You", player: true }, ...c.jurors];
    let yes = 0, no = 0;
    document.getElementById("jurors").innerHTML = ballots.map((j, i) => {
      const visible = i === 0 || i <= revealed;
      if (visible) j.vote === "refund" ? yes++ : no++;
      const cls = [visible ? j.vote : "waiting", i === revealed && i > 0 ? "revealed" : "", j.player ? "is-player" : "", settled && j.vote === result.majority ? "majority-member" : ""].join(" ");
      return `<div class="juror ${cls}"><img src="assets/juror-${esc(j.animal)}.svg" alt="" width="72" height="65"><span class="juror-name">${j.player ? "You · your vote" : "Juror " + i}</span><span class="ballot">${visible ? voteName(j.vote) : "Waiting…"}</span></div>`;
    }).join("");
    document.getElementById("refund-count").textContent = yes;
    document.getElementById("reject-count").textContent = no;
    document.getElementById("voting-status").textContent = settled ? `${yes + no} of ${ballots.length} ballots counted. Your vote is included.` : paused ? "Paused. Resume or skip whenever you’re ready." : `${yes + no} of ${ballots.length} ballots revealed…`;
    document.getElementById("jury-heading").textContent = settled ? "The votes are in." : paused ? "The jury is paused." : "The jury is voting.";
    document.getElementById("vote-controls").hidden = settled;
    if (settled) {
      document.getElementById("verdict").innerHTML = resultView(result, c);
      document.getElementById("wallet").textContent = session.wallet;
    }
  }
  function resultView(r, c) {
    const types = c.jurors.reduce((a, j) => (a[j.type]++, a), { normal: 0, buyer: 0, seller: 0 });
    const mismatch = r.majority !== S.benchmarkVote(c.severity);
    const finalCase = session.history.length >= 10 || session.wallet === 0;
    const confetti = r.agreed ? `<div class="confetti" aria-hidden="true">${Array.from({length:15}, (_,i) => `<i style="--x:${5+i*6}%;--delay:${(i%5)*.07}s;--color:${["#e6b05a","#76a887","#d88b6e"][i%3]}"></i>`).join("")}</div>` : "";
    return `<div class="verdict ${r.agreed ? "agreed" : "disagreed"}">${confetti}<p class="eyebrow">Majority decision</p><h3>${voteName(r.majority)}</h3><p>${r.agreed ? "You’re with the majority." : "You voted differently from the majority."} ${r.votesRefund} Refund · ${r.votesReject} No Refund.</p>
      <span class="reward">${r.agreed ? "+2 tokens awarded · +1 net for this case" : "0 tokens awarded · −1 net for this case"}</span>${button("next", finalCase ? "See your jury report →" : "Next case →")}</div>
      ${mismatch ? `<p class="insight">This majority differs from the game’s evidence benchmark (${voteName(S.benchmarkVote(c.severity))}). Juror leanings and probabilistic votes can outweigh the physical evidence.</p>` : ""}
      <details class="composition"><summary>Reveal this panel’s composition</summary><p>${types.normal} normal · ${types.buyer} buyer-leaning · ${types.seller} seller-leaning. These are the ${c.jurors.length} simulated jurors; your vote is separate.</p><p>Evidence classification: ${["Good condition", "Lightly damaged", "Damaged", "Badly damaged"][c.severity]}. Illustrative benchmark: ${voteName(S.benchmarkVote(c.severity))}.</p></details>`;
  }
  function endRow() {
    return `<div class="end-row"><p>${session.phase === "evidence" ? "Finish now to retain your balance. The entry fee stays paid; an uncast vote does not count as a judged case." : session.phase === "voting" ? "Finish now to settle your submitted vote and keep your final balance." : "Stop whenever you like and retain your remaining virtual tokens."}</p><button class="text-button" data-action="quit">Finish now</button></div>`;
  }
  function schedule() {
    clearTimeout(timer); timer = null;
    if (paused || session.phase !== "voting") return;
    timer = setTimeout(() => {
      revealed++;
      if (revealed >= session.scenario.cases[session.index].jurors.length) settle();
      else { updateVoting(); schedule(); }
    }, 700);
  }
  function settle() {
    clearTimeout(timer); timer = null;
    revealed = session.scenario.cases[session.index].jurors.length;
    if (!S.settle(session)) return;
    paused = false; render(false); updateVoting();
    const r = session.history[session.history.length - 1];
    announce(`${voteName(r.majority)} is the majority. ${r.agreed ? "You received two tokens." : "No reward this case."} Your balance is ${session.wallet} tokens.`);
    const verdict = document.getElementById("jury-heading"); if (verdict) verdict.focus({ preventScroll: true });
  }
  function reportView() {
    const s = S.summary(session);
    const reason = { completed: "All 10 cases are complete.", bankrupt: "You have no tokens left to join another case.", quit: "You chose to finish and keep your remaining tokens." }[s.reason] || "Your session is complete.";
    const rate = s.agreementRate == null ? "—" : Math.round(s.agreementRate * 100) + "%";
    const width = s.casesJudged ? s.agreements / s.casesJudged * 100 : 0;
    const rows = session.history.map((r, i) => {
      const c = session.scenario.cases[r.caseIndex == null ? i : r.caseIndex];
      return `<tr><th scope="row">${i+1}. ${esc(c.title)}</th><td>${voteName(r.playerVote)}</td><td>${voteName(r.majority)}</td><td class="${r.agreed ? "net-positive" : "net-negative"}">${signed(r.net)}</td></tr>`;
    }).join("");
    const leanings = session.history.filter(r => {
      const c = session.scenario.cases[r.caseIndex];
      const b = c.jurors.filter(j => j.type === "buyer").length, se = c.jurors.filter(j => j.type === "seller").length;
      return b !== se;
    }).length;
    return `<section class="report"><header class="report-header"><div><p class="eyebrow">Jury duty, complete</p><h1 data-focus tabindex="-1">Your Jury Report<span style="color:var(--orange)">.</span></h1><p>${reason}</p></div><div class="report-stamp"><b>${s.casesJudged}</b><span>cases judged</span></div></header>
      <div class="report-grid"><section class="report-card"><p class="eyebrow">Your token wallet</p><div class="balance"><b>${s.finalTokens}</b><span>final tokens · ${signed(s.net)} net</span></div>
      <dl class="ledger"><div><dt>Starting tokens</dt><dd>${s.startingTokens}</dd></div><div><dt>Participation fees</dt><dd>−${s.feesPaid}</dd></div><div><dt>Majority rewards</dt><dd>+${s.rewardsEarned}</dd></div><div class="total"><dt>Net tokens earned / lost</dt><dd>${signed(s.net)}</dd></div></dl></section>
      <section class="report-card"><p class="eyebrow">Agreement with the crowd</p><div class="balance"><b>${rate}</b><span>of your votes matched</span></div><div class="agreement-bar" aria-hidden="true"><span class="agrees" style="width:${width}%"></span><span class="disagrees" style="width:${s.casesJudged ? 100-width : 0}%"></span></div><div class="report-numbers"><div><b>${s.agreements}</b><span>Agreements</span></div><div><b>${s.disagreements}</b><span>Disagreements</span></div><div><b>${s.refundVotes} / ${s.rejectVotes}</b><span>Your Refund / No Refund votes</span></div></div></section></div>
      <section class="report-observations"><h2>What happened in your jury room?</h2><p>${s.casesJudged ? `You agreed with the majority in ${s.agreements} out of ${s.casesJudged} disputes. The majority chose Refund ${s.majorityRefunds} times and No Refund ${s.majorityRejects} times.` : "You left before casting a vote. There are no jury outcomes to interpret."}</p>
      ${s.casesJudged ? `<p>${s.majorityBenchmarkDisagreements ? `The majority differed from the game’s evidence benchmark in ${s.majorityBenchmarkDisagreements} of ${s.casesJudged} cases. Agreement with the crowd and agreement with the evidence are different measures.` : "Every majority decision in this session matched the game’s evidence benchmark. That is an outcome of these particular cases, not a guarantee about crowds."}</p>` : ""}
      ${leanings ? `<p>In ${leanings} of your panels, the number of buyer-leaning and seller-leaning jurors differed. Those leanings were drawn before you voted; no outcomes were adjusted in response to your choice.</p>` : ""}
      ${s.unvotedFees ? `<p>You also paid ${s.unvotedFees} token to open a case without submitting a vote. That fee is included in your wallet; it is not counted as a majority disagreement.</p>` : ""}</section>
      ${s.casesJudged ? `<div class="report-history table-scroll"><table><caption>Your judged cases · net tokens include the entry fee</caption><thead><tr><th scope="col">Case</th><th scope="col">Your vote</th><th scope="col">Majority</th><th scope="col">Net</th></tr></thead><tbody>${rows}</tbody></table></div>` : ""}
      <div class="button-row">${button("new", "Play Again with New Cases")}${button("replay", "Replay Same Cases", "secondary")}<a class="btn quiet" href="../../index.html#lab">Return to Interactive Lab</a></div>
      <p class="report-note">Replay code: <strong>${esc(session.scenario.seed)}</strong>. Replaying keeps the same evidence and simulated ballots. Your own vote can change a close majority.</p>
      <p class="report-note">This is a standalone fictional crowd-judging simulation inspired by my research on dispute systems. Tokens are fictional game points, have no monetary value and cannot be redeemed. No account, real payment or backend is involved.</p></section>`;
  }
  app.addEventListener("click", event => {
    const target = event.target.closest("[data-action]");
    if (!target || target.disabled) return;
    const action = target.dataset.action;
    if (action === "start" && welcome) { welcome = false; render(true); }
    else if (action === "join" && S.join(session)) { zoomed = false; render(true); announce("Evidence unlocked. One token paid."); }
    else if ((action === "refund" || action === "reject") && S.castVote(session, action)) {
      revealed = 0; paused = false; render(false); updateVoting();
      document.getElementById("jury-heading").focus({ preventScroll: true });
      announce("Your vote is saved. The jury is revealing its ballots.");
      if (reducedMotion.matches) settle(); else schedule();
    } else if (action === "inspect" && session.phase !== "locked" && session.phase !== "finished") {
      zoomed = !zoomed; document.getElementById("product-stage").classList.toggle("zoomed", zoomed); target.setAttribute("aria-pressed", String(zoomed));
    } else if (action === "pause" && session.phase === "voting") {
      paused = !paused; target.textContent = paused ? "Resume animation" : "Pause animation";
      document.getElementById("jury-card").classList.toggle("paused", paused); updateVoting(); schedule();
    } else if (action === "skip" && session.phase === "voting") settle();
    else if (action === "next" && session.phase === "result") { S.next(session); zoomed = false; render(true); }
    else if (action === "quit" && session.phase !== "finished") { clearTimeout(timer); timer = null; S.quit(session); render(true); announce("Your jury report is ready."); }
    else if (action === "replay" && session.phase === "finished") reset(session.scenario.seed, false);
    else if (action === "new" && session.phase === "finished") reset(newSeed(), false);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && session.phase === "voting" && !paused) {
      paused = true; clearTimeout(timer); timer = null;
      const control = app.querySelector('[data-action="pause"]'); if (control) control.textContent = "Resume animation";
      document.getElementById("jury-card").classList.add("paused"); updateVoting();
    }
  });
  if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches && session.phase === "voting") settle();
  });
  const suppliedSeed = new URLSearchParams(window.location.search).get("seed");
  reset(suppliedSeed ? suppliedSeed.slice(0, 96) : newSeed(), true);
})();
