import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { TBSelector } from '../../Store/Reducers/TBSlice';
import Service from '../../Service/Service';
import TableComponents from '../../components/ant/TableComponents';
import toast, { Toaster } from 'react-hot-toast';
import { Modal, notification } from 'antd';
import CONFIG from '../../Config';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';


export default function Client() {
    const userData = Service.getUserdata();
    const { user } = useSelector(TBSelector);
    const [clientData, setClientData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingClient, setDeletingClient] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [formData, setFormData] = useState({
        ClientName: '',
        Client_ClientId: '',
        ClientContactNumber: '',
        ClientAddress: '',
        ClientPAN: '',
        ClientGST: '',
        ClientCIN: '',
        Client_SecreteKey: ''
    });
    const [formLoading, setFormLoading] = useState(false);

    const columns = [
        {
            title: 'Auto ID',
            key: 'autoId',
            width: 80,
            render: (_, record, index) => (
                <span className="font-semibold text-black dark:text-gray-400">
                    {index + 1}
                </span>
            ),
        },
        {
            title: 'Client ID',
            dataIndex: 'Client_ClientId',
            key: 'Client_ClientId',
            width: 130,
            render: (id) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {id || 'N/A'}
                </span>
            ),
        },
        {
            title: 'Client Name',
            dataIndex: 'ClientName',
            key: 'ClientName',
            width: 200,
            render: (name) => (
                <span className="font-medium text-gray-900 dark:text-white">
                    {name}
                </span>
            ),
        },
        {
            title: 'Contact Number',
            dataIndex: 'ClientContactNumber',
            key: 'ClientContactNumber',
            width: 150,
            render: (contact) => (
                <span className="font-mono text-sm px-2 py-1 rounded">
                    {contact}
                </span>
            ),
        },
        {
            title: 'Address',
            dataIndex: 'ClientAddress',
            key: 'ClientAddress',
            width: 300,
            render: (address) => (
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {address}
                </span>
            ),
        },
        {
            title: 'PAN',
            dataIndex: 'ClientPAN',
            key: 'ClientPAN',
            width: 120,
            render: (pan) => (
                <span className="font-mono text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {pan}
                </span>
            ),
        },
        {
            title: 'GST',
            dataIndex: 'ClientGST',
            key: 'ClientGST',
            width: 120,
            render: (gst) => (
                <span className="font-mono text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {gst}
                </span>
            ),
        },
        {
            title: 'Secret Key',
            dataIndex: 'Client_SecreteKey',
            key: 'Client_SecreteKey',
            width: 150,
            render: (secretKey) => (
                <span className="font-mono text-sm px-2 py-1 rounded border">
                    {secretKey}
                </span>
            ),
        },
        {
            title: 'Created By',
            dataIndex: 'CreatedBy',
            key: 'CreatedBy',
            width: 120,
            render: (createdBy) => (
                <span className="text-sm px-2 py-1  dark:text-blue-300 rounded">
                    {createdBy}
                </span>
            ),
        },
        {
            title: 'Created Date',
            dataIndex: 'CreatedDate',
            key: 'CreatedDate',
            width: 120,
            render: (date) => (
                <span className="text-sm px-2 py-1 dark:text-green-300 rounded">
                    {new Date(date).toLocaleDateString()}
                </span>
            ),
        },
        {
            title: 'Edit',
            key: 'edit',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <button
                    type="button"
                    onClick={() => handleEditClick(record)}
                    className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                    title="Edit API"
                >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.414 2.586a2 2 0 010 2.828l-8.95 8.95a1 1 0 01-.39.24l-3.5 1a1 1 0 01-1.236-1.236l1-3.5a1 1 0 01.24-.39l8.95-8.95a2 2 0 012.828 0z" />
                        <path d="M12.5 4.5l3 3" />
                    </svg>
                </button>
            ),
        },
        {
            title: 'Delete',
            key: 'delete',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <button
                    type="button"
                    onClick={() => handleDeleteClick(record)}
                    className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                    title="Delete API"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            ),
        },

    ];


    useEffect(() => {
        fetchClientData();
    }, []);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            console.log('Starting to fetch client data...');
            const result = await Service.fetchClientMasters();

            if (result.success) {
                const transformedData = result.data
                    .map(client => ({
                        ...client,
                        key: client.AutoId.toString()
                    }))
                    .sort((a, b) => {
                        // Sort by AutoId in ascending order
                        return a.AutoId - b.AutoId;
                    });
                console.log('ClientMaster transformed data:', transformedData);
                setClientData(transformedData);
            } else {
                setError(result.message || 'Failed to fetch client data');
            }
        } catch (err) {
            console.error('ClientMaster fetch error:', err);
            setError('Error connecting to server: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log('Input changed:', name, value); // Debug log
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddClient = async (e) => {
        e.preventDefault();

        // Basic validation - ClientName and Client_ClientId are required
        if (!formData.ClientName) {
            setError('Client Name is required');
            return;
        }

        if (!formData.Client_ClientId) {
            setError('Client ID is required');
            return;
        }

        try {
            setFormLoading(true);
            const result = await Service.createClientMaster({
                ...formData,
                CreatedBy: userData?.name || 'Unknown'
            });

            if (result.success) {
                toast.success('Client added successfully!');
                fetchClientData();
                closeModal();
                setFormData({
                    ClientName: '',
                    ClientContactNumber: '',
                    ClientAddress: '',
                    ClientPAN: '',
                    ClientGST: '',
                    ClientCIN: '',
                    Client_SecreteKey: '',
                    Client_ClientId: ''
                });
            } else {
                const errorMessage = result.message || 'Failed to add client';
                toast.error(errorMessage);
                setError(errorMessage);
            }
        } catch (error) {
            console.error('Error adding client:', error);
            const errorMessage = 'An error occurred while adding the client';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateClient = async (e) => {
        e.preventDefault();
        try {
            setFormLoading(true);
            const updateData = {
                ...formData,
                UpdatedBy: userData?.name || 'Unknown'
            };
            const result = await Service.updateClientMaster(editingClient.AutoId, updateData);
            if (result.success) {
                toast.success('Client updated successfully!');
                fetchClientData();
                closeEditModal();
            } else {
                const errorMessage = result.message || 'Failed to update client';
                toast.error(errorMessage);
                setError(errorMessage);
            }
        } catch (error) {
            console.error('Error updating client:', error);
            const errorMessage = 'An error occurred while updating the client';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingClient) return;

        try {
            setDeleteLoading(true);
            console.log('Starting delete for client:', deletingClient);

            const result = await Service.deleteClientMaster(deletingClient.AutoId);
            console.log('Delete result:', result);

            if (result.success) {
                toast.success('Client deleted successfully!');
                fetchClientData();
                closeDeleteModal();
            } else {
                const errorMessage = result.message || 'Failed to delete client';
                toast.error(errorMessage);
                setError(errorMessage);
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            const errorMessage = 'An error occurred while deleting the client';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEditClick = (record) => {
        setEditingClient(record);
        setFormData({
            ClientName: record.ClientName || '',
            Client_ClientId: record.Client_ClientId || '',
            ClientContactNumber: record.ClientContactNumber || '',
            ClientAddress: record.ClientAddress || '',
            ClientPAN: record.ClientPAN || '',
            ClientGST: record.ClientGST || '',
            ClientCIN: record.ClientCIN || '',
            Client_SecreteKey: record.Client_SecreteKey || ''
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = (record) => {
        setDeletingClient(record);
        setShowDeleteModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setFormData({
            ClientName: '',
            Client_ClientId: '',
            ClientContactNumber: '',
            ClientAddress: '',
            ClientPAN: '',
            ClientGST: '',
            ClientCIN: '',
            Client_SecreteKey: ''
        });
        setError(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingClient(null);
        setFormData({
            ClientName: '',
            Client_ClientId: '',
            ClientContactNumber: '',
            ClientAddress: '',
            ClientPAN: '',
            ClientGST: '',
            ClientCIN: '',
            Client_SecreteKey: ''
        });
        setError(null);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingClient(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Master</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Client
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Table */}
            <TableComponents
                columns={columns}
                dataSource={clientData}
                loading={loading}
                scroll={{ x: 1500 }}
            />

            {/* Add Client Modal */}
            <Modal
                title="Add New Client"
                open={showAddModal}
                onCancel={closeModal}
                footer={null}
                width={600}
            >
                <form onSubmit={handleAddClient} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client Name *
                        </label>
                        <input
                            type="text"
                            name="ClientName"
                            value={formData.ClientName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client ID *
                        </label>
                        <input
                            type="text"
                            name="Client_ClientId"
                            value={formData.Client_ClientId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Number
                        </label>
                        <input
                            type="text"
                            name="ClientContactNumber"
                            value={formData.ClientContactNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <textarea
                            name="ClientAddress"
                            value={formData.ClientAddress}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                PAN
                            </label>
                            <input
                                type="text"
                                name="ClientPAN"
                                value={formData.ClientPAN}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                GST
                            </label>
                            <input
                                type="text"
                                name="ClientGST"
                                value={formData.ClientGST}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CIN
                            </label>
                            <input
                                type="text"
                                name="ClientCIN"
                                value={formData.ClientCIN}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Secret Key
                            </label>
                            <input
                                type="text"
                                name="Client_SecreteKey"
                                value={formData.Client_SecreteKey}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                        >
                            {formLoading ? 'Adding...' : 'Add Client'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Client Modal */}
            <Modal
                title="Edit Client"
                open={showEditModal}
                onCancel={closeEditModal}
                footer={null}
                width={600}
            >
                <form onSubmit={handleUpdateClient} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client Name *
                        </label>
                        <input
                            type="text"
                            name="ClientName"
                            value={formData.ClientName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Client ID Display - Cannot be updated */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client ID   (Read only)
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600">
                            {editingClient?.Client_ClientId || 'Not assigned'}
                        </div>
                       
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Number
                        </label>
                        <input
                            type="text"
                            name="ClientContactNumber"
                            value={formData.ClientContactNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <textarea
                            name="ClientAddress"
                            value={formData.ClientAddress}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                PAN
                            </label>
                            <input
                                type="text"
                                name="ClientPAN"
                                value={formData.ClientPAN}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                GST
                            </label>
                            <input
                                type="text"
                                name="ClientGST"
                                value={formData.ClientGST}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CIN
                            </label>
                            <input
                                type="text"
                                name="ClientCIN"
                                value={formData.ClientCIN}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Secret Key
                            </label>
                            <input
                                type="text"
                                name="Client_SecreteKey"
                                value={formData.Client_SecreteKey}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={closeEditModal}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                        >
                            {formLoading ? 'Updating...' : 'Update Client'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteConfirm}
                title="Delete Client"
                message={`Are you sure you want to delete "${deletingClient?.ClientName}"? This action cannot be undone.`}
                loading={deleteLoading}
            />
        </div>
    );
}
