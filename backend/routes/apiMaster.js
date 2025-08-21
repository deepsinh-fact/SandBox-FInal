import express from 'express';
import { addAPI, getAllAPIs, updateAPI, deleteAPI } from '../controllers/apiMaster.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sql = require('msnodesqlv8');
import 'dotenv/config';

const connectionString = `server=${process.env.DB_SERVER || "FACT-LAP-07"};Database=${process.env.DB_NAME || "Fact"};Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server};`;

const router = express.Router();

// GET /api/apimaster - Get all APIs
router.get('/', getAllAPIs);

// POST /api/apimaster/addAPI - Create new API
router.post('/addAPI', addAPI);

// PUT /api/apimaster/updateAPI/:id - Update existing API
router.put('/updateAPI/:id', (req, res, next) => {
    console.log('Update API endpoint hit. ID:', req.params.id);
    next();
}, updateAPI);

// Soft delete
router.delete('/deleteAPI/:id', (req, res, next) => {
    console.log('Delete API endpoint hit. ID:', req.params.id);
    next();
}, deleteAPI);

export default router;