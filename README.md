# DocsTracker

A CLI tool for tracking and managing documentation updates in a codebase. DocsTracker ensures documentation remains in sync with code changes using a precise mapping system.

## Features

- **Advanced Mapping System**: Track code-to-documentation relationships with line-based and character-based precision
- **Change Detection**: Automatically detect when code changes require documentation updates
- **Robust Validations**: Comprehensive checks for file existence, line lengths, and mapping conflicts
- **User-Friendly CLI**: Simple commands for managing documentation mappings
- **Project-Aware**: Automatically detects project root and supports various project types

## Installation

```bash
npm install -g docs-tracker
```

## Usage

### Check Documentation Status

```bash
doc-tracker check [source] [target]
```

Examples:
```bash
# Check all mappings
doc-tracker check

# Check specific mapping
doc-tracker check src/index.ts:10-20 docs/api.md:5-15
```

Scans mapped files for changes and flags outdated documentation.

### Add a New Mapping

```bash
doc-tracker add <source> <target>
```

Examples:
```bash
# Line-based mapping (multiple lines)
doc-tracker add src/main.py:12-20 docs/usage.md:5-10

# Line-based mapping (single line)
doc-tracker add src/main.py:12 docs/usage.md:5

# Character-based mapping (specific characters in a line)
doc-tracker add src/main.py:12@5-30 docs/usage.md:5@10-20
```

The tool supports two types of ranges:
1. **Line-based ranges**: Specify a line number or range of lines
   - Single line: `file:5`
   - Line range: `file:5-10`
2. **Character-based ranges**: Specify exact characters within a line
   - Format: `file:line@start-end`
   - Example: `file:12@5-30` (characters 5-30 of line 12)

### List All Mappings

```bash
doc-tracker list
```

Displays all configured documentation mappings with their indices.

### Remove a Mapping

```bash
doc-tracker remove <index>
```

Example:
```bash
doc-tracker remove 1
```

## Configuration

Mappings are stored in `.doc-tracker` in your project root. The tool automatically detects the project root by looking for common project markers:

- `package.json` (Node.js)
- `.git` (Git repository)
- `pom.xml` (Maven/Java)
- `build.gradle` (Gradle/Java)
- `requirements.txt` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)
- `Gemfile` (Ruby)
- `composer.json` (PHP)

If no project root markers are found, the current directory is used as the project root.

## Supported File Types

### Source Files
- JavaScript/TypeScript: `.js`, `.jsx`, `.ts`, `.tsx`
- Python: `.py`
- Java: `.java`
- C/C++: `.c`, `.cpp`, `.h`, `.hpp`, `.cc`
- Go: `.go`
- Ruby: `.rb`
- PHP: `.php`
- Swift: `.swift`
- Kotlin: `.kt`
- Scala: `.scala`
- Rust: `.rs`
- And many more...

### Documentation Files
- Markdown: `.md`
- Text: `.txt`
- reStructuredText: `.rst`
- AsciiDoc: `.adoc`
- Word: `.doc`, `.docx`
- PDF: `.pdf`

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