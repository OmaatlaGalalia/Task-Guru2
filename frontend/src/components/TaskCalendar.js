import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const TaskCalendar = ({ tasks, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    const date = new Date(task.scheduledDate).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {});

  const handleDateChange = (date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  // Custom tile content to show task count
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const tasksForDate = tasksByDate[date.toDateString()] || [];
      return tasksForDate.length > 0 ? (
        <div className="task-count">
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full">
            {tasksForDate.length}
          </span>
        </div>
      ) : null;
    }
  };

  // Custom tile className to highlight dates with tasks
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const tasksForDate = tasksByDate[date.toDateString()] || [];
      return tasksForDate.length > 0 ? 'has-tasks' : null;
    }
  };

  return (
    <div className="task-calendar-container">
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        className="rounded-lg shadow bg-white p-4"
      />
      
      {/* Task List for Selected Date */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">
          Tasks for {selectedDate.toLocaleDateString()}
        </h3>
        <div className="space-y-2">
          {(tasksByDate[selectedDate.toDateString()] || []).map((task) => (
            <div
              key={task.id}
              className="p-3 bg-white rounded-lg shadow border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(task.scheduledTime).toLocaleTimeString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    task.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : task.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {task.status}
                </span>
              </div>
            </div>
          ))}
          {(!tasksByDate[selectedDate.toDateString()] ||
            tasksByDate[selectedDate.toDateString()].length === 0) && (
            <p className="text-gray-500 text-center py-4">
              No tasks scheduled for this date
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .task-calendar-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .react-calendar {
          width: 100%;
          border: none;
        }

        .has-tasks {
          background-color: #EBF5FF;
          color: #1E40AF;
        }

        .task-count {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default TaskCalendar;
