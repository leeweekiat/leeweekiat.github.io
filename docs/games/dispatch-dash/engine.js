/* Dispatch Dash: deterministic routing and deadline model. No DOM, clock or network. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DispatchEngine = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function freeze(value) {
    Object.keys(value).forEach(function (key) {
      if (value[key] && typeof value[key] === 'object') freeze(value[key]);
    });
    return Object.freeze(value);
  }

  var CONFIG = freeze({
    capacity: 3,
    durations: [60, 180, 300],
    defaultDuration: 60,
    speed: 100,
    distanceUnit: 'map units',
    clearingSeconds: 38,
    // Base draw and route minimums stay unchanged; grace is added afterward.
    deadlineMin: 12,
    deadlineMax: 35,
    deadlineGraceSeconds: 3,
    initialBurst: 2,
    burstProbability: 0.26,
    shortArrivalGap: [5, 6.2],
    longArrivalGap: [7, 9],
    arrivalIntervalMultiplier: 1.8,
    depot: 'n16'
  });
  var EPSILON = 1e-9;
  var special = {
    n0: ['Acorn Café', 'restaurant'],
    n3: ['Noodle Corner', 'restaurant'],
    n6: ['Pepper Kitchen', 'restaurant'],
    n12: ['Sunshine Deli', 'restaurant'],
    n19: ['Riverside Bakes', 'restaurant'],
    n2: ['Maple House', 'customer'],
    n4: ['Hilltop Flats', 'customer'],
    n7: ['Garden Court', 'customer'],
    n10: ['Willow House', 'customer'],
    n11: ['Park Apartments', 'customer'],
    n13: ['Market Lofts', 'customer'],
    n15: ['Canal House', 'customer'],
    n17: ['Sunset Court', 'customer'],
    n18: ['River Apartments', 'customer'],
    n16: ['Courier Depot', 'depot']
  };
  var NODES = freeze(Array.from({ length: 20 }, function (_, index) {
    var id = 'n' + index;
    return {
      id: id, x: 80 + (index % 5) * 200, y: 90 + Math.floor(index / 5) * 170,
      label: special[id] ? special[id][0] : 'Junction ' + (index + 1),
      kind: special[id] ? special[id][1] : 'junction'
    };
  }));
  var byId = Object.create(null);
  NODES.forEach(function (node) { byId[node.id] = node; });
  var roads = [];
  NODES.forEach(function (node, index) {
    if (index % 5 < 4) roads.push({ from: node.id, to: 'n' + (index + 1), distance: 200, seconds: 2 });
    if (index < 15) roads.push({ from: node.id, to: 'n' + (index + 5), distance: 170, seconds: 1.7 });
  });
  // Each entry describes one physical road; travel is allowed in both directions.
  var EDGES = freeze(roads);
  var neighbors = Object.create(null);
  NODES.forEach(function (node) { neighbors[node.id] = []; });
  EDGES.forEach(function (edge) {
    neighbors[edge.from].push({ id: edge.to, distance: edge.distance, seconds: edge.seconds });
    neighbors[edge.to].push({ id: edge.from, distance: edge.distance, seconds: edge.seconds });
  });

  function checkNode(id) {
    if (!byId[id]) throw new RangeError('Unknown road node: ' + id);
  }

  function shortestPath(from, to) {
    checkNode(from);
    checkNode(to);
    var costs = Object.create(null);
    var previous = Object.create(null);
    var visited = Object.create(null);
    NODES.forEach(function (node) { costs[node.id] = Infinity; });
    costs[from] = 0;
    for (var count = 0; count < NODES.length; count += 1) {
      var current = null;
      NODES.forEach(function (node) {
        if (!visited[node.id] && (current === null || costs[node.id] < costs[current] - EPSILON)) current = node.id;
      });
      if (current === null || !isFinite(costs[current])) break;
      if (current === to) break;
      visited[current] = true;
      neighbors[current].forEach(function (next) {
        var candidate = costs[current] + next.seconds;
        if (candidate < costs[next.id] - EPSILON) {
          costs[next.id] = candidate;
          previous[next.id] = current;
        }
      });
    }
    var route = [to];
    while (route[0] !== from) route.unshift(previous[route[0]]);
    return { nodes: route, distance: costs[to] * CONFIG.speed, seconds: costs[to] };
  }

  function randomFor(seed) {
    var state = 2166136261;
    for (var index = 0; index < seed.length; index += 1) {
      state ^= seed.charCodeAt(index);
      state = Math.imul(state, 16777619);
    }
    return function () {
      state += 0x6D2B79F5;
      var mixed = Math.imul(state ^ state >>> 15, 1 | state);
      mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, 61 | mixed);
      return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
    };
  }

  function rounded(value) { return Math.round(value * 1e6) / 1e6; }

  function createScenario(seed, durationSeconds) {
    var duration = durationSeconds === undefined ? CONFIG.defaultDuration : Number(durationSeconds);
    if (CONFIG.durations.indexOf(duration) < 0) throw new RangeError('Choose a 60, 180 or 300 second game.');
    var scenarioSeed = String(seed === undefined ? 'dispatch-dash' : seed);
    var random = randomFor(scenarioSeed + '|duration:' + duration);
    var restaurants = NODES.filter(function (node) { return node.kind === 'restaurant'; });
    var customers = NODES.filter(function (node) { return node.kind === 'customer'; });
    var clearingAt = duration - CONFIG.clearingSeconds;
    var orders = [];
    var time = 0;
    var lastPickup = restaurants[Math.floor(random() * restaurants.length)].id;
    var gap = duration === 60 ? CONFIG.shortArrivalGap : CONFIG.longArrivalGap;
    var wave = 0;
    while (time <= clearingAt + EPSILON) {
      var sameArea = restaurants.filter(function (node) { return shortestPath(lastPickup, node.id).seconds <= 6; });
      var choices = random() < 0.6 ? sameArea : restaurants;
      var pickup = choices[Math.floor(random() * choices.length)].id;
      var burst = time === 0 || (duration === 60 && wave === 1) ? CONFIG.initialBurst : (random() < CONFIG.burstProbability ? 2 : 1);
      for (var inBurst = 0; inBurst < burst; inBurst += 1) {
        var selectedPickup = time > 0 && inBurst > 0 && random() > 0.72 ? restaurants[Math.floor(random() * restaurants.length)].id : pickup;
        // Nearby customers are common, but longer trips keep batching and prioritization meaningful.
        var nearby = customers.filter(function (node) { return shortestPath(selectedPickup, node.id).seconds <= 6; });
        var destinations = random() < 0.7 ? nearby : customers;
        var dropoff = destinations[Math.floor(random() * destinations.length)].id;
        var directSeconds = shortestPath(selectedPickup, dropoff).seconds;
        var allowance = Math.max(CONFIG.deadlineMin + Math.floor(random() * (CONFIG.deadlineMax - CONFIG.deadlineMin + 1)), Math.ceil(directSeconds + 8));
        if (time === 0) allowance = Math.max(allowance, Math.ceil(shortestPath(CONFIG.depot, selectedPickup).seconds + directSeconds + 2));
        allowance += CONFIG.deadlineGraceSeconds;
        orders.push({
          id: 'O' + String(orders.length + 1).padStart(2, '0'),
          pickup: selectedPickup, dropoff: dropoff, appearsAt: rounded(time),
          deadline: rounded(Math.min(duration, time + allowance))
        });
      }
      lastPickup = pickup;
      wave += 1;
      time = rounded(time + (gap[0] + random() * (gap[1] - gap[0])) * CONFIG.arrivalIntervalMultiplier);
    }
    return freeze({ seed: scenarioSeed, duration: duration, clearingAt: clearingAt, orders: orders });
  }

  function Game(scenario) {
    if (!scenario || !Array.isArray(scenario.orders) || !Number.isFinite(scenario.duration) || scenario.duration <= 0) throw new TypeError('A valid scenario is required.');
    var seen = Object.create(null);
    this.orders = scenario.orders.map(function (order) {
      checkNode(order.pickup);
      checkNode(order.dropoff);
      if (!order.id || seen[order.id] || order.pickup === order.dropoff || !Number.isFinite(order.appearsAt) || !Number.isFinite(order.deadline) || order.appearsAt < 0 || order.deadline < order.appearsAt || order.deadline > scenario.duration || order.appearsAt > scenario.duration) throw new RangeError('Invalid or duplicate order: ' + order.id);
      seen[order.id] = true;
      return { id: order.id, pickup: order.pickup, dropoff: order.dropoff, appearsAt: order.appearsAt, deadline: order.deadline, status: 'future' };
    }).sort(function (a, b) { return a.appearsAt - b.appearsAt || String(a.id).localeCompare(String(b.id)); });
    this.seed = String(scenario.seed === undefined ? '' : scenario.seed);
    this.duration = scenario.duration;
    this.clearingAt = scenario.clearingAt === undefined ? Math.max(0, scenario.duration - CONFIG.clearingSeconds) : scenario.clearingAt;
    this.time = 0;
    this.ended = false;
    this.score = 0;
    this.delivered = 0;
    this.missed = 0;
    this.totalDistance = 0;
    this._node = CONFIG.depot;
    this._x = byId[this._node].x;
    this._y = byId[this._node].y;
    this._destination = null;
    this._segments = [];
    this._edgeEndpoints = null;
    this._events = [];
    this._serial = 0;
    this._processArrivals();
  }

  Game.prototype._event = function (type, detail) {
    this._serial += 1;
    this._events.push(Object.assign({ serial: this._serial, type: type, time: rounded(this.time) }, detail || {}));
  };

  Game.prototype._processArrivals = function () {
    var self = this;
    this.orders.forEach(function (order) {
      if (order.status === 'future' && order.appearsAt <= self.time + EPSILON) {
        order.status = 'waiting';
        self._event('arrival', { orderId: order.id, node: order.pickup });
      }
    });
  };

  Game.prototype._resolve = function (order, delivered) {
    if (order.status === 'delivered' || order.status === 'missed') return;
    order.status = delivered ? 'delivered' : 'missed';
    order.resolvedAt = rounded(this.time);
    this.score += delivered ? 1 : -1;
    if (delivered) this.delivered += 1;
    else this.missed += 1;
    this._event(order.status, { orderId: order.id, node: delivered ? order.dropoff : order.pickup, points: delivered ? 1 : -1 });
  };

  Game.prototype._expire = function (timeContinues, force) {
    var self = this;
    this.orders.forEach(function (order) {
      if ((order.status === 'waiting' || order.status === 'carried' || (force && order.status === 'future')) &&
          (force || order.deadline < self.time - EPSILON || (timeContinues && order.deadline <= self.time + EPSILON))) self._resolve(order, false);
    });
  };

  Game.prototype._arrive = function (nodeId) {
    this._node = nodeId;
    this._edgeEndpoints = null;
    this._x = byId[nodeId].x;
    this._y = byId[nodeId].y;
    var self = this;
    this.orders.forEach(function (order) {
      if (order.status === 'carried' && order.dropoff === nodeId && self.time <= order.deadline + EPSILON) self._resolve(order, true);
    });
    if (!this._segments.length) {
      this._destination = null;
      this._event('stop', { node: nodeId });
    }
  };

  Game.prototype._move = function (seconds) {
    if (!this._segments.length || seconds <= 0) return;
    var segment = this._segments[0];
    this._edgeEndpoints = segment.endpoints;
    var travelled = Math.min(seconds * CONFIG.speed, segment.length - segment.travelled);
    segment.travelled += travelled;
    this.totalDistance += travelled;
    var fraction = segment.length ? segment.travelled / segment.length : 1;
    this._x = segment.startX + (byId[segment.to].x - segment.startX) * fraction;
    this._y = segment.startY + (byId[segment.to].y - segment.startY) * fraction;
    this._node = null;
    if (segment.length - segment.travelled <= EPSILON * CONFIG.speed) {
      this._segments.shift();
      this._arrive(segment.to);
    }
  };

  Game.prototype.advance = function (deltaSeconds) {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) throw new RangeError('Elapsed seconds must be finite and nonnegative.');
    if (this.ended || deltaSeconds === 0) return false;
    var target = Math.min(this.duration, this.time + deltaSeconds);
    while (this.time < target - EPSILON) {
      this._processArrivals();
      this._expire(true, false);
      var next = target;
      this.orders.forEach(function (order) {
        if (order.status === 'future' && order.appearsAt > this.time + EPSILON) next = Math.min(next, order.appearsAt);
        if ((order.status === 'waiting' || order.status === 'carried') && order.deadline > this.time + EPSILON) next = Math.min(next, order.deadline);
      }, this);
      if (this._segments.length) {
        var current = this._segments[0];
        next = Math.min(next, this.time + (current.length - current.travelled) / CONFIG.speed);
      }
      var step = next - this.time;
      this.time = next;
      this._move(step);
    }
    this.time = target;
    this._processArrivals();
    this._expire(false, false);
    if (this.time >= this.duration - EPSILON) {
      this.time = this.duration;
      this._expire(false, true);
      this.ended = true;
      this._destination = null;
      this._segments = [];
      this._event('ended');
    }
    return true;
  };

  function makeSegment(startX, startY, to, endpoints) {
    return {
      startX: startX, startY: startY, to: to, endpoints: endpoints,
      length: Math.hypot(byId[to].x - startX, byId[to].y - startY), travelled: 0
    };
  }

  Game.prototype.goTo = function (nodeId) {
    checkNode(nodeId);
    if (this.ended || this._destination === nodeId || (this._node === nodeId && !this._segments.length)) return false;
    var path;
    var segments = [];
    if (this._node !== null) {
      path = shortestPath(this._node, nodeId).nodes;
    } else {
      var endpoints = this._segments[0].endpoints;
      var self = this;
      var candidates = endpoints.map(function (endpoint) {
        var route = shortestPath(endpoint, nodeId);
        var approach = Math.hypot(byId[endpoint].x - self._x, byId[endpoint].y - self._y);
        return { endpoint: endpoint, route: route, cost: approach / CONFIG.speed + route.seconds, approach: approach };
      });
      var best = candidates[0].cost <= candidates[1].cost + EPSILON ? candidates[0] : candidates[1];
      if (best.approach > EPSILON) segments.push(makeSegment(this._x, this._y, best.endpoint, endpoints.slice()));
      path = best.route.nodes;
    }
    for (var index = 1; index < path.length; index += 1) {
      segments.push(makeSegment(byId[path[index - 1]].x, byId[path[index - 1]].y, path[index], [path[index - 1], path[index]]));
    }
    this._segments = segments;
    this._destination = nodeId;
    if (!segments.length) this._arrive(nodeId);
    return true;
  };

  Game.prototype.estimateTravel = function (nodeId) {
    checkNode(nodeId);
    if (this._node !== null) {
      var direct = shortestPath(this._node, nodeId);
      return { seconds: direct.seconds, distance: direct.distance };
    }
    var self = this;
    var endpoints = this._segments.length ? this._segments[0].endpoints : this._edgeEndpoints;
    var distances = endpoints ? endpoints.map(function (endpoint) {
      return Math.hypot(byId[endpoint].x - self._x, byId[endpoint].y - self._y) + shortestPath(endpoint, nodeId).distance;
    }) : [0];
    var distance = Math.min.apply(Math, distances);
    return { seconds: distance / CONFIG.speed, distance: distance };
  };

  Game.prototype.pickup = function (orderIds) {
    if (!Array.isArray(orderIds)) throw new TypeError('Choose order IDs in an array.');
    if (this.ended || this._node === null) return [];
    var self = this;
    var room = CONFIG.capacity - this.orders.filter(function (order) { return order.status === 'carried'; }).length;
    var accepted = [];
    orderIds.forEach(function (id) {
      if (!room) return;
      var order = self.orders.find(function (item) { return item.id === id; });
      if (order && order.status === 'waiting' && order.pickup === self._node && self.time <= order.deadline + EPSILON) {
        order.status = 'carried';
        order.pickedUpAt = rounded(self.time);
        room -= 1;
        accepted.push(order.id);
        self._event('pickup', { orderId: order.id, node: self._node });
      }
    });
    return accepted;
  };

  Game.prototype.quickPickup = function () {
    var self = this;
    return this.pickup(this.orders.filter(function (order) { return order.status === 'waiting' && order.pickup === self._node; })
      .sort(function (a, b) { return a.deadline - b.deadline || a.appearsAt - b.appearsAt || String(a.id).localeCompare(String(b.id)); })
      .map(function (order) { return order.id; }));
  };

  Game.prototype.snapshot = function () {
    var route = [{ x: rounded(this._x), y: rounded(this._y) }];
    this._segments.forEach(function (segment) { route.push({ x: byId[segment.to].x, y: byId[segment.to].y }); });
    var carried = this.orders.filter(function (order) { return order.status === 'carried'; }).map(function (order) { return order.id; });
    return {
      seed: this.seed, time: rounded(this.time), duration: this.duration, clearingAt: this.clearingAt, ended: this.ended,
      orders: this.orders.map(function (order) { return Object.assign({}, order); }),
      rider: { x: rounded(this._x), y: rounded(this._y), node: this._node, destination: this._destination, route: route },
      score: this.score, delivered: this.delivered, missed: this.missed,
      totalDistance: rounded(this.totalDistance), carried: carried, capacity: CONFIG.capacity,
      waiting: this.orders.filter(function (order) { return order.status === 'waiting'; }).length,
      onTimeRate: this.orders.length ? this.delivered / this.orders.length : 0,
      events: this._events.map(function (event) { return Object.assign({}, event); })
    };
  };

  return Object.freeze({
    CONFIG: CONFIG, NODES: NODES, EDGES: EDGES,
    shortestPath: shortestPath, createScenario: createScenario,
    Game: Game, createGame: function (scenario) { return new Game(scenario); }
  });
}));
