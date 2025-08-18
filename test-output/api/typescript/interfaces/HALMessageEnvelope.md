[HAL Schemas - v0.0.1](../README.md) / HALMessageEnvelope

# Interface: HALMessageEnvelope

Standard envelope for all HAL messages

## Table of contents

### Properties

- [caps](HALMessageEnvelope.md#caps)
- [correlation\_id](HALMessageEnvelope.md#correlation_id)
- [device\_id](HALMessageEnvelope.md#device_id)
- [hal\_major](HALMessageEnvelope.md#hal_major)
- [hal\_minor](HALMessageEnvelope.md#hal_minor)
- [payload](HALMessageEnvelope.md#payload)
- [schema](HALMessageEnvelope.md#schema)
- [seq](HALMessageEnvelope.md#seq)
- [ts](HALMessageEnvelope.md#ts)

## Properties

### caps

• **caps**: `string`[]

Array of capability strings with versions (e.g., motor.differential:v1.0)

#### Defined in

[types/common/envelope.ts:26](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/common/envelope.ts#L26)

___

### correlation\_id

• `Optional` **correlation\_id**: `string`

Optional correlation ID for request/response patterns

#### Defined in

[types/common/envelope.ts:44](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/common/envelope.ts#L44)

___

### device\_id

• **device\_id**: `string`

Unique device identifier

#### Defined in

[types/common/envelope.ts:22](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/common/envelope.ts#L22)

___

### hal\_major

• **hal\_major**: `number`

Major version of HAL specification

#### Defined in

[types/common/envelope.ts:10](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/common/envelope.ts#L10)

___

### hal\_minor

• **hal\_minor**: `number`

Minor version of HAL specification

#### Defined in

[types/common/envelope.ts:14](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/common/envelope.ts#L14)

___

### payload

• **payload**: `Object`

Message payload conforming to schema

#### Index signature

▪ [k: `string`]: `unknown`

#### Defined in

[types/common/envelope.ts:34](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/common/envelope.ts#L34)

___

### schema

• **schema**: `string`

Schema identifier for payload (e.g., tafylabs/hal/motor/differential/1.0)

#### Defined in

[types/common/envelope.ts:18](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/common/envelope.ts#L18)

___

### seq

• `Optional` **seq**: `number`

Optional sequence number for ordering

#### Defined in

[types/common/envelope.ts:40](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/common/envelope.ts#L40)

___

### ts

• **ts**: `string`

ISO 8601 timestamp

#### Defined in

[types/common/envelope.ts:30](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/common/envelope.ts#L30)
