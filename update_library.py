#!/usr/bin/env python3
"""
Script to update reading.json with data from Great Books of the Western World.csv
Adds missing works, plan_selection, themes, and great_ideas fields.
"""

import json
import csv
from typing import Dict, List, Any

def normalize_title(title: str) -> str:
    """Normalize title for comparison"""
    return title.lower().strip()

def normalize_author(author: str) -> str:
    """Normalize author name for comparison"""
    # Handle common variations
    author = author.strip()
    author_map = {
        'st. thomas aquinas': 'aquinas',
        'st. augustine': 'augustine',
        'st. thomas': 'aquinas',
    }
    lower_author = author.lower()
    return author_map.get(lower_author, lower_author)

def combine_great_ideas(vol_i: str, vol_ii: str) -> List[str]:
    """Combine GreatIdeas from Vol I and Vol II into a single list"""
    ideas = []
    if vol_i:
        ideas.extend([idea.strip() for idea in vol_i.split(';') if idea.strip()])
    if vol_ii:
        ideas.extend([idea.strip() for idea in vol_ii.split(';') if idea.strip()])
    # Remove duplicates while preserving order
    seen = set()
    unique_ideas = []
    for idea in ideas:
        if idea not in seen:
            seen.add(idea)
            unique_ideas.append(idea)
    return unique_ideas

def load_csv_data(csv_path: str) -> Dict[int, Dict[str, Dict[str, Any]]]:
    """Load CSV data into a structured format"""
    csv_map = {}
    
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            year = row['Year']
            if not year or not year.isdigit():
                continue
            year = int(year)
            
            author = row['Author'].strip()
            work = row['Work'].strip()
            
            if year not in csv_map:
                csv_map[year] = {}
            if author not in csv_map[year]:
                csv_map[year][author] = {}
            
            # Combine GreatIdeas
            great_ideas = combine_great_ideas(
                row.get('GreatIdeas_VolI', ''),
                row.get('GreatIdeas_VolII', '')
            )
            
            csv_map[year][author][work] = {
                'plan_selection': row.get('PlanSelection', '').strip(),
                'themes': row.get('Themes', '').strip(),
                'great_ideas': great_ideas,
                'seq_in_year': int(row['SeqInYear']) if row.get('SeqInYear') else 0,
                'author': author,
                'work': work
            }
    
    return csv_map

def find_matching_work(json_works: List[Dict], csv_work_title: str, csv_author: str) -> Dict:
    """Try to find a matching work in the JSON works list"""
    csv_title_norm = normalize_title(csv_work_title)
    csv_author_norm = normalize_author(csv_author)
    
    for work in json_works:
        json_title_norm = normalize_title(work['title'])
        
        # Exact match
        if json_title_norm == csv_title_norm:
            return work
        
        # Check if CSV title is contained in JSON title or vice versa
        if csv_title_norm in json_title_norm or json_title_norm in csv_title_norm:
            return work
    
    return None

