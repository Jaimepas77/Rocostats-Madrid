import json
from pathlib import Path


def clean_ocupacion_data(input_file: str, output_file: str = None) -> None:
    """
    Remove all Recintos entries where Ocupacion is 0 from the JSON file.
    
    Args:
        input_file: Path to the input JSON file
        output_file: Path to save the cleaned data. If None, overwrites input file.
    """
    # Use input file as output if not specified
    if output_file is None:
        output_file = input_file
    
    # Load the JSON data
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Clean data: remove recintos with Ocupacion == 0
    cleaned_data = []
    for timestamp_entry in data:
        cleaned_recintos = [
            recinto for recinto in timestamp_entry['data']
            if recinto.get('Ocupacion', 0) != 0
        ]
        
        # Only keep timestamp entries that still have data
        if cleaned_recintos:
            cleaned_data.append({
                'timestamp': timestamp_entry['timestamp'],
                'data': cleaned_recintos
            })
    
    # Save the cleaned data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Cleaned data saved to: {output_file}")


if __name__ == '__main__':
    # Path to the stats.json file
    project_root = Path(__file__).parent.parent
    input_path = project_root / 'data' / 'stats.json'
    output_path = project_root / 'data' / 'stats_cleaned.json'
    
    try:
        clean_ocupacion_data(str(input_path), str(output_path))
        print(f"Original file: {input_path}")
        print(f"Cleaned file: {output_path}")
    except FileNotFoundError:
        print(f"Error: File not found at {input_path}")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON file at {input_path}")
