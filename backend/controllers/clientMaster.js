import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sql = require('msnodesqlv8');
import 'dotenv/config';


// Connection string for msnodesqlv8 with Windows Authentication
const connectionString = `server=${process.env.DB_SERVER || "FACT-LAP-07"};Database=${process.env.DB_NAME || "Fact"};Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server};`;

// Helper function to execute SQL queries
const executeQuery = (queryString, params = []) => {
    return new Promise((resolve, reject) => {

        if (params.length === 0) {
            // If no parameters, use simple query
            sql.query(connectionString, queryString, (err, rows) => {
                if (err) {
                    console.error('SQL Error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        } else {
            // Use parameterized query
            sql.query(connectionString, queryString, params, (err, rows) => {
                if (err) {
                    console.error('SQL Error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        }
    });
};




// GET /api/clientmaster/getAllClient - Get all clients (excluding soft deleted)
export const getAllClient = async (req, res) => {
    try {
        // console.log('Fetching all clients from ClientMaster table');

        const selectQuery = `
            SELECT * FROM ClientMaster 
            WHERE IsDeleted IS NULL OR IsDeleted = 0
        `;

        const clients = await executeQuery(selectQuery);
        // console.log('Fetched clients from database:', clients);

        res.json({
            success: true,
            message: 'Clients retrieved successfully',
            data: clients
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// PUT /api/clientmaster/updateClient/:id - Update existing client (exported function)
export const updateClient = async (req, res) => {
    try {

        const clientId = parseInt(req.params.id);

        if (isNaN(clientId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid client ID'
            });
        }

        const {
            ClientName,
            ClientUserName,
            ClientPassword,
            ClientContactNumber,
            ClientAddress,
            ClientPAN,
            ClientGST,
            ClientCIN,
            Client_SecreteKey
        } = req.body;

        console.log('=== UPDATE CLIENT DEBUG ===');
        console.log('Client ID:', clientId);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('ClientUserName value:', ClientUserName, 'Type:', typeof ClientUserName);
        console.log('ClientPassword value:', ClientPassword, 'Type:', typeof ClientPassword);

        // Check if client exists
        const checkQuery = `SELECT * FROM ClientMaster WHERE AutoId = ${clientId}`;
        const existingClient = await executeQuery(checkQuery);

        if (!existingClient || existingClient.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        console.log('Existing client before update:', JSON.stringify(existingClient[0], null, 2));

        // Build update query dynamically based on provided fields
        let updateFields = [];
        let updateValues = [];

        if (ClientName !== undefined) {
            console.log('Adding ClientName to update:', ClientName);
            updateFields.push('ClientName = ?');
            updateValues.push(ClientName);
        }

        // Only update ClientUserName if it's provided and not empty
        if (ClientUserName !== undefined && ClientUserName !== '') {
            console.log('✓ Adding ClientUserName to update:', ClientUserName);
            updateFields.push('ClientUserName = ?');
            updateValues.push(ClientUserName);
        } else {
            console.log('✗ Skipping ClientUserName update - value:', ClientUserName, 'undefined?', ClientUserName === undefined, 'empty?', ClientUserName === '');
        }

        // Only update ClientPassword if it's provided and not empty
        if (ClientPassword !== undefined && ClientPassword !== '') {
            console.log('✓ Adding ClientPassword to update (length:', ClientPassword.length, ')');
            updateFields.push('ClientPassword = ?');
            updateValues.push(ClientPassword);
        } else {
            console.log('✗ Skipping ClientPassword update - undefined?', ClientPassword === undefined, 'empty?', ClientPassword === '');
        }

        if (ClientContactNumber !== undefined) {
            updateFields.push('ClientContactNumber = ?');
            updateValues.push(ClientContactNumber);
        }
        if (ClientAddress !== undefined) {
            updateFields.push('ClientAddress = ?');
            updateValues.push(ClientAddress);
        }
        if (ClientPAN !== undefined) {
            updateFields.push('ClientPAN = ?');
            updateValues.push(ClientPAN);
        }
        if (ClientGST !== undefined) {
            updateFields.push('ClientGST = ?');
            updateValues.push(ClientGST);
        }
        if (ClientCIN !== undefined) {
            updateFields.push('ClientCIN = ?');
            updateValues.push(ClientCIN);
        }
        if (Client_SecreteKey !== undefined) {
            updateFields.push('Client_SecreteKey = ?');
            updateValues.push(Client_SecreteKey);
        }

        // Only add fields if we have something to update
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        const updateQuery = `UPDATE ClientMaster SET ${updateFields.join(', ')} WHERE AutoId = ${clientId}`;
        
        console.log('=== EXECUTING UPDATE ===');
        console.log('Update query:', updateQuery);
        console.log('Update values:', updateValues);
        console.log('Update fields count:', updateFields.length);

        const updateResult = await executeQuery(updateQuery, updateValues);
        console.log('Update result:', updateResult);

        // Fetch the updated client
        const selectQuery = `SELECT * FROM ClientMaster WHERE AutoId = ${clientId}`;
        const updatedClient = await executeQuery(selectQuery);

        console.log('=== AFTER UPDATE ===');
        console.log('Updated client:', JSON.stringify(updatedClient[0], null, 2));

        res.json({
            success: true,
            message: 'Client updated successfully',
            data: updatedClient[0]
        });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// GET /api/clientmaster/getClientByID/:id - Get client by ID (excluding soft deleted)
export const getClientById = async (req, res) => {
    try {
        const clientId = req.params.id;
        console.log("---&&& ", clientId)

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'Client ID is required'
            });
        }

        const selectQuery = `
            SELECT * FROM ClientMaster 
            WHERE Client_ClientId = ? AND (IsDeleted IS NULL OR IsDeleted = 0)
        `;

        const clients = await executeQuery(selectQuery, [clientId]);

        if (!clients || clients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Client does not exist or has been deleted'
            });
        }

        console.log('Fetched client from database:', clients[0]);

        res.json({
            success: true,
            message: 'Client retrieved successfully',
            data: clients[0]
        });
    } catch (error) {
        console.error('Error fetching client by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// DELETE /api/clientmaster/deleteClient/:id - Soft delete client by ID
export const deleteClient = async (req, res) => {

    try {
        const clientId = parseInt(req.params.id);
        console.log("Parsed clientId:", clientId);
        console.log("clientId type:", typeof clientId);

        if (isNaN(clientId)) {
            console.log("Invalid client ID - not a number");
            return res.status(400).json({
                success: false,
                message: 'Invalid client ID'
            });
        }

        // Check if client exists and is not already deleted (using AutoId since frontend sends AutoId)
        const checkQuery = `SELECT * FROM ClientMaster WHERE AutoId = ${clientId} AND (IsDeleted IS NULL OR IsDeleted = 0)`;

        const existingClient = await executeQuery(checkQuery);

        if (!existingClient || existingClient.length === 0) {
            console.log("Client not found or already deleted");
            return res.status(404).json({
                success: false,
                message: 'Client not found or already deleted'
            });
        }

        console.log("Client found, proceeding with soft delete");
        console.log("Client to delete:", existingClient[0]);

        // Soft delete the client by setting IsDeleted = 1 (using AutoId)
        const softDeleteQuery = `UPDATE ClientMaster SET IsDeleted = 1 WHERE AutoId = ${clientId}`;
        console.log("Soft delete query:", softDeleteQuery);

        const updateResult = await executeQuery(softDeleteQuery);
        console.log("Update result:", updateResult);

        console.log('Client soft deleted successfully:', existingClient[0]);

        res.json({
            success: true,
            message: 'Client deleted successfully',
            data: existingClient[0]
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// POST /api/clientmaster/addClient - Create new client
export const addClient = async (req, res) => {
    try {
        const {
            ClientName,
            ClientUserName,
            ClientPassword,
            Client_ClientId,
            ClientContactNumber,
            ClientAddress,
            ClientPAN,
            ClientGST,
            ClientCIN,
            Client_SecreteKey,
            CreatedBy
        } = req.body;

        console.log('Creating new client:', req.body);
        console.log('ClientUserName value:', ClientUserName);

        // Basic validation - ClientName and Client_ClientId are required
        if (!ClientName) {
            return res.status(400).json({
                success: false,
                message: 'ClientName is required'
            });
        }

        if (!Client_ClientId) {
            return res.status(400).json({
                success: false,
                message: 'Client ID is required'
            });
        }

        if (!ClientUserName) {
            return res.status(400).json({
                success: false,
                message: 'ClientUserName is required'
            });
        }

        // Check if Client_ClientId already exists
        const checkClientIdQuery = `SELECT * FROM ClientMaster WHERE Client_ClientId = ? AND (IsDeleted IS NULL OR IsDeleted = 0)`;
        const existingClient = await executeQuery(checkClientIdQuery, [Client_ClientId]);

        if (existingClient && existingClient.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Client ID already exists. Please choose a different Client ID.'
            });
        }

        console.log('Using provided Client ID:', Client_ClientId);

        // Get current timestamp for CreatedDate
        const currentDateTime = new Date().toISOString();
        const currentUser = CreatedBy || 'Test User';

        console.log('Current User:', currentUser);
        console.log('Current DateTime:', currentDateTime);

        // Insert new client with auto-generated Client_ClientId using parameterized query
        const insertQuery = `
            INSERT INTO ClientMaster (
                AutoId,
                ClientName,
                ClientUserName,
                ClientPassword,
                ClientContactNumber,
                ClientAddress,
                ClientPAN,
                ClientGST,
                ClientCIN,
                Client_ClientId,
                Client_SecreteKey,
                CreatedBy,
                CreatedDate
            ) VALUES (
                (SELECT ISNULL(MAX(AutoId), 0) + 1 FROM ClientMaster),
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE()
            )
        `;

        const insertParams = [
            ClientName,
            ClientUserName || null,
            ClientPassword || null,
            ClientContactNumber || null,
            ClientAddress || null,
            ClientPAN || null,
            ClientGST || null,
            ClientCIN || null,
            Client_ClientId,
            Client_SecreteKey || null,
            currentUser
        ];



        console.log('Insert query:', insertQuery);
        console.log('Insert params:', insertParams);

        await executeQuery(insertQuery, insertParams);

        // Fetch the newly created client
        const selectQuery = `SELECT * FROM ClientMaster WHERE Client_ClientId = ?`;

        const newClient = await executeQuery(selectQuery, [Client_ClientId]);
        // console.log('Newly created client:', newClient[0]);

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: newClient[0]
        });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};