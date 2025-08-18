[HAL Schemas - v0.0.1](../README.md) / DifferentialDriveMotorTelemetry

# Interface: DifferentialDriveMotorTelemetry

Telemetry data from differential drive motors

## Table of contents

### Properties

- [actual\_angular\_rad\_per\_sec](DifferentialDriveMotorTelemetry.md#actual_angular_rad_per_sec)
- [actual\_linear\_meters\_per\_sec](DifferentialDriveMotorTelemetry.md#actual_linear_meters_per_sec)
- [commanded\_angular\_rad\_per\_sec](DifferentialDriveMotorTelemetry.md#commanded_angular_rad_per_sec)
- [commanded\_linear\_meters\_per\_sec](DifferentialDriveMotorTelemetry.md#commanded_linear_meters_per_sec)
- [current\_draw\_amps](DifferentialDriveMotorTelemetry.md#current_draw_amps)
- [error\_code](DifferentialDriveMotorTelemetry.md#error_code)
- [odometry](DifferentialDriveMotorTelemetry.md#odometry)
- [status](DifferentialDriveMotorTelemetry.md#status)
- [temperature\_celsius](DifferentialDriveMotorTelemetry.md#temperature_celsius)
- [wheel\_velocities](DifferentialDriveMotorTelemetry.md#wheel_velocities)

## Properties

### actual\_angular\_rad\_per\_sec

• **actual\_angular\_rad\_per\_sec**: `number`

Actual angular velocity in radians per second

#### Defined in

[types/motor/differential-telemetry.ts:14](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential-telemetry.ts#L14)

___

### actual\_linear\_meters\_per\_sec

• **actual\_linear\_meters\_per\_sec**: `number`

Actual linear velocity in meters per second

#### Defined in

[types/motor/differential-telemetry.ts:10](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential-telemetry.ts#L10)

___

### commanded\_angular\_rad\_per\_sec

• `Optional` **commanded\_angular\_rad\_per\_sec**: `number`

Last commanded angular velocity

#### Defined in

[types/motor/differential-telemetry.ts:22](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential-telemetry.ts#L22)

___

### commanded\_linear\_meters\_per\_sec

• `Optional` **commanded\_linear\_meters\_per\_sec**: `number`

Last commanded linear velocity

#### Defined in

[types/motor/differential-telemetry.ts:18](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential-telemetry.ts#L18)

___

### current\_draw\_amps

• `Optional` **current\_draw\_amps**: `number`

Total current draw in amperes

#### Defined in

[types/motor/differential-telemetry.ts:56](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential-telemetry.ts#L56)

___

### error\_code

• `Optional` **error\_code**: `string`

Error code if any

#### Defined in

[types/motor/differential-telemetry.ts:64](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential-telemetry.ts#L64)

___

### odometry

• **odometry**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `distance_meters?` | `number` | Total distance traveled in meters |
| `theta_rad` | `number` | Orientation in radians |
| `x_meters` | `number` | X position in meters (robot frame) |
| `y_meters` | `number` | Y position in meters (robot frame) |

#### Defined in

[types/motor/differential-telemetry.ts:23](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential-telemetry.ts#L23)

___

### status

• `Optional` **status**: ``"idle"`` \| ``"moving"`` \| ``"stalled"`` \| ``"error"`` \| ``"emergency_stop"``

Current motor status

#### Defined in

[types/motor/differential-telemetry.ts:68](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential-telemetry.ts#L68)

___

### temperature\_celsius

• `Optional` **temperature\_celsius**: `number`

Motor controller temperature

#### Defined in

[types/motor/differential-telemetry.ts:60](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential-telemetry.ts#L60)

___

### wheel\_velocities

• `Optional` **wheel\_velocities**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `left_meters_per_sec?` | `number` | Left wheel velocity |
| `right_meters_per_sec?` | `number` | Right wheel velocity |

#### Defined in

[types/motor/differential-telemetry.ts:42](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential-telemetry.ts#L42)
