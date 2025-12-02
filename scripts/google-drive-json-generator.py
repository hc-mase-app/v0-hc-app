#!/usr/bin/env python3
"""
Helper script untuk convert Google Drive links menjadi JSON format
untuk HCGA IMS Document Management System

Usage:
  python scripts/google-drive-json-generator.py

Paste your Google Drive links (one per line), then press Ctrl+D (Unix) or Ctrl+Z (Windows)
"""

import re
import json
from datetime import datetime

def extract_drive_id(url):
    """Extract Google Drive file ID from URL"""
    patterns = [
        r'/file/d/([a-zA-Z0-9_-]+)',
        r'id=([a-zA-Z0-9_-]+)',
        r'/folders/([a-zA-Z0-9_-]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    # If it's just an ID
    if re.match(r'^[a-zA-Z0-9_-]+$', url):
        return url
    
    return None

def main():
    print("=" * 60)
    print("Google Drive to JSON Converter untuk HCGA IMS")
    print("=" * 60)
    print("\nPaste Google Drive links (one per line)")
    print("Format: https://drive.google.com/file/d/FILE_ID/view")
    print("\nPress Enter twice when done, then Ctrl+D (Unix) or Ctrl+Z (Windows)\n")
    
    documents = []
    line_num = 1
    
    try:
        while True:
            try:
                line = input(f"{line_num}. ")
                if not line.strip():
                    continue
                    
                drive_id = extract_drive_id(line)
                
                if drive_id:
                    print(f"   → Found ID: {drive_id}")
                    doc_name = input(f"   → Document name: ")
                    
                    doc = {
                        "name": doc_name or f"Document {line_num}",
                        "driveId": drive_id,
                        "size": "Unknown",
                        "uploadedAt": datetime.now().strftime("%d/%m/%Y"),
                        "category": "sk"  # Change this as needed
                    }
                    documents.append(doc)
                    print(f"   ✓ Added\n")
                    line_num += 1
                else:
                    print(f"   ✗ Invalid URL or ID\n")
                    
            except EOFError:
                break
    except KeyboardInterrupt:
        print("\n\nCancelled")
        return
    
    if documents:
        output = {
            "documents": documents
        }
        
        json_output = json.dumps(output, indent=2, ensure_ascii=False)
        
        print("\n" + "=" * 60)
        print("Generated JSON:")
        print("=" * 60)
        print(json_output)
        print("\n" + "=" * 60)
        print(f"Total documents: {len(documents)}")
        print("=" * 60)
        
        # Save to file
        category = input("\nEnter category name (sk/form/sop-ik/etc): ").strip() or "sk"
        filename = f"public/google-drive-documents/{category}/documents.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(json_output)
            print(f"\n✓ Saved to: {filename}")
        except Exception as e:
            print(f"\n✗ Could not save file: {e}")
            print(f"\nCopy the JSON above and save manually to:")
            print(f"  {filename}")
    else:
        print("\nNo documents added")

if __name__ == "__main__":
    main()
