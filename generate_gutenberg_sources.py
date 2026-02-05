#!/usr/bin/env python3
"""
Script to generate GUTENBERG_SOURCES.md from project.json

This script:
1. Loads all books from project.json (398 entries)
2. Uses sourceUrl field from project.json for books available on multiple Project Gutenberg sites:
   - gutenberg.org (US)
   - gutenberg.net.au (Australia)
   - gutenberg.ca (Canada)
   - freeread.de (Roy Glashan's Library)
3. Generates a markdown file with a matrix showing:
   - ✅ Available on Project Gutenberg or partner sites (with URL)
   - ⚠️ Uncertain/Need verification
   - ⛔ Not available (if manually marked)
"""

import json
from datetime import datetime
from collections import defaultdict


def load_json_file(filename):
    """Load and return JSON data from file"""
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)


def build_source_mapping(books):
    """
    Build a mapping of book titles to their source URLs from project.json
    Returns dict with normalized titles as keys and URLs as values
    """
    sources = {}
    
    for book in books:
        if not book:
            continue
        author = book.get('author', '')
        title = book.get('title', '').strip()
        source_url = book.get('sourceUrl', '')
        
        if title and source_url:
            # Create a normalized key for matching
            normalized_title = title.lower().strip()
            sources[normalized_title] = {
                'url': source_url,
                'title': title,
                'author': author
            }
    
    return sources


def get_gutenberg_number(url):
    """
    Extract Project Gutenberg ebook number from URL
    Supports multiple Gutenberg sites:
    - gutenberg.org (US)
    - gutenberg.net.au (Australia)
    - gutenberg.ca (Canada)
    - freeread.de (Roy Glashan's Library)
    """
    if not url:
        return None
        
    # Standard Project Gutenberg (US)
    if 'gutenberg.org/ebooks/' in url:
        parts = url.rstrip('/').split('/')
        return parts[-1]
    
    # Project Gutenberg Australia
    if 'gutenberg.net.au/ebooks' in url:
        parts = url.rstrip('/').split('/')
        # Extract the ebook ID from the filename (e.g., "0100101h.html" -> "0100101h")
        if parts:
            filename = parts[-1]
            if '.' in filename:
                return filename.split('.')[0]
            return filename
    
    # Project Gutenberg Canada
    if 'gutenberg.ca/' in url:
        parts = url.rstrip('/').split('/')
        if parts:
            return parts[-1].split('.')[0] if '.' in parts[-1] else parts[-1]
    
    # Roy Glashan's Library
    if 'freeread.de/' in url:
        parts = url.rstrip('/').split('/')
        if parts:
            return parts[-1].split('.')[0] if '.' in parts[-1] else parts[-1]
    
    return None


def find_source_for_book(book, sources):
    """
    Try to find a source URL for a book by matching title
    Returns tuple: (status, url, pg_number)
    - status: '✅' (has source), '⚠️' (needs check), '⛔' (not available)
    """
    title = book.get('title', '').strip()
    author = book.get('author')
    
    # Try exact match
    normalized_title = title.lower().strip()
    if normalized_title in sources:
        source = sources[normalized_title]
        pg_num = get_gutenberg_number(source['url'])
        return '✅', source['url'], pg_num
    
    # Try partial match (for cases like "The Republic" vs "Republic")
    for source_title, source_data in sources.items():
        # Check if one title contains the other
        if source_title in normalized_title or normalized_title in source_title:
            # Also check if authors match (if both have authors)
            if author and source_data.get('author'):
                if author.lower() in source_data['author'].lower():
                    pg_num = get_gutenberg_number(source_data['url'])
                    return '✅', source_data['url'], pg_num
    
    # No source found - needs verification
    return '⚠️', None, None


def group_books_by_category(books):
    """
    Group books by author and time period for better organization
    Returns dict with categories
    """
    categories = defaultdict(list)
    
    for book in books:
        author = book.get('author', 'Unknown')
        date = book.get('date', 0)
        
        if author:
            # Group by author
            categories[author].append(book)
        else:
            # Group by time period for books without author
            if date < 0:
                categories['Ancient Works (No Author)'].append(book)
            else:
                categories['Other Works (No Author)'].append(book)
    
    return categories


