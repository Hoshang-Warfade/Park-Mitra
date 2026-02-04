import React, { useState, useEffect } from 'react';
import { 
  getParkingLots, 
  createParkingLot, 
  updateParkingLot, 
  updateParkingLotSlots,
  toggleParkingLotStatus, 
  deleteParkingLot 
} from '../../services/parkingLotService';
import { FaParking, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const ParkingLotManagement = ({ organizationId }) => {
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [deletingLot, setDeletingLot] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(true);

  const [formData, setFormData] = useState({
    lot_name: '',
    lot_description: '',
    total_slots: '',
    priority_order: ''
  });

  const fetchParkingLots = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getParkingLots(organizationId, includeInactive);
      setParkingLots(data.parking_lots || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load parking lots');
    } finally {
      setLoading(false);
    }
  }, [organizationId, includeInactive]);

  useEffect(() => {
    fetchParkingLots();
  }, [fetchParkingLots]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      lot_name: '',
      lot_description: '',
      total_slots: '',
      priority_order: ''
    });
  };

  const handleAddLot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await createParkingLot(organizationId, {
        lot_name: formData.lot_name,
        lot_description: formData.lot_description || null,
        total_slots: parseInt(formData.total_slots),
        priority_order: parseInt(formData.priority_order)
      });

      setSuccess('Parking lot created successfully!');
      setShowAddModal(false);
      resetForm();
      fetchParkingLots();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create parking lot');
    }
  };

  const handleEditLot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateParkingLot(editingLot.lot_id, {
        lot_name: formData.lot_name,
        lot_description: formData.lot_description || null,
        priority_order: parseInt(formData.priority_order)
      });

      // Update slots separately if changed
      if (parseInt(formData.total_slots) !== editingLot.total_slots) {
        await updateParkingLotSlots(editingLot.lot_id, parseInt(formData.total_slots));
      }

      setSuccess('Parking lot updated successfully!');
      setShowEditModal(false);
      setEditingLot(null);
      resetForm();
      fetchParkingLots();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update parking lot');
    }
  };

  const handleToggleStatus = async (lotId) => {
    try {
      await toggleParkingLotStatus(lotId);
      setSuccess('Parking lot status updated!');
      fetchParkingLots();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteLot = async (lotId, lotName) => {
    setDeletingLot({ id: lotId, name: lotName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingLot) return;

    try {
      await deleteParkingLot(deletingLot.id);
      setSuccess('Parking lot deleted successfully!');
      fetchParkingLots();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete parking lot');
    } finally {
      setShowDeleteModal(false);
      setDeletingLot(null);
    }
  };

  const openEditModal = (lot) => {
    setEditingLot(lot);
    setFormData({
      lot_name: lot.lot_name,
      lot_description: lot.lot_description || '',
      total_slots: lot.total_slots.toString(),
      priority_order: lot.priority_order.toString()
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingLot(null);
    resetForm();
    setError('');
  };

  if (loading && parkingLots.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaParking className="text-blue-600" />
            Parking Lot Management
          </h2>
          <p className="text-gray-600 mt-1">Manage your parking lots, slots, and priorities</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <FaPlus /> Add Parking Lot
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          Show inactive parking lots
        </label>
      </div>

      {/* Parking Lots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parkingLots.map((lot) => (
          <div
            key={lot.lot_id}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              lot.is_active ? 'border-green-500' : 'border-gray-400'
            }`}
          >
            {/* Lot Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{lot.lot_name}</h3>
                {lot.lot_description && (
                  <p className="text-sm text-gray-600 mt-1">{lot.lot_description}</p>
                )}
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                lot.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {lot.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Lot Stats */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Slots:</span>
                <span className="font-semibold text-gray-800">{lot.total_slots}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available:</span>
                <span className={`font-semibold ${
                  (lot.stats?.available_slots ?? lot.available_slots) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {lot.stats?.available_slots ?? lot.available_slots}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Priority:</span>
                <span className="font-semibold text-blue-600">#{lot.priority_order}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    ((lot.stats?.available_slots ?? lot.available_slots) / lot.total_slots) > 0.5
                      ? 'bg-green-500'
                      : ((lot.stats?.available_slots ?? lot.available_slots) / lot.total_slots) > 0.2
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${((lot.stats?.available_slots ?? lot.available_slots) / lot.total_slots) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(((lot.stats?.available_slots ?? lot.available_slots) / lot.total_slots) * 100)}% available
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(lot)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 flex items-center justify-center gap-1 text-sm transition-colors"
              >
                <FaEdit /> Edit
              </button>
              <button
                onClick={() => handleToggleStatus(lot.lot_id)}
                className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-1 text-sm transition-colors ${
                  lot.is_active
                    ? 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {lot.is_active ? <FaToggleOff /> : <FaToggleOn />}
                {lot.is_active ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => handleDeleteLot(lot.lot_id, lot.lot_name)}
                className="bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 flex items-center justify-center text-sm transition-colors"
                title="Delete"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {parkingLots.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FaParking className="text-6xl mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No parking lots found</p>
          <p className="text-sm">Click "Add Parking Lot" to create your first parking lot</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {showAddModal ? 'Add New Parking Lot' : 'Edit Parking Lot'}
              </h3>

              <form onSubmit={showAddModal ? handleAddLot : handleEditLot}>
                <div className="space-y-4">
                  {/* Lot Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lot Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lot_name"
                      value={formData.lot_name}
                      onChange={handleInputChange}
                      placeholder="e.g., E-Building Basement"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      name="lot_description"
                      value={formData.lot_description}
                      onChange={handleInputChange}
                      placeholder="Brief description of the parking lot"
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Total Slots */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Slots <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="total_slots"
                      value={formData.total_slots}
                      onChange={handleInputChange}
                      min="1"
                      max="10000"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Priority Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority Order <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="priority_order"
                      value={formData.priority_order}
                      onChange={handleInputChange}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower numbers get filled first (1 = highest priority)
                    </p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showAddModal ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <FaTrash className="h-8 w-8 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete Parking Lot
              </h3>

              {/* Message */}
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{deletingLot?.name}"</span>?
                <br />
                <span className="text-sm text-red-600 mt-2 block">
                  This action cannot be undone. All slots and associated data will be permanently removed.
                </span>
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingLot(null);
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingLotManagement;
