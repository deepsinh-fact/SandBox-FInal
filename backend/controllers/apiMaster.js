import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sql = require('msnodesqlv8');
import 'dotenv/config';

// Helper function to ensure APIMaster table exists with correct schema
const ensureAPIMasterTable = async () => {
    try {
        const createTableQuery = `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'APIMaster')
            BEGIN
                CREATE TABLE APIMaster (
                    APIId INT IDENTITY(1,1) PRIMARY KEY,
                    APIName NVARCHAR(150) NOT NULL,
                    APIDescription NVARCHAR(MAX) NULL,
                    APICode NVARCHAR(50) NOT NULL,
                    MethodName NVARCHAR(20) DEFAULT 'GET',
                    BasePrice DECIMAL(10, 2) DEFAULT 0.00,
                    SellPrice DECIMAL(10, 2) DEFAULT 0.00,
                    CreatedBy  NVARCHAR(100) NULL,
                    CreatedDate DATETIME DEFAULT GETDATE(),
                    UpdatedBy NVARCHAR(100) NULL,
                    UpdatedDate DATETIME NULL,
                    IsDeleted BIT DEFAULT 0
                )
                PRINT 'APIMaster table created successfully'
            END
            
            -- Ensure IsDeleted column exists (for backward compatibility)
            IF NOT EXISTS (SELECT * FROM sys.columns 
                          WHERE object_id = OBJECT_ID('APIMaster') 
                          AND name = 'IsDeleted')
            BEGIN
                ALTER TABLE APIMaster ADD IsDeleted BIT DEFAULT 0
                PRINT 'Added IsDeleted column to APIMaster table'
            END
        `;
        
        await executeQuery(createTableQuery);
        console.log('APIMaster table verified/created');
    } catch (error) {
        console.error('Error ensuring APIMaster table:', error);
        throw error; 
    }
};

// Connection string for msnodesqlv8 with Windows Authentication
const connectionString = `server=${process.env.DB_SERVER || "FACT-LAP-07"};Database=${process.env.DB_NAME || "Fact"};Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server};`;

// Helper function to execute SQL queries
const executeQuery = (queryString, params = []) => {
    return new Promise((resolve, reject) => {
        console.log('\n=== SQL Query ===');
        console.log('Query:', queryString.replace(/\s+/g, ' ').trim());
        console.log('Parameters:', params);
        
        // For msnodesqlv8, we use sql.query directly
        sql.query(connectionString, queryString, params, (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                reject(new Error(`Database error: ${err.message}`));
                return;
            }
            
            console.log('Query executed successfully');
            
            // msnodesqlv8 returns rows directly
            if (rows && Array.isArray(rows)) {
                console.log(`Returned ${rows.length} rows`);
                if (rows.length > 0) {
                    console.log('First row:', JSON.stringify(rows[0], null, 2));
                }
                resolve(rows);
            } else {
                console.log('No records returned or unexpected result format');
                resolve(rows || []);
            }
        });
    });
};

// Get all APIs
export const getAllAPIs = async (req, res) => {
    try {
        console.log('Fetching all APIs from APIMaster table');
        
        // First, try with IsDeleted check
        try {
            const query = `
                SELECT 
                    APIId,
                    APIName,
                    APIDescription,
                    APICode,
                    Version,  -- Added Version column
                    MethodName,
                    BasePrice,
                    SellPrice,
                    CreatedBy,
                    CreatedDate,
                    UpdatedBy,
                    UpdatedDate
                FROM APIMaster
                WHERE IsDeleted = 0 OR IsDeleted IS NULL  -- Handle cases where IsDeleted might be NULL
            `;
            
            const apis = await executeQuery(query);
            console.log(`Fetched ${apis.length} APIs from database`);
            console.log('API Data from database:', JSON.stringify(apis, null, 2));
            
            const response = {
                success: true,
                message: 'APIs retrieved successfully',
                data: apis
            };
            
            console.log('Sending response:', JSON.stringify(response, null, 2));
            return res.status(200).json(response);
        } catch (error) {
            // If the error is about IsDeleted column, try without it
            if (error.message && error.message.includes('IsDeleted')) {
                console.log('IsDeleted column not found, trying without it');
                const query = `
                    SELECT 
                        APIId,
                        APIName,
                        APIDescription,
                        APICode,
                        Version,  
                        MethodName,
                        BasePrice,
                        SellPrice,
                        CreatedBy,
                        CreatedDate,
                        UpdatedBy,
                        UpdatedDate
                    FROM APIMaster
                    ORDER BY APIName
                `;
                
                const apis = await executeQuery(query);

                return res.status(200).json({
                    success: true,
                    message: 'APIs retrieved successfully',
                    data: apis
                });
            }
            // If it's another error, rethrow it
            throw error;
        }
        
    } catch (error) {
        console.error('Error in getAllAPIs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch APIs',
            error: error.message
        });
    }
};

