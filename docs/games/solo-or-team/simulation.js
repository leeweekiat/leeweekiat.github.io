/* Solo or Team? — an illustrative teaching abstraction, not a paper replication.
   No dependencies. Every random quantity belongs to an opportunity, never a policy. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TeamSimulation = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const CONFIG = Object.freeze({
    opportunities: 10,
    consentAssurance: 0.34,
    nominationBurden: 7,
    approvalBaseCost: 6.6,
    approvalQuadraticCost: 5,
    secondaryFailurePremiumMin: 30,
    secondaryFailurePremiumMax: 110,
    liabilityBase: 0.2,
    liabilityOversight: 0.65,
    detectionBase: 0.05,
    detectionOversight: 0.8,
    oversightQuadraticCost: 2.5
  });
  const CHALLENGES = Object.freeze([
    Object.freeze({ id: "usual", title: "Business as Usual", subtitle: "Most jobs fit the lead. Is extra permission worth its cost?", hidden: false }),
    Object.freeze({ id: "helping", title: "A Helping Hand", subtitle: "More mismatches and failed first attempts make assistance valuable.", hidden: false }),
    Object.freeze({ id: "hidden", title: "Hidden Teams", subtitle: "Workers can seek approval—or consider an unofficial route.", hidden: true })
  ]);
  const POLICIES = Object.freeze([
    Object.freeze({ id: "block", name: "Block" }),
    Object.freeze({ id: "case", name: "Case-by-Case Approval" }),
    Object.freeze({ id: "team", name: "Formal Team" })
  ]);
  const LEDGER_KEYS = ["revenue", "failureLoss", "secondaryFailureLoss", "approvalCosts", "oversightCosts", "hiddenDamage"];
  const METRIC_KEYS = ["profit", "successes", "failures", "unformed", "reassignments", "successfulBackups", "authorizedAttempts", "unauthorizedAttempts", "undetectedUnauthorized", "nominations", "approvals", "approvalCosts", "oversightCosts", "leadSuccesses", "backupAttempts", "secondaryFailures", "detectedUnauthorized", "declinedNominations", "opportunities"];
  const TASKS = ["Parcel handoff", "Photo edit", "Garden visit", "Product listing", "Event setup", "Document layout", "Meal delivery", "Furniture assembly", "Audio cleanup", "Shop inventory", "Poster design", "Local collection"];
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function money(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function empty(keys) { return Object.fromEntries(keys.map(key => [key, 0])); }
  function probability(value) { return clamp(value, 0, 1); }
  function normalizeSettings(settings, hidden) {
    const source = settings || {};
    const policy = source.policy || "block";
    if (!POLICIES.some(p => p.id === policy)) throw new Error("Unknown account policy.");
    const s = Number.isFinite(source.s) ? probability(source.s) : 0.4;
    const x = Number.isFinite(source.x) ? probability(source.x) : 0.35;
    return { policy, s, x, oversightApplicable: Boolean(hidden && policy !== "team") };
  }
  function configFor(overrides) {
    const result = Object.assign({}, CONFIG, overrides || {});
    Object.keys(CONFIG).forEach(key => {
      if (!Number.isFinite(result[key]) || result[key] < 0) throw new Error("Invalid model parameter: " + key);
    });
    return result;
  }
  // A field-addressed 32-bit hash: all policies use the very same potential outcomes.
  function randomAt(seed, address) {
    const text = String(seed) + "|" + String(address);
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
    h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function createScenario(seed, challengeIndex) {
    const index = Number.isInteger(challengeIndex) ? challengeIndex : 0;
    const challenge = CHALLENGES[index];
    if (!challenge) throw new Error("Unknown marketplace challenge.");
    const code = String(seed == null ? "MARKET-2026" : seed);
    // A shared economic condition, drawn before any policy or outcome is evaluated.
    // These ranges tune gameplay variety; they are not calibrated research estimates.
    const secondaryFailurePremium = CONFIG.secondaryFailurePremiumMin +
      (CONFIG.secondaryFailurePremiumMax - CONFIG.secondaryFailurePremiumMin) * randomAt(code, "marketplace/secondary-risk");
    // Capability mixes describe the challenge, not the policy or its winner.
    const profiles = index === 0
      ? [...Array(CONFIG.opportunities - 4).fill("both"), "lead", "lead", "secondary", "neither"]
      : [...Array(CONFIG.opportunities - 5).fill("both"), "lead", "secondary", "secondary", "secondary", "neither"];
    const ordered = profiles.map((profile, i) => ({ profile, order: randomAt(code, index + "/order/" + i) }))
      .sort((a, b) => a.order - b.order);
    const opportunities = ordered.map((entry, i) => {
      const draw = field => randomAt(code, index + "/" + i + "/" + field);
      const range = (field, low, high) => money(low + (high - low) * draw(field));
      const leadProbability = range("lead-probability", index === 0 ? 0.87 : 0.48, index === 0 ? 0.97 : 0.8);
      const secondaryProbability = range("secondary-probability", 0.48, 0.93);
      const concern = draw("client-concern");
      return {
        id: challenge.id + "-" + (i + 1),
        index: i,
        task: TASKS[Math.floor(draw("task") * TASKS.length)],
        leadFit: entry.profile === "both" || entry.profile === "lead",
        secondaryFit: entry.profile === "both" || entry.profile === "secondary",
        leadProbability, secondaryProbability,
        leadSuccess: draw("lead-outcome") < leadProbability,
        secondarySuccess: draw("secondary-outcome") < secondaryProbability,
        platformValue: range("platform-value", 13, 24),
        failureLoss: range("failed-transaction-loss", 14, 25),
        additionalFailureLoss: money(range("secondary-failure-loss", 6, 18) + secondaryFailurePremium),
        providerReward: range("provider-reward", 11, 21),
        providerLiability: range("provider-liability", 14, 25),
        secondaryCost: range("secondary-service-cost", 3, 9),
        proposalCost: range("private-proposal-cost", 0.4, 4.4),
        hiddenCoordinationCost: range("hidden-coordination-cost", 0.3, 4.5),
        detectionPenalty: range("detection-penalty", 7, 18),
        hiddenDamage: range("undetected-platform-damage", 5, 14),
        clientConcern: concern,
        consentBase: 0.8 - 0.6 * concern,
        consentDraw: draw("client-consent"),
        detectionDraw: draw("hidden-detection")
      };
    });
    return Object.assign({ seed: code, index, secondaryFailurePremium, opportunities }, challenge);
  }
  function createMarketplace(seed) {
    const scenarios = CHALLENGES.map((_, index) => createScenario(seed, index));
    return { seed: scenarios[0].seed, challenges: scenarios };
  }
  // All values below are expectations. Realized outcome/detection/consent draws
  // are deliberately absent. A failed lead attempt is already observed at backup.
  function evaluateDecision(opportunity, kind, settings, hidden, overrides) {
    const cfg = configFor(overrides);
    const chosen = normalizeSettings(settings, hidden);
    const x = chosen.oversightApplicable ? chosen.x : 0;
    const liabilityRate = probability(cfg.liabilityBase + cfg.liabilityOversight * x);
    const detectionProbability = hidden && chosen.policy !== "team"
      ? probability(cfg.detectionBase + cfg.detectionOversight * x) : 0;
    const p = opportunity.secondaryProbability;
    const liability = liabilityRate * opportunity.providerLiability;
    const noSecondaryValue = kind === "backup" ? -liability : 0;
    const authorizedValue = p * opportunity.providerReward - opportunity.secondaryCost - (1 - p) * liability;
    const authorizedGain = authorizedValue - noSecondaryValue;
    const hiddenGain = authorizedGain - opportunity.hiddenCoordinationCost - detectionProbability * opportunity.detectionPenalty;
    const hiddenAvailable = Boolean(hidden && chosen.policy !== "team" && opportunity.secondaryFit);
    const hiddenChosen = hiddenAvailable && hiddenGain > 0;
    const fallbackGain = hiddenChosen ? hiddenGain : 0;
    const consentProbability = probability(opportunity.consentBase + cfg.consentAssurance * chosen.s);
    const nominationBurden = opportunity.proposalCost + cfg.nominationBurden * chosen.s;
    const nominationGain = consentProbability * authorizedGain + (1 - consentProbability) * fallbackGain - nominationBurden;
    return {
      liabilityRate, liability, detectionProbability, consentProbability,
      noSecondaryValue, authorizedValue, authorizedGain, hiddenGain, hiddenAvailable,
      hiddenChosen, fallbackGain, nominationBurden, nominationGain,
      nominate: chosen.policy === "case" && opportunity.secondaryFit && nominationGain > fallbackGain,
      formalParticipate: chosen.policy === "team" && opportunity.secondaryFit && authorizedGain > 0
    };
  }
  function profitFromLedger(ledger) {
    return money(ledger.revenue - ledger.failureLoss - ledger.secondaryFailureLoss - ledger.approvalCosts - ledger.oversightCosts - ledger.hiddenDamage);
  }
  function simulateOpportunity(opportunity, settings, hidden, overrides) {
    const cfg = configFor(overrides);
    const chosen = normalizeSettings(settings, hidden);
    const o = opportunity;
    const e = {
      id: o.id, index: o.index, task: o.task, kind: "lead", formed: false,
      success: false, failed: false, secondaryAttempt: false, authorized: false,
      unauthorized: false, detected: false, nomination: false, approved: false,
      declinedNomination: false, workerPenalty: 0, providerDecision: "",
      profit: 0, ledger: empty(LEDGER_KEYS), steps: []
    };
    const step = (type, text, actor) => e.steps.push({ type, text, actor: actor || "platform" });
    const finish = () => {
      if (e.success) e.ledger.revenue = o.platformValue;
      e.failed = e.formed && !e.success;
      if (e.failed) e.ledger.failureLoss = o.failureLoss;
      if (e.secondaryAttempt && !e.success) e.ledger.secondaryFailureLoss = o.additionalFailureLoss;
      LEDGER_KEYS.forEach(key => { e.ledger[key] = money(e.ledger[key]); });
      e.profit = profitFromLedger(e.ledger);
      step("settled", "Job settled: " + (e.profit >= 0 ? "+" : "") + e.profit.toFixed(2) + " illustrative credits.", "platform");
      return e;
    };
    if (chosen.oversightApplicable) e.ledger.oversightCosts = cfg.oversightQuadraticCost * chosen.x * chosen.x;
    step("posted", "A client posts “" + o.task + "”.", "client");
    step("assess", "The lead checks whether this job fits their capabilities.", "lead");
    if (o.leadFit) {
      e.formed = true;
      step("lead-attempt", "The job fits. The lead starts the service.", "lead");
      if (o.leadSuccess) {
        e.success = true;
        step("lead-success", "Delivered! The lead completes the job.", "lead");
        return finish();
      }
      e.kind = "backup";
      step("lead-failure", "The first attempt failed. Backup needed!", "lead");
      step("backup", "Backup — Can someone save the job? This transaction already exists.", "secondary");
    } else {
      e.kind = o.secondaryFit ? "reassignment" : "unavailable";
      step("reassignment", "The lead cannot take this job. Reassignment could create a new transaction.", "lead");
    }
    if (!o.secondaryFit) {
      step("no-fit", "The secondary worker cannot perform this service either.", "secondary");
      step(e.formed ? "failed" : "unformed", e.formed ? "The existing transaction fails without a capable backup." : "No transaction forms; this is not a failed transaction.", "platform");
      return finish();
    }
    const d = evaluateDecision(o, e.kind, chosen, hidden, cfg);
    e.decisions = d;
    if (chosen.policy === "team") {
      if (d.formalParticipate) {
        e.authorized = true;
        step("authorize", "Both workers are preauthorized. The secondary accepts the assistance request.", "platform");
      } else {
        step("decline-team", "Preauthorization is available, but the expected private gain does not cover providing assistance.", "lead");
      }
      e.providerDecision = "Preauthorized assistance has an expected private gain of " + money(d.authorizedGain).toFixed(2) + " relative to the no-secondary outcome.";
    } else if (chosen.policy === "case") {
      e.nomination = d.nominate;
      e.declinedNomination = !d.nominate;
      e.providerDecision = "Seeking approval offers expected incremental utility " + money(d.nominationGain).toFixed(2) + ", after proposal burden " + money(d.nominationBurden).toFixed(2) + "; the best fallback offers " + money(d.fallbackGain).toFixed(2) + ".";
      if (d.nominate) {
        e.ledger.approvalCosts = cfg.approvalBaseCost + cfg.approvalQuadraticCost * chosen.s * chosen.s;
        step("nominate", "The lead chooses to submit a proposal. The platform processes the request.", "lead");
        e.approved = o.consentDraw < d.consentProbability;
        if (e.approved) {
          e.authorized = true;
          step("consent-approved", "The client consents to this proposed secondary worker.", "client");
          step("authorize", "Approved substitution verified and recorded.", "platform");
        } else {
          step("consent-denied", "The client declines this proposal. The lead considers the available fallback.", "client");
        }
      } else {
        step("decline-nomination", "The lead does not nominate: the expected approval gain does not beat the burden and available fallback.", "lead");
      }
    } else {
      step("blocked", "Only the lead is authorized under Block.", "platform");
      e.providerDecision = hidden
        ? "Hidden assistance offers expected private gain " + money(d.hiddenGain).toFixed(2) + " after coordination costs and expected detection penalties."
        : "Secondary participation is not authorized; no hidden participation is available in this challenge.";
    }
    if (!e.authorized && d.hiddenChosen) {
      e.unauthorized = true;
      step("hidden", "Educational reveal: the workers choose an unofficial connection. The platform did not observe this choice in advance.", "secondary");
    }
    if (e.authorized || e.unauthorized) {
      e.secondaryAttempt = true;
      e.formed = true;
      step("secondary-attempt", e.kind === "backup" ? "The secondary tries to rescue the existing transaction." : "The secondary starts a newly formed reassigned transaction.", "secondary");
      e.success = o.secondarySuccess;
      step(e.success ? "secondary-success" : "secondary-failure", e.success
        ? (e.kind === "backup" ? "Backup succeeds! The transaction is rescued." : "Reassignment succeeds! An additional transaction is completed.")
        : "The secondary attempt fails, creating an additional failure loss.", "secondary");
      if (e.unauthorized) {
        e.detected = o.detectionDraw < d.detectionProbability;
        if (e.detected) {
          e.workerPenalty = o.detectionPenalty;
          step("detected", "Oversight detects the unofficial participation. The worker penalty is not platform revenue.", "platform");
        } else {
          e.ledger.hiddenDamage = o.hiddenDamage;
          step("hidden", "The unofficial participation goes undetected and causes an additional platform damage cost.", "platform");
        }
      }
    } else {
      step(e.formed ? "failed" : "unformed", e.formed ? "No secondary attempt occurs. The existing transaction fails." : "No secondary attempt occurs. No transaction forms.", "platform");
    }
    return finish();
  }
  function metricsForEvents(events) {
    const metrics = empty(METRIC_KEYS);
    const ledger = empty(LEDGER_KEYS);
    events.forEach(e => {
      metrics.opportunities += 1;
      metrics.successes += Number(e.success);
      metrics.failures += Number(e.failed);
      metrics.unformed += Number(!e.formed);
      metrics.leadSuccesses += Number(e.success && !e.secondaryAttempt);
      metrics.reassignments += Number(e.kind === "reassignment" && e.secondaryAttempt);
      metrics.backupAttempts += Number(e.kind === "backup" && e.secondaryAttempt);
      metrics.successfulBackups += Number(e.kind === "backup" && e.secondaryAttempt && e.success);
      metrics.authorizedAttempts += Number(e.authorized && e.secondaryAttempt);
      metrics.unauthorizedAttempts += Number(e.unauthorized && e.secondaryAttempt);
      metrics.undetectedUnauthorized += Number(e.unauthorized && !e.detected);
      metrics.detectedUnauthorized += Number(e.detected);
      metrics.nominations += Number(e.nomination);
      metrics.approvals += Number(e.approved);
      metrics.declinedNominations += Number(e.declinedNomination);
      metrics.secondaryFailures += Number(e.secondaryAttempt && !e.success);
      LEDGER_KEYS.forEach(key => { ledger[key] += e.ledger[key]; });
    });
    LEDGER_KEYS.forEach(key => { ledger[key] = money(ledger[key]); });
    metrics.profit = profitFromLedger(ledger);
    metrics.approvalCosts = ledger.approvalCosts;
    metrics.oversightCosts = ledger.oversightCosts;
    return { metrics, ledger };
  }
  function insightsFor(result) {
    const m = result.metrics, l = result.ledger, settings = result.settings;
    const what = ["Successful transactions: " + m.successes + ". Failed transactions: " + m.failures + ". Opportunities that never formed a transaction: " + m.unformed + "."];
    const why = [];
    if (m.reassignments || m.successfulBackups) what.push("Reassigned transactions attempted: " + m.reassignments + "; existing transactions rescued by backup: " + m.successfulBackups + ".");
    if (settings.policy === "case") {
      what.push("Proposals submitted: " + m.nominations + "; approved by clients: " + m.approvals + ".");
      if (m.declinedNominations) why.push("The lead declined to nominate on " + m.declinedNominations + (m.declinedNominations === 1 ? " opportunity" : " opportunities") + " because expected approval benefits, after proposal burden, did not beat the available fallback.");
      if (m.nominations) why.push("Approval requirements enter three separate calculations: client assurance, worker proposal burden, and the platform's convex request-processing cost.");
    }
    if (settings.policy === "team" && m.authorizedAttempts) why.push("Preauthorization removed repeated proposals; workers accepted assistance when its expected private value exceeded the no-secondary outcome.");
    if (m.secondaryFailures) why.push(m.secondaryFailures + (m.secondaryFailures === 1 ? " secondary attempt failed" : " secondary attempts failed") + ", incurring " + l.secondaryFailureLoss.toFixed(2) + " extra failure-loss credits in addition to the ordinary failed-transaction losses.");
    if (m.unauthorizedAttempts) {
      what.push("Unofficial secondary attempts: " + m.unauthorizedAttempts + " (detected: " + m.detectedUnauthorized + "; undetected: " + m.undetectedUnauthorized + ").");
      why.push("For unofficial participation, expected gains exceeded private coordination costs and expected detection penalties. Worker penalties do not count as platform earnings.");
    }
    if (result.events.some(e => e.unauthorized && e.kind === "backup") && settings.oversightApplicable && settings.x > 0) {
      why.push("For hidden backup in this sample, a rescue also avoids liability on an already failed lead attempt. Oversight raises this benefit and the competing threat of detection; its net effect is not universal.");
    }
    if (!why.length) why.push(settings.policy === "block"
      ? "Block kept secondary workers unauthorized. Suitable lead jobs proceeded; unserved mismatches created no transaction, while unsuccessful accepted jobs counted as failures."
      : "Decisions used expected reliability and private costs; realized service outcomes determined the eventual profit.");
    return { what, why };
  }
  function runRound(scenario, settings, overrides) {
    if (!scenario || !Array.isArray(scenario.opportunities)) throw new Error("A generated marketplace scenario is required.");
    const chosen = normalizeSettings(settings, scenario.hidden);
    const events = scenario.opportunities.map(o => simulateOpportunity(o, chosen, scenario.hidden, overrides));
    const totals = metricsForEvents(events);
    const result = Object.assign({
      scenarioId: scenario.id, seed: scenario.seed, challengeIndex: scenario.index,
      title: scenario.title, hidden: scenario.hidden, settings: chosen, events
    }, totals);
    result.insights = insightsFor(result);
    return result;
  }
  function comparePolicies(scenario, settings, overrides) {
    return POLICIES.map(policy => runRound(scenario, Object.assign({}, settings, { policy: policy.id }), overrides));
  }
  function summarizeRounds(rounds) {
    const completed = rounds.filter(Boolean);
    const totals = metricsForEvents(completed.flatMap(round => round.events));
    return Object.assign({
      policies: completed.map(round => ({ challenge: round.title, policy: round.settings.policy, settings: round.settings })),
      rounds: completed.length
    }, totals);
  }
  return Object.freeze({
    CONFIG, CHALLENGES, POLICIES, createMarketplace, createScenario, runRound,
    comparePolicies, summarizeRounds, evaluateDecision, simulateOpportunity,
    metricsForEvents, profitFromLedger, randomAt
  });
}));
