[HAL Schemas - v0.0.1](../README.md) / InertialMeasurementUnitData

# Interface: InertialMeasurementUnitData

Data from IMU sensors (accelerometer, gyroscope, magnetometer)

## Table of contents

### Properties

- [acceleration](InertialMeasurementUnitData.md#acceleration)
- [angular\_velocity](InertialMeasurementUnitData.md#angular_velocity)
- [calibration\_status](InertialMeasurementUnitData.md#calibration_status)
- [magnetic\_field](InertialMeasurementUnitData.md#magnetic_field)
- [orientation](InertialMeasurementUnitData.md#orientation)
- [temperature\_celsius](InertialMeasurementUnitData.md#temperature_celsius)

## Properties

### acceleration

• **acceleration**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `x_meters_per_sec2` | `number` | X-axis acceleration in m/s² |
| `y_meters_per_sec2` | `number` | Y-axis acceleration in m/s² |
| `z_meters_per_sec2` | `number` | Z-axis acceleration in m/s² |

#### Defined in

[types/sensor/imu.ts:7](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/imu.ts#L7)

___

### angular\_velocity

• **angular\_velocity**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `x_rad_per_sec` | `number` | X-axis angular velocity in rad/s |
| `y_rad_per_sec` | `number` | Y-axis angular velocity in rad/s |
| `z_rad_per_sec` | `number` | Z-axis angular velocity in rad/s |

#### Defined in

[types/sensor/imu.ts:22](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/imu.ts#L22)

___

### calibration\_status

• `Optional` **calibration\_status**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `accelerometer?` | `number` |
| `gyroscope?` | `number` |
| `magnetometer?` | `number` |
| `system?` | `number` |

#### Defined in

[types/sensor/imu.ts:81](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/imu.ts#L81)

___

### magnetic\_field

• `Optional` **magnetic\_field**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `x_gauss?` | `number` | X-axis magnetic field in Gauss |
| `y_gauss?` | `number` | Y-axis magnetic field in Gauss |
| `z_gauss?` | `number` | Z-axis magnetic field in Gauss |

#### Defined in

[types/sensor/imu.ts:37](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/imu.ts#L37)

___

### orientation

• `Optional` **orientation**: `Object`

#### Index signature

▪ [k: `string`]: `unknown`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `euler?` | \{ `[k: string]`: `unknown`; `pitch_rad?`: `number` ; `roll_rad?`: `number` ; `yaw_rad?`: `number`  } |
| `euler.pitch_rad?` | `number` |
| `euler.roll_rad?` | `number` |
| `euler.yaw_rad?` | `number` |
| `quaternion?` | \{ `[k: string]`: `unknown`; `w`: `number` ; `x`: `number` ; `y`: `number` ; `z`: `number`  } |
| `quaternion.w` | `number` |
| `quaternion.x` | `number` |
| `quaternion.y` | `number` |
| `quaternion.z` | `number` |

#### Defined in

[types/sensor/imu.ts:52](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/imu.ts#L52)

___

### temperature\_celsius

• `Optional` **temperature\_celsius**: `number`

IMU temperature

#### Defined in

[types/sensor/imu.ts:80](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/imu.ts#L80)
