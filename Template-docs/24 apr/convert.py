import mammoth
import os
import glob

input_dir = "/Users/mac/Documents/AlemLab-pickpointoperations/Template-docs/24 apr"
output_dir = os.path.join(input_dir, "html-output")

# Convert all docx files
for filepath in glob.glob(os.path.join(input_dir, "*.docx")):
    filename = os.path.basename(filepath)
    name, _ = os.path.splitext(filename)
    output_path = os.path.join(output_dir, f"{name}.html")
    
    with open(filepath, "rb") as f:
        result = mammoth.convert_to_html(f)
        html = result.value
        messages = result.messages
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    
    print(f"Converted: {filename} -> {name}.html")
    if messages:
        for msg in messages:
            print(f"  {msg}")

print("Done!")
