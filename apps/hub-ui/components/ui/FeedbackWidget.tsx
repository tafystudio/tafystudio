'use client';

import { useState } from 'react';
import Button from './Button';
import Modal from './Modal';
import Toast from './Toast';

type FeedbackType = 'bug' | 'feature' | 'general';

interface FeedbackFormData {
  type: FeedbackType;
  message: string;
  email?: string;
}

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: 'general',
    message: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement actual feedback submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowToast(true);
      setIsOpen(false);
      setFormData({ type: 'general', message: '', email: '' });

      setTimeout(() => setShowToast(false), 5000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes = [
    {
      value: 'bug',
      label: '🐛 Bug Report',
      description: "Something isn't working",
    },
    {
      value: 'feature',
      label: '✨ Feature Request',
      description: 'Suggest an improvement',
    },
    {
      value: 'general',
      label: '💬 General Feedback',
      description: 'Share your thoughts',
    },
  ];

  return (
    <>
      {/* Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-tafy-600 dark:bg-tafy-500 text-white rounded-full shadow-lg hover:bg-tafy-700 dark:hover:bg-tafy-600 transition-colors focus:outline-none focus:ring-2 focus:ring-tafy-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label="Send feedback"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* Feedback Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Send Feedback"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              loadingText="Sending..."
            >
              Send Feedback
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback Type
            </label>
            <div className="space-y-2">
              {feedbackTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.type === type.value
                      ? 'border-tafy-500 bg-tafy-50 dark:bg-tafy-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-tafy-300 dark:hover:border-tafy-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as FeedbackType,
                      })
                    }
                    className="sr-only"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {type.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {type.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Your Message
            </label>
            <textarea
              id="message"
              rows={4}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-tafy-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Tell us what's on your mind..."
              required
            />
          </div>

          {/* Email (optional) */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-tafy-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="your@email.com"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              We&apos;ll only use this to follow up on your feedback
            </p>
          </div>
        </form>
      </Modal>

      {/* Success Toast */}
      {showToast && (
        <Toast
          message="Thank you for your feedback!"
          variant="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
