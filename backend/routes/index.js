import authRoutes from './auth.js';
import clientRoutes from './client.js';
import clientMasterRoutes from './clientMaster.js';
import apiMasterRoutes from './apiMaster.js';

const setupRoutes = (app) => {
    // Mount all API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/client', clientRoutes);
    app.use('/api/clientmaster', clientMasterRoutes);
    app.use('/api/apimaster', apiMasterRoutes);
};

export default setupRoutes;