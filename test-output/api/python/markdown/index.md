<!-- Tafy Hub API documentation master file -->

# Welcome to Tafy Hub API Documentation

The Tafy Hub API is the backend service for the Tafy Studio Robot Distributed Operation System (RDOS).

# API Reference

## Core Modules

Application configuration using Pydantic Settings

### *class* app.core.config.Settings(\_case_sensitive=None, \_nested_model_default_partial_update=None, \_env_prefix=None, \_env_file=PosixPath('.'), \_env_file_encoding=None, \_env_ignore_empty=None, \_env_nested_delimiter=None, \_env_nested_max_split=None, \_env_parse_none_str=None, \_env_parse_enums=None, \_cli_prog_name=None, \_cli_parse_args=None, \_cli_settings_source=None, \_cli_parse_none_str=None, \_cli_hide_none_type=None, \_cli_avoid_json=None, \_cli_enforce_required=None, \_cli_use_class_docs_for_groups=None, \_cli_exit_on_error=None, \_cli_prefix=None, \_cli_flag_prefix_char=None, \_cli_implicit_flags=None, \_cli_ignore_unknown_args=None, \_cli_kebab_case=None, \_cli_shortcuts=None, \_secrets_dir=None, \*\*values)

Bases: [`BaseSettings`](https://docs.pydantic.dev/latest/api/pydantic_settings/#pydantic_settings.BaseSettings)

#### API_V1_STR *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### PROJECT_NAME *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### VERSION *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### BACKEND_CORS_ORIGINS *: [`List`](https://docs.python.org/3/library/typing.html#typing.List)[[`AnyHttpUrl`](https://docs.pydantic.dev/latest/api/networks/#pydantic.networks.AnyHttpUrl)]*

#### *classmethod* assemble_cors_origins(v)

* **Return type:**
  [`Union`](https://docs.python.org/3/library/typing.html#typing.Union)[[`List`](https://docs.python.org/3/library/typing.html#typing.List)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)], [`str`](https://docs.python.org/3/library/stdtypes.html#str)]

#### NATS_URL *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### NATS_USER *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### NATS_PASSWORD *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### DATABASE_URL *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### REDIS_URL *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### SECRET_KEY *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### ALGORITHM *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### ACCESS_TOKEN_EXPIRE_MINUTES *: [`int`](https://docs.python.org/3/library/functions.html#int)*

#### LOG_LEVEL *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### LOG_FORMAT *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### model_config *: ClassVar[SettingsConfigDict]* *= {'arbitrary_types_allowed': True, 'case_sensitive': True, 'cli_avoid_json': False, 'cli_enforce_required': False, 'cli_exit_on_error': True, 'cli_flag_prefix_char': '-', 'cli_hide_none_type': False, 'cli_ignore_unknown_args': False, 'cli_implicit_flags': False, 'cli_kebab_case': False, 'cli_parse_args': None, 'cli_parse_none_str': None, 'cli_prefix': '', 'cli_prog_name': None, 'cli_shortcuts': None, 'cli_use_class_docs_for_groups': False, 'enable_decoding': True, 'env_file': '.env', 'env_file_encoding': 'utf-8', 'env_ignore_empty': False, 'env_nested_delimiter': None, 'env_nested_max_split': None, 'env_parse_enums': None, 'env_parse_none_str': None, 'env_prefix': '', 'extra': 'forbid', 'json_file': None, 'json_file_encoding': None, 'nested_model_default_partial_update': False, 'protected_namespaces': ('model_validate', 'model_dump', 'settings_customise_sources'), 'secrets_dir': None, 'toml_file': None, 'validate_default': True, 'yaml_config_section': None, 'yaml_file': None, 'yaml_file_encoding': None}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

<a id="module-app.core.nats"></a>

NATS client singleton for the application

### *class* app.core.nats.NATSClient

Bases: [`object`](https://docs.python.org/3/library/functions.html#object)

NATS client wrapper with connection management

#### \_\_init_\_()

#### *async* connect()

Connect to NATS server

#### *async* close()

Close NATS connection

#### *property* is_connected *: [bool](https://docs.python.org/3/library/functions.html#bool)*

Check if connected to NATS

#### *async* publish(subject, data)

Publish message to subject

#### *async* subscribe(subject, callback)

Subscribe to subject with callback

## Database Models

Database models package

## API Schemas

Pydantic schemas for request/response validation

### *class* app.schemas.DeviceCreate(\*\*data)

Bases: `DeviceBase`

Schema for creating a device

#### id *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### ip_address *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### mac_address *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### model_config *: ClassVar[ConfigDict]* *= {}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

### *class* app.schemas.DeviceUpdate(\*\*data)

Bases: [`BaseModel`](https://docs.pydantic.dev/latest/api/base_model/#pydantic.BaseModel)

Schema for updating a device

#### name *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### status *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[`DeviceStatus`]*

#### capabilities *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`Dict`](https://docs.python.org/3/library/typing.html#typing.Dict)[[`str`](https://docs.python.org/3/library/stdtypes.html#str), [`Any`](https://docs.python.org/3/library/typing.html#typing.Any)]]*

#### device_metadata *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`Dict`](https://docs.python.org/3/library/typing.html#typing.Dict)[[`str`](https://docs.python.org/3/library/stdtypes.html#str), [`Any`](https://docs.python.org/3/library/typing.html#typing.Any)]]*

#### ip_address *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### model_config *: ClassVar[ConfigDict]* *= {}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

### *class* app.schemas.DeviceResponse(\*\*data)

Bases: `DeviceBase`

Schema for device responses

#### id *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### status *: `DeviceStatus`*

#### claimed *: [`bool`](https://docs.python.org/3/library/functions.html#bool)*

#### ip_address *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### mac_address *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### last_seen *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`datetime`](https://docs.python.org/3/library/datetime.html#datetime.datetime)]*

#### created_at *: [`datetime`](https://docs.python.org/3/library/datetime.html#datetime.datetime)*

#### updated_at *: [`datetime`](https://docs.python.org/3/library/datetime.html#datetime.datetime)*

#### model_config *: ClassVar[ConfigDict]* *= {'from_attributes': True}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

### *class* app.schemas.DeviceList(\*\*data)

Bases: [`BaseModel`](https://docs.pydantic.dev/latest/api/base_model/#pydantic.BaseModel)

Schema for device list responses

#### devices *: [`List`](https://docs.python.org/3/library/typing.html#typing.List)[[`DeviceResponse`](#app.schemas.DeviceResponse)]*

#### total *: [`int`](https://docs.python.org/3/library/functions.html#int)*

#### model_config *: ClassVar[ConfigDict]* *= {}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

### *class* app.schemas.FlowCreate(\*\*data)

Bases: `FlowBase`

Schema for creating a flow

#### model_config *: ClassVar[ConfigDict]* *= {}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

### *class* app.schemas.FlowUpdate(\*\*data)

Bases: [`BaseModel`](https://docs.pydantic.dev/latest/api/base_model/#pydantic.BaseModel)

Schema for updating a flow

#### name *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### description *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]*

#### config *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`Dict`](https://docs.python.org/3/library/typing.html#typing.Dict)[[`str`](https://docs.python.org/3/library/stdtypes.html#str), [`Any`](https://docs.python.org/3/library/typing.html#typing.Any)]]*

#### target_nodes *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`List`](https://docs.python.org/3/library/typing.html#typing.List)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]]*

#### flow_metadata *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`Dict`](https://docs.python.org/3/library/typing.html#typing.Dict)[[`str`](https://docs.python.org/3/library/stdtypes.html#str), [`Any`](https://docs.python.org/3/library/typing.html#typing.Any)]]*

#### model_config *: ClassVar[ConfigDict]* *= {}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

### *class* app.schemas.FlowResponse(\*\*data)

Bases: `FlowBase`

Schema for flow responses

#### id *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### deployed *: [`bool`](https://docs.python.org/3/library/functions.html#bool)*

#### deployed_at *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`datetime`](https://docs.python.org/3/library/datetime.html#datetime.datetime)]*

#### version *: [`int`](https://docs.python.org/3/library/functions.html#int)*

#### created_at *: [`datetime`](https://docs.python.org/3/library/datetime.html#datetime.datetime)*

#### updated_at *: [`datetime`](https://docs.python.org/3/library/datetime.html#datetime.datetime)*

#### model_config *: ClassVar[ConfigDict]* *= {'from_attributes': True}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

### *class* app.schemas.FlowDeploy(\*\*data)

Bases: [`BaseModel`](https://docs.pydantic.dev/latest/api/base_model/#pydantic.BaseModel)

Schema for flow deployment

#### target_nodes *: [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`List`](https://docs.python.org/3/library/typing.html#typing.List)[[`str`](https://docs.python.org/3/library/stdtypes.html#str)]]*

#### force *: [`bool`](https://docs.python.org/3/library/functions.html#bool)*

#### model_config *: ClassVar[ConfigDict]* *= {}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

### *class* app.schemas.SystemInfo(\*\*data)

Bases: [`BaseModel`](https://docs.pydantic.dev/latest/api/base_model/#pydantic.BaseModel)

System information schema

#### version *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### hostname *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### platform *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### python_version *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### uptime_seconds *: [`float`](https://docs.python.org/3/library/functions.html#float)*

#### memory_usage_mb *: [`float`](https://docs.python.org/3/library/functions.html#float)*

#### cpu_percent *: [`float`](https://docs.python.org/3/library/functions.html#float)*

#### nats_connected *: [`bool`](https://docs.python.org/3/library/functions.html#bool)*

#### redis_connected *: [`bool`](https://docs.python.org/3/library/functions.html#bool)*

#### database_connected *: [`bool`](https://docs.python.org/3/library/functions.html#bool)*

#### model_config *: ClassVar[ConfigDict]* *= {}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

### *class* app.schemas.HealthCheck(\*\*data)

Bases: [`BaseModel`](https://docs.pydantic.dev/latest/api/base_model/#pydantic.BaseModel)

Health check response schema

#### status *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### version *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### checks *: [`Dict`](https://docs.python.org/3/library/typing.html#typing.Dict)[[`str`](https://docs.python.org/3/library/stdtypes.html#str), [`bool`](https://docs.python.org/3/library/functions.html#bool)]*

#### timestamp *: [`datetime`](https://docs.python.org/3/library/datetime.html#datetime.datetime)*

#### model_config *: ClassVar[ConfigDict]* *= {}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

### *class* app.schemas.LogEntry(\*\*data)

Bases: [`BaseModel`](https://docs.pydantic.dev/latest/api/base_model/#pydantic.BaseModel)

Log entry schema

#### timestamp *: [`datetime`](https://docs.python.org/3/library/datetime.html#datetime.datetime)*

#### level *: `LogLevel`*

#### message *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### module *: [`str`](https://docs.python.org/3/library/stdtypes.html#str)*

#### metadata *: [`Dict`](https://docs.python.org/3/library/typing.html#typing.Dict)[[`str`](https://docs.python.org/3/library/stdtypes.html#str), [`Any`](https://docs.python.org/3/library/typing.html#typing.Any)]*

#### model_config *: ClassVar[ConfigDict]* *= {}*

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## API Endpoints

Device management endpoints

### *async* app.api.v1.endpoints.devices.list_devices(status=Query(None))

List all discovered devices

### *async* app.api.v1.endpoints.devices.get_device(device_id)

Get device details

### *async* app.api.v1.endpoints.devices.create_device(device_data)

Register a new device

### *async* app.api.v1.endpoints.devices.update_device(device_id, update_data)

Update device information

### *async* app.api.v1.endpoints.devices.claim_device(device_id)

Claim a device for this hub

### *async* app.api.v1.endpoints.devices.send_command(device_id, command=Body(PydanticUndefined))

Send command to device

<a id="module-app.api.v1.endpoints.flows"></a>

Flow management endpoints for Node-RED integration

### *async* app.api.v1.endpoints.flows.list_flows(deployed_only=Query(False))

List available flows

### *async* app.api.v1.endpoints.flows.get_flow(flow_id)

Get flow details

### *async* app.api.v1.endpoints.flows.create_flow(flow_data)

Create a new flow

### *async* app.api.v1.endpoints.flows.update_flow(flow_id, update_data)

Update flow configuration

### *async* app.api.v1.endpoints.flows.deploy_flow(flow_id, deploy_data=Body(target_nodes=None force=False))

Deploy flow to devices

### *async* app.api.v1.endpoints.flows.undeploy_flow(flow_id)

Undeploy a running flow

## Services

Business logic services

### *class* app.services.DeviceService

Bases: [`object`](https://docs.python.org/3/library/functions.html#object)

Service for managing devices

#### \_\_init_\_()

#### *async* create_device(device_data)

Create a new device

* **Return type:**
  [`DeviceResponse`](#app.schemas.DeviceResponse)

#### *async* get_device(device_id)

Get device by ID

* **Return type:**
  [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`DeviceResponse`](#app.schemas.DeviceResponse)]

#### *async* update_device(device_id, update_data)

Update device

* **Return type:**
  [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`DeviceResponse`](#app.schemas.DeviceResponse)]

#### *async* list_devices(status=None)

List all devices

* **Return type:**
  [`List`](https://docs.python.org/3/library/typing.html#typing.List)[[`DeviceResponse`](#app.schemas.DeviceResponse)]

#### *async* claim_device(device_id)

Claim a device

* **Return type:**
  [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`DeviceResponse`](#app.schemas.DeviceResponse)]

#### *async* send_command(device_id, command)

Send command to device

* **Return type:**
  [`bool`](https://docs.python.org/3/library/functions.html#bool)

### *class* app.services.FlowService

Bases: [`object`](https://docs.python.org/3/library/functions.html#object)

Service for managing Node-RED flows

#### \_\_init_\_()

#### *async* create_flow(flow_data)

Create a new flow

* **Return type:**
  [`FlowResponse`](#app.schemas.FlowResponse)

#### *async* get_flow(flow_id)

Get flow by ID

* **Return type:**
  [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`FlowResponse`](#app.schemas.FlowResponse)]

#### *async* update_flow(flow_id, update_data)

Update flow

* **Return type:**
  [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`FlowResponse`](#app.schemas.FlowResponse)]

#### *async* list_flows(deployed_only=False)

List all flows

* **Return type:**
  [`List`](https://docs.python.org/3/library/typing.html#typing.List)[[`FlowResponse`](#app.schemas.FlowResponse)]

#### *async* deploy_flow(flow_id, target_nodes=None)

Deploy flow to nodes

* **Return type:**
  [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`FlowResponse`](#app.schemas.FlowResponse)]

#### *async* undeploy_flow(flow_id)

Undeploy flow from nodes

* **Return type:**
  [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`FlowResponse`](#app.schemas.FlowResponse)]

### *class* app.services.NATSService

Bases: [`object`](https://docs.python.org/3/library/functions.html#object)

Service for NATS messaging operations

#### \_\_init_\_()

#### *async* subscribe(subject, handler)

Subscribe to a NATS subject

* **Return type:**
  [`str`](https://docs.python.org/3/library/stdtypes.html#str)

#### *async* unsubscribe(sub_id)

Unsubscribe from a subject

#### *async* publish(subject, data, reply=None)

Publish message to a subject

#### *async* request(subject, data, timeout=5.0)

Send request and wait for response

* **Return type:**
  [`Optional`](https://docs.python.org/3/library/typing.html#typing.Optional)[[`Dict`](https://docs.python.org/3/library/typing.html#typing.Dict)[[`str`](https://docs.python.org/3/library/stdtypes.html#str), [`Any`](https://docs.python.org/3/library/typing.html#typing.Any)]]

#### *async* setup_standard_subscriptions()

Set up standard Hub subscriptions

# Indices and tables

* [Index](genindex.md)
* [Module Index](py-modindex.md)
* [Search Page](search.md)
