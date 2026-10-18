/* Browser presentation only. The deterministic model lives in engine.js. */
(function () {
  'use strict';
  var E = window.DispatchEngine;
  var app = document.getElementById('app');
  var status = document.getElementById('status');
  var soundButton = document.getElementById('sound');
  var nodes = Object.create(null), codes = Object.create(null), counts = { restaurant: 0, customer: 0 };
  E.NODES.forEach(function (node) {
    nodes[node.id] = node;
    codes[node.id] = node.kind === 'restaurant' ? String.fromCharCode(65 + counts.restaurant++) :
      node.kind === 'customer' ? 'H' + (++counts.customer) : '⌂';
  });
  var settings = { duration: 60, seed: freshSeed() };
  var query = new URLSearchParams(window.location.search);
  if ([60, 180, 300].indexOf(Number(query.get('duration'))) >= 0) settings.duration = Number(query.get('duration'));
  if (query.get('seed') && validSeed(query.get('seed'))) settings.seed = query.get('seed');
  var state = 'welcome', game = null, scenario = null, baseline = null;
  var paused = false, countdown = 3, lastFrame = null, frameId = null, lastSerial = 0, lastPaint = -1;
  var sound = false, audioContext = null, metrics, notices = [], effects = [], refs = {}, cards = new Map();

  function freshSeed() {
    var bytes = new Uint32Array(1);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else bytes[0] = Date.now();
    return 'DASH-' + bytes[0].toString(36).toUpperCase();
  }
  function validSeed(value) { return /^[A-Za-z0-9_-]{1,32}$/.test(value); }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function setText(element, value) { if (element && element.textContent !== String(value)) element.textContent = value; }
  function announce(text) { setText(status, text); }
  function focusHeading() { var heading = app.querySelector('h1'); if (heading) heading.focus({ preventScroll: false }); }
  function timeText(seconds) { var value = Math.max(0, Math.ceil(seconds)); return Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0'); }
  function signed(value) { return value > 0 ? '+' + value : String(value); }
  function place(id) { return codes[id] + ' · ' + nodes[id].label; }
  function stopLoop() { if (frameId !== null) cancelAnimationFrame(frameId); frameId = null; lastFrame = null; }
  function steps() {
    return '<div class="teach-strip"><article><span class="teach-icon orange" aria-hidden="true">↗</span><div><h2>Choose a pickup</h2><p>Tap an amber restaurant. Your courier follows the roads.</p></div></article>' +
      '<article><span class="teach-icon" aria-hidden="true">▣</span><div><h2>Pack your bag</h2><p>Collect individual orders, or quick-pick the earliest due. Carry up to three.</p></div></article>' +
      '<article><span class="teach-icon blue" aria-hidden="true">⌂</span><div><h2>Beat each deadline</h2><p>Tap a customer. Deliveries happen on arrival: +1 on time, −1 missed.</p></div></article></div>';
  }

  function welcome(newChallenge) {
    stopLoop(); state = 'welcome'; paused = false; app.classList.remove('game-paused');
    if (newChallenge) { settings.seed = freshSeed(); baseline = null; }
    app.innerHTML = '<section class="welcome"><div><p class="eyebrow">A LITTLE CITY. A LOT OF DECISIONS.</p>' +
      '<h1 tabindex="-1">Dispatch<br><em>Dash!</em></h1><div class="clock-line">BEAT THE CLOCK!</div>' +
      '<p class="lead">One courier. Three bag slots.<br>How many orders can you deliver on time?</p>' +
      '<p class="duration-label" id="duration-label">Choose your shift</p><div class="mode-picker" role="group" aria-labelledby="duration-label">' +
      [60, 180, 300].map(function (duration, i) { return '<button class="mode-button" id="mode-' + duration + '" data-duration="' + duration + '" aria-pressed="' + (duration === settings.duration) + '"><strong>' + duration / 60 + ' min</strong><span>' + ['A quick spin', 'Find your rhythm', 'The long ride'][i] + '</span></button>'; }).join('') +
      '</div><button class="button primary" data-action="tutorial">Let’s ride <span aria-hidden="true">↗</span></button>' +
      '<p class="intro-note">A fictional routing challenge. No account needed.</p><div class="pill-row"><span>Tap or click to route</span><span>Sound off by default</span><span>Pause anytime</span></div></div>' +
      '<div class="welcome-art" aria-hidden="true"><div class="art-label">YOUR NEIGHBOURHOOD <span>READY TO ROLL ↗</span></div><div class="preview-map"><img class="city-image" src="assets/city.svg" alt="" width="960" height="680"><img class="preview-rider" src="assets/courier.svg" alt="" width="120" height="108"><div class="preview-pin pick">Order up! <span>Pick up at the café</span></div><div class="preview-pin drop">Knock, knock. <span>One happy customer</span></div></div><div class="art-note"><div>Every turn is a trade-off.<br><small>A short route isn’t always the right route.</small></div><b>+1</b></div></div></section>' +
      steps() + '<details class="setup-details"><summary>Play a specific challenge</summary><form id="seed-form" class="seed-form"><label for="seed-input">Challenge code</label><input id="seed-input" name="seed" value="' + escapeHTML(settings.seed) + '" maxlength="32" pattern="[A-Za-z0-9_-]{1,32}" required autocomplete="off" spellcheck="false"><button class="button small" type="submit">Use code</button></form><p class="seed-note">Use the same code and shift length to repeat exactly the same arrivals and deadlines.</p></details>';
  }

  function tutorial() {
    state = 'tutorial';
    app.innerHTML = '<section class="tutorial"><p class="eyebrow">YOUR FIRST DELIVERY, IN THREE STEPS</p><h1 tabindex="-1">Ready to roll?</h1>' + steps() +
      '<p class="tip-note"><strong>Watch each order’s clock.</strong> Two orders from the same restaurant can have different customers and deadlines. You choose what to collect; you can change destination while riding.</p>' +
      '<p class="seed-note">The timer pauses when you leave this tab. The final ' + E.CONFIG.clearingSeconds + ' seconds have no new orders, so you can clear your queue. Missed orders leave with a backup courier.</p>' +
      '<div class="actions"><button class="button primary" data-action="start">Start ' + settings.duration / 60 + '-minute shift <span aria-hidden="true">→</span></button><button class="text-button" data-action="setup">Change shift</button></div></section>';
    focusHeading();
  }

  function startRun(replay) {
    stopLoop();
    if (!replay || !scenario) { scenario = E.createScenario(settings.seed, settings.duration); baseline = null; }
    game = E.createGame(scenario); state = 'countdown'; paused = false; countdown = 3; lastSerial = 0; lastPaint = -1;
    metrics = { maxBag: 0, batches: 0, reroutes: 0 }; notices = []; effects = []; cards.clear();
    app.classList.remove('game-paused');
    app.innerHTML = '<div class="game-heading"><div><h1 tabindex="-1">Dispatch <em>Dash!</em></h1><p class="game-subtitle">BEAT THE CLOCK · ' + settings.duration / 60 + '-MINUTE SHIFT</p></div><div class="actions"><button id="pause" class="quiet-button" data-action="pause">Pause</button><button class="quiet-button" data-action="restart">Restart</button></div></div>' +
      '<div class="scoreboard" aria-label="Shift statistics"><div class="stat time-stat"><span>Time left</span><strong id="time">' + timeText(settings.duration) + '</strong><div class="time-bar"><span id="time-fill"></span></div></div>' +
      [['score', 'Score', '0'], ['waiting', 'Waiting', '0'], ['bag', 'In your bag', '0 / 3'], ['delivered', 'Delivered', '0'], ['missed', 'Missed', '0']].map(function (stat) { return '<div class="stat"><span>' + stat[1] + '</span><strong id="' + stat[0] + '">' + stat[2] + '</strong></div>'; }).join('') + '</div>' +
      '<div class="play-layout"><div id="map-side"><section class="map-card" aria-label="Neighbourhood road map"><div class="map-top"><span>YOUR NEIGHBOURHOOD</span><span class="weather" id="shift-phase">Orders are coming in ☀</span></div><div class="map-canvas">' +
      '<img class="city-image" src="assets/city.svg" width="960" height="680" alt="A small neighbourhood with a grid of connected roads, cafés, homes and a park.">' +
      '<svg class="route-svg" viewBox="0 0 960 680" aria-hidden="true"><polyline id="route-shadow" class="route-shadow"></polyline><polyline id="route" class="route-line"></polyline></svg>' +
      E.NODES.filter(function (node) { return node.kind !== 'junction'; }).map(function (node) {
        return '<button type="button" id="stop-' + node.id + '" class="map-stop ' + node.kind + '" data-node="' + node.id + '" style="left:' + node.x / 9.6 + '%;top:' + node.y / 6.8 + '%" aria-label="Go to ' + escapeHTML(place(node.id)) + '"><span class="stop-icon" aria-hidden="true">' + codes[node.id] + '</span><span class="stop-count" aria-hidden="true"></span><span class="stop-deadline" aria-hidden="true"></span><span class="stop-name" aria-hidden="true">' + escapeHTML(node.label) + '</span></button>';
      }).join('') +
      '<div id="courier" class="courier" aria-hidden="true"><div id="courier-facing"><img src="assets/courier.svg" alt="" width="120" height="108"></div></div><div id="map-effects" class="map-effects" aria-hidden="true"></div></div>' +
      '<div class="map-legend"><span><i class="legend-square"></i>A–E: collect at restaurants</span><span><i class="legend-circle"></i>H1–H9: deliver to homes</span><span>Badge = active orders · Clock = earliest due</span></div><div id="notice-feed" class="notice-feed" aria-hidden="true"></div></section>' +
      '<section class="dispatch-dock" aria-label="Courier controls"><div class="location-line"><div><span id="location-kind">Currently at</span><strong id="location">Courier Depot</strong></div><span id="bag-pill" class="bag-pill">Bag 0 / 3</span></div><div class="dock-actions"><p id="dock-help">Tap a restaurant with waiting orders to begin.</p><button id="quick-pickup" class="button small primary" data-action="quick" disabled>Quick pickup</button></div></section>' +
      '<details class="hint-panel" id="hints"><summary>Need a routing hint?</summary><div class="hint-list"><button id="hint-near" class="text-button" data-hint="near"></button><button id="hint-due" class="text-button" data-hint="due"></button><p id="hint-batch"></p><p>These are suggestions, not a planned route. Distance, batching and urgency can point in different directions.</p></div></details></div>' +
      '<aside id="orders-panel" class="orders-panel" aria-label="Order list"><h2>Your dispatch board</h2><p class="orders-note">Each parcel has its own customer and deadline.</p><details class="order-group" open><summary id="carried-label">In your bag (0 / 3)</summary><div class="group-list" id="carried-list"></div><p class="empty-list" id="carried-empty">Your bag is empty. Collect at a restaurant.</p></details><details class="order-group" open><summary id="waiting-label">Waiting for pickup (0)</summary><div class="group-list" id="waiting-list"></div><p class="empty-list" id="waiting-empty">No orders waiting right now.</p></details><details class="order-group"><summary id="history-label">Resolved (0)</summary><div id="history-list"></div></details></aside>' +
      '<div id="game-layer" class="game-layer"><div class="layer-card" id="layer-content"></div></div></div>';
    refs = {};
    ['time', 'time-fill', 'score', 'waiting', 'bag', 'delivered', 'missed', 'courier', 'courier-facing', 'route', 'route-shadow', 'location', 'location-kind', 'bag-pill', 'dock-help', 'quick-pickup', 'shift-phase', 'carried-list', 'waiting-list', 'history-list', 'carried-empty', 'waiting-empty', 'carried-label', 'waiting-label', 'history-label', 'game-layer', 'layer-content', 'notice-feed', 'map-effects', 'map-side', 'orders-panel', 'pause', 'hint-near', 'hint-due', 'hint-batch'].forEach(function (id) { refs[id] = $(id); });
    refs.markers = {};
    E.NODES.filter(function (node) { return node.kind !== 'junction'; }).forEach(function (node) {
      var el = $('stop-' + node.id); refs.markers[node.id] = { el: el, count: el.querySelector('.stop-count'), clock: el.querySelector('.stop-deadline') };
    });
    paint(game.snapshot(), true); updateLayer(); focusHeading(); announce('Your shift starts in three seconds.');
    if (document.hidden) setPaused(true, 'hidden');
    frameId = requestAnimationFrame(frame);
  }

  function updateLayer(reason) {
    var blocking = paused || state === 'countdown';
    refs['game-layer'].hidden = !blocking;
    refs['map-side'].inert = blocking; refs['orders-panel'].inert = blocking;
    app.classList.toggle('game-paused', blocking);
    setText(refs.pause, paused ? 'Resume' : 'Pause');
    if (paused) {
      refs['layer-content'].innerHTML = '<p class="eyebrow">TAKE A BREATHER</p><h2>Shift paused.</h2><p>' + (reason === 'hidden' ? 'You left the tab, so we stopped the clock. ' : '') + 'Your orders and deadlines will wait.</p><div class="actions"><button class="button primary" data-action="resume">Resume shift →</button></div>';
    } else if (state === 'countdown') {
      refs['layer-content'].innerHTML = '<p class="eyebrow">YOUR SHIFT STARTS IN</p><div class="count-number" id="count-number">' + Math.ceil(countdown) + '</div><h2>Get your bearings.</h2><p>Amber squares are restaurants.<br>Green circles are customers.</p>';
    }
  }
  function setPaused(value, reason) {
    if (state !== 'playing' && state !== 'countdown') return;
    paused = value; lastFrame = null; updateLayer(reason);
    announce(value ? 'Shift paused. The clock and deadlines are stopped.' : 'Shift resumed.');
    if (value && reason !== 'hidden') refs['layer-content'].querySelector('button').focus();
    if (!value) refs.pause.focus({ preventScroll: true });
  }

  function frame(timestamp) {
    var delta = lastFrame === null ? 0 : Math.max(0, (timestamp - lastFrame) / 1000);
    lastFrame = timestamp;
    if (!paused && !document.hidden) {
      if (state === 'countdown') {
        var before = Math.ceil(countdown); countdown -= delta;
        if (countdown <= 0) { state = 'playing'; updateLayer(); announce('Go! Choose a restaurant and collect your first orders.'); processEvents(game.snapshot()); }
        else if (Math.ceil(countdown) !== before) { setText($('count-number'), Math.ceil(countdown)); announce(String(Math.ceil(countdown))); }
      } else if (state === 'playing') {
        game.advance(delta);
        var snap = game.snapshot(); processEvents(snap); paint(snap, false);
        if (snap.ended) { finish(snap); return; }
      }
    }
    if (state === 'playing' || state === 'countdown') frameId = requestAnimationFrame(frame);
  }

  function paint(snap, force) {
    refs.courier.style.left = snap.rider.x / 9.6 + '%'; refs.courier.style.top = snap.rider.y / 6.8 + '%';
    refs.courier.classList.toggle('moving', Boolean(snap.rider.destination));
    if (snap.rider.route.length > 1 && snap.rider.route[1].x !== snap.rider.x) refs['courier-facing'].style.transform = snap.rider.route[1].x < snap.rider.x ? 'scaleX(-1)' : '';
    var points = snap.rider.route.map(function (point) { return point.x + ',' + point.y; }).join(' ');
    refs.route.setAttribute('points', points); refs['route-shadow'].setAttribute('points', points);
    if (!force && snap.time - lastPaint < .1) return;
    lastPaint = snap.time;
    setText(refs.time, timeText(snap.duration - snap.time)); refs['time-fill'].style.width = Math.max(0, (1 - snap.time / snap.duration) * 100) + '%';
    setText(refs.score, signed(snap.score)); setText(refs.waiting, snap.waiting); setText(refs.bag, snap.carried.length + ' / 3'); setText(refs.delivered, snap.delivered); setText(refs.missed, snap.missed);
    metrics.maxBag = Math.max(metrics.maxBag, snap.carried.length);
    setText(refs['shift-phase'], snap.time >= snap.clearingAt ? 'Final stretch · no new orders' : 'Orders are coming in ☀');
    setText(refs['location-kind'], snap.rider.destination ? 'Riding to · ' + game.estimateTravel(snap.rider.destination).seconds.toFixed(1) + 's away' : 'Currently at');
    setText(refs.location, place(snap.rider.destination || snap.rider.node || E.CONFIG.depot));
    setText(refs['bag-pill'], 'Bag ' + snap.carried.length + ' / 3');
    var here = snap.orders.filter(function (order) { return order.status === 'waiting' && order.pickup === snap.rider.node; });
    var room = 3 - snap.carried.length;
    refs['quick-pickup'].disabled = !here.length || room === 0;
    setText(refs['quick-pickup'], here.length && room ? 'Quick pickup · ' + Math.min(here.length, room) : 'Quick pickup');
    setText(refs['dock-help'], here.length ? (room ? 'Choose individual parcels on the board, or collect the earliest deadlines here.' : 'Your bag is full. Deliver an order to make room.') : snap.carried.length ? 'Tap a green delivery stop. Orders are handed over automatically on arrival.' : 'Tap an amber restaurant with a badge, then collect your orders.');
    Object.keys(refs.markers).forEach(function (id) {
      var marker = refs.markers[id];
      var relevant = snap.orders.filter(function (order) { return order.status === 'waiting' && order.pickup === id || order.status === 'carried' && order.dropoff === id; });
      var remaining = relevant.length ? Math.max(0, Math.ceil(Math.min.apply(Math, relevant.map(function (order) { return order.deadline; })) - snap.time)) : null;
      setText(marker.count, relevant.length || ''); setText(marker.clock, remaining === null ? '' : remaining + 's');
      marker.clock.classList.toggle('urgent', remaining !== null && remaining <= 7);
      marker.el.classList.toggle('has-pickup', relevant.length > 0 && nodes[id].kind === 'restaurant'); marker.el.classList.toggle('has-delivery', relevant.length > 0 && nodes[id].kind === 'customer');
      marker.el.classList.toggle('selected', snap.rider.destination === id);
      marker.el.setAttribute('aria-label', 'Go to ' + place(id) + (relevant.length ? ', ' + relevant.length + (nodes[id].kind === 'restaurant' ? ' waiting' : ' to deliver') + ', earliest deadline in ' + remaining + ' seconds' : ''));
    });
    updateOrders(snap); updateHints(snap);
    notices = notices.filter(function (notice) { return notice.until > snap.time; });
    var noticeHTML = notices.slice(-2).map(function (notice) { return '<span class="notice-chip' + (notice.bad ? ' bad' : '') + '">' + escapeHTML(notice.text) + '</span>'; }).join('');
    if (refs['notice-feed'].innerHTML !== noticeHTML) refs['notice-feed'].innerHTML = noticeHTML;
    effects = effects.filter(function (effect) { if (effect.until <= snap.time) { effect.el.remove(); return false; } return true; });
  }

  function updateOrders(snap) {
    var visible = new Set();
    snap.orders.filter(function (order) { return order.status === 'waiting' || order.status === 'carried'; }).sort(function (a, b) { return a.deadline - b.deadline || a.id.localeCompare(b.id); }).forEach(function (order) {
      visible.add(order.id);
      var card = cards.get(order.id);
      if (!card) {
        var el = document.createElement('article'); el.className = 'order-card'; el.setAttribute('aria-label', 'Order ' + order.id);
        el.innerHTML = '<div class="order-top"><strong>' + order.id + '</strong><span class="deadline"></span></div><p class="order-route"><b>' + escapeHTML(place(order.pickup)) + '</b><br>↳ ' + escapeHTML(place(order.dropoff)) + '</p><p class="order-meta"></p><button class="button" data-order="' + order.id + '"></button>';
        card = { el: el, clock: el.querySelector('.deadline'), meta: el.querySelector('.order-meta'), button: el.querySelector('button') }; cards.set(order.id, card);
      }
      var carried = order.status === 'carried';
      var parent = refs[carried ? 'carried-list' : 'waiting-list'];
      if (card.el.parentNode !== parent) {
        var restoreFocus = card.el.contains(document.activeElement);
        parent.appendChild(card.el);
        if (restoreFocus) { parent.closest('details').open = true; card.button.focus({ preventScroll: true }); }
      }
      var remaining = Math.max(0, Math.ceil(order.deadline - snap.time));
      card.el.classList.toggle('carried', carried); card.el.classList.toggle('urgent', remaining <= 7);
      card.clock.classList.toggle('urgent', remaining <= 7); setText(card.clock, remaining + 's left');
      setText(card.meta, carried ? 'In your bag · automatic handoff on arrival' : 'Waiting at restaurant · pickup required');
      var atPickup = !carried && snap.rider.node === order.pickup;
      setText(card.button, carried ? 'Deliver ' + order.id + ' → ' + codes[order.dropoff] : atPickup ? 'Collect ' + order.id : 'Pickup ' + order.id + ' → ' + codes[order.pickup]);
      card.button.disabled = atPickup && snap.carried.length >= 3;
      card.button.setAttribute('aria-label', card.button.textContent + ', ' + remaining + ' seconds left');
    });
    cards.forEach(function (card, id) {
      if (!visible.has(id)) {
        // Keep keyboard focus in the board when an order resolves or expires.
        if (card.el.contains(document.activeElement)) refs.pause.focus({ preventScroll: true });
        card.el.remove(); cards.delete(id);
      }
    });
    setText(refs['carried-label'], 'In your bag (' + snap.carried.length + ' / 3)'); setText(refs['waiting-label'], 'Waiting for pickup (' + snap.waiting + ')');
    refs['carried-empty'].hidden = snap.carried.length > 0; refs['waiting-empty'].hidden = snap.waiting > 0;
    var history = snap.orders.filter(function (order) { return order.status === 'delivered' || order.status === 'missed'; });
    setText(refs['history-label'], 'Resolved (' + history.length + ')');
    if (refs['history-list'].childElementCount !== history.length) refs['history-list'].innerHTML = history.slice().sort(function (a, b) { return b.resolvedAt - a.resolvedAt; }).map(function (order) { return '<div class="history-row ' + order.status + '"><span>' + order.id + ' · ' + (order.status === 'delivered' ? 'Delivered' : 'Backup courier') + '</span><strong>' + (order.status === 'delivered' ? '+1' : '−1') + '</strong></div>'; }).join('');
  }

  function updateHints(snap) {
    var waiting = snap.orders.filter(function (order) { return order.status === 'waiting'; });
    var active = snap.orders.filter(function (order) { return order.status === 'waiting' || order.status === 'carried'; });
    var nearest = waiting.slice().sort(function (a, b) { return game.estimateTravel(a.pickup).seconds - game.estimateTravel(b.pickup).seconds; })[0];
    var due = active.filter(function (order) { return snap.carried.length < 3 || order.status === 'carried'; }).sort(function (a, b) { return a.deadline - b.deadline; })[0];
    refs['hint-near'].disabled = !nearest || snap.carried.length >= 3; refs['hint-due'].disabled = !due;
    refs['hint-near'].dataset.nodeTarget = nearest ? nearest.pickup : '';
    refs['hint-due'].dataset.nodeTarget = due ? (due.status === 'carried' ? due.dropoff : due.pickup) : '';
    setText(refs['hint-near'], nearest ? 'Nearest pickup: ' + place(nearest.pickup) + ' · ' + game.estimateTravel(nearest.pickup).seconds.toFixed(1) + 's ride' + (snap.carried.length >= 3 ? ' (bag full)' : '') : 'No pickups waiting.');
    setText(refs['hint-due'], due ? (snap.carried.length === 3 ? 'Bag full · earliest carried deadline: ' : 'Earliest deadline: ') + due.id + ' · ' + Math.max(0, Math.ceil(due.deadline - snap.time)) + 's left → ' + codes[due.status === 'carried' ? due.dropoff : due.pickup] : 'No active deadlines.');
    var batch = waiting.find(function (order) { return waiting.filter(function (item) { return item.pickup === order.pickup; }).length >= 2; });
    setText(refs['hint-batch'], batch ? 'Batching opportunity: ' + nodes[batch.pickup].label + ' has multiple orders. Compare their destinations and deadlines before filling your bag.' : 'No shared pickup right now. Carrying extra orders only helps if the detour fits their deadlines.');
  }

  function routeTo(nodeId) {
    var snap = game.snapshot();
    if (snap.rider.destination && snap.rider.destination !== nodeId) metrics.reroutes += 1;
    if (game.goTo(nodeId)) announce('Riding to ' + nodes[nodeId].label + '.');
    paint(game.snapshot(), true);
  }
  function collect(ids) {
    var quickFocused = document.activeElement === refs['quick-pickup'];
    var accepted = ids ? game.pickup(ids) : game.quickPickup();
    if (accepted.length >= 2) metrics.batches += 1;
    var snap = game.snapshot(); processEvents(snap); paint(snap, true);
    if (quickFocused && refs['quick-pickup'].disabled && accepted.length) {
      refs['carried-list'].closest('details').open = true;
      cards.get(accepted[0]).button.focus({ preventScroll: true });
    }
    if (accepted.length) announce('Collected ' + accepted.join(', ') + '. Bag ' + snap.carried.length + ' of 3. Choose a customer.');
  }
  function processEvents(snap) {
    var latest = [];
    snap.events.filter(function (event) { return event.serial > lastSerial; }).forEach(function (event) {
      lastSerial = event.serial;
      var text = '';
      if (event.type === 'arrival') {
        text = event.orderId + ' ready at ' + codes[event.node] + ' · ' + nodes[event.node].label;
        var marker = refs.markers[event.node].el; marker.classList.add('fresh'); setTimeout(function () { marker.classList.remove('fresh'); }, 450);
      } else if (event.type === 'pickup') {
        refs.courier.classList.add('loading'); var courier = refs.courier; setTimeout(function () { courier.classList.remove('loading'); }, 450);
      } else if (event.type === 'delivered' || event.type === 'missed') {
        text = event.type === 'delivered' ? '+1 · ' + event.orderId + ' delivered!' : '−1 · ' + event.orderId + ' missed. Backup courier took over.';
        var point = event.type === 'delivered' ? nodes[event.node] : snap.rider;
        var popup = document.createElement('span'); popup.className = 'score-pop' + (event.type === 'missed' ? ' bad' : ''); popup.textContent = event.type === 'delivered' ? '+1' : '−1';
        popup.style.left = point.x / 9.6 + '%'; popup.style.top = point.y / 6.8 + '%'; refs['map-effects'].appendChild(popup); effects.push({ el: popup, until: snap.time + 1.8 });
      } else if (event.type === 'stop') {
        latest.push('Arrived at ' + nodes[event.node].label + '.');
      }
      if (text) { notices.push({ text: text, until: snap.time + 5, bad: event.type === 'missed' }); latest.push(text); }
      if (event.type === 'delivered' || event.type === 'missed' || event.type === 'pickup') tone(event.type);
    });
    if (latest.length) announce(latest.join(' '));
  }

  function result(snap) {
    return { score: snap.score, delivered: snap.delivered, missed: snap.missed, total: snap.orders.length, rate: Math.round(snap.onTimeRate * 100), distance: Math.round(snap.totalDistance), average: snap.delivered ? Math.round(snap.totalDistance / snap.delivered) : null };
  }
  function finish(snap) {
    stopLoop(); state = 'summary'; paused = false; app.classList.remove('game-paused');
    var now = result(snap);
    var stats = [[now.total, 'Orders generated', 'Every order resolved exactly once'], [now.delivered, 'Delivered on time', '+1 point each'], [now.missed, 'Missed deadlines', '−1 point each'], [now.rate + '%', 'On-time rate', 'Delivered ÷ all generated orders'], [now.distance.toLocaleString(), 'Distance travelled', 'Illustrative map units'], [now.average === null ? '—' : now.average.toLocaleString(), 'Distance per delivery', now.average === null ? 'Undefined: no completed deliveries' : 'Total distance ÷ completed deliveries']];
    var missedCarried = snap.orders.filter(function (order) { return order.status === 'missed' && order.pickedUpAt !== undefined; }).length;
    app.innerHTML = '<section class="result-head"><p class="eyebrow">SHIFT COMPLETE · TAKE A BREATHER</p><div class="big-score"><strong>' + signed(now.score) + '</strong><span>FINAL SCORE</span></div><h1 tabindex="-1">Small city.<br><em>Big decisions.</em></h1><p>' + now.delivered + ' on-time deliveries − ' + now.missed + ' missed deadlines = ' + signed(now.score) + ' points.</p></section>' +
      '<div class="result-grid">' + stats.map(function (stat) { return '<div class="result-stat"><strong>' + stat[0] + '</strong><span>' + stat[1] + '</span><small>' + stat[2] + '</small></div>'; }).join('') + '</div>' +
      '<section class="insights"><h2>What did this ride reveal?</h2><p>' + (now.delivered ? 'You completed ' + now.delivered + ' deliveries while travelling ' + now.distance.toLocaleString() + ' map units. A nearby pickup can save distance, but an urgent delivery may deserve the next turn.' : 'No deliveries were completed this time. Try collecting at an amber restaurant, then heading straight to that order’s customer before its timer runs out.') + '</p>' +
      '<p>' + (metrics.batches ? 'You collected multiple orders together ' + metrics.batches + ' time' + (metrics.batches === 1 ? '' : 's') + '. Shared pickups can save a return trip; different customer destinations can still create costly detours.' : 'Your fullest bag held ' + metrics.maxBag + ' of 3 parcels. Collecting compatible orders together may save a return trip, but filling every slot is not always best.') + '</p>' +
      '<p>' + (missedCarried ? missedCarried + ' missed order' + (missedCarried === 1 ? ' was' : 's were') + ' already in your bag. Before adding another parcel, compare the detour with the deadlines you have already accepted.' : now.missed ? 'Your missed orders expired before pickup. Not every request may fit your route: compare reachability and deadlines before setting off.' : 'Every order made its deadline. Replay the same arrivals and see whether you can keep that service level while travelling less.') + '</p><p class="seed-note">This is a fictional teaching game about dynamic routing, batching and deadlines. It is not calibrated to a real platform or based on unpublished research.</p></section>' +
      (baseline ? comparison(baseline, now) : '') +
      '<div class="actions result-actions"><button class="button primary" data-action="replay">Replay the same challenge ↻</button><button class="button" data-action="new">Try a new challenge →</button><a class="button" href="../../index.html#lab">Back to the website</a></div><p class="result-code">Challenge <code>' + escapeHTML(settings.seed) + '</code> · ' + settings.duration / 60 + (settings.duration === 60 ? ' minute' : ' minutes') + '. Same code + same duration = same orders.</p>';
    if (!baseline) baseline = now;
    announce('Shift complete. Final score ' + now.score + '. ' + now.delivered + ' delivered, ' + now.missed + ' missed.'); focusHeading();
  }
  function comparison(first, now) {
    var rows = [['Score', signed(first.score), signed(now.score)], ['Delivered', first.delivered, now.delivered], ['Missed', first.missed, now.missed], ['On-time rate', first.rate + '%', now.rate + '%'], ['Distance (map units)', first.distance, now.distance], ['Distance / delivery', first.average === null ? '—' : first.average, now.average === null ? '—' : now.average]];
    return '<section class="comparison"><h2>Same city. A different strategy?</h2><p>Identical arrivals, customers and deadlines. Compare this ride with your first completed attempt.</p><table><thead><tr><th scope="col">Measure</th><th scope="col">First ride</th><th scope="col">This ride</th></tr></thead><tbody>' + rows.map(function (row) { return '<tr><th scope="row">' + row[0] + '</th><td>' + row[1] + '</td><td>' + row[2] + '</td></tr>'; }).join('') + '</tbody></table><p>Less distance is useful when you maintain service. A short ride with fewer deliveries is not necessarily an improvement.</p></section>';
  }

  function tone(type) {
    if (!sound || !audioContext || document.hidden || paused) return;
    try {
      var oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = type === 'missed' ? 180 : type === 'delivered' ? 660 : 440;
      var at = audioContext.currentTime; gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(.035, at + .015); gain.gain.exponentialRampToValueAtTime(.0001, at + .14);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(at); oscillator.stop(at + .15);
    } catch (_) { /* Audio is optional; never interrupt a shift. */ }
  }
  soundButton.addEventListener('click', function () {
    if (!sound) {
      var Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { announce('Sound is unavailable in this browser. The game remains fully playable.'); return; }
      try { if (!audioContext) audioContext = new Audio(); audioContext.resume().catch(function () {}); } catch (_) { announce('Sound could not be enabled.'); return; }
    }
    sound = !sound; soundButton.setAttribute('aria-pressed', String(sound)); setText(soundButton, 'Sound: ' + (sound ? 'On' : 'Off')); if (sound) tone('pickup');
  });

  app.addEventListener('submit', function (event) {
    if (event.target.id !== 'seed-form') return;
    event.preventDefault(); var seed = $('seed-input').value.trim();
    if (!validSeed(seed)) { announce('Use 1 to 32 letters, numbers, underscores or hyphens.'); return; }
    settings.seed = seed; baseline = null; announce('Challenge ' + seed + ' selected for a ' + settings.duration / 60 + '-minute shift.');
    setText(event.target.querySelector('button'), 'Code selected ✓');
  });
  app.addEventListener('click', function (event) {
    var button = event.target.closest('button'); if (!button || button.disabled) return;
    if (button.dataset.duration) {
      settings.duration = Number(button.dataset.duration); baseline = null;
      app.querySelectorAll('[data-duration]').forEach(function (item) { item.setAttribute('aria-pressed', String(Number(item.dataset.duration) === settings.duration)); }); return;
    }
    var action = button.dataset.action;
    if (action === 'tutorial') { var input = $('seed-input'); if (input && validSeed(input.value.trim())) settings.seed = input.value.trim(); tutorial(); }
    else if (action === 'setup') { welcome(false); focusHeading(); }
    else if (action === 'start') startRun(false);
    else if (action === 'restart' || action === 'replay') startRun(true);
    else if (action === 'new') { welcome(true); focusHeading(); }
    else if (action === 'pause') setPaused(!paused, 'manual');
    else if (action === 'resume') setPaused(false, 'manual');
    else if (state === 'playing' && !paused && !document.hidden) {
      if (action === 'quick') collect();
      else if (button.dataset.node) routeTo(button.dataset.node);
      else if (button.dataset.hint && button.dataset.nodeTarget) routeTo(button.dataset.nodeTarget);
      else if (button.dataset.order) {
        var snap = game.snapshot(); var order = snap.orders.find(function (item) { return item.id === button.dataset.order; });
        if (!order || (order.status !== 'waiting' && order.status !== 'carried')) return;
        if (order.status === 'waiting' && snap.rider.node === order.pickup) collect([order.id]);
        else routeTo(order.status === 'carried' ? order.dropoff : order.pickup);
      }
    }
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) setPaused(true, 'hidden'); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && (state === 'playing' || state === 'countdown')) { event.preventDefault(); setPaused(!paused, 'manual'); } });
  welcome(false);
}());
