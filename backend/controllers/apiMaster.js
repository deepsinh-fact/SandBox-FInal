import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sql = require('msnodesqlv8');
import 'dotenv/config';

// Connection string for msnodesqlv8 with Windows Authentication
const connectionString = `server=${process.env.DB_SERVER || "FACT-LAP-07"};Database=${process.env.DB_NAME || "Fact"};Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server};`;

// Helper function to execute SQL queries
const executeQuery = (queryString, params = []) => {
    return new Promise((resolve, reject) => {
        console.log('Executing SQL query:', queryString);
        console.log('With parameters:', params);
        console.log('Connection string:', connectionString.replace(/server=.*?;/, 'server=***;'));

        if (params.length === 0) {
            sql.query(connectionString, queryString, (err, rows) => {
                if (err) {
                    console.error('SQL Error:', err);
                    console.error('Query was:', queryString);
                    reject(new Error(`Database error: ${err.message}`));
                } else {
                    console.log('Query successful, rows returned:', rows ? rows.length : 0);
                    resolve(rows);
                }
            });
        } else {
            sql.query(connectionString, queryString, params, (err, rows) => {
                if (err) {
                    console.error('SQL Error:', err);
                    console.error('Query was:', queryString);
                    console.error('Parameters were:', params);
                    reject(new Error(`Database error: ${err.message}`));
                } else {
                    console.log('Query successful, rows returned:', rows ? rows.length : 0);
                    resolve(rows);
                }
            });
        }
    });
};

// Note: API_Id is now user-provided, no auto-generation needed

