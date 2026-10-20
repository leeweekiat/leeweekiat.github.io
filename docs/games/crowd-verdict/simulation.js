/* Crowd Verdict: independent, fictional teaching-game rules.
 * Randomness and accounting live here; presentation never decides a ballot.
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CrowdSimulation = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.keys(value).forEach(function (key) { freeze(value[key]); });
      Object.freeze(value);
    }
    return value;
  }

  var DEFAULT_CONFIG = freeze({
    startTokens: 10,
    maxCases: 10,
    entryFee: 1,
    reward: 2,
    normalRefund: [0.05, 0.30, 0.70, 0.95],
    typeWeights: { normal: 0.65, buyer: 0.20, seller: 0.15 },
    varyTypeWeights: false
  });
  var TYPES = ["normal", "buyer", "seller"];
  var ANIMALS = ["cat", "rabbit", "bear", "fox"];
  var NAMES = {
    cat: ["Miso", "Clover", "Pip", "Mochi"],
    rabbit: ["Bun", "Hazel", "Coco", "Clover"],
    bear: ["Maple", "Honey", "Teddy", "Pudding"],
    fox: ["Fern", "Rusty", "Ember", "Acorn"]
  };

  // Every listing promises good condition. The four complaints and matching
  // illustrations are evidence, not facts to reveal on the locked-case teaser.
  var PRODUCTS = [
    {
      product: "laptop", title: "A second-hand laptop",
      listing: "A laptop in good condition: intact screen and hinges, all keys working, with no undisclosed damage.",
      complaints: [
        "The laptop powers on, the screen is clear, and every key works. The buyer says it feels older than expected.",
        "There are a few shallow scratches on the screen bezel and palm rest. The screen, keyboard and hinges work normally.",
        "A long crack crosses the screen, although the laptop still turns on. The listing did not mention a crack.",
        "The screen is shattered, the display frame is broken, and several keys are missing. The laptop cannot be used normally."
      ]
    },
    {
      product: "smartphone", title: "A second-hand smartphone",
      listing: "A smartphone in good condition: an intact screen and case, working buttons, and no undisclosed damage.",
      complaints: [
        "The screen and buttons work, and the case is intact. The buyer dislikes the phone's color in daylight.",
        "A few light scratches mark the case. The screen and all buttons still work normally.",
        "A visible crack runs across the display, and a corner of the case is chipped. These were not disclosed.",
        "The display is shattered and dark, the case is bent, and the phone will not power on."
      ]
    },
    {
      product: "bicycle", title: "A second-hand bicycle",
      listing: "A bicycle in good condition: safe working wheels, a sound frame, and no undisclosed damage.",
      complaints: [
        "Both wheels spin smoothly and the frame is intact. The buyer finds the paint color less bright than expected.",
        "There are small paint scratches on the frame. The wheels, pedals and brakes still work normally.",
        "The front wheel is visibly bent and rubs against the frame. The listing did not disclose this damage.",
        "The front wheel is buckled, the frame is cracked, and the bicycle cannot be ridden."
      ]
    },
    {
      product: "camera", title: "A second-hand camera",
      listing: "A camera in good condition: an intact lens and body, working controls, and no undisclosed damage.",
      complaints: [
        "The lens is clear and the camera takes normal photos. The buyer thinks it is heavier than expected.",
        "There are light scuffs on the camera body. The lens and controls still work normally.",
        "The lens glass has a visible crack that appears in photos. The listing did not disclose it.",
        "The lens is shattered and partly detached, the body is cracked, and the camera will not take photos."
      ]
    },
    {
      product: "chair", title: "A second-hand chair",
      listing: "A chair in good condition: a sound seat and stable legs, with no undisclosed damage.",
      complaints: [
        "The chair stands evenly and the seat is intact. The buyer finds its shape less comfortable than expected.",
        "There are shallow scratches on the seat and legs. The chair is stable and usable.",
        "The seat cushion is torn and a back slat is split. The listing did not mention these problems.",
        "One leg has snapped off and the seat is broken. The chair cannot support a sitter."
      ]
    },
    {
      product: "headphones", title: "Second-hand headphones",
      listing: "Headphones in good condition: a sound headband and ear pads, working audio, and no undisclosed damage.",
      complaints: [
        "Both ear cups play normally and the headband is intact. The buyer prefers a different sound profile.",
        "The ear cups have light surface scuffs. Both ear cups and the headband work normally.",
        "The headband is cracked and one ear pad is torn. The listing did not disclose the damage.",
        "The headband is snapped, one ear cup hangs loose, and sound works on only one side."
      ]
    },
    {
      product: "handbag", title: "A second-hand handbag",
      listing: "A handbag in good condition: intact straps, seams and closure, with no undisclosed damage.",
      complaints: [
        "The straps, seams and closure are intact. The buyer finds the bag smaller than they had imagined.",
        "There are a few light scuff marks on the outside. The straps, seams and closure work normally.",
        "An open tear marks the front panel of the bag. The listing did not mention a tear.",
        "A handle has torn away, a side seam is split open, and the bag cannot hold its contents securely."
      ]
    },
    {
      product: "television", title: "A second-hand television",
      listing: "A television in good condition: an intact screen and stand, working picture, and no undisclosed damage.",
      complaints: [
        "The picture is clear and the screen and stand are intact. The buyer dislikes the size of the bezel.",
        "The bezel has a few light scratches. The picture and stand are normal.",
        "A crack crosses the screen and disrupts the picture. The listing did not disclose the damage.",
        "The screen is shattered, the stand is broken, and the television cannot display a picture."
      ]
    },
    {
      product: "table", title: "A second-hand table",
      listing: "A table in good condition: a sound surface and stable legs, with no undisclosed damage.",
      complaints: [
        "The tabletop is intact and the legs are stable. The buyer prefers a different wood color.",
        "There are a few shallow scratches on the top. The table is stable and usable.",
        "A deep split runs across the top and one edge is chipped. The listing did not mention this damage.",
        "One leg has broken away and the tabletop is split through. The table cannot stand securely."
      ]
    },
    {
      product: "console", title: "A second-hand gaming console",
      listing: "A gaming console in good condition: an intact case and controller, working controls, and no undisclosed damage.",
      complaints: [
        "The console starts games and every controller button works. The buyer had expected a different color.",
        "The case has light scratches. The console and controller still work normally.",
        "The case is cracked and a controller handle is split. The listing did not mention either problem.",
        "The console case is broken open, the controller is snapped, and the console will not start."
      ]
    }
  ];

  function probability(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
  }

  function validateWeights(weights) {
    if (!weights || typeof weights !== "object" || Array.isArray(weights) ||
        Object.keys(weights).length !== TYPES.length ||
        !TYPES.every(function (type) { return probability(weights[type]); })) {
      throw new TypeError("Juror type weights must contain normal, buyer and seller probabilities.");
    }
    var total = TYPES.reduce(function (sum, type) { return sum + weights[type]; }, 0);
    if (Math.abs(total - 1) > 1e-9) throw new RangeError("Juror type weights must sum to 1.");
    return weights;
  }

  function validateConfig(overrides) {
    if (overrides === undefined) overrides = {};
    if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
      throw new TypeError("Configuration must be an object.");
    }
    Object.keys(overrides).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, key)) {
        throw new TypeError("Unknown configuration field: " + key);
      }
    });
    var config = Object.assign({}, DEFAULT_CONFIG, overrides);
    if (!Number.isSafeInteger(config.startTokens) || config.startTokens < 0) {
      throw new RangeError("Starting tokens must be a nonnegative integer.");
    }
    if (!Number.isInteger(config.maxCases) || config.maxCases < 1 || config.maxCases > 10) {
      throw new RangeError("A session must have between 1 and 10 cases.");
    }
    if (!Number.isSafeInteger(config.entryFee) || config.entryFee < 1 ||
        !Number.isSafeInteger(config.reward) || config.reward < 0 ||
        !Number.isSafeInteger(config.startTokens + config.maxCases * config.reward)) {
      throw new RangeError("Use a positive integer fee and a nonnegative integer reward within safe token limits.");
    }
    if (!Array.isArray(config.normalRefund) || config.normalRefund.length !== 4 ||
        !config.normalRefund.every(probability)) {
      throw new RangeError("Normal-voter refund probabilities must be four numbers between 0 and 1.");
    }
    validateWeights(config.typeWeights);
    if (typeof config.varyTypeWeights !== "boolean") {
      throw new TypeError("varyTypeWeights must be true or false.");
    }
    config.normalRefund = config.normalRefund.slice();
    config.typeWeights = Object.assign({}, config.typeWeights);
    return freeze(config);
  }

  function hash(seed) {
    var text = String(seed);
    var value = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function createRng(seed) {
    var state = hash(seed);
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      var value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function choose(rng, values) {
    return values[Math.floor(rng() * values.length)];
  }

  function shuffle(rng, values) {
    var result = values.slice();
    for (var i = result.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rng() * (i + 1));
      var value = result[i];
      result[i] = result[j];
      result[j] = value;
    }
    return result;
  }

  function validSeverity(severity) {
    if (!Number.isInteger(severity) || severity < 0 || severity > 3) {
      throw new RangeError("Evidence severity must be an integer from 0 to 3.");
    }
  }

  function benchmarkVote(severity) {
    validSeverity(severity);
    return severity >= 2 ? "refund" : "reject";
  }

  function drawJuror(rng, severity, config, typeWeights) {
    if (typeof rng !== "function") throw new TypeError("A seeded random-number function is required.");
    validSeverity(severity);
    config = config || DEFAULT_CONFIG;
    typeWeights = typeWeights || config.typeWeights;
    validateWeights(typeWeights);
    var typeDraw = rng();
    var type = typeDraw < typeWeights.normal ? "normal" :
      typeDraw < typeWeights.normal + typeWeights.buyer ? "buyer" : "seller";
    // Consume the vote draw for every type. Appearance is independent of type
    // and ballots are final before any player decision or animation exists.
    var voteDraw = rng();
    var vote = type === "buyer" || (type === "normal" && voteDraw < config.normalRefund[severity])
      ? "refund" : "reject";
    var animal = choose(rng, ANIMALS);
    return freeze({ type: type, vote: vote, animal: animal, name: choose(rng, NAMES[animal]) });
  }

  function weightsForCase(rng, config) {
    if (!config.varyTypeWeights) return Object.assign({}, config.typeWeights);
    var raw = {};
    var total = 0;
    TYPES.forEach(function (type) {
      raw[type] = config.typeWeights[type] * (0.5 + rng());
      total += raw[type];
    });
    TYPES.forEach(function (type) { raw[type] /= total; });
    return raw;
  }

  function generateScenario(seed, overrides) {
    seed = seed === undefined || seed === null || String(seed).trim() === ""
      ? "CROWD-2026" : String(seed).trim();
    var config = validateConfig(overrides);
    var rng = createRng(seed);
    var products = shuffle(rng, PRODUCTS).slice(0, config.maxCases);
    // A full session includes every product, all four severities and all four
    // panel sizes. Their order and the additional draws vary with the seed.
    var severities = [0, 1, 2, 3];
    var panelSizes = [2, 4, 6, 8];
    while (severities.length < config.maxCases) severities.push(Math.floor(rng() * 4));
    while (panelSizes.length < config.maxCases) panelSizes.push(choose(rng, [2, 4, 6, 8]));
    severities = shuffle(rng, severities).slice(0, config.maxCases);
    panelSizes = shuffle(rng, panelSizes).slice(0, config.maxCases);
    var code = hash(seed).toString(36).toUpperCase();
    var cases = products.map(function (product, index) {
      var severity = severities[index];
      var typeWeights = weightsForCase(rng, config);
      var jurors = [];
      for (var j = 0; j < panelSizes[index]; j += 1) {
        jurors.push(drawJuror(rng, severity, config, typeWeights));
      }
      return {
        id: "CV-" + code + "-" + String(index + 1).padStart(2, "0"),
        product: product.product,
        title: product.title,
        listing: product.listing,
        complaint: product.complaints[severity],
        severity: severity,
        jurors: jurors,
        typeWeights: typeWeights
      };
    });
    return freeze({ seed: seed, config: config, cases: cases });
  }

  function createSession(scenario) {
    if (!scenario || !scenario.config || !Array.isArray(scenario.cases) ||
        !scenario.cases.length || scenario.cases.length !== scenario.config.maxCases) {
      throw new TypeError("Create a session from a generated scenario.");
    }
    var state = {
      scenario: scenario,
      wallet: scenario.config.startTokens,
      index: 0,
      phase: "locked",
      history: [],
      reason: null,
      feesPaid: 0,
      rewardsEarned: 0,
      pending: null
    };
    if (state.wallet < scenario.config.entryFee) {
      state.phase = "finished";
      state.reason = "bankrupt";
    }
    return state;
  }

  function join(state) {
    if (state.phase !== "locked" || state.index >= state.scenario.cases.length ||
        state.wallet < state.scenario.config.entryFee) return false;
    state.wallet -= state.scenario.config.entryFee;
    state.feesPaid += state.scenario.config.entryFee;
    state.phase = "evidence";
    return true;
  }

  function castVote(state, vote) {
    if (state.phase !== "evidence" || (vote !== "refund" && vote !== "reject")) return false;
    var dispute = state.scenario.cases[state.index];
    var refunds = dispute.jurors.reduce(function (sum, juror) {
      return sum + (juror.vote === "refund" ? 1 : 0);
    }, vote === "refund" ? 1 : 0);
    var total = dispute.jurors.length + 1;
    var rejects = total - refunds;
    var majority = refunds > rejects ? "refund" : "reject";
    var agreed = vote === majority;
    var reward = agreed ? state.scenario.config.reward : 0;
    var benchmark = benchmarkVote(dispute.severity);
    state.pending = freeze({
      playerVote: vote,
      votesRefund: refunds,
      votesReject: rejects,
      total: total,
      majority: majority,
      agreed: agreed,
      reward: reward,
      net: reward - state.scenario.config.entryFee,
      benchmark: benchmark,
      benchmarkMatch: vote === benchmark,
      caseId: dispute.id,
      caseIndex: state.index
    });
    state.phase = "voting";
    return true;
  }

  function settle(state) {
    if (state.phase !== "voting" || !state.pending) return false;
    state.wallet += state.pending.reward;
    state.rewardsEarned += state.pending.reward;
    state.history.push(state.pending);
    state.phase = "result";
    return true;
  }

  function endReason(state) {
    if (state.history.length >= state.scenario.cases.length) return "completed";
    if (state.wallet < state.scenario.config.entryFee) return "bankrupt";
    return null;
  }

  function next(state) {
    if (state.phase !== "result") return false;
    var reason = endReason(state);
    if (reason) {
      state.phase = "finished";
      state.reason = reason;
    } else {
      state.index += 1;
      state.pending = null;
      state.phase = "locked";
    }
    return true;
  }

  function quit(state) {
    if (state.phase === "finished") return false;
    // A ballot already cast counts even if the player skips its presentation.
    // Quitting after payment but before a ballot retains that one entry fee.
    if (state.phase === "voting") settle(state);
    state.phase = "finished";
    state.reason = endReason(state) || "quit";
    return true;
  }

  function summary(state) {
    var history = state.history;
    var agreements = history.filter(function (result) { return result.agreed; }).length;
    var refunds = history.filter(function (result) { return result.playerVote === "refund"; }).length;
    var majorityRefunds = history.filter(function (result) { return result.majority === "refund"; }).length;
    var benchmarkAgreements = history.filter(function (result) { return result.benchmarkMatch; }).length;
    var majorityBenchmarkDisagreements = history.filter(function (result) {
      return result.majority !== result.benchmark;
    }).length;
    return freeze({
      startingTokens: state.scenario.config.startTokens,
      finalTokens: state.wallet,
      net: state.wallet - state.scenario.config.startTokens,
      casesJudged: history.length,
      agreements: agreements,
      disagreements: history.length - agreements,
      agreementRate: history.length ? agreements / history.length : null,
      refundVotes: refunds,
      rejectVotes: history.length - refunds,
      majorityRefunds: majorityRefunds,
      majorityRejects: history.length - majorityRefunds,
      benchmarkAgreements: benchmarkAgreements,
      majorityBenchmarkDisagreements: majorityBenchmarkDisagreements,
      feesPaid: state.feesPaid,
      rewardsEarned: state.rewardsEarned,
      unvotedFees: state.feesPaid - (history.length + (state.phase === "voting" ? 1 : 0)) * state.scenario.config.entryFee,
      reason: state.reason
    });
  }

  return freeze({
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    validateConfig: validateConfig,
    createRng: createRng,
    benchmarkVote: benchmarkVote,
    drawJuror: drawJuror,
    generateScenario: generateScenario,
    createSession: createSession,
    join: join,
    castVote: castVote,
    settle: settle,
    next: next,
    quit: quit,
    summary: summary
  });
});
