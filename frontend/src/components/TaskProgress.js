import React from 'react';

const TaskProgress = ({ task, onUpdateStatus }) => {
  const statusSteps = [
    { id: 'open', label: 'Open' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' }
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.id === task.status);

  const getStepColor = (stepIndex) => {
    if (stepIndex < currentStepIndex) return 'bg-green-500'; // completed
    if (stepIndex === currentStepIndex) return 'bg-blue-500'; // current
    return 'bg-gray-200'; // upcoming
  };

  const handleStatusUpdate = (newStatus) => {
    // Only allow moving one step forward or backward
    const newIndex = statusSteps.findIndex(step => step.id === newStatus);
    if (Math.abs(newIndex - currentStepIndex) <= 1) {
      onUpdateStatus(newStatus);
    }
  };

  return (
    <div className="py-4">
      {/* Progress Bar */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          {statusSteps.map((step, index) => (
            <div
              key={step.id}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getStepColor(
                index
              )}`}
              style={{ width: '25%', transition: 'all 0.3s ease' }}
            />
          ))}
        </div>

        {/* Step Markers */}
        <div className="flex justify-between -mt-2">
          {statusSteps.map((step, index) => (
            <div
              key={step.id}
              className="relative flex flex-col items-center"
              style={{ width: '25%' }}
            >
              <button
                onClick={() => handleStatusUpdate(step.id)}
                disabled={Math.abs(index - currentStepIndex) > 1}
                className={`w-4 h-4 rounded-full transition-colors duration-200 ${
                  index <= currentStepIndex
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                } ${
                  Math.abs(index - currentStepIndex) <= 1
                    ? 'cursor-pointer hover:bg-blue-600'
                    : 'cursor-not-allowed'
                }`}
              />
              <span className="absolute -bottom-6 text-xs text-center w-20 text-gray-600">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Task Details */}
      <div className="mt-12 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Started</h3>
            <p className="mt-1 text-sm text-gray-900">
              {task.startDate
                ? new Date(task.startDate).toLocaleString()
                : 'Not started'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(task.dueDate).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Time Spent</h3>
            <p className="mt-1 text-sm text-gray-900">
              {task.timeSpent || '0'} hours
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className={`mt-1 text-sm font-medium ${
              task.status === 'completed'
                ? 'text-green-600'
                : task.status === 'in-progress'
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskProgress;
