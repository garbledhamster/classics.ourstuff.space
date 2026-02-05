# Classics Collection - Project Gutenberg Sources

This repository tracks sources for a collection of classic books, with a focus on availability across multiple Project Gutenberg sites and partner libraries.

## Supported Sources

- **Project Gutenberg (US)** - gutenberg.org
- **Project Gutenberg Australia** - gutenberg.net.au
- **Project Gutenberg Canada** - gutenberg.ca
- **Roy Glashan's Library** - freeread.de

## Files

- **`project.json`**: Master list of 398 classic books with metadata (title, author, volume, date, item number)
- **`reading.json`**: Reading plan with source URLs for books available on Project Gutenberg
- **`GUTENBERG_SOURCES.md`**: Auto-generated reference showing which books have Project Gutenberg sources
- **`generate_gutenberg_sources.py`**: Script to generate GUTENBERG_SOURCES.md from the JSON files

## Generating the Sources Reference

The `GUTENBERG_SOURCES.md` file is **automatically generated** and should not be edited manually.

### Running the Script

```bash
python3 generate_gutenberg_sources.py
```

This will:
1. Read all 398 books from `project.json`
2. Cross-reference with `reading.json` to find existing source URLs from multiple Gutenberg sites
3. Generate `GUTENBERG_SOURCES.md` with a complete table showing:
   - ✅ Books with confirmed sources (with links)
   - ⚠️ Books that need verification
   - ⛔ Books confirmed not available

### Adding New Sources

To add or update sources from any supported Project Gutenberg site or partner library:

1. Edit `reading.json` and add/update the `sourceUrl` field for books in the reading plan
2. Run `python3 generate_gutenberg_sources.py` to regenerate the markdown file
3. Commit both files

Example of a book with source in `reading.json`:
```json
{
  "title": "Apology",
  "sourceUrl": "https://www.gutenberg.org/ebooks/1656"
}
```

Supported URL formats:
- `https://www.gutenberg.org/ebooks/[id]` (Project Gutenberg US)
- `https://gutenberg.net.au/ebooks[##]/[id].html` (Project Gutenberg Australia)
- `https://gutenberg.ca/[path]` (Project Gutenberg Canada)
- `https://freeread.de/[path]` (Roy Glashan's Library)

### Output Format

The generated markdown file includes:
- Statistics (total books, books with sources, books needing verification)
- Complete table of all 398 books with:
  - Status indicator
  - Item number from project.json
  - Title and author
  - Volume and date
  - Project Gutenberg ebook number
  - Direct link to the source

## Current Statistics

- **Total Books**: 398
- **Books with Sources**: 101
- **Books Needing Verification**: 297

## Project Structure

```
.
├── project.json                    # Master list of all books
├── reading.json                    # Reading plan with sources
├── generate_gutenberg_sources.py  # Generator script
├── GUTENBERG_SOURCES.md           # Generated reference (do not edit manually)
└── README.md                       # This file
```

## Contributing

When adding new books or sources:
1. Add book metadata to `project.json`
2. If the book has a Project Gutenberg source, add the `sourceUrl` to the corresponding entry in `reading.json`
3. Run the generator script to update `GUTENBERG_SOURCES.md`
4. Commit all changed files

## License

The book metadata and scripts are provided for reference purposes. Individual books have their own copyright status on Project Gutenberg.
