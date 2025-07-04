'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Upload } from 'lucide-react';
import { getAllChallenges } from '@/lib/services/challenges';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/lib/hooks/useUserRole';
import type { Database } from '@/lib/types/database';

type Challenge = Database['public']['Tables']['challenges']['Row'];

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const { role } = useUserRole();

  // Redirect if not admin/editor
  useEffect(() => {
    if (role && role !== 'admin' && role !== 'editor') {
      window.location.href = '/dashboard';
    }
  }, [role]);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const data = await getAllChallenges();
      setChallenges(data);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);

      if (error) throw error;
      
      await loadChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert('Failed to delete challenge');
    }
  };

  const toggleChallengeStatus = async (challengeId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('challenges')
        .update({ is_active: !currentStatus })
        .eq('id', challengeId);

      if (error) throw error;
      
      await loadChallenges();
    } catch (error) {
      console.error('Error updating challenge status:', error);
      alert('Failed to update challenge status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-center">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Challenge Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create and manage challenge themes for your community
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Challenge
          </button>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
            >
              {/* Challenge Header */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {challenge.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${challenge.theme === 'gratitude' ? 'bg-green-500' : challenge.theme === 'prayer' ? 'bg-blue-500' : challenge.theme === 'faith' ? 'bg-purple-500' : 'bg-gray-500'}`}></span>
                        {challenge.theme}
                      </span>
                      <span>{challenge.total_challenges} challenges</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    challenge.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {challenge.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {challenge.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                    {challenge.description}
                  </p>
                )}

                {/* Challenge Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Schedule:</span>
                    <span className="text-gray-900 dark:text-white">
                      {challenge.weekly_schedule ? 'Mon-Fri + Reviews' : 'Daily'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="text-gray-900 dark:text-white">
                      {challenge.category || 'General'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Challenge Actions */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit challenge"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <div className="text-sm text-gray-500 flex items-center ml-2">
                      ID: {challenge.id.substring(0, 8)}...
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleChallengeStatus(challenge.id, challenge.is_active)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        challenge.is_active
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-200 text-green-700 hover:bg-green-300'
                      }`}
                    >
                      {challenge.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteChallenge(challenge.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete challenge"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {challenges.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No challenges created yet
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Challenge
            </button>
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <CreateChallengeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadChallenges();
          }}
        />
      )}

      {/* Edit Challenge Modal */}
      {showEditModal && selectedChallenge && (
        <EditChallengeModal
          challenge={selectedChallenge}
          onClose={() => {
            setShowEditModal(false);
            setSelectedChallenge(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedChallenge(null);
            loadChallenges();
          }}
        />
      )}
    </div>
  );
}

function CreateChallengeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    theme: 'gratitude',
    total_challenges: 70,
    category: '',
    weekly_schedule: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('challenges')
        .insert([{
          ...formData,
          is_active: false, // Start inactive until content is added
        }]);

      if (error) throw error;
      
      onSuccess();
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Create New Challenge
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Challenge Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="gratitude">Gratitude</option>
                <option value="prayer">Prayer</option>
                <option value="faith">Faith</option>
                <option value="service">Service</option>
                <option value="worship">Worship</option>
                <option value="scripture">Scripture</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Challenges
              </label>
              <input
                type="number"
                min="70"
                max="365"
                value={formData.total_challenges}
                onChange={(e) => setFormData({ ...formData, total_challenges: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category (Optional)
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Beginner, Advanced, Youth"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="weekly_schedule"
                checked={formData.weekly_schedule}
                onChange={(e) => setFormData({ ...formData, weekly_schedule: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="weekly_schedule" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Use weekly schedule (Mon-Fri + Sunday reviews)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Creating...' : 'Create Challenge'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditChallengeModal({ challenge, onClose, onSuccess }: { 
  challenge: Challenge; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    title: challenge.title,
    description: challenge.description || '',
    theme: challenge.theme,
    total_challenges: challenge.total_challenges,
    category: challenge.category || '',
    weekly_schedule: challenge.weekly_schedule,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('challenges')
        .update(formData)
        .eq('id', challenge.id);

      if (error) throw error;
      
      onSuccess();
    } catch (error) {
      console.error('Error updating challenge:', error);
      alert('Failed to update challenge');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Edit Challenge
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Challenge Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="gratitude">Gratitude</option>
                <option value="prayer">Prayer</option>
                <option value="faith">Faith</option>
                <option value="service">Service</option>
                <option value="worship">Worship</option>
                <option value="scripture">Scripture</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Challenges
              </label>
              <input
                type="number"
                min="70"
                max="365"
                value={formData.total_challenges}
                onChange={(e) => setFormData({ ...formData, total_challenges: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category (Optional)
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Beginner, Advanced, Youth"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit_weekly_schedule"
                checked={formData.weekly_schedule}
                onChange={(e) => setFormData({ ...formData, weekly_schedule: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="edit_weekly_schedule" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Use weekly schedule (Mon-Fri + Sunday reviews)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Updating...' : 'Update Challenge'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}