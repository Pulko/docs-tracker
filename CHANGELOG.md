# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2024-03-22

### Added
- New `confirm` command (`doc-tracker confirm` or `dt -cf`) to validate and update documentation hashes
- Support for confirming individual mappings via `doc-tracker confirm <source> <target>`
- Support for bulk confirmation of all mappings via `doc-tracker confirm`

### Changed
- Improved hash update workflow - developers can now explicitly confirm when documentation has been updated
- Enhanced feedback during confirmation process with clear success/failure messages

The new confirm command provides a way for developers to explicitly acknowledge that documentation has been updated to match code changes. This helps maintain documentation accuracy by ensuring the tracking system knows when documentation has been intentionally updated rather than just detecting changes. The command updates the stored hashes in `.doc-tracker` to match the current state of both source and documentation files.


## [2.0.0] - 2024-03-22

### Added
- Character-based range support for more precise documentation mapping
- Improved error handling and validation for file paths
- New test coverage for edge cases and error scenarios

### Changed
- Breaking: Updated mapping file format to support character ranges
- Enhanced change detection algorithm for better accuracy
- Improved CLI feedback with more detailed error messages

### Fixed
- Issue with relative path resolution in config files
- Inconsistent hash generation for certain file types
- Edge cases in line number validation


## [1.1.0] - 2024-03-21

### Changed
- Improved README documentation with more accurate command examples
- Added comprehensive list of supported file types
- Added project root detection documentation
- Fixed character-based mapping syntax documentation

## [1.0.0] - 2024-03-21

### Added
- Initial release
- Basic CLI functionality
- Documentation mapping system
- Change detection
- File validation 