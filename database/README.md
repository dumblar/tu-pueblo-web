# Database Migrations

This directory contains SQL migration scripts for the car reservation system database.

## Available Migrations

### 1. Initial Schema Migration (`schema.sql`)
This is the initial database schema that sets up all necessary tables and constraints.

To run this migration:
```bash
cd server
npm run migrate
```

### 2. Add Status to Unique Constraint (`add_status_to_unique_constraint.sql`)
This migration modifies the unique constraint on the reservations table to include the status column, allowing multiple reservations for the same seat if the previous one is cancelled.

To run this migration:
```bash
cd server
npm run migrate:add-status
```

## Migration Details

### Add Status to Unique Constraint Migration

This migration performs the following steps:

1. **Identify Foreign Key Constraints**: 
   - Creates a temporary table to store details of all foreign key constraints on the reservations table
   - This ensures we can recreate them after modifying the index

2. **Drop Foreign Key Constraints**:
   - Safely drops all foreign key constraints that might be using the index
   - Uses dynamic SQL to handle multiple constraints if they exist

3. **Modify Index**:
   - Drops the existing `unique_seat_route_date` constraint
   - Creates a new constraint `unique_seat_route_date_status` that includes the status column
   - Adds an index on the status column for better performance

4. **Recreate Foreign Key Constraints**:
   - Recreates all previously dropped foreign key constraints
   - Uses the stored information from the temporary table
   - Ensures database integrity is maintained

5. **Cleanup**:
   - Drops the temporary table used for storing constraint information

## Benefits

- **Improved Data Integrity**: The new constraint ensures that a seat can only be reserved once for a specific route and date, but allows multiple reservations if the previous one is cancelled.
- **Better Performance**: The additional index on the status column improves query performance when filtering reservations by status.
- **Maintained Referential Integrity**: All foreign key constraints are preserved, ensuring the database remains consistent.

## Troubleshooting

If you encounter any errors during the migration:

1. **Foreign Key Constraint Errors**:
   - The migration script is designed to handle these automatically
   - It will identify, drop, and recreate all necessary constraints
   - No manual intervention should be required

2. **Permission Issues**:
   - Ensure your database user has sufficient privileges to:
     - Create and drop temporary tables
     - Modify table structures
     - Create and drop indexes
     - Create and drop foreign key constraints

3. **Data Consistency**:
   - The migration is designed to maintain data consistency
   - All operations are performed in a way that preserves existing data
   - Foreign key constraints are properly maintained

## Rollback

If you need to rollback this migration:

1. Drop the new index and constraint:
```sql
ALTER TABLE reservations DROP INDEX unique_seat_route_date_status;
DROP INDEX idx_reservations_status ON reservations;
```

2. Recreate the original constraint:
```sql
ALTER TABLE reservations ADD UNIQUE KEY unique_seat_route_date (route_id, reservation_date, seat_number);
```

Note: Before rolling back, ensure that there are no cancelled reservations that would violate the original constraint. 