[HAL Schemas - v0.0.1](../README.md) / TimeOfFlightRangeSensorData

# Interface: TimeOfFlightRangeSensorData

Data from Time of Flight (ToF) range sensors

## Table of contents

### Properties

- [ambient\_light\_level](TimeOfFlightRangeSensorData.md#ambient_light_level)
- [field\_of\_view\_deg](TimeOfFlightRangeSensorData.md#field_of_view_deg)
- [max\_range\_meters](TimeOfFlightRangeSensorData.md#max_range_meters)
- [min\_range\_meters](TimeOfFlightRangeSensorData.md#min_range_meters)
- [quality](TimeOfFlightRangeSensorData.md#quality)
- [range\_meters](TimeOfFlightRangeSensorData.md#range_meters)
- [raw\_value](TimeOfFlightRangeSensorData.md#raw_value)
- [sensor\_id](TimeOfFlightRangeSensorData.md#sensor_id)
- [status](TimeOfFlightRangeSensorData.md#status)
- [temperature\_celsius](TimeOfFlightRangeSensorData.md#temperature_celsius)

## Properties

### ambient\_light\_level

• `Optional` **ambient\_light\_level**: `number`

Ambient light level (sensor specific units)

#### Defined in

[types/sensor/range-tof.ts:34](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/range-tof.ts#L34)

___

### field\_of\_view\_deg

• `Optional` **field\_of\_view\_deg**: `number`

Field of view in degrees

#### Defined in

[types/sensor/range-tof.ts:30](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/range-tof.ts#L30)

___

### max\_range\_meters

• `Optional` **max\_range\_meters**: `number`

Maximum measurable range for this sensor

#### Defined in

[types/sensor/range-tof.ts:26](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/range-tof.ts#L26)

___

### min\_range\_meters

• `Optional` **min\_range\_meters**: `number`

Minimum measurable range for this sensor

#### Defined in

[types/sensor/range-tof.ts:22](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/range-tof.ts#L22)

___

### quality

• **quality**: `number`

Measurement quality/confidence percentage

#### Defined in

[types/sensor/range-tof.ts:18](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/range-tof.ts#L18)

___

### range\_meters

• **range\_meters**: `number`

Measured range in meters

#### Defined in

[types/sensor/range-tof.ts:14](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/range-tof.ts#L14)

___

### raw\_value

• `Optional` **raw\_value**: `number`

Raw sensor reading for debugging

#### Defined in

[types/sensor/range-tof.ts:46](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/range-tof.ts#L46)

___

### sensor\_id

• **sensor\_id**: `string`

Unique identifier for this sensor on the device

#### Defined in

[types/sensor/range-tof.ts:10](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/range-tof.ts#L10)

___

### status

• `Optional` **status**: ``"error"`` \| ``"ok"`` \| ``"out_of_range"`` \| ``"low_signal"`` \| ``"high_ambient_light"``

Sensor status

#### Defined in

[types/sensor/range-tof.ts:42](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/range-tof.ts#L42)

___

### temperature\_celsius

• `Optional` **temperature\_celsius**: `number`

Sensor temperature

#### Defined in

[types/sensor/range-tof.ts:38](https://github.com/tafystudio/tafystudio/blob/34fd8be075ed5aae21b0626c275822912464ee10/packages/hal-schemas/src/types/sensor/range-tof.ts#L38)
