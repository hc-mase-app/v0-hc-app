# Database Scripts

This folder contains SQL scripts for database schema and migrations.

## Active Scripts (DO NOT DELETE)

### Core Schema
- `41-create-tms-tables.sql` - Main TMS (Target Management System) schema
- `23-create-tms-laetms-schema.sql` - LAETMS schema (deprecated, use 41 instead)

### Performance & Features
- `43-add-leave-requests-composite-indexes.sql` - Performance indexes for leave requests
- `99-create-archive-logs-table.sql` - Archive system for document tracking

## Archived Scripts (Migration History)

These scripts represent historical database migrations and should be preserved for reference:

### Cleanup Operations (One-time use)
- `10-delete-all-leave-requests.sql`
- `15-delete-all-history.sql`
- `16-delete-leave-requests-only.sql`
- `17-delete-assessments-only.sql`
- `18-simple-delete-leave-requests.sql`

### Migration Steps (Development History)
- `24-add-manager-to-karyawan.sql` through `33-remove-constraint-and-fix.sql`
- `34-drop-all-nrp-tms-tables.sql` through `40-fix-nrp-counter-structure.sql`

### Debugging Scripts (Development Tools)
- `check-assessment-data.sql`
- `find-assessment-creator.sql`

## Usage Guidelines

1. **Production deployment**: Only run scripts marked as "Active" above
2. **New database setup**: Run active scripts in numerical order
3. **Migration history**: Keep archived scripts for reference, do not run in production
4. **New migrations**: Add new scripts with incremental numbers (e.g., 44-, 45-, etc.)

## Safety Notes

- Always backup database before running any script
- Test scripts in development environment first
- Document any new scripts added to this folder
- Do not delete any scripts without team approval
