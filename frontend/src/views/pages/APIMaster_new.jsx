import React, { useState, useEffect } from 'react';
import Service from '../../Service/Service';
import TableComponents from '../../components/ant/TableComponents';
import toast, { Toaster } from 'react-hot-toast';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import { AddAPIModal, EditAPIModal } from '../../components/modals/APIModals';

export default function APIMaster() {
    const userData = Service.getUserdata();
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
        APIId: '',
        APICode: '',
        APIName: '',
        APIDescription: '',
        Version: '',
        MethodName: '',
        BasePrice: '',
        SellPrice: '',
        CreatedBy: '',
        CreatedDate: '',
        UpdatedBy: '',
        UpdatedDate: ''
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
            title: 'API Name',
            dataIndex: 'APIName',
            key: 'APIName',
            width: 200,
            render: (name) => (
                <span className="font-medium text-gray-900 dark:text-white">
                    {name}
                </span>
            ),
        },
        {
            title: 'API Description',
            dataIndex: 'APIDescription',
            key: 'APIDescription',
            width: 200,
            render: (description) => (
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {description}
                </span>
            ),
        },
        {
            title: 'API Code',
            dataIndex: 'APICode',
            key: 'APICode',
            width: 50,
            render: (code) => (
                <span className="font-mono text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {code}
                </span>
            ),
        },
        {
          title: 'Version',
          dataIndex: 'Version',
          key: 'Version',
          width: 80,
          render: (version) => {
              if (version === null || version === undefined || version === '') {
                  return (
                      <span className="text-sm px-2 py-1 text-gray-400 italic">
                          Not set
                      </span>
                  );
              }
              return (
                  <span className="text-sm px-2 py-1 rounded">
                      {version}
                  </span>
              );
          },
      },
        {
            title: 'Method',
            dataIndex: 'MethodName',
            key: 'MethodName',
            width: 80,
            render: (method) => (
                <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {method || 'GET'}
                </span>
            ),
        },
        {
            title: 'Base Price',
            dataIndex: 'BasePrice',
            key: 'BasePrice',
            width: 100,
            render: (price) => (
                <span className="text-sm font-medium text-green-600">
                    ₹{price || 0}
                </span>
            ),
        },
        {
            title: 'Sell Price',
            dataIndex: 'SellPrice',
            key: 'SellPrice',
            width: 100,
            render: (price) => (
                <span className="text-sm font-medium text-blue-600">
                    ₹{price || 0}
                </span>
            ),
        },
        {
            title: 'Created By',
            dataIndex: 'CreatedBy',
            key: 'CreatedBy',
            width: 120,
            render: (createdBy) => (
                <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {createdBy || 'System'}
                </span>
            ),
        },
        {
            title: 'Updated Date',
            dataIndex: 'UpdatedDate',
            key: 'UpdatedDate',
            width: 120,
            render: (date) => (
                <span className="text-sm px-2 py-1 dark:text-yellow-300 rounded">
                    {date ? new Date(date).toLocaleDateString() : 'N/A'}
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
            
            const apiUrl = 'http://localhost:3000/api/apimaster';
            console.log('Fetching API data from:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            console.log('API Response Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('=== API Response ===');
            console.log('Raw response:', JSON.stringify(result, null, 2));
            
            if (!result) {
                throw new Error('Empty response from server');
            }
            
            // Handle both array response and object with data property
            let data = [];
            if (Array.isArray(result)) {
                data = result;
            } else if (result.data && Array.isArray(result.data)) {
                data = result.data;
            } else if (result.success && result.data) {
                data = Array.isArray(result.data) ? result.data : [result.data];
            } else {
                console.warn('Unexpected response format:', result);
                data = [];
            }
            
            console.log(`\n=== API Data (${data.length} items) ===`);
            
            if (data.length === 0) {
                console.warn('No API data received from server');
                setApiData([]);
                return;
            }
            
            // Process the data to ensure all required fields are present
            const processedData = data.map(item => {
                // Ensure all required fields have default values
                const processedItem = {
                    ...item,
                    API_Id: item.API_Id || item.APIId || `temp_${Math.random().toString(36).substr(2, 9)}`,
                    APIName: item.APIName || item.API_Name || 'Unnamed API',
                    APICode: item.APICode || item.API_Code || 'N/A',
                    APIDescription: item.APIDescription || item.API_Description || 'No description',
                    Version: item.Version || '1.0',
                    MethodName: item.MethodName || 'GET',
                    BasePrice: item.BasePrice || item.Base_Price || 0,
                    SellPrice: item.SellPrice || item.Sell_Price || 0,
                    CreatedBy: item.CreatedBy || 'System',
                    CreatedDate: item.CreatedDate || new Date().toISOString(),
                    UpdatedBy: item.UpdatedBy || item.CreatedBy || 'System',
                    UpdatedDate: item.UpdatedDate || item.UpdatedDate || item.CreatedDate || new Date().toISOString()
                };
                
                console.log('Processed item:', processedItem);
                return processedItem;
            });
            
            // Sort the data by APIId
            const sortedData = [...processedData].sort((a, b) => {
                return (a.APIId || 0) - (b.APIId || 0);
            });
            
            setApiData(sortedData);
            
        } catch (error) {
            console.error('Error fetching API data:', error);
            const errorMessage = error.message || 'Failed to load API data';
            setError(errorMessage);
            toast.error(errorMessage);
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

    const closeModal = () => {
        setShowAddModal(false);
        setFormData({
            APIId: '',
            APICode: '',
            APIName: '',
            APIDescription: '',
            Version: '',
            MethodName: '',
            BasePrice: '',
            SellPrice: '',
            CreatedBy: '',
            CreatedDate: '',
            UpdatedBy: '',
            UpdatedDate: ''
        });
        setError(null);
    };

    const handleAddApi = async (e) => {
        e.preventDefault();

        // Basic validation - required fields
        if (!formData.APIId) {
            setError('API ID is required');
            return;
        }

        if (!formData.APIName) {
            setError('API Name is required');
            return;
        }

        // Validate numeric fields
        if (formData.BasePrice && isNaN(Number(formData.BasePrice))) {
            setError('Base Price must be a valid number');
            return;
        }

        if (formData.SellPrice && isNaN(Number(formData.SellPrice))) {
            setError('Sell Price must be a valid number');
            return;
        }

        try {
            setFormLoading(true);
            setError(null);

            console.log('Submitting API data:', formData);
            
            // Prepare the API data with all required fields using backend's expected field names
            const apiData = {
                APIId: formData.APIId,
                APICode: formData.APICode,
                APIName: formData.APIName,
                APIDescription: formData.APIDescription || '',
                Version: formData.Version || '1.0',
                MethodName: formData.MethodName || 'GET',
                BasePrice: formData.BasePrice ? Number(formData.BasePrice) : 0,
                SellPrice: formData.SellPrice ? Number(formData.SellPrice) : 0,
                CreatedBy: "TestUser" 
            };

 
            const response = await fetch('http://localhost:3000/api/apimaster/addAPI', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData)
            });
            
            const result = await response.json();

            if (result.success) {
                toast.success(`API added successfully with ID: ${result.data.API_Id}`);
                // Reset form and close modal
                setFormData({
                    APIId: '',
                    APICode: '',
                    APIName: '',
                    APIDescription: '',
                    Version: '',
                    MethodName: '',
                    BasePrice: '',
                    SellPrice: ''
                });
                closeModal();
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

        // Validate required fields
        if (!formData.APIName || formData.APIName.trim() === '') {
            setError('API Name is required');
            return;
        }

        if (!formData.APICode || formData.APICode.trim() === '') {
            setError('API Code is required');
            return;
        }

        // Validate prices if provided
        if (formData.BasePrice && isNaN(Number(formData.BasePrice))) {
            setError('Base Price must be a valid number');
            return;
        }

        if (formData.SellPrice && isNaN(Number(formData.SellPrice))) {
            setError('Sell Price must be a valid number');
            return;
        }

        try {
            setFormLoading(true);
            setError(null);

            // Map frontend field names to backend field names
            const apiData = {
                API_Name: formData.APIName,
                API_Description: formData.APIDescription || '',
                API_Code: formData.APICode,
                Version: formData.Version || '1.0',
                MethodName: formData.MethodName || 'GET',
                Base_Price: formData.BasePrice ? Number(formData.BasePrice) : 0,
                Sell_Price: formData.SellPrice ? Number(formData.SellPrice) : 0,
                UpdatedBy: 'Test User' // Using 'Test User' as the default value
            };
            
            // Use AutoID for the update
            const apiId = editingApi.API_Id || editingApi.APIId;
          
            if (!apiId) {
                throw new Error('No valid API ID found for update');
            }

            const result = await Service.updateAPIMaster(apiId, apiData);

            if (result && result.success) {
                toast.success('API updated successfully!');
                closeEditModal();
                fetchApiData();
            } else {
                const errorMsg = result?.message || 'Failed to update API';
                throw new Error(errorMsg);
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

    const handleEditClick = (record) => {
        console.log('Edit clicked for record:', record);
        setEditingApi(record);
        setFormData({
            APIId: record.APIId || record.API_Id,
            APICode: record.APICode || record.API_Code,
            APIName: record.APIName || record.API_Name,
            APIDescription: record.APIDescription || record.API_Description,
            Version: record.Version || '1.0',
            MethodName: record.MethodName || 'GET',
            BasePrice: record.BasePrice || record.Base_Price || 0,
            SellPrice: record.SellPrice || record.Sell_Price || 0,
            CreatedBy: record.CreatedBy,
            CreatedDate: record.CreatedDate,
            UpdatedBy: record.UpdatedBy,
            UpdatedDate: record.UpdatedDate
        });
        setShowEditModal(true);
        setError(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingApi(null);
        setFormData({
            APIId: '',
            APICode: '',
            APIName: '',
            APIDescription: '',
            Version: '',
            MethodName: '',
            BasePrice: '',
            SellPrice: '',
            CreatedBy: '',
            CreatedDate: '',
            UpdatedBy: '',
            UpdatedDate: ''
        });
        setError(null);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingApi(null);
    };

    const handleDeleteClick = (record) => {
        setDeletingApi(record);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingApi) {
            console.error('No API selected for deletion');
            return;
        }

        // Use APIId or API_Id, whichever is available
        const apiIdToDelete = deletingApi.APIId || deletingApi.API_Id;
        console.log('Deleting API with data:', deletingApi);
        console.log('API ID to delete:', apiIdToDelete, 'Type:', typeof apiIdToDelete);
        
        if (!apiIdToDelete) {
            const errorMsg = 'No valid API ID found for deletion';
            console.error(errorMsg);
            toast.error(errorMsg);
            return;
        }

        try {
            setDeleteLoading(true);
            setError(null);

            console.log('Sending delete request for API ID:', apiIdToDelete);
            const response = await fetch(`http://localhost:3000/api/apimaster/deleteAPI/${apiIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete request failed:', response.status, errorText);
                throw new Error(`Server responded with status ${response.status}: ${errorText}`);
            }

            console.log('Delete response status:', response.status);
            const result = await response.json().catch(e => {
                console.error('Error parsing JSON response:', e);
                throw new Error('Invalid response from server');
            });
            console.log('Delete response body:', result);

            if (result.success) {
                // Show appropriate success message
                const message = result.message === 'API already deleted' 
                    ? 'API was already deleted' 
                    : 'API deleted successfully! (Soft Delete)';
                toast.success(message);
                
                // Remove the deleted item from the UI immediately
                setApiData(prevData => 
                    prevData.filter(api => (api.APIId || api.API_Id) !== apiIdToDelete)
                );
                closeDeleteModal();
            } else {
                throw new Error(result.message || 'Failed to delete API');
            }
        } catch (error) {
            console.error('Error deleting API:', error);
            const errorMessage = error.message || 'An error occurred while deleting the API';
            toast.error(errorMessage);
            setError(errorMessage);
            closeDeleteModal(); // Close modal even on error
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Master</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New API
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <TableComponents
                        columns={columns}
                        dataSource={apiData}
                        loading={loading}
                        scroll={{ x: 800 }}
                        rowKey="API_Id"
                    />
                </div>
            )}

            {/* Add API Modal */}
            <AddAPIModal
                isOpen={showAddModal}
                onClose={closeModal}
                onSubmit={handleAddApi}
                formData={formData}
                onInputChange={handleInputChange}
                isLoading={formLoading}
                error={error}
            />

            {/* Edit API Modal */}
            <EditAPIModal
                isOpen={showEditModal}
                onClose={closeEditModal}
                onSubmit={handleUpdateApi}
                formData={formData}
                onInputChange={handleInputChange}
                isLoading={formLoading}
                error={error}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteConfirm}
                isLoading={deleteLoading}
                title="Delete API"
                message="Are you sure you want to delete this API?"
            />

            <Toaster />
        </div>
    );
}