export const addAPI = async (req, res) => {
    try {
        const {
            APIId,  
            APIName,
            APICode,
            APIDescription,
            Version = '1.0',  // Default to '1.0' if not provided
            MethodName = 'GET',
            BasePrice = 0.00,
            SellPrice = 0.00
        } = req.body;

        // In a real application, the user ID would come from authentication middleware (e.g., JWT token).
        // Example: const CreatedBy = req.user.id;
        // For this example, we'll use a default system user ID.
        const CreatedBy = "Test User";

        // --- Validation ---
        // APIName and APICode are essential, so we validate their presence.
        if (!APIName || !APICode) {
            return res.status(400).json({
                success: false,
                message: 'APIName and APICode are required fields.'
            });
        }

        // --- Uniqueness Check ---
        // Check if APICode already exists to enforce uniqueness
        const checkExistingQuery = `
            SELECT APICode 
            FROM APIMaster 
            WHERE APICode = ?
        `;
        const existingAPI = await executeQuery(checkExistingQuery, [APICode]);

        if (existingAPI.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'APICode already exists. Please use a different value.'
            });
        }

        try {
            const insertQuery = `
                INSERT INTO APIMaster (
                    APICode,
                    APIName,
                    APIDescription,
                    Version,
                    MethodName,
                    BasePrice,
                    SellPrice,
                    CreatedBy,
                    CreatedDate,
                    UpdatedDate
                )
                OUTPUT INSERTED.*
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE());
            `;

            // Prepare parameters for the query to prevent SQL injection.
            const insertParams = [
                APICode,
                APIName,
                APIDescription || null, 
                Version, 
                MethodName,
                parseFloat(BasePrice) || 0.00,
                parseFloat(SellPrice) || 0.00,
                CreatedBy
                // CreatedDate and UpdatedDate are set to GETDATE() in the SQL query
            ];

            // Execute the query and get the newly created API record.
            const newAPIRecord = await executeQuery(insertQuery, insertParams);

            // --- Success Response ---
            // Send a 201 Created status with the new API data.
            res.status(201).json({
                success: true,
                message: 'API created successfully.',
                data: newAPIRecord[0] // The query returns an array, so we take the first element
            });
        } catch (error) {
            console.error('Error during API creation:', error);
            throw error; // Re-throw to be caught by the outer catch block
        } finally {
            // Always ensure IDENTITY_INSERT is turned off, even if there was an error
            try {
                await executeQuery('SET IDENTITY_INSERT APIMaster OFF;');
            } catch (e) {
                console.error('Error turning off IDENTITY_INSERT:', e);
            }
        }

     } catch (error) {
        console.error('Error creating API:', error);
        res.status(500).json({
            success: false,
            message: 'An internal server error occurred.',
            error: error.message
        });
    }
};
 

