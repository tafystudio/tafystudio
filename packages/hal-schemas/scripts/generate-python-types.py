#!/usr/bin/env python3
"""Generate Python type definitions from JSON schemas."""

import json
import os
from pathlib import Path
from typing import Any, Dict, List

def json_type_to_python(json_type: str, format: str = None) -> str:
    """Convert JSON Schema type to Python type hint."""
    type_map = {
        "string": "str",
        "integer": "int", 
        "number": "float",
        "boolean": "bool",
        "object": "Dict[str, Any]",
        "array": "List[Any]",
        "null": "None",
    }
    
    if json_type == "string" and format == "date-time":
        return "datetime"
    
    return type_map.get(json_type, "Any")

def pascal_to_snake(name: str) -> str:
    """Convert PascalCase to snake_case."""
    result = []
    for i, char in enumerate(name):
        if char.isupper() and i > 0:
            result.append("_")
        result.append(char.lower())
    return "".join(result)

def generate_pydantic_model(schema: Dict[str, Any], class_name: str) -> str:
    """Generate a Pydantic model from a JSON schema."""
    lines = []
    
    # Extract description
    description = schema.get("description", "")
    if description:
        lines.append(f'"""{description}"""')
        lines.append("")
    
    # Generate class definition
    lines.append(f"class {class_name}(BaseModel):")
    
    # Generate fields
    properties = schema.get("properties", {})
    required = set(schema.get("required", []))
    
    if not properties:
        lines.append("    pass")
    else:
        for prop_name, prop_schema in properties.items():
            field_name = prop_name
            field_type = json_type_to_python(
                prop_schema.get("type", "Any"),
                prop_schema.get("format")
            )
            
            # Handle arrays
            if prop_schema.get("type") == "array":
                item_type = json_type_to_python(
                    prop_schema.get("items", {}).get("type", "Any")
                )
                field_type = f"List[{item_type}]"
            
            # Handle objects
            elif prop_schema.get("type") == "object":
                field_type = "Dict[str, Any]"
            
            # Make optional if not required
            if prop_name not in required:
                field_type = f"Optional[{field_type}]"
            
            # Add field with description
            description = prop_schema.get("description", "")
            if description:
                lines.append(f'    {field_name}: {field_type} = Field(..., description="{description}")')
            else:
                default = " = None" if prop_name not in required else ""
                lines.append(f"    {field_name}: {field_type}{default}")
    
    # Add model config
    lines.append("")
    lines.append("    model_config = ConfigDict(")
    lines.append('        json_schema_extra={"$schema": schema.get("$schema", "")},')
    lines.append("        validate_assignment=True,")
    lines.append("    )")
    
    return "\n".join(lines)

def process_schema_file(schema_path: Path, output_path: Path):
    """Process a single schema file."""
    with open(schema_path) as f:
        schema = json.load(f)
    
    # Generate class name from filename
    filename = schema_path.stem
    class_name = "".join(word.capitalize() for word in filename.split("-"))
    
    # Generate imports
    imports = [
        "from datetime import datetime",
        "from typing import Any, Dict, List, Optional",
        "from pydantic import BaseModel, Field, ConfigDict",
    ]
    
    # Generate model
    model_code = generate_pydantic_model(schema, class_name)
    
    # Write output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        f.write("# Generated from JSON Schema - DO NOT EDIT\n")
        f.write("\n".join(imports))
        f.write("\n\n\n")
        f.write(model_code)
        f.write("\n")

def main():
    """Generate Python types for all schemas."""
    script_dir = Path(__file__).parent
    schemas_dir = script_dir.parent / "schemas"
    output_dir = script_dir.parent / "python" / "tafy_hal_schemas"
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create __init__.py
    init_file = output_dir / "__init__.py"
    init_imports = []
    
    # Process all schema files
    for schema_file in schemas_dir.rglob("*.json"):
        relative_path = schema_file.relative_to(schemas_dir)
        output_file = output_dir / relative_path.with_suffix(".py")
        
        print(f"Generating: {output_file}")
        process_schema_file(schema_file, output_file)
        
        # Add to imports
        module_path = str(relative_path.with_suffix("")).replace("/", ".")
        class_name = "".join(
            word.capitalize() for word in schema_file.stem.split("-")
        )
        init_imports.append(f"from .{module_path} import {class_name}")
    
    # Write __init__.py
    with open(init_file, "w") as f:
        f.write("# Generated HAL schema types\n\n")
        f.write("\n".join(sorted(init_imports)))
        f.write("\n\n__all__ = [\n")
        for imp in sorted(init_imports):
            class_name = imp.split()[-1]
            f.write(f'    "{class_name}",\n')
        f.write("]\n")
    
    print("✅ Python types generated successfully!")

if __name__ == "__main__":
    main()