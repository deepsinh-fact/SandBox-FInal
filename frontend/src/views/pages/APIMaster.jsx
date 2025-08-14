import React, { useState, useEffect } from 'react';
import TableComponents from '../../components/ant/TableComponents';
import toast, { Toaster } from 'react-hot-toast';
import { Modal } from 'antd';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';


export default function APIMaster() {
    const [apiData, setApiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingApi, setEditingApi] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingApi, setDeletingApi] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [formData, setFormData] = useState({
        API_Id: '',
        API_Name: '',
        API_Description: '',
        API_Code: ''
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
            title: 'API Id',
            dataIndex: 'API_Id',
            key: 'API_Id',
            width: 100,
            render: (id) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {id}
                </span>
            ),
        },
        {
            title: 'API Name',
            dataIndex: 'API_Name',
            key: 'API_Name',
            width: 200,
            render: (name) => (
                <span className="font-medium text-gray-900 dark:text-white">
                    {name}
                </span>
            ),
        },
        {
            title: 'API Description',
            dataIndex: 'API_Description',
            key: 'API_Description',
            width: 250,
            render: (description) => (
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {description}
                </span>
            ),
        },
        {
            title: 'API Code',
            dataIndex: 'API_Code',
            key: 'API_Code',
            width: 150,
            render: (code) => (
                <span className="font-mono text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {code}
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
            title: 'IsDeleted',
            dataIndex: 'IsDeleted',
            key: 'IsDeleted',
            width: 100,
            align: 'center',
            render: (isDeleted) => (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${isDeleted === 1 || isDeleted === true
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    }`}>
                    {isDeleted === 1 || isDeleted === true ? 'Deleted' : 'Active'}
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
                    disabled={record.IsDeleted === 1 || record.IsDeleted === true}
                    className={`p-2 rounded ${record.IsDeleted === 1 || record.IsDeleted === true
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                    title={record.IsDeleted === 1 || record.IsDeleted === true ? "Cannot edit deleted API" : "Edit API"}
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
                    disabled={record.IsDeleted === 1 || record.IsDeleted === true}
                    className={`p-2 rounded ${record.IsDeleted === 1 || record.IsDeleted === true
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                    title={record.IsDeleted === 1 || record.IsDeleted === true ? "Already deleted" : "Delete API"}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            ),
        },
    ];


    const fetchApiData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://localhost:3000/api/apimaster/getAllAPI');
            const result = await response.json();

            if (result.success) {
                // Sort data by CreatedDate (oldest first) or API_Id to ensure new items appear at bottom
                // Show both active and soft-deleted records
                const sortedData = (result.data || []).sort((a, b) => {
                    // First try to sort by CreatedDate if available
                    if (a.CreatedDate && b.CreatedDate) {
                        return new Date(a.CreatedDate) - new Date(b.CreatedDate);
                    }
                    // Fallback to sorting by API_Id
                    return (a.API_Id || 0) - (b.API_Id || 0);
                });
                setApiData(sortedData);
            } else {
                throw new Error(result.message || 'Failed to fetch API data');
            }
        } catch (error) {
            console.error('Error fetching API data:', error);
            setError(error.message || 'Failed to load API data');
            setApiData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApiData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddApi = async (e) => {
        e.preventDefault();

        // Basic validation - both API_Id and API_Name are required
        if (!formData.API_Id) {
            setError('API ID is required');
            return;
        }

        if (!formData.API_Name) {
            setError('API Name is required');
            return;
        }

        try {
            setFormLoading(true);
            setError(null);

            const response = await fetch('http://localhost:3000/api/apimaster/addAPI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    API_Id: formData.API_Id,
                    API_Name: formData.API_Name,
                    API_Description: formData.API_Description,
                    API_Code: formData.API_Code
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success(`API added successfully with ID: ${result.data.API_Id}`);
                closeModal();
                // Refresh the data
                fetchApiData();
            } else {
                throw new Error(result.message || 'Failed to add API');
            }
        } catch (error) {
            console.error('Error adding API:', error);
            const errorMessage = error.message || 'An error occurred while adding the API';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateApi = async (e) => {
        e.preventDefault();
        if (!editingApi) return;

        // Basic validation
        if (!formData.API_Name) {
            setError('API Name is required');
            return;
        }

        try {
            setFormLoading(true);
            setError(null);

            console.log('Updating API with data:', {
                originalId: editingApi.API_Id,
                newData: {
                    API_Name: formData.API_Name,
                    API_Description: formData.API_Description,
                    API_Code: formData.API_Code
                }
            });

            const response = await fetch(`http://localhost:3000/api/apimaster/updateAPI/${editingApi.API_Id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    API_Name: formData.API_Name,
                    API_Description: formData.API_Description,
                    API_Code: formData.API_Code
                })
            });

            const result = await response.json();
            console.log('Update response:', result);

            if (result.success) {
                toast.success('API updated successfully!');
                closeEditModal();
                // Refresh the data
                fetchApiData();
            } else {
                throw new Error(result.message || 'Failed to update API');
            }
        } catch (error) {
            console.error('Error updating API:', error);
            const errorMessage = error.message || 'An error occurred while updating the API';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingApi) return;

        try {
            setDeleteLoading(true);
            setError(null);

            const response = await fetch(`http://localhost:3000/api/apimaster/deleteAPI/${deletingApi.API_Id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                toast.success('API deleted successfully! (Soft Delete)');
                closeDeleteModal();
                // Refresh the data
                fetchApiData();
            } else {
                throw new Error(result.message || 'Failed to delete API');
            }
        } catch (error) {
            console.error('Error deleting API:', error);
            const errorMessage = error.message || 'An error occurred while deleting the API';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEditClick = (record) => {
        setEditingApi(record);
        setFormData({
            API_Id: record.API_Id || '',
            API_Name: record.API_Name || '',
            API_Description: record.API_Description || '',
            API_Code: record.API_Code || ''
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = (record) => {
        setDeletingApi(record);
        setShowDeleteModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setFormData({
            API_Id: '',
            API_Name: '',
            API_Description: '',
            API_Code: ''
        });
        setError(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingApi(null);
        setFormData({
            API_Id: '',
            API_Name: '',
            API_Description: '',
            API_Code: ''
        });
        setError(null);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingApi(null);
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Master</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add API
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
                dataSource={apiData}
                loading={loading}
                scroll={{ x: 800 }}
                rowKey="API_Id"
            />

            <Modal
                title="Add New API"
                open={showAddModal}
                onCancel={closeModal}
                footer={null}
                width={600}
            >

                <form onSubmit={handleAddApi} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Id *
                        </label>
                        <input
                            type="text"
                            name="API_Id"
                            value={formData.API_Id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="Enter unique API ID"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Name *
                        </label>
                        <input
                            type="text"
                            name="API_Name"
                            value={formData.API_Name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Description
                        </label>
                        <textarea
                            name="API_Description"
                            value={formData.API_Description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Code
                        </label>
                        <input
                            type="text"
                            name="API_Code"
                            value={formData.API_Code}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
                            {formLoading ? 'Adding...' : 'Add API'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit API Modal */}
            <Modal
                title="Edit API"
                open={showEditModal}
                onCancel={closeEditModal}
                footer={null}
                width={600}
            >
                <form onSubmit={handleUpdateApi} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API ID (Read Only)
                        </label>
                        <input
                            type="text"
                            name="API_Id"
                            value={formData.API_Id}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                            readOnly
                            disabled
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Name *
                        </label>
                        <input
                            type="text"
                            name="API_Name"
                            value={formData.API_Name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Description
                        </label>
                        <textarea
                            name="API_Description"
                            value={formData.API_Description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Code
                        </label>
                        <input
                            type="text"
                            name="API_Code"
                            value={formData.API_Code}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
                            {formLoading ? 'Updating...' : 'Update API'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteConfirm}
                title="Delete API"
                message={`Are you sure you want to delete "${deletingApi?.API_Name}"? This will mark the API as deleted but keep it in the database.`}
                loading={deleteLoading}
            />
        </div>
    );
}
