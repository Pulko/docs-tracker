# DocsTracker

A CLI tool for tracking and managing documentation updates in a codebase. DocsTracker ensures documentation remains in sync with code changes using a precise mapping system.

## Features

- **Advanced Mapping System**: Track code-to-documentation relationships with line-based and character-based precision
- **Change Detection**: Identify modified but uncommitted files and detect needed documentation updates
- **Robust Validations**: Comprehensive checks for file existence, line lengths, and mapping conflicts
- **User-Friendly CLI**: Simple commands for managing documentation mappings

## Installation

```bash
npm install -g docs-tracker
```

## Usage

### Check Documentation Status

```bash
doc-tracker check
```

Scans mapped files for changes and flags outdated documentation.

### Add a New Mapping

```bash
# Line-based mapping
doc-tracker add src/main.py:12-20 docs/usage.md:5-10

# Character-based mapping
doc-tracker add src/main.py:12[5-30] docs/usage.md:5[0-15]
```

### List All Mappings

```bash
# Basic list
doc-tracker list

# Detailed list with character-level information
doc-tracker list --detailed
```

### Remove a Mapping

```bash
# Line-based mapping
doc-tracker remove src/main.py:12-20

# Character-based mapping
doc-tracker remove src/main.py:12[5-30]
```

## Mapping File Format

Mappings are stored in a `.doc-tracker` file in your project root. Each line represents a mapping in one of two formats:

### Line-based Mapping
```
src/main.py:12-20 -> docs/usage.md:5-10
```

### Character-based Mapping
```
src/main.py:12[5-30] -> docs/usage.md:5[0-15]
```

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```

## License

MIT 