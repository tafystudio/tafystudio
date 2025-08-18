HAL Schemas

# HAL Schemas - v0.0.1

## Table of contents

### Interfaces

- [DeviceDiscoveryAnnouncement](interfaces/DeviceDiscoveryAnnouncement.md)
- [DeviceHeartbeat](interfaces/DeviceHeartbeat.md)
- [DifferentialDriveMotorCommand](interfaces/DifferentialDriveMotorCommand.md)
- [DifferentialDriveMotorTelemetry](interfaces/DifferentialDriveMotorTelemetry.md)
- [HALMessageEnvelope](interfaces/HALMessageEnvelope.md)
- [InertialMeasurementUnitData](interfaces/InertialMeasurementUnitData.md)
- [TimeOfFlightRangeSensorData](interfaces/TimeOfFlightRangeSensorData.md)

### Variables

- [CAPABILITIES](README.md#capabilities)
- [HAL\_VERSION](README.md#hal_version)
- [NATS\_SUBJECTS](README.md#nats_subjects)
- [SCHEMAS](README.md#schemas)

### Functions

- [createEnvelope](README.md#createenvelope)
- [getSubjectForSchema](README.md#getsubjectforschema)
- [hasCapability](README.md#hascapability)
- [parseCapability](README.md#parsecapability)

## Variables

### CAPABILITIES

• `Const` **CAPABILITIES**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `motor` | \{ `differential`: ``"motor.differential:v1.0"`` = 'motor.differential:v1.0' } |
| `motor.differential` | ``"motor.differential:v1.0"`` |
| `sensor` | \{ `imu`: ``"sensor.imu:v1.0"`` = 'sensor.imu:v1.0'; `rangeTof`: ``"sensor.range-tof:v1.0"`` = 'sensor.range-tof:v1.0' } |
| `sensor.imu` | ``"sensor.imu:v1.0"`` |
| `sensor.rangeTof` | ``"sensor.range-tof:v1.0"`` |
| `system` | \{ `discovery`: ``"system.discovery:v1.0"`` = 'system.discovery:v1.0'; `heartbeat`: ``"system.heartbeat:v1.0"`` = 'system.heartbeat:v1.0' } |
| `system.discovery` | ``"system.discovery:v1.0"`` |
| `system.heartbeat` | ``"system.heartbeat:v1.0"`` |

#### Defined in

[index.ts:28](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/index.ts#L28)

___

### HAL\_VERSION

• `Const` **HAL\_VERSION**: `Object`

HAL Schema Definitions and Utilities

#### Type declaration

| Name | Type |
| :------ | :------ |
| `major` | ``1`` |
| `minor` | ``0`` |

#### Defined in

[index.ts:5](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/index.ts#L5)

___

### NATS\_SUBJECTS

• `Const` **NATS\_SUBJECTS**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `motor` | \{ `differential`: ``"hal.v1.motor.differential.cmd"`` = 'hal.v1.motor.differential.cmd' } |
| `motor.differential` | ``"hal.v1.motor.differential.cmd"`` |
| `sensor` | \{ `imu`: ``"hal.v1.sensor.imu.data"`` = 'hal.v1.sensor.imu.data'; `rangeTof`: ``"hal.v1.sensor.range.tof.data"`` = 'hal.v1.sensor.range.tof.data' } |
| `sensor.imu` | ``"hal.v1.sensor.imu.data"`` |
| `sensor.rangeTof` | ``"hal.v1.sensor.range.tof.data"`` |
| `system` | \{ `discovery`: ``"hal.v1.system.discovery"`` = 'hal.v1.system.discovery'; `heartbeat`: ``"hal.v1.system.heartbeat"`` = 'hal.v1.system.heartbeat' } |
| `system.discovery` | ``"hal.v1.system.discovery"`` |
| `system.heartbeat` | ``"hal.v1.system.heartbeat"`` |
| `telemetry` | \{ `motor`: ``"hal.v1.motor.differential.telemetry"`` = 'hal.v1.motor.differential.telemetry' } |
| `telemetry.motor` | ``"hal.v1.motor.differential.telemetry"`` |

#### Defined in

[index.ts:42](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/index.ts#L42)

___

### SCHEMAS

• `Const` **SCHEMAS**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `common` | \{ `envelope`: ``"tafylabs/hal/common/envelope/1.0"`` = 'tafylabs/hal/common/envelope/1.0' } |
| `common.envelope` | ``"tafylabs/hal/common/envelope/1.0"`` |
| `motor` | \{ `differential`: ``"tafylabs/hal/motor/differential/1.0"`` = 'tafylabs/hal/motor/differential/1.0'; `differentialTelemetry`: ``"tafylabs/hal/motor/differential-telemetry/1.0"`` = 'tafylabs/hal/motor/differential-telemetry/1.0' } |
| `motor.differential` | ``"tafylabs/hal/motor/differential/1.0"`` |
| `motor.differentialTelemetry` | ``"tafylabs/hal/motor/differential-telemetry/1.0"`` |
| `sensor` | \{ `imu`: ``"tafylabs/hal/sensor/imu/1.0"`` = 'tafylabs/hal/sensor/imu/1.0'; `rangeTof`: ``"tafylabs/hal/sensor/range-tof/1.0"`` = 'tafylabs/hal/sensor/range-tof/1.0' } |
| `sensor.imu` | ``"tafylabs/hal/sensor/imu/1.0"`` |
| `sensor.rangeTof` | ``"tafylabs/hal/sensor/range-tof/1.0"`` |
| `system` | \{ `discovery`: ``"tafylabs/hal/system/discovery/1.0"`` = 'tafylabs/hal/system/discovery/1.0'; `heartbeat`: ``"tafylabs/hal/system/heartbeat/1.0"`` = 'tafylabs/hal/system/heartbeat/1.0' } |
| `system.discovery` | ``"tafylabs/hal/system/discovery/1.0"`` |
| `system.heartbeat` | ``"tafylabs/hal/system/heartbeat/1.0"`` |

#### Defined in

[index.ts:10](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/index.ts#L10)

## Functions

### createEnvelope

▸ **createEnvelope**\<`T`\>(`schema`, `deviceId`, `capabilities`, `payload`, `options?`): `Object`

Create a HAL message envelope

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `string` |
| `deviceId` | `string` |
| `capabilities` | `string`[] |
| `payload` | `T` |
| `options?` | `Object` |
| `options.correlationId?` | `string` |
| `options.seq?` | `number` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `caps` | `string`[] |
| `correlation_id?` | `string` |
| `device_id` | `string` |
| `hal_major` | ``1`` |
| `hal_minor` | ``0`` |
| `payload` | `T` |
| `schema` | `string` |
| `seq?` | `number` |
| `ts` | `string` |

#### Defined in

[index.ts:69](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/index.ts#L69)

___

### getSubjectForSchema

▸ **getSubjectForSchema**(`schema`): `string` \| `undefined`

Get NATS subject for a schema

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `string` |

#### Returns

`string` \| `undefined`

#### Defined in

[index.ts:128](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/index.ts#L128)

___

### hasCapability

▸ **hasCapability**(`deviceCapabilities`, `requiredCapability`): `boolean`

Check if a device supports a specific capability

#### Parameters

| Name | Type |
| :------ | :------ |
| `deviceCapabilities` | `string`[] |
| `requiredCapability` | `string` |

#### Returns

`boolean`

#### Defined in

[index.ts:118](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/index.ts#L118)

___

### parseCapability

▸ **parseCapability**(`capability`): `Object`

Parse a capability string into its components

#### Parameters

| Name | Type |
| :------ | :------ |
| `capability` | `string` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `domain` | `string` |
| `type` | `string` |
| `version` | \{ `major`: `number` ; `minor`: `number`  } |
| `version.major` | `number` |
| `version.minor` | `number` |

#### Defined in

[index.ts:95](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/index.ts#L95)
