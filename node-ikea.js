"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });

var cloneDeep = require('lodash/cloneDeep');

const ikea = require("node-tradfri-client");

module.exports = function (RED) {

    RED.httpAdmin.get('/ikea/ikea-blinds', RED.auth.needsPermission('ikea-homesmart.read'), function (req, res) {

        const node = RED.nodes.getNode(req.query.nodeId);
        if (!node) {
            res.json({ error: true });
            return;
        }
        let blinds = node.getBlinds();
        let ret = [];
        for (let k in blinds) {
            ret.push({ name: blinds[k].name, id: k });
        }
        res.json(JSON.stringify(ret));
    });

    RED.httpAdmin.get('/ikea/ikea-lights', RED.auth.needsPermission('ikea-homesmart.read'), function (req, res) {

        const node = RED.nodes.getNode(req.query.nodeId);
        if (!node) {
            res.json({ error: true });
            return;
        }
        let lights = node.getLights();
        let ret = [];
        for (let k in lights) {
            ret.push({ name: lights[k].name, id: k });
        }
        res.json(JSON.stringify(ret));
    });

    RED.httpAdmin.get('/ikea/ikea-plugs', RED.auth.needsPermission('ikea-homesmart.read'), function (req, res) {

        const node = RED.nodes.getNode(req.query.nodeId);
        if (!node) {
            res.json({ error: true });
            return;
        }
        let plugs = node.getPlugs();
        let ret = [];
        for (let k in plugs) {
            ret.push({ name: plugs[k].name, id: k });
        }
        res.json(JSON.stringify(ret));
    });

    RED.httpAdmin.get('/ikea/ikea-sensors', RED.auth.needsPermission('ikea-homesmart.read'), function (req, res) {

        const node = RED.nodes.getNode(req.query.nodeId);
        if (!node) {
            res.json({ error: true });
            return;
        }
        let sensors = node.getSensors();
        let ret = [];
        for (let k in sensors) {
            ret.push({ name: sensors[k].name, id: k });
        }
        res.json(JSON.stringify(ret));
    });

    RED.httpAdmin.get('/ikea/ikea-remotes', RED.auth.needsPermission('ikea-homesmart.read'), function (req, res) {

        const node = RED.nodes.getNode(req.query.nodeId);
        if (!node) {
            res.json({ error: true });
            return;
        }
        let remotes = node.getRemotes();
        let ret = [];
        for (let k in remotes) {
            ret.push({ name: remotes[k].name, id: k });
        }
        res.json(JSON.stringify(ret));
    });

    RED.httpAdmin.get('/ikea/ikea-groups', RED.auth.needsPermission('ikea-homesmart.read'), function (req, res) {

        const node = RED.nodes.getNode(req.query.nodeId);
        if (!node) {
            res.json({ error: true });
            return;
        }
        let groups = node.getGroups();
        let ret = [];
        for (let k in groups) {
            ret.push({ name: groups[k].name, id: k });
        }
        res.json(JSON.stringify(ret));
    });

    RED.httpAdmin.get('/ikea/ikea-scenes', RED.auth.needsPermission('ikea-homesmart.read'), function (req, res) {

        const node = RED.nodes.getNode(req.query.nodeId);
        if (!node) {
            res.json({ error: true });
            return;
        }
        let scenes = node.getScenes();
        let ret = [];
        for (let k in scenes) {
            for (let l in scenes[k]) {
                ret.push({ group: k, name: scenes[k][l].name, id: scenes[k][l].instanceId });
            }
        }
        res.json(JSON.stringify(ret));
    });

    function IKEAConnectionNode(config) {
        var node = this;

        RED.nodes.createNode(node, config);

        node.name = config.name;
        node.address = config.address;
        node.securityCode = node.credentials.securityCode;
        node.identity = node.credentials.identity;
        node.psk = node.credentials.psk;
        if ((node.identity == null && node.psk != null) || (node.identity != null && node.psk == null)) {
            RED.log.error("Must provide both identity and PSK or leave both blank to generate new credentials from security code.");
        }
        if (node.identity == null && node.psk == null && node.securityCode == null) {
            RED.log.error("Must provide either identity and PSK or a security code to connect to the IKEA hub");
        }

        var _blinds = {};
        var _lights = {};
        var _plugs = {};
        var _sensors = {};
        var _remotes = {};
        var _groups = {};
        let _scenes = {};
        var _listeners = {};
        var _client = null;

        var _deviceUpdatedCallback = (accessory) => {
            if (accessory.type === ikea.AccessoryTypes.blind) {
                _blinds[accessory.instanceId] = accessory;
                //RED.log.debug(`Blind ${accessory.instanceId} found`);
            } else if (accessory.type === ikea.AccessoryTypes.lightbulb) {
                _lights[accessory.instanceId] = accessory;
                //RED.log.debug(`Light ${accessory.instanceId} found`);
            } else if (accessory.type === ikea.AccessoryTypes.plug) {
                _plugs[accessory.instanceId] = accessory;
                //RED.log.debug(`Plug ${accessory.instanceId} found`);
            } else if (accessory.type === ikea.AccessoryTypes.motionSensor) {
                _sensors[accessory.instanceId] = accessory;
                //RED.log.debug(`Sensor ${accessory.instanceId} found`);
            } else if (accessory.type === ikea.AccessoryTypes.remote || accessory.type === ikea.AccessoryTypes.slaveRemote) {
                _remotes[accessory.instanceId] = accessory;
                //RED.log.debug(`Remote ${accessory.instanceId} found`);
            }

            if (_listeners[accessory.instanceId]) {
                for (let nodeId in _listeners[accessory.instanceId]) {
                    _listeners[accessory.instanceId][nodeId](accessory);
                }
            }
        };

        var _groupUpdatedCallback = (group) => {
            _groups[group.instanceId] = group;
            //RED.log.debug(`Group ${group.instanceId} found`);

            if (_listeners[group.instanceId]) {
                for (let nodeId in _listeners[group.instanceId]) {
                    _listeners[group.instanceId][nodeId](group);
                }
            }
        };

        var _sceneUpdatedCallback = (groupId, scene) => {
            if (!_scenes[groupId]) {
                _scenes[groupId] = [];
            }
            _scenes[groupId].push(scene);
            //RED.log.debug(`groupId ${groupId} found`);
            //RED.log.debug(`scene ${scene.instanceId} found`);

            if (_listeners[scene.instanceId]) {
                for (let nodeId in _listeners[scene.instanceId]) {
                    _listeners[scene.instanceId][nodeId](scene);
                }
            }
        };

        let _setupClient = () => __awaiter(this, void 0, void 0, function* () {
            let loggerFunction = (message, severity) => {
                if (severity !== "silly") {
                    RED.log.debug(severity + ", " + message);
                }
            };

            //let client = new ikea.TradfriClient(node.address);
            //let client = new ikea.TradfriClient(node.address,{"watchConnection":true});
            //let client = new ikea.TradfriClient(node.address,loggerFunction);
            let client = new ikea.TradfriClient(node.address,{"customLogger":loggerFunction,"watchConnection":true});

            if (node.identity == null && node.psk == null) {
                const { identity, psk } = yield client.authenticate(node.securityCode);
                node.identity = identity;
                node.psk = psk;
            }

            if (yield client.connect(node.identity, node.psk)) {
                client.on("device updated", _deviceUpdatedCallback);
                client.on("group updated", _groupUpdatedCallback);
                client.on("scene updated", _sceneUpdatedCallback);
                client.observeDevices();
                client.observeGroupsAndScenes();
                _client = client;
            } else {
                throw new Error(`Client not available`);
            }
        });

        let _reconnect = () => __awaiter(this, void 0, void 0, function* () {
            let timeout = 5000;
            if (_client != null) {
                _client.destroy();
                _client = null;
            }
            while (_client == null) {
                try {
                    yield _setupClient();
                }
                catch (e) {
                    RED.log.trace(`[IKEA: ${node.id}] ${e.toString()}, reconnecting...`);
                }
                yield new Promise(resolve => setTimeout(resolve, timeout));
            }
        });

/*
        let pingInterval = 30;

        let _ping = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            let client;
            try {
                client = yield node.getClient();
                let res = yield client.ping();
                RED.log.trace(`[IKEA: ${node.id}] ping returned '${res}'`);
            }
            catch (e) {
                RED.log.trace(`[IKEA: ${node.id}] ping returned '${e.toString()}'`);
            }
        }), pingInterval * 1000);
*/
        _reconnect();

        node.getClient = () => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_client == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                } else {
                    return _client;
                }
            }
            throw new Error('Client not available');
        });

        node.getBlind = (instanceId) => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_blinds[instanceId] == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                } else {
                    return _blinds[instanceId];
                }
            }
            throw new Error('Blind not available');
        });

        node.getBlinds = () => {
            return _blinds;
        };

        node.getLight = (instanceId) => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_lights[instanceId] == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                } else {
                    return _lights[instanceId];
                }
            }
            throw new Error('Light not available');
        });

        node.getLights = () => {
            return _lights;
        };

        node.getPlug = (instanceId) => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_plugs[instanceId] == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                } else {
                    return _plugs[instanceId];
                }
            }
            throw new Error('Plug not available');
        });

        node.getPlugs = () => {
            return _plugs;
        };

        node.getSensor = (instanceId) => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_sensors[instanceId] == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                } else {
                    return _sensors[instanceId];
                }
            }
            throw new Error('Sensor not available');
        });

        node.getSensors = () => {
            return _sensors;
        };

        node.getRemote = (instanceId) => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_remotes[instanceId] == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                } else {
                    return _remotes[instanceId];
                }
            }
            throw new Error('Remote not available');
        });

        node.getRemotes = () => {
            return _remotes;
        };

        node.getGroup = (instanceId) => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_groups[instanceId] == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                } else {
                    return _groups[instanceId];
                }
            }
            throw new Error('Group not available');
        });

        node.getGroups = () => {
            return _groups;
        };

        node.getScene = (groupId) => __awaiter(this, void 0, void 0, function* () {
            let maxRetries = 5;
            let timeout = 2;
            for (let i = 0; i < maxRetries; i++) {
                if (_scenes[groupId] == null) {
                    yield new Promise(resolve => setTimeout(resolve, timeout * 1000));
                } else {
                    return _scenes[groupId];
                }
            }
            throw new Error('Scene not available');
        });

        node.getScenes = () => {
            return _scenes;
        };

        node.register = (nodeId, instanceId, callback) => {
            if (!_listeners[instanceId]) {
                _listeners[instanceId] = {};
            }
            _listeners[instanceId][nodeId] = callback;
            RED.log.debug(`[IKEA: ${nodeId}] registered event listener for ${instanceId}`);
        };

        node.unregister = (nodeId) => {
            for (let instanceId in _listeners) {
                if (_listeners[instanceId].hasOwnProperty(nodeId)) {
                    delete _listeners[instanceId][nodeId];
                    RED.log.debug(`[IKEA: ${nodeId}] unregistered event listeners`);
                }
            }
        };

        node.on('close', () => {
            clearInterval(_ping);
            _client.destroy();
            RED.log.debug(`[IKEA: ${node.id}] Config was closed`);
        });
    }

    RED.nodes.registerType("ikea-connection", IKEAConnectionNode, {
        credentials: {
            securityCode: { type: "text" },
            identity: { type: "text" },
            psk: { type: "text" }
        }
    });

    function IKEANode(config) {

        var node = this;
        RED.nodes.createNode(node, config);

        node.name = config.name;
        node.deviceId = config.deviceId;
        node.deviceName = config.deviceName;
        node.deviceType = config.deviceType;
        node.observe = config.observe;
        node.topic = config.deviceType;

        var _config = RED.nodes.getNode(config.connection);

        var _removeKeys = (obj, keys) => {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    switch (typeof(obj[prop])) {
                        case 'object':
                            if (keys.indexOf(prop) > -1) {
                                delete obj[prop];
                            } else {
                                _removeKeys(obj[prop], keys);
                            }
                            break;
                      default:
                            if (keys.indexOf(prop) > -1) {
                                delete obj[prop];
                            }
                            break;
                    }
                }
            }
        }

        var _send = (payload) => {
            //let msg = Object.assign({}, payload);
            //msg = JSON.parse(JSON.stringify(msg));
            let msg = cloneDeep(payload);

            _removeKeys(msg, ['isProxy','options','client','_accessory','_modelName']);

            RED.log.debug(`[IKEA: ${node.id}] recieved update for '${msg.name}' (${msg.instanceId})`);
            node.send({ topic: node.topic, payload: msg });
        };

        var _handleStatus = () => __awaiter(this, void 0, void 0, function* () {
            try {
                let payload;
                if (node.deviceType === 'ikea-blinds') {
                    payload = yield _config.getBlind(node.deviceId);
                } else if (node.deviceType === 'ikea-lights') {
                    payload = yield _config.getLight(node.deviceId);
                } else if (node.deviceType === 'ikea-plugs') {
                    payload = yield _config.getPlug(node.deviceId);
                } else if (node.deviceType === 'ikea-sensors') {
                    payload = yield _config.getSensor(node.deviceId);
                } else if (node.deviceType === 'ikea-remotes') {
                    payload = yield _config.getRemote(node.deviceId);
                } else if (node.deviceType === 'ikea-groups') {
                    payload = yield _config.getGroup(node.deviceId);
                }
                _send(payload);
                RED.log.debug(`[IKEA: ${node.id}] Status request successful`);
            }
            catch (e) {
                RED.log.debug(`[IKEA: ${node.id}] Status request unsuccessful, '${e.toString()}'`);
            }
        });

        var _handleBlindOp = (blind) => __awaiter(this, void 0, void 0, function* () {
            let blindOp = Object.assign({ force: true }, blind);
            try {
                let blind = yield _config.getBlind(node.deviceId);
                if (Object.keys(blindOp).length > 0) {
                    let client = yield _config.getClient();
                    let res;
                    if ('trigger' in blindOp) {
                        res = yield client.request('/15001/' + node.deviceId,'put',{15015:[{5523:0.0}]})
                    } else {
                        res = yield client.operateBlind(blind, blindOp);
                    }
                    RED.log.debug(`[IKEA: ${node.id}] BlindOp '${JSON.stringify(blindOp)}' returned '${res}'`);
                }
            }
            catch (e) {
                RED.log.debug(`[IKEA: ${node.id}] BlindOp '${JSON.stringify(blindOp)}' unsuccessful, '${e.toString()}'`);
            }
        });

        var _handleLightOp = (light) => __awaiter(this, void 0, void 0, function* () {
            let lightOp = Object.assign({ transitionTime: 0 }, light);
            try {
                let light = yield _config.getLight(node.deviceId);
                if (Object.keys(lightOp).length > 0) {
                    let client = yield _config.getClient();
                    let res = yield client.operateLight(light, lightOp);
                    RED.log.debug(`[IKEA: ${node.id}] LightOp '${JSON.stringify(lightOp)}' returned '${res}'`);
                }
            }
            catch (e) {
                RED.log.debug(`[IKEA: ${node.id}] LightOp '${JSON.stringify(lightOp)}' unsuccessful, '${e.toString()}'`);
            }
        });

        var _handlePlugOp = (plug) => __awaiter(this, void 0, void 0, function* () {
            let plugOp = Object.assign(plug);
            try {
                let plug = yield _config.getPlug(node.deviceId);
                if (Object.keys(plugOp).length > 0) {
                    let client = yield _config.getClient();
                    let res = yield client.operatePlug(plug, plugOp);
                    RED.log.debug(`[IKEA: ${node.id}] PlugOp '${JSON.stringify(plugOp)}' returned '${res}'`);
                }
            }
            catch (e) {
                RED.log.debug(`[IKEA: ${node.id}] PlugOp '${JSON.stringify(plugOp)}' unsuccessful, '${e.toString()}'`);
            }
        });

        var _handleGroupOp = (group) => __awaiter(this, void 0, void 0, function* () {
            let groupOp = Object.assign({ transitionTime: 0 }, group);
            try {
                let group = yield _config.getGroup(node.deviceId);
                if (Object.keys(groupOp).length > 0) {
                    let client = yield _config.getClient();
                    let res = yield client.operateGroup(group, groupOp, true);
                    RED.log.debug(`[IKEA: ${node.id}] GroupOp '${JSON.stringify(groupOp)}' returned '${res}'`);
                }
            }
            catch (e) {
                RED.log.debug(`[IKEA: ${node.id}] GroupOp '${JSON.stringify(groupOp)}' unsuccessful, '${e.toString()}'`);
            }
        });

        if (node.observe) {
            _config.register(node.id, node.deviceId, _send);
        }

        node.on('input', function (msg) {
            (() => __awaiter(this, void 0, void 0, function* () {
                if (msg.hasOwnProperty('payload')) {
                    if (msg.payload === "status") {
                        msg.payload = { status: true };
                    }
                    let isStatus = msg.payload.hasOwnProperty('status');
                    if (isStatus) {
                        _handleStatus();
                    } else if (node.deviceType === 'ikea-blinds') {
                        _handleBlindOp(msg.payload);
                    } else if (node.deviceType === 'ikea-lights') {
                        _handleLightOp(msg.payload);
                    } else if (node.deviceType === 'ikea-plugs') {
                        _handlePlugOp(msg.payload);
                    } else if (node.deviceType === 'ikea-groups') {
                        _handleGroupOp(msg.payload);
                    }
                }
            }))();
        });

        node.on('close', function () {
            RED.log.debug(`[IKEA: ${node.id}] Node was closed`);
            _config.unregister(node.id);
        });
    }
    RED.nodes.registerType("ikea-homesmart", IKEANode);
};
