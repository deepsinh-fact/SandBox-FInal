import express from 'express';
import {
    getAllAPI,
    getAPIById,
    addAPI,
    updateAPI,
    deleteAPI,
    restoreAPI,
    debugDatabase
} from '../controllers/apiMaster.js';

const router = express.Router();


router.get('/getAllAPI', getAllAPI);

router.get('/debug', debugDatabase);

// Test endpoint for update functionality
router.post('/testUpdate', async (req, res) => {
    try {
        const { originalId, newData } = req.body;
        console.log('Test update request:', { originalId, newData });
        
        res.json({
            success: true,
            message: 'Test endpoint working',
            received: { originalId, newData }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Test endpoint error',
            error: error.message
        });
    }
});

router.get('/getAPIByID/:id', getAPIById);

router.post('/addAPI', addAPI);

// Test endpoint to verify routing
router.put('/test/:id', (req, res) => {
    res.json({
        success: true,
        message: 'Test route working',
        id: req.params.id,
        body: req.body
    });
});

router.put('/updateAPI/:id', updateAPI);

// DELETE /api/apimaster/deleteAPI/:id - Delete API by ID
router.delete('/deleteAPI/:id', deleteAPI);

// PUT /api/apimaster/restoreAPI/:id - Restore soft-deleted API by ID
router.put('/restoreAPI/:id', restoreAPI);

export default router;