def update_reading_json(reading_data: Dict, csv_map: Dict) -> Dict:
    """Update reading.json with data from CSV"""
    
    for year_num in range(1, 11):
        if year_num not in csv_map:
            continue
        
        # Find the year in reading.json
        json_year = None
        for y in reading_data['years']:
            if y['year'] == year_num:
                json_year = y
                break
        
        if not json_year:
            print(f"Warning: Year {year_num} not found in reading.json")
            continue
        
        # Process each reading entry
        for reading in json_year['readings']:
            json_author = reading['author']
            json_author_norm = normalize_author(json_author)
            
            # Find matching CSV author
            csv_author = None
            for author in csv_map[year_num]:
                if normalize_author(author) == json_author_norm:
                    csv_author = author
                    break
            
            if not csv_author:
                # Try partial match
                for author in csv_map[year_num]:
                    if normalize_author(author) in json_author_norm or json_author_norm in normalize_author(author):
                        csv_author = author
                        break
            
            if csv_author:
                # Update each work with CSV data
                for work in reading['works']:
                    csv_work_title = None
                    csv_work_data = None
                    
                    # Try to find exact match
                    for work_title in csv_map[year_num][csv_author]:
                        if normalize_title(work_title) == normalize_title(work['title']):
                            csv_work_title = work_title
                            csv_work_data = csv_map[year_num][csv_author][work_title]
                            break
                    
                    # Try partial match
                    if not csv_work_data:
                        for work_title in csv_map[year_num][csv_author]:
                            if (normalize_title(work_title) in normalize_title(work['title']) or 
                                normalize_title(work['title']) in normalize_title(work_title)):
                                csv_work_title = work_title
                                csv_work_data = csv_map[year_num][csv_author][work_title]
                                break
                    
                    if csv_work_data:
                        # Add/update fields
                        if csv_work_data['plan_selection'] and 'selection' not in work:
                            work['selection'] = csv_work_data['plan_selection']
                        elif csv_work_data['plan_selection']:
                            # Update selection if CSV has it
                            work['selection'] = csv_work_data['plan_selection']
                        
                        if csv_work_data['themes']:
                            work['themes'] = csv_work_data['themes']
                        
                        if csv_work_data['great_ideas']:
                            work['great_ideas'] = csv_work_data['great_ideas']
                        
                        # Mark as processed
                        csv_map[year_num][csv_author][csv_work_title]['processed'] = True
    
    # Now handle missing works from CSV that weren't found in JSON
    for year_num in sorted(csv_map.keys()):
        json_year = None
        for y in reading_data['years']:
            if y['year'] == year_num:
                json_year = y
                break
        
        if not json_year:
            continue
        
        for csv_author in sorted(csv_map[year_num].keys()):
            for csv_work_title in sorted(csv_map[year_num][csv_author].keys()):
                csv_work_data = csv_map[year_num][csv_author][csv_work_title]
                
                if csv_work_data.get('processed'):
                    continue
                
                # This work is missing - we need to add it
                print(f"Year {year_num}: Adding missing work - {csv_author}: {csv_work_title}")
                
                # Find if there's already a reading entry for this author
                found_reading = None
                for reading in json_year['readings']:
                    if normalize_author(reading['author']) == normalize_author(csv_author):
                        found_reading = reading
                        break
                
                # Create the work object
                new_work = {
                    'title': csv_work_title
                }
                if csv_work_data['plan_selection']:
                    new_work['selection'] = csv_work_data['plan_selection']
                if csv_work_data['themes']:
                    new_work['themes'] = csv_work_data['themes']
                if csv_work_data['great_ideas']:
                    new_work['great_ideas'] = csv_work_data['great_ideas']
                
                if found_reading:
                    # Add to existing reading entry
                    found_reading['works'].append(new_work)
                else:
                    # Create a new reading entry
                    new_reading = {
                        'order': csv_work_data['seq_in_year'],
                        'tier': 'core',  # Default to core
                        'author': csv_author,
                        'works': [new_work]
                    }
                    json_year['readings'].append(new_reading)
        
        # Sort readings by order
        json_year['readings'].sort(key=lambda x: x.get('order', 999))
    
    return reading_data

def main():
    csv_path = '/home/runner/work/classics.ourstuff.space/classics.ourstuff.space/Great Books of the Western World.csv'
    json_path = '/home/runner/work/classics.ourstuff.space/classics.ourstuff.space/reading.json'
    output_path = '/home/runner/work/classics.ourstuff.space/classics.ourstuff.space/reading.json'
    
    print("Loading CSV data...")
    csv_map = load_csv_data(csv_path)
    
    print("Loading reading.json...")
    with open(json_path, 'r') as f:
        reading_data = json.load(f)
    
    print("\nUpdating reading.json with CSV data...")
    updated_data = update_reading_json(reading_data, csv_map)
    
    print("\nSaving updated reading.json...")
    with open(output_path, 'w') as f:
        json.dump(updated_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nDone! Updated reading.json saved to {output_path}")
    
    # Print summary statistics
    total_works = 0
    works_with_themes = 0
    works_with_ideas = 0
    works_with_selection = 0
    
    for year in updated_data['years']:
        for reading in year['readings']:
            for work in reading['works']:
                total_works += 1
                if work.get('themes'):
                    works_with_themes += 1
                if work.get('great_ideas'):
                    works_with_ideas += 1
                if work.get('selection'):
                    works_with_selection += 1
    
    print(f"\nSummary:")
    print(f"  Total works: {total_works}")
    print(f"  Works with themes: {works_with_themes}")
    print(f"  Works with great_ideas: {works_with_ideas}")
    print(f"  Works with selection: {works_with_selection}")

if __name__ == '__main__':
    main()
