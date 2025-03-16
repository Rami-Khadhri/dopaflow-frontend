import React, { useState, useEffect } from 'react';
import { FaPlus, FaCheck, FaEdit, FaTrash, FaUser, FaFilter, FaCalendarAlt, FaSpinner, FaTasks, FaBan } from 'react-icons/fa';
import axios from 'axios';

const getAuthToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else console.warn('No token found in localStorage');
  return config;
}, error => Promise.reject(error));

const Tasks = () => {
  const [tasks, setTasks] = useState({ ToDo: [], InProgress: [], Done: [], Cancelled: [] });
  const [opportunities, setOpportunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '', description: '', deadline: '', priority: 'MEDIUM', typeTask: 'CALL', assignedUserId: '', opportunityId: ''
  });
  const [editTask, setEditTask] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchUsers(), fetchOpportunities()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/all');
      console.log('Tasks response:', response.data);
      const taskData = response.data.content.reduce((acc, task) => {
        const status = task.statutTask || 'ToDo';
        acc[status] = [...(acc[status] || []), task];
        return acc;
      }, { ToDo: [], InProgress: [], Done: [], Cancelled: [] });
      setTasks(taskData);
      setError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(`Failed to load tasks: ${error.response?.status || 'Unknown error'}`);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/all');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await api.get('/opportunities/all');
      setOpportunities(response.data.content);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      setError('Failed to load opportunities');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post(
        `/tasks/add?opportunityId=${newTask.opportunityId}&assignedUserId=${newTask.assignedUserId}`,
        newTask
      );
      setTasks(prev => ({ ...prev, ToDo: [response.data, ...prev.ToDo] }));
      setNewTask({ title: '', description: '', deadline: '', priority: 'MEDIUM', typeTask: 'CALL', assignedUserId: '', opportunityId: '' });
      setShowAddTaskModal(false);
      setError(null);
    } catch (error) {
      setError(`Error adding task: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put(
        `/tasks/update/${editTask.id}?assignedUserId=${editTask.assignedUserId}`,
        {
          title: editTask.title,
          description: editTask.description,
          deadline: editTask.deadline,
          priority: editTask.priority,
          typeTask: editTask.typeTask,
          opportunity: { id: editTask.opportunityId },
          statutTask: editTask.statutTask
        }
      );
      setTasks(prev => {
        const updatedTask = response.data;
        const fromColumn = Object.keys(prev).find(key => prev[key].some(t => t.id === updatedTask.id));
        return {
          ...prev,
          [fromColumn]: prev[fromColumn].map(t => t.id === updatedTask.id ? updatedTask : t)
        };
      });
      setShowEditTaskModal(false);
      setEditTask(null);
      setError(null);
    } catch (error) {
      console.error('Error updating task:', error);
      setError(`Error updating task: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
    setLoading(true);
    try {
      const response = await api.put(`/tasks/change-status/${taskId}?status=${newStatus}`);
      setTasks(prev => {
        const task = Object.values(prev).flat().find(t => t.id === taskId);
        const fromColumn = task.statutTask;
        return {
          ...prev,
          [fromColumn]: prev[fromColumn].filter(t => t.id !== taskId),
          [newStatus]: [...prev[newStatus], response.data]
        };
      });
      setError(null);
    } catch (error) {
      console.error('Error moving task:', error);
      setError('Error moving task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId, column) => {
    setLoading(true);
    try {
      await api.delete(`/tasks/delete/${taskId}`);
      setTasks(prev => ({ ...prev, [column]: prev[column].filter(t => t.id !== taskId) }));
      setError(null);
    } catch (error) {
      setError('Error deleting task');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-orange-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTasks = (tasksList) => filter === 'all' ? tasksList : tasksList.filter(task => task.priority.toLowerCase() === filter);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <FaSpinner className="animate-spin text-5xl text-blue-600" />
      <span className="ml-4 text-xl text-gray-700">Chargement...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md animate-slideIn">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="float-right font-bold text-lg">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Tâches</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 flex items-center transition-all duration-300 shadow-md"
          >
            <FaPlus className="mr-2" /> Nouvelle Tâche
          </button>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-white text-gray-700 px-5 py-2 rounded-full hover:bg-gray-200 flex items-center transition-all duration-300 shadow-md"
            >
              <FaFilter className="mr-2" /> Filtrer
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-10 animate-dropIn">
                {['all', 'high', 'medium', 'low'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-100 transition-colors duration-200 ${filter === f ? 'bg-blue-50 font-semibold' : ''}`}
                  >
                    {f === 'all' ? 'Toutes' : `Priorité ${f.charAt(0).toUpperCase() + f.slice(1)}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(tasks).map(([column, tasksList]) => (
          <div key={column} className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-300 hover:shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{column}</h3>
            <div className="space-y-4">
              {filteredTasks(tasksList).map(task => (
                <div
                  key={task.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{task.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <FaCalendarAlt className="inline mr-1" /> {new Date(task.deadline).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <FaUser className="inline mr-1" /> Assigné à: {task.assignedUserUsername || 'Inconnu'}
                      </p>
                      <p className="text-sm text-gray-600">Opportunité: {task.opportunityTitle || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Type: {task.typeTask}</p>
                    </div>
                    <span className={`w-4 h-4 rounded-full ${getPriorityColor(task.priority)}`}></span>
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    {column !== 'Done' && (
                      <button
                        onClick={() => handleMoveTask(task.id, 'Done')}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors duration-200"
                        title="Marquer comme terminé"
                      >
                        <FaCheck className="w-5 h-5" />
                      </button>
                    )}
                    {column !== 'InProgress' && (
                      <button
                        onClick={() => handleMoveTask(task.id, 'InProgress')}
                        className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full transition-colors duration-200"
                        title="En cours"
                      >
                        <FaTasks className="w-5 h-5" />
                      </button>
                    )}
                    {column !== 'Cancelled' && (
                      <button
                        onClick={() => handleMoveTask(task.id, 'Cancelled')}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        title="Annuler"
                      >
                        <FaBan className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditTask({
                          id: task.id,
                          title: task.title,
                          description: task.description || '',
                          deadline: new Date(task.deadline).toISOString().slice(0, 16),
                          priority: task.priority,
                          typeTask: task.typeTask,
                          assignedUserId: task.assignedUserId || '',
                          opportunityId: task.opportunityId || '',
                          statutTask: task.statutTask
                        });
                        setShowEditTaskModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
                      title="Modifier"
                    >
                      <FaEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id, column)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                      title="Supprimer"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all duration-300 animate-scaleIn">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ajouter une Tâche</h2>
            <form onSubmit={handleAddTask} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input
                  type="datetime-local"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                >
                  <option value="HIGH">Élevée</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="LOW">Faible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Tâche</label>
                <select
                  value={newTask.typeTask}
                  onChange={(e) => setNewTask({ ...newTask, typeTask: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                >
                  <option value="CALL">Appel</option>
                  <option value="EMAIL">Email</option>
                  <option value="MEETING">Réunion</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigné à</label>
                <select
                  value={newTask.assignedUserId}
                  onChange={(e) => setNewTask({ ...newTask, assignedUserId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opportunité</label>
                <select
                  value={newTask.opportunityId}
                  onChange={(e) => setNewTask({ ...newTask, opportunityId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                >
                  <option value="">Sélectionner une opportunité</option>
                  {opportunities.map(opportunity => (
                    <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 h-20"
                  required
                />
              </div>
              <div className="col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 shadow-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 shadow-md"
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="animate-spin inline mr-2" /> : null}
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && editTask && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300 animate-scaleIn">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Modifier la Tâche</h2>
            <form onSubmit={handleEditTask} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={editTask.title}
                  onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editTask.description}
                  onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 h-24"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input
                  type="datetime-local"
                  value={editTask.deadline}
                  onChange={(e) => setEditTask({ ...editTask, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <select
                  value={editTask.priority}
                  onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                >
                  <option value="HIGH">Élevée</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="LOW">Faible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Tâche</label>
                <select
                  value={editTask.typeTask}
                  onChange={(e) => setEditTask({ ...editTask, typeTask: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                >
                  <option value="CALL">Appel</option>
                  <option value="EMAIL">Email</option>
                  <option value="MEETING">Réunion</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigné à</label>
                <select
                  value={editTask.assignedUserId}
                  onChange={(e) => setEditTask({ ...editTask, assignedUserId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opportunité</label>
                <select
                  value={editTask.opportunityId}
                  onChange={(e) => setEditTask({ ...editTask, opportunityId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                >
                  <option value="">Sélectionner une opportunité</option>
                  {opportunities.map(opportunity => (
                    <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditTaskModal(false)}
                  className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 shadow-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 shadow-md"
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="animate-spin inline mr-2" /> : null}
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = `
  @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes dropIn { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .animate-slideIn { animation: slideIn 0.3s ease-out; }
  .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
  .animate-dropIn { animation: dropIn 0.2s ease-out; }
`;

export default Tasks;