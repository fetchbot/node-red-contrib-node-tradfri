# node-red-contrib-ikea-home-smart

Node-RED node to interface with IKEA smart home products as tradfri lights or blinds without any external binaries thanks to [node-tradfri](https://github.com/AlCalzone/node-tradfri-client).

* All operations (brightness, color temperature, color, etc.) supported by the gateway are available.
* Support for observation (i.e. reporting on changes to the light).

## Usage
There is one node to configure each accessory type (besides the config node). After the configuration has been successful -- either by providing an existing identity and PSK or by generating new ones by providing the security code from the gateway -- simply select which accessory or group to target and check if the node should observe the device as well.

**Notice:**
After configuring the gateway, you must apply the settings by deploying your flow. Only then can you create and configure the accessories.

### Controlling the node
Nodes can be programmatically controlled by sending a message with `msg.payload` set to one of the following strings:
* `"status"` The node will output the current status of its target accessory.

### Controlling the blinds
A blind's position can be controled by sending an object with the following property as `msg.payload` to the node.

* `"position"`: number - The position in percent [0..100%].
* `"trigger"`: number - A trigger event to stop a moving blind [0.0].

### Controlling the lights
Lightbulbs can be controlled by sending an object with one or more of the following properties as `msg.payload` to the node.

**All** of them support the most basic properties, which are
* `"dimmer"`: number - The brightness in percent [0..100%].
* `"onOff"`: boolean - If the lightbulb is on (true) or off (false)
* `"transitionTime"`: number - The duration of state changes in seconds. Default 0.5s, not supported for on/off.

**White spectrum** lightbulbs also support
* `"colorTemperature"`: number - The color temperature in percent, where 0% equals cold white and 100% equals warm white.

**RGB** lightbulbs have the following properties:
* `"color"`: string - The 6 digit hex number representing the lightbulb's color. Don't use any prefixes like "#", only the hex number itself!
* `"hue"`: number - The color's hue [0..360°].
* `"saturation"`: number - The color's saturation [0..100%].

### Controlling the plugs (Untested)
Control a plug by sending an object with the following property as `msg.payload` to the node.

* `"onOff"`: boolean - If the plug is on (true) or off (false).

### Controlling the groups
A group contains several devices, usually a remote control and either lightbulbs, plugs or blinds. To control the group send the following properties as `msg.payload` to the node:

**For a group of lights**
* `"dimmer"`: number - The brightness in percent [0..100%].
* `"onOff"`: boolean - If the lightbulb is on (true) or off (false)
* `"transitionTime"`: number - The duration of state changes in seconds. Default 0.5s, not supported for on/off.

**For a group of blinds**
* `"position"`: number - The position in percent [0..100%].

**For a group of plugs**
* `"onOff"`: boolean - If the plug is on (true) or off (false)

Additionally, this property is also supported:
* `"sceneId"`: number - Set this to the instanceId of a scene (or "mood" as IKEA calls them), to activate it.

### Status node output
If a status request is send or a device's state is updated, the node will respond with a `msg.payload` containing its current properties.

* `"name"`: string - The name of this accessory.
* `"createdAt"`: number - The unix timestamp of the creation of the device.
* `"instanceId"`: number - The ID under which the accessory is known to the gateway.
* `"type"`: number - The type of the accessory.
	- remote (0) - A "normal" remote
	- slaveRemote (1) - A remote which has been paired with another remote. You can find details here on how to achieve this configuration.
	- lightbulb (2) - A lightbulb
	- plug (3) - A smart plug
	- motionSensor (4) - A motion sensor
	- signalRepeater (6) - A signal repeater
	- blind (7) - A blind
* `"alive"`: boolean - Whether the gateway considers this device as alive.
* `"lastSeen"`: number - The unix timestamp of the last communication with the gateway.
* `"otaUpdateState"`: number - Unknown. Might be a boolean
* `"deviceInfo"`: object - Some additional information about the device.
	- `"firmwareVersion"`: string - The firmware version of the device.
	- `"manufacturer"`: string - The device manufacturer.
	- `"modelNumber"`: string - The name/type of the device.
	- `"power"`: number - How the device is powered.
		* Unknown (0)
		* InternalBattery (1)
		* ExternalBattery (2)
		* Battery (3) - Although not in the specs, this is apparently used by the remote
		* PowerOverEthernet (4)
		* USB (5)
		* AC_Power (6)
		* Solar (7)
	- `"serialNumber"`: string - Not used currently. Always ""
	- `"battery"`: number - The battery percentage of a device. Only present if the device is battery-powered.
* `"switchList"`: array - An array of all remotes belonging to this accessory.
	- `"name"`: string - Currently not supported.
	- `"createdAt"`: number - Currently not supported.
	- `"instanceId"`: number - Currently not supported.
* `"sensorList"`: array - An array of all sensors belonging to this accessory.
	- `"name"`: string - Currently not supported.
	- `"createdAt"`: number - Currently not supported.
	- `"instanceId"`: number - Currently not supported.
	- `"appType"`: string - Currently not supported.
	- `"sensorType"`: string - Currently not supported.
	- `"minMeasuredValue"`: number - Currently not supported.
	- `"maxMeasuredValue"`: number - Currently not supported.
	- `"minRangeValue"`: number - Currently not supported.
	- `"maxRangeValue"`: number - Currently not supported.
	- `"resetMinMaxMeasureValue"`: boolean - Currently not supported.
	- `"sensorValue"`: number - Currently not supported.
	- `"unit"`: string - Currently not supported.
* `"plugList"`: array - An array of all plugs belonging to this accessory.
	- `"onOff"`: boolean - If the plug is on (true) or off (false).
	- `"isSwitchable"`: boolean - Whether the plug supports on/off (always true).
	- `"isDimmable"`: boolean - Whether the plug supports setting the dimmer value (always false for now).
* `"lightList"`: array - An array of all lights belonging to this accessory.
	- `"onOff"`: boolean - If the lightbulb is on (true) or off (false)
	- `"dimmer"`: number - The brightness in percent [0..100%].
	- `"transitionTime"`: number - The duration of state changes in seconds. Default 0.5s, not supported for on/off.
	- `"colorTemperature"`: number - The color temperature in percent, where 0% equals cold white and 100% equals white.
	- `"color"`: string - The 6 digit hex number representing the lightbulb's color.
	- `"colorX"`: number - The x component of the xy-color
	- `"colorY"`: number - The y component of the xy-color
	- `"hue"`: number - The color's hue [0..360°].
	- `"saturation"`: number - The color's saturation [0..100%].
* `"blindList"`: array - An array of all blinds belonging to this accessory.
	- `"position"`: number - The position in percent [0..100%].

## Changelog

### 0.3.3
* [Workaround](https://github.com/AlCalzone/node-tradfri-client/releases/tag/v3.0.1) for a bug in IKEA gateway firmware `v1.15.x`

### 0.3.0
* One combined node for all device types
* Temporary fix for the blind stop function
* Automatic node restart after connection loss to the gateway

### 0.2.0
* Fork from [freahs/node-red-contrib-node-tradfri](https://github.com/freahs/node-red-contrib-node-tradfri)
* Added group and scene control, blind, plug, remote and sensor support.

### 0.1.2
* Moved output status object from `msg.payload.light` to `msg.payload`.
* Updated security code, identity and PSK to be saved as credentials in config.
* Updated info panels and tweaked node appearance.

### 0.1.1
* Published to NPM
