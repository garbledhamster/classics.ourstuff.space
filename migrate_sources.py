#!/usr/bin/env python3
"""
Script to migrate sourceUrl fields from reading.json to project.json

This script:
1. Reads all sourceUrls from reading.json
2. Matches them to books in project.json by title and author
3. Adds sourceUrl field to matching books in project.json
4. Saves the updated project.json with sourceUrls
"""

import json
from collections import defaultdict


def load_json_file(filename):
    """Load and return JSON data from file"""
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json_file(filename, data):
    """Save JSON data to file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')  # Add trailing newline


def normalize_title(title):
    """Normalize title for matching"""
    return title.lower().strip().replace('the ', '').replace('a ', '').replace('an ', '')


def build_source_mapping(reading_data):
    """
    Build a mapping of book titles to their source URLs from reading.json
    Returns dict with keys like "author|title" for better matching
    """
    sources = {}
    
    for year in reading_data.get('years', []):
        if not year:
            continue
        for reading_item in year.get('readings', []):
            if not reading_item:
                continue
            author = reading_item.get('author', '').strip()
            for work in reading_item.get('works', []):
                if not work:
                    continue
                title = work.get('title', '').strip()
                source_url = work.get('sourceUrl', '').strip()
                
                if title and source_url:
                    # Create multiple keys for better matching
                    normalized_title = normalize_title(title)
                    
                    # Key by exact title
                    sources[title.lower()] = source_url
                    
                    # Key by author and title
                    if author:
                        sources[f"{author.lower()}|{title.lower()}"] = source_url
                        sources[f"{author.lower()}|{normalized_title}"] = source_url
                    
                    # Key by normalized title
                    sources[normalized_title] = source_url
    
    return sources


def find_source_for_book(book, sources):
    """
    Try to find a source URL for a book by matching title and author
    Returns the source URL or None
    """
    title = book.get('title', '').strip()
    author = book.get('author', '').strip() if book.get('author') else ''
    
    if not title:
        return None
    
    # Try exact match with author and title
    if author:
        key = f"{author.lower()}|{title.lower()}"
        if key in sources:
            return sources[key]
        
        # Try with normalized title
        normalized_title = normalize_title(title)
        key = f"{author.lower()}|{normalized_title}"
        if key in sources:
            return sources[key]
    
    # Try exact title match
    if title.lower() in sources:
        return sources[title.lower()]
    
    # Try normalized title match
    normalized_title = normalize_title(title)
    if normalized_title in sources:
        return sources[normalized_title]
    
    return None


def main():
    """Main function to migrate sources"""
    print("Loading reading.json...")
    reading_data = load_json_file('reading.json')
    
    print("Building source mapping...")
    sources = build_source_mapping(reading_data)
    print(f"  Found {len(set(sources.values()))} unique source URLs")
    
    print("Loading project.json...")
    books = load_json_file('project.json')
    print(f"  Loaded {len(books)} books")
    
    print("Matching sources to books...")
    matched = 0
    for book in books:
        source_url = find_source_for_book(book, sources)
        if source_url:
            book['sourceUrl'] = source_url
            matched += 1
    
    print(f"  Matched {matched} books with sources")
    
    print("Saving updated project.json...")
    save_json_file('project.json', books)
    
    print("✓ Migration complete!")
    print(f"\nSummary:")
    print(f"  Total books: {len(books)}")
    print(f"  Books with sources added: {matched}")
    print(f"  Books without sources: {len(books) - matched}")


if __name__ == '__main__':
    main()