// GET /api/apimaster/getAPIByID/:id - Get API by ID
export const getAPIById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching API with ID: ${id} (type: ${typeof id})`);

        // Try to ensure table exists, but don't fail if it already exists
        try {
            await ensureAPIMasterTable();
        } catch (tableError) {
            console.log('Table setup warning (continuing):', tableError.message);
        }

        // Ensure the ID is treated as a string
        const apiId = String(id);
        console.log(`Converted API ID: ${apiId}`);

        // First, let's see what data exists in the table for debugging
        const debugQuery = `SELECT TOP 10 API_Id, API_Name FROM APIMaster`;
        const allApis = await executeQuery(debugQuery);
        console.log('Available APIs in database:', allApis);

        // Also check for exact matches with different case sensitivity
        const caseInsensitiveQuery = `SELECT * FROM APIMaster WHERE UPPER(API_Id) = UPPER('${apiId.replace(/'/g, "''")}')`;
        const caseInsensitiveResult = await executeQuery(caseInsensitiveQuery);
        console.log('Case insensitive search result:', caseInsensitiveResult);

        // Use string interpolation to avoid parameter binding issues with string IDs
        // Also filter out soft deleted records
        const selectQuery = `SELECT * FROM APIMaster WHERE API_Id = '${apiId.replace(/'/g, "''")}' AND (IsDeleted = 0)`;
        const api = await executeQuery(selectQuery);

        if (api.length === 0) {
            // If not found, let's also try a LIKE search to see if there are similar IDs
            const likeQuery = `SELECT * FROM APIMaster WHERE API_Id LIKE '%${apiId.replace(/'/g, "''")}%'`;
            const likeResult = await executeQuery(likeQuery);
            console.log('LIKE search result:', likeResult);

            return res.status(404).json({
                success: false,
                message: 'API not found',
                debug: {
                    searchedFor: apiId,
                    availableIds: allApis.map(a => a.API_Id),
                    caseInsensitiveMatch: caseInsensitiveResult.length > 0,
                    similarIds: likeResult.map(a => a.API_Id)
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'API retrieved successfully',
            data: api[0]
        });
    } catch (error) {
        console.error('Error fetching API by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const ensureAPIMasterTable = async () => {
    try {
        // First check if table exists and get its structure
        const checkTableQuery = `
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'APIMaster'
            ORDER BY ORDINAL_POSITION
        `;

        const tableStructure = await executeQuery(checkTableQuery);
        console.log('Current APIMaster table structure:', tableStructure);

        // If table doesn't exist, create it
        if (!tableStructure || tableStructure.length === 0) {
            const createTableQuery = `
                CREATE TABLE APIMaster (
                    AutoId INT IDENTITY(1,1) PRIMARY KEY,
                    API_Id NVARCHAR(50) NOT NULL UNIQUE,
                    API_Name NVARCHAR(255) NOT NULL,
                    API_Description NVARCHAR(MAX),
                    API_Code VARCHAR(50),
                    CreatedDate DATETIME DEFAULT GETDATE(),
                    IsDeleted BIT DEFAULT 0
                )
            `;

            await executeQuery(createTableQuery);
            console.log('APIMaster table created successfully');
        } else {
            // Check if AutoId column exists, if not add it (but only if no primary key exists)
            const hasAutoId = tableStructure.some(col => col.COLUMN_NAME === 'AutoId');
            if (!hasAutoId) {
                try {
                    // Check if there's already a primary key
                    const checkPrimaryKeyQuery = `
                        SELECT COLUMN_NAME 
                        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                        WHERE TABLE_NAME = 'APIMaster' 
                        AND CONSTRAINT_NAME LIKE 'PK_%'
                    `;
                    const primaryKeyColumns = await executeQuery(checkPrimaryKeyQuery);

                    if (primaryKeyColumns.length === 0) {
                        // No primary key exists, safe to add AutoId as primary key
                        const addAutoIdQuery = `ALTER TABLE APIMaster ADD AutoId INT IDENTITY(1,1) PRIMARY KEY`;
                        await executeQuery(addAutoIdQuery);
                        console.log('Added AutoId column to APIMaster table');
                    } else {
                        // Primary key exists, just add AutoId as regular column
                        const addAutoIdQuery = `ALTER TABLE APIMaster ADD AutoId INT IDENTITY(1,1)`;
                        await executeQuery(addAutoIdQuery);
                        console.log('Added AutoId column to APIMaster table (without primary key constraint)');
                    }
                } catch (autoIdError) {
                    console.log('AutoId column may already exist or table structure is different:', autoIdError.message);
                }
            }

            // Check if CreatedDate column exists, if not add it
            const hasCreatedDate = tableStructure.some(col => col.COLUMN_NAME === 'CreatedDate');
            if (!hasCreatedDate) {
                try {
                    const addColumnQuery = `ALTER TABLE APIMaster ADD CreatedDate DATETIME DEFAULT GETDATE()`;
                    await executeQuery(addColumnQuery);
                    console.log('Added CreatedDate column to APIMaster table');
                } catch (dateError) {
                    console.log('CreatedDate column may already exist:', dateError.message);
                }
            }

            // Check if IsDeleted column exists, if not add it for soft delete functionality
            const hasIsDeleted = tableStructure.some(col => col.COLUMN_NAME === 'IsDeleted');
            if (!hasIsDeleted) {
                try {
                    const addIsDeletedQuery = `ALTER TABLE APIMaster ADD IsDeleted BIT DEFAULT 0`;
                    await executeQuery(addIsDeletedQuery);
                    console.log('Added IsDeleted column to APIMaster table for soft delete functionality');
                } catch (isDeletedError) {
                    console.log('IsDeleted column may already exist:', isDeletedError.message);
                }
            }
        }
    } catch (error) {
        console.error('Error ensuring APIMaster table:', error);
        // Don't throw the error, just log it - the table might already exist with the right structure
        console.log('Continuing with existing table structure...');
    }
};


// GET /api/apimaster/getAllAPI - Get all APIs
export const getAllAPI = async (req, res) => {
    try {
        // Try to ensure table exists, but don't fail if it already exists
        try {
            await ensureAPIMasterTable();
        } catch (tableError) {
            console.log('Table setup warning (continuing):', tableError.message);
        }

        const selectQuery = `
            SELECT * FROM APIMaster 
            ORDER BY CASE WHEN CreatedDate IS NOT NULL THEN CreatedDate ELSE '1900-01-01' END DESC
        `;

        const apis = await executeQuery(selectQuery);

        res.status(200).json({
            success: true,
            message: 'APIs retrieved successfully',
            data: apis
        });
    } catch (error) {
        console.error('Error fetching APIs:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// POST /api/apimaster/addAPI - Create new API
export const addAPI = async (req, res) => {
    try {
        // Try to ensure table exists, but don't fail if it already exists
        try {
            await ensureAPIMasterTable();
        } catch (tableError) {
            console.log('Table setup warning (continuing):', tableError.message);
        }

        const {
            API_Id,
            API_Name,
            API_Description,
            API_Code,
        } = req.body;

        // Basic validation - API_Id and API_Name are required
        if (!API_Id) {
            return res.status(400).json({
                success: false,
                message: 'API_Id is required'
            });
        }

        if (!API_Name) {
            return res.status(400).json({
                success: false,
                message: 'API_Name is required'
            });
        }

        // Check if API_Id already exists
        const checkExistingQuery = `SELECT API_Id FROM APIMaster WHERE API_Id = ? AND (IsDeleted = 0 OR IsDeleted IS NULL)`;
        const existingAPI = await executeQuery(checkExistingQuery, [API_Id]);

        if (existingAPI.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'API_Id already exists. Please choose a different API_Id.'
            });
        }

        console.log('Using user-provided API ID:', API_Id);

        // Insert new API with user-provided API_Id - try with CreatedDate first, fallback without it
        let insertQuery = `
            INSERT INTO APIMaster (
                API_Id,
                API_Name,
                API_Description,
                API_Code,
                CreatedDate
            ) VALUES (
                ?, ?, ?, ?, GETDATE()
            )
        `;

        let insertParams = [
            API_Id,
            API_Name,
            API_Description || null,
            API_Code || null
        ];

        try {
            await executeQuery(insertQuery, insertParams);
        } catch (insertError) {
            // If CreatedDate column doesn't exist, try without it
            console.log('Trying insert without CreatedDate column...');
            insertQuery = `
                INSERT INTO APIMaster (
                    API_Id,
                    API_Name,
                    API_Description,
                    API_Code
                ) VALUES (
                    ?, ?, ?, ?
                )
            `;
            await executeQuery(insertQuery, insertParams);
        }

        // Fetch the newly created API using the API_Id
        const selectQuery = `SELECT * FROM APIMaster WHERE API_Id = ?`;
        const newAPI = await executeQuery(selectQuery, [API_Id]);

        res.status(201).json({
            success: true,
            message: 'API created successfully',
            data: newAPI[0]
        });
    } catch (error) {
        console.error('Error creating API:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


// PUT /api/apimaster/updateAPI/:id - Update existing API
export const updateAPI = async (req, res) => {
    // IMMEDIATE BLOCK - Check for API_Id before anything else
    if (req.body && req.body.API_Id !== undefined) {
        return res.status(400).json({
            success: false,
            message: 'API_Id cannot be updated as it is the primary key',
            error: 'PRIMARY_KEY_UPDATE_BLOCKED'
        });
    }

    try {
        const { id } = req.params;
        const updateFields = req.body; // user can send any field

        const requestKeys = Object.keys(updateFields);
        const apiIdVariations = ['API_Id', 'api_id', 'apiId', 'API_ID', 'Api_Id', 'api_Id'];

        for (const key of requestKeys) {
            console.log(`Checking key: "${key}"`);
            if (apiIdVariations.includes(key)) {
                console.log(`BLOCKED: Found API_Id field "${key}" in request`);
                return res.status(400).json({
                    success: false,
                    message: `API_Id cannot be updated as it is the primary key. Attempted field: ${key}`,
                    blockedField: key,

                });
            }
        }

        // Remove all possible API_Id variations from updateFields (extra safety)
        apiIdVariations.forEach(field => {
            if (updateFields[field]) {
                console.log(`Removing field: ${field}`);
                delete updateFields[field];
            }
        });
        console.log('Fields after cleanup:', Object.keys(updateFields));

        // Check if at least one field is provided after removing API_Id
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided for update'
            });
        }

        // Check if the API exists using the original API_Id from URL (exclude soft deleted)
        let checkExistingQuery = `SELECT * FROM APIMaster WHERE API_Id = ? AND (IsDeleted = 0 OR IsDeleted IS NULL)`;
        let existingAPI = await executeQuery(checkExistingQuery, [id]);

        if (existingAPI.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'API not found'
            });
        }

        // Dynamically build SET clause (excluding all API_Id variations)
        const setClauses = [];
        const params = [];
        const forbiddenFields = ['API_Id', 'api_id', 'apiId', 'API_ID', 'AutoId', 'autoId'];

        for (const key in updateFields) {
            if (!forbiddenFields.includes(key)) { // Extra safety check
                setClauses.push(`${key} = ?`);
                params.push(updateFields[key]);
            }
        }

        const updateQuery = `
            UPDATE APIMaster
            SET ${setClauses.join(', ')}
            WHERE API_Id = ?
        `;
        params.push(id); // Use the original ID from URL params

        console.log('Executing update query:', updateQuery);
        console.log('With parameters:', params);

        await executeQuery(updateQuery, params);
        console.log('Update query executed successfully');

        const selectQuery = `SELECT * FROM APIMaster WHERE API_Id = ?`;
        const updatedAPI = await executeQuery(selectQuery, [id]);

        console.log('Updated API fetched:', updatedAPI[0]);

        res.status(200).json({
            success: true,
            message: 'API updated successfully',
            data: updatedAPI[0]
        });
    } catch (error) {
        console.error('Error updating API:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


// DELETE /api/apimaster/deleteAPI/:id - Delete API
// DEBUG endpoint to check database contents
export const debugDatabase = async (_req, res) => {
    try {
        const checkQuery = `SELECT * FROM APIMaster`;
        const allRecords = await executeQuery(checkQuery);

        res.status(200).json({
            success: true,
            message: 'Database debug info',
            data: {
                totalRecords: allRecords.length,
                records: allRecords,
                apiIds: allRecords.map(r => r.API_Id)
            }
        });
    } catch (error) {
        console.error('Error in debug:', error);
        res.status(500).json({
            success: false,
            message: 'Debug error',
            error: error.message
        });
    }
};

// Setup endpoint to manually add IsDeleted column
export const setupSoftDelete = async (_req, res) => {
    try {
        console.log('Setting up soft delete functionality...');

        // Check if IsDeleted column exists
        const checkColumnQuery = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'APIMaster' AND COLUMN_NAME = 'IsDeleted'
        `;

        const columnExists = await executeQuery(checkColumnQuery);

        if (columnExists.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'IsDeleted column already exists',
                data: { columnExists: true }
            });
        }

        // Add IsDeleted column
        const addColumnQuery = `ALTER TABLE APIMaster ADD IsDeleted BIT DEFAULT 0`;
        await executeQuery(addColumnQuery);
        console.log('Added IsDeleted column successfully');

        // Update all existing records to have IsDeleted = 0
        const updateExistingQuery = `UPDATE APIMaster SET IsDeleted = 0 WHERE IsDeleted IS NULL`;
        await executeQuery(updateExistingQuery);
        console.log('Updated existing records with IsDeleted = 0');

        res.status(200).json({
            success: true,
            message: 'Soft delete functionality setup completed successfully',
            data: {
                columnAdded: true,
                existingRecordsUpdated: true
            }
        });

    } catch (error) {
        console.error('Error setting up soft delete:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting up soft delete functionality',
            error: error.message
        });
    }
};

export const deleteAPI = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('Soft deleting API with ID:', id);

        // Check if the API exists
        let checkExistingQuery = `SELECT * FROM APIMaster WHERE API_Id = ? AND (IsDeleted = 0 OR IsDeleted IS NULL)`;
        let existingAPI = await executeQuery(checkExistingQuery, [id]);

        if (existingAPI.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'API not found or already deleted'
            });
        }

        // Soft delete the API by setting IsDeleted = 1
        const currentRecord = existingAPI[0];
        const softDeleteQuery = `UPDATE APIMaster SET IsDeleted = 1 WHERE API_Id = ?`;
        await executeQuery(softDeleteQuery, [currentRecord.API_Id]);

        res.status(200).json({
            success: true,
            message: 'API deleted successfully (soft delete)'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// PUT /api/apimaster/restoreAPI/:id - Restore soft-deleted API
export const restoreAPI = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('Restoring API with ID:', id);

        // Check if the API exists and is deleted
        let checkExistingQuery = `SELECT * FROM APIMaster WHERE API_Id = ? AND IsDeleted = 1`;
        let existingAPI = await executeQuery(checkExistingQuery, [id]);

        if (existingAPI.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'API not found or not deleted'
            });
        }

        // Restore the API by setting IsDeleted = 0
        const currentRecord = existingAPI[0];
        const restoreQuery = `UPDATE APIMaster SET IsDeleted = 0 WHERE API_Id = ?`;
        await executeQuery(restoreQuery, [currentRecord.API_Id]);

        res.status(200).json({
            success: true,
            message: 'API restored successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};