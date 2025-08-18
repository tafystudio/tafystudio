[HAL Schemas - v0.0.1](../README.md) / DifferentialDriveMotorCommand

# Interface: DifferentialDriveMotorCommand

Command schema for differential drive motors

## Table of contents

### Properties

- [acceleration\_meters\_per\_sec2](DifferentialDriveMotorCommand.md#acceleration_meters_per_sec2)
- [angular\_acceleration\_rad\_per\_sec2](DifferentialDriveMotorCommand.md#angular_acceleration_rad_per_sec2)
- [angular\_rad\_per\_sec](DifferentialDriveMotorCommand.md#angular_rad_per_sec)
- [duration\_ms](DifferentialDriveMotorCommand.md#duration_ms)
- [linear\_meters\_per\_sec](DifferentialDriveMotorCommand.md#linear_meters_per_sec)
- [priority](DifferentialDriveMotorCommand.md#priority)

## Properties

### acceleration\_meters\_per\_sec2

• `Optional` **acceleration\_meters\_per\_sec2**: `number`

Optional linear acceleration limit

#### Defined in

[types/motor/differential.ts:22](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential.ts#L22)

___

### angular\_acceleration\_rad\_per\_sec2

• `Optional` **angular\_acceleration\_rad\_per\_sec2**: `number`

Optional angular acceleration limit

#### Defined in

[types/motor/differential.ts:26](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential.ts#L26)

___

### angular\_rad\_per\_sec

• **angular\_rad\_per\_sec**: `number`

Angular velocity in radians per second

#### Defined in

[types/motor/differential.ts:14](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential.ts#L14)

___

### duration\_ms

• `Optional` **duration\_ms**: `number`

Optional duration in milliseconds (0 = indefinite)

#### Defined in

[types/motor/differential.ts:18](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential.ts#L18)

___

### linear\_meters\_per\_sec

• **linear\_meters\_per\_sec**: `number`

Linear velocity in meters per second

#### Defined in

[types/motor/differential.ts:10](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential.ts#L10)

___

### priority

• `Optional` **priority**: ``"low"`` \| ``"normal"`` \| ``"high"`` \| ``"emergency"``

Command priority for queue management

#### Defined in

[types/motor/differential.ts:30](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/motor/differential.ts#L30)