export const updateAPI = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('=== Starting Update Process ===');
        console.log('Request params:', req.params);
        console.log('Request headers:', req.headers);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        // Validate ID
        if (!id) {
            console.error('Error: No ID provided in request');
            return res.status(400).json({
                success: false,
                message: 'API ID is required for update',
                receivedParams: req.params
            });
        }
        
        // Get the update fields from request body
        const updateFields = req.body;
        
        // Log the raw request body for debugging
        let rawBody = '';
        req.on('data', chunk => {
            rawBody += chunk.toString();
        });
        
        console.log('Raw request body (stream):', rawBody);
        
        // Remove any null or undefined values
        Object.keys(updateFields).forEach(key => {
            if (updateFields[key] === null || updateFields[key] === undefined) {
                delete updateFields[key];
            }
        });

        // If no valid fields to update
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided for update'
            });
        }

        // First, check if the API exists
        const checkQuery = `SELECT APIId, APIName, APICode, APIDescription, MethodName, BasePrice, SellPrice FROM APIMaster WHERE APIId = ?`;
        const existingAPI = await executeQuery(checkQuery, [id]);

        if (!existingAPI || existingAPI.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'API not found.'
            });
        }
        
        const apiToUpdate = existingAPI[0];
        console.log('Found API to update:', apiToUpdate);

        // Build the update query
        const setClauses = [];
        const params = [];
        
        console.log('Raw request body:', JSON.stringify(req.body, null, 2));

        const fieldMappings = {
            'API_Name': 'APIName',
            'API_Description': 'APIDescription',
            'APICode': 'APICode',  
            'API_Code': 'APICode',
            'Version': 'Version',
            'MethodName': 'MethodName',
            'Base_Price': 'BasePrice',
            'Sell_Price': 'SellPrice',
            'UpdatedBy': 'UpdatedBy'
        };
        
        console.log('Field mappings:', fieldMappings);

        // Set both CreatedBy and UpdatedBy to 'Test User'
        updateFields.UpdatedBy = 'Test User';
        updateFields.CreatedBy = 'Test User';

        // Add fields to update
        for (const [key, value] of Object.entries(updateFields)) {
            const dbColumn = fieldMappings[key] || key;
            if (dbColumn && value !== undefined) {
                setClauses.push(`${dbColumn} = ?`);
                
                // Convert field values to appropriate types
                if (key === 'Base_Price' || key === 'SellPrice') {
                    // Convert to number
                    params.push(parseFloat(value) || 0);
                } else if (key === 'Version') {
                    // Keep version as string, default to '1.0' if empty
                    params.push(value || '1.0');
                    console.log('Version:', value);
                } else {
                    // Convert all other values to string
                    params.push(String(value));
                }
            }
        }

        // Only update the UpdatedDate, leave CreatedDate as is
        setClauses.push('UpdatedDate = GETDATE()');
        
        // Add the ID to the parameters for the WHERE clause
        params.push(id);

        // Build the final query
        const updateQuery = `
            UPDATE APIMaster
            SET ${setClauses.join(', ')}
            OUTPUT INSERTED.*
            WHERE APIId = ?
        `;
        
        console.log('Final update query:', updateQuery);
        console.log('Query parameters:', [...params, id]);

        console.log('Executing update query:', updateQuery);
        console.log('With parameters:', params);
        console.log('Set clauses:', setClauses);

        // Execute the update
        console.log('=== Executing Query ===');
        console.log('Query:', updateQuery);
        console.log('Parameters:', params);
        
        let result;
        try {
            console.log('Attempting to execute query...');
            result = await executeQuery(updateQuery, params);
            console.log('Query executed successfully');
            console.log('Query result type:', typeof result);
            console.log('Is array:', Array.isArray(result));
            console.log('Result keys:', result ? Object.keys(result) : 'null');
            
            if (result && typeof result === 'object') {
                console.log('Result properties:');
                for (const [key, value] of Object.entries(result)) {
                    console.log(`  ${key}:`, typeof value);
                    if (Array.isArray(value)) {
                        console.log(`  ${key} length:`, value.length);
                    }
                }
            }
            
            console.log('Query result:', JSON.stringify(result, null, 2));
        } catch (dbError) {
            console.error('Database error:', dbError);
            console.error('Error details:', {
                message: dbError.message,
                code: dbError.code,
                sqlState: dbError.sqlstate,
                originalError: dbError.originalError
            });
            throw new Error(`Database error: ${dbError.message}`);
        }
        
        // Get the updated record
        let updatedRecord = null;
        if (Array.isArray(result) && result.length > 0) {
            updatedRecord = result[0];
        } else if (result && result.recordset && result.recordset.length > 0) {
            updatedRecord = result.recordset[0];
        } else {
            // If no record returned, fetch it
            const fetchQuery = 'SELECT * FROM APIMaster WHERE APIId = ?';
            const fetchResult = await executeQuery(fetchQuery, [id]);
            updatedRecord = Array.isArray(fetchResult) ? fetchResult[0] : 
                         (fetchResult.recordset ? fetchResult.recordset[0] : null);
        }

        if (!updatedRecord) {
            console.error('Error: Failed to retrieve updated API record');
            console.log('Query result was:', result);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve updated API record',
                query: updateQuery,
                params: params,
                result: result
            });
        }

        res.status(200).json({
            success: true,
            message: 'API updated successfully',
            data: updatedRecord
        });

    } catch (error) {
        console.error('Error updating API:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the API',
            error: error.message
        });
    }
}

// Soft delete an API
export const deleteAPI = async (req, res) => {
    const { id } = req.params;
    
    console.log('Delete request received for API ID:', id);
    
    if (!id) {
        console.error('No ID provided for deletion');
        return res.status(400).json({
            success: false,
            message: 'API ID is required for deletion'
        });
    }

    try {
        console.log('Attempting to soft delete API with ID:', id);
        
        // First, verify the API exists and is not already deleted
        const checkQuery = 'SELECT APIId, IsDeleted FROM APIMaster WHERE APIId = ?';
        const existingApi = await executeQuery(checkQuery, [id]);
        
        if (!existingApi || existingApi.length === 0) {
            console.error('API not found with ID:', id);
            return res.status(404).json({
                success: false,
                message: 'API not found'
            });
        }
        
        // Check if already deleted
        if (existingApi[0].IsDeleted === 1 || existingApi[0].IsDeleted === true) {
            console.log('API already deleted with ID:', id);
            return res.status(200).json({
                success: true,
                message: 'API already deleted'
            });
        }
        
        const updateQuery = `
            UPDATE APIMaster
            SET 
                IsDeleted = 1,
                UpdatedBy = ?,
                UpdatedDate = GETDATE()
            WHERE APIId = ?
        `;

        const updatedBy = 'Test User';
        
        const result = await executeQuery(updateQuery, [updatedBy, id]);

        console.log('Update result:', result);
        
        // Check for different possible result structures
        const rowsAffected = result.rowsAffected || 
                           (Array.isArray(result) ? result[0]?.rowsAffected : null) ||
                           (result.recordset ? result.rowsAffected : null);
        
        console.log('Rows affected:', rowsAffected);
        
        if (rowsAffected > 0) {
            console.log('Successfully soft deleted API with ID:', id);
            return res.status(200).json({
                success: true,
                message: 'API deleted successfully'
            });
        } else {
            console.error('No rows affected when trying to delete API with ID:', id);
            return res.status(404).json({
                success: false,
                message: 'API not found or already deleted'
            });
        }
    } catch (error) {
        console.error('Error soft deleting API:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete API',
            error: error.message
        });
    }
};