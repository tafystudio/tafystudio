[HAL Schemas - v0.0.1](../README.md) / DeviceDiscoveryAnnouncement

# Interface: DeviceDiscoveryAnnouncement

Message broadcast by devices for discovery

## Table of contents

### Properties

- [capabilities](DeviceDiscoveryAnnouncement.md#capabilities)
- [device\_type](DeviceDiscoveryAnnouncement.md#device_type)
- [firmware\_version](DeviceDiscoveryAnnouncement.md#firmware_version)
- [hardware\_id](DeviceDiscoveryAnnouncement.md#hardware_id)
- [metadata](DeviceDiscoveryAnnouncement.md#metadata)
- [network](DeviceDiscoveryAnnouncement.md#network)
- [resources](DeviceDiscoveryAnnouncement.md#resources)

## Properties

### capabilities

• **capabilities**: `string`[]

List of supported capabilities

#### Defined in

[types/system/discovery.ts:22](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/discovery.ts#L22)

___

### device\_type

• **device\_type**: ``"esp32"`` \| ``"esp8266"`` \| ``"rpi"`` \| ``"jetson"`` \| ``"x86"`` \| ``"other"``

Hardware platform type

#### Defined in

[types/system/discovery.ts:10](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/discovery.ts#L10)

___

### firmware\_version

• **firmware\_version**: `string`

Firmware version (semver)

#### Defined in

[types/system/discovery.ts:18](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/discovery.ts#L18)

___

### hardware\_id

• **hardware\_id**: `string`

Unique hardware identifier (MAC address or serial)

#### Defined in

[types/system/discovery.ts:14](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/discovery.ts#L14)

___

### metadata

• `Optional` **metadata**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `description?` | `string` |
| `hardware_revision?` | `string` |
| `location?` | `string` |
| `manufacturer?` | `string` |
| `model?` | `string` |
| `serial_number?` | `string` |

#### Defined in

[types/system/discovery.ts:30](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/discovery.ts#L30)

___

### network

• `Optional` **network**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `hostname?` | `string` |
| `ip_address?` | `string` |
| `mac_address?` | `string` |
| `port?` | `number` |

#### Defined in

[types/system/discovery.ts:23](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/discovery.ts#L23)

___

### resources

• `Optional` **resources**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `cpu_cores?` | `number` |
| `cpu_freq_mhz?` | `number` |
| `ram_mb?` | `number` |
| `storage_mb?` | `number` |

#### Defined in

[types/system/discovery.ts:39](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/system/discovery.ts#L39)
