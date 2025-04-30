-- First, let's identify all foreign key constraints on the reservations table
-- and store their details for later recreation
CREATE TEMPORARY TABLE IF NOT EXISTS temp_fk_constraints AS
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    information_schema.KEY_COLUMN_USAGE
WHERE 
    TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'reservations' 
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Drop all foreign key constraints on the reservations table
SET @drop_constraints_sql = (
    SELECT GROUP_CONCAT(CONCAT('ALTER TABLE reservations DROP FOREIGN KEY ', CONSTRAINT_NAME, ';') SEPARATOR ' ')
    FROM temp_fk_constraints
);

-- Execute the SQL to drop constraints if any exist
SET @drop_constraints_sql = IF(
    @drop_constraints_sql IS NOT NULL,
    @drop_constraints_sql,
    'SELECT "No foreign key constraints found"'
);

PREPARE stmt FROM @drop_constraints_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Now we can safely drop the index
ALTER TABLE reservations DROP INDEX unique_seat_route_date;

-- Add a new unique constraint that includes the status column
-- This ensures that a seat can be reserved multiple times if the previous reservation is cancelled
ALTER TABLE reservations ADD UNIQUE KEY unique_seat_route_date_status (route_id, reservation_date, seat_number, status);

-- Add an index on the status column for better performance when filtering by status
CREATE INDEX idx_reservations_status ON reservations(status);

-- Recreate all foreign key constraints that were dropped
SET @recreate_constraints_sql = (
    SELECT GROUP_CONCAT(
        CONCAT(
            'ALTER TABLE reservations ADD CONSTRAINT ',
            CONSTRAINT_NAME,
            ' FOREIGN KEY (',
            COLUMN_NAME,
            ') REFERENCES ',
            REFERENCED_TABLE_NAME,
            '(',
            REFERENCED_COLUMN_NAME,
            ');'
        ) SEPARATOR ' '
    )
    FROM temp_fk_constraints
);

-- Execute the SQL to recreate constraints if any exist
SET @recreate_constraints_sql = IF(
    @recreate_constraints_sql IS NOT NULL,
    @recreate_constraints_sql,
    'SELECT "No foreign key constraints to recreate"'
);

PREPARE stmt FROM @recreate_constraints_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop the temporary table
DROP TEMPORARY TABLE IF EXISTS temp_fk_constraints; 