[HAL Schemas - v0.0.1](../README.md) / DeviceHeartbeat

# Interface: DeviceHeartbeat

Periodic heartbeat message from devices

## Table of contents

### Properties

- [active\_capabilities](DeviceHeartbeat.md#active_capabilities)
- [error\_count](DeviceHeartbeat.md#error_count)
- [health](DeviceHeartbeat.md#health)
- [metrics](DeviceHeartbeat.md#metrics)
- [status](DeviceHeartbeat.md#status)
- [uptime\_seconds](DeviceHeartbeat.md#uptime_seconds)
- [warnings](DeviceHeartbeat.md#warnings)

## Properties

### active\_capabilities

• `Optional` **active\_capabilities**: `string`[]

Currently active capabilities

#### Defined in

[types/system/heartbeat.ts:45](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/heartbeat.ts#L45)

___

### error\_count

• `Optional` **error\_count**: `number`

Number of errors since last heartbeat

#### Defined in

[types/system/heartbeat.ts:49](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/heartbeat.ts#L49)

___

### health

• **health**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `battery_percent?` | `number` | Battery level percentage (if applicable) |
| `cpu_percent` | `number` | CPU usage percentage |
| `memory_percent` | `number` | Memory usage percentage |
| `storage_percent?` | `number` | Storage usage percentage |
| `temperature_celsius` | `number` | System temperature |
| `voltage_volts?` | `number` | Supply voltage |

#### Defined in

[types/system/heartbeat.ts:15](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/heartbeat.ts#L15)

___

### metrics

• `Optional` **metrics**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `commands_executed?` | `number` |
| `commands_failed?` | `number` |
| `messages_received?` | `number` |
| `messages_sent?` | `number` |

#### Defined in

[types/system/heartbeat.ts:54](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/heartbeat.ts#L54)

___

### status

• **status**: ``"idle"`` \| ``"error"`` \| ``"emergency_stop"`` \| ``"active"`` \| ``"maintenance"``

Current device status

#### Defined in

[types/system/heartbeat.ts:14](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/heartbeat.ts#L14)

___

### uptime\_seconds

• **uptime\_seconds**: `number`

Device uptime in seconds

#### Defined in

[types/system/heartbeat.ts:10](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/heartbeat.ts#L10)

___

### warnings

• `Optional` **warnings**: `string`[]

Current warning messages

#### Defined in

[types/system/heartbeat.ts:53](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/heartbeat.ts#L53)