def generate_markdown(books, sources):
    """Generate the complete markdown document"""
    
    # Count statistics
    total_books = len(books)
    books_with_sources = 0
    books_needing_verification = 0
    
    # Build book list with sources
    books_data = []
    for book in books:
        status, url, pg_num = find_source_for_book(book, sources)
        books_data.append({
            'book': book,
            'status': status,
            'url': url,
            'pg_num': pg_num
        })
        
        if status == '✅':
            books_with_sources += 1
        elif status == '⚠️':
            books_needing_verification += 1
    
    # Start building markdown
    md = []
    md.append("# Project Gutenberg Sources for Classics Collection")
    md.append("")
    md.append("This document tracks the availability of books from our collection on various Project Gutenberg sites and partner libraries.")
    md.append("")
    md.append("**Supported Sources:**")
    md.append("- Project Gutenberg (US) - gutenberg.org")
    md.append("- Project Gutenberg Australia - gutenberg.net.au")
    md.append("- Project Gutenberg Canada - gutenberg.ca")
    md.append("- Roy Glashan's Library - freeread.de")
    md.append("")
    md.append("**Status Indicators:**")
    md.append("- ✅ Available with URL")
    md.append("- ⚠️ Needs verification")
    md.append("- ⛔ Not available")
    md.append("")
    md.append("**Statistics:**")
    md.append(f"- Total Books: {total_books}")
    md.append(f"- Available with Source: {books_with_sources}")
    md.append(f"- Needing Verification: {books_needing_verification}")
    md.append("")
    md.append(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d')}")
    md.append("")
    md.append("---")
    md.append("")
    
    # Table header
    md.append("## Complete Book List")
    md.append("")
    md.append("| Status | Item # | Title | Author | Vol | Date | PG # | URL |")
    md.append("|--------|--------|-------|--------|-----|------|------|-----|")
    
    # Add all books to the table
    for data in books_data:
        book = data['book']
        status = data['status']
        url = data['url']
        pg_num = data['pg_num']
        
        item = book.get('item', '')
        title = book.get('title', '').replace('|', '\\|')  # Escape pipes in markdown
        author = book.get('author', '') or ''
        author = author.replace('|', '\\|').replace('\n', ' ')  # Escape and clean
        vol = book.get('vol', '') or ''
        date = book.get('date', '') or ''
        
        # Format URL as markdown link or empty
        url_cell = f"[Link]({url})" if url else ''
        pg_cell = pg_num or ''
        
        md.append(f"| {status} | {item} | {title} | {author} | {vol} | {date} | {pg_cell} | {url_cell} |")
    
    md.append("")
    md.append("---")
    md.append("")
    
    # Summary section
    md.append("## How to Use This Document")
    md.append("")
    md.append("1. Search for your book by title, author, or item number")
    md.append("2. Check the status indicator:")
    md.append("   - ✅ Click the link to access the book")
    md.append("   - ⚠️ The book may be available but needs manual verification")
    md.append("   - ⛔ The book is not available")
    md.append("3. PG # is the ebook identifier from the source site")
    md.append("")
    md.append("## Notes")
    md.append("")
    md.append("- This file is automatically generated from `project.json`")
    md.append("- To update sources, add or modify `sourceUrl` entries in `project.json`")
    md.append("- Run `python3 generate_gutenberg_sources.py` to regenerate this file")
    md.append("- Sources include multiple Project Gutenberg sites (US, Australia, Canada) and Roy Glashan's Library")
    md.append("- Some books may have multiple editions with different identifiers on different sites")
    md.append("- Copyright status varies by jurisdiction - check your local laws")
    md.append("- Books on Project Gutenberg Australia/Canada may not be public domain in the US and vice versa")
    md.append("")
    
    return '\n'.join(md)


def main():
    """Main function to generate the markdown file"""
    print("Loading project.json...")
    books = load_json_file('project.json')
    print(f"  Loaded {len(books)} books")
    
    print("Building source mapping from project.json...")
    sources = build_source_mapping(books)
    print(f"  Found {len(sources)} books with source URLs")
    
    print("Generating markdown...")
    markdown = generate_markdown(books, sources)
    
    print("Writing GUTENBERG_SOURCES.md...")
    with open('GUTENBERG_SOURCES.md', 'w', encoding='utf-8') as f:
        f.write(markdown)
    
    print("✓ GUTENBERG_SOURCES.md generated successfully!")
    
    # Print summary
    books_with_sources = sum(1 for book in books if find_source_for_book(book, sources)[0] == '✅')
    print(f"\nSummary:")
    print(f"  Total books: {len(books)}")
    print(f"  Books with sources: {books_with_sources}")
    print(f"  Books needing verification: {len(books) - books_with_sources}")


if __name__ == '__main__':
    main()
