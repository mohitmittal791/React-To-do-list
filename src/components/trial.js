import React, { useState, useEffect, useMemo } from 'react';

// Task component
const Task = ({ task, onToggle, onDelete }) => {
  return (
    <div
      className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${
        task.completed
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-300 hover:border-blue-300'
      }`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center ${
          task.completed 
            ? 'bg-green-500 border-green-500 text-white' 
            : 'border-gray-300 hover:border-green-500'
        }`}
      >
        {task.completed && '✓'}
      </button>
      
      <div className="flex-1 min-w-0">
        <p
          className={`${
            task.completed
              ? 'line-through text-gray-500'
              : 'text-gray-800'
          } break-words`}
        >
          {task.text}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(task.createdAt).toLocaleTimeString()}
        </p>
      </div>
      
      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors text-lg"
      >
        🗑️
      </button>
    </div>
  );
};

// Date Group Header Component
const DateGroupHeader = ({ date, taskCount, completedCount }) => {
  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time for accurate comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
      return '📅 Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return '📆 Yesterday';
    } else {
      return `📋 ${date.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`;
    }
  };

  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mb-3">
      <h3 className="text-lg font-semibold text-gray-800">
        {formatDateHeader(date)}
      </h3>
      <div className="flex gap-3 text-sm">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          Total: {taskCount}
        </span>
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
          Done: {completedCount}
        </span>
        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
          Remaining: {taskCount - completedCount}
        </span>
      </div>
    </div>
  );
};

// Main TodoApp component
const TodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});

  // Load tasks from memory on component mount
  useEffect(() => {
    const savedTasks = JSON.parse(sessionStorage.getItem('todoTasks') || '[]');
    setTasks(savedTasks);
  }, []);

  // Save tasks to memory whenever tasks change
  useEffect(() => {
    sessionStorage.setItem('todoTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Input validation
  const validateTask = (value) => {
    const newErrors = {};
    
    if (!value.trim()) {
      newErrors.input = 'Task cannot be empty';
    } else if (value.trim().length < 3) {
      newErrors.input = 'Task must be at least 3 characters long';
    } else if (value.trim().length > 100) {
      newErrors.input = 'Task cannot exceed 100 characters';
    } else if (tasks.some(task => task.text.toLowerCase() === value.trim().toLowerCase())) {
      newErrors.input = 'Task already exists';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add new task
  const addTask = (e) => {
    e.preventDefault();
    
    if (!validateTask(inputValue)) {
      return;
    }

    const newTask = {
      id: Date.now() + Math.random(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, newTask]);
    setInputValue('');
    setErrors({});
  };

  // Toggle task completion
  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Remove task
  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Clear all completed tasks
  const clearCompleted = () => {
    setTasks(tasks.filter(task => !task.completed));
  };

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    switch (filter) {
      case 'active':
        filtered = filtered.filter(task => !task.completed);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
      default:
        break;
    }

    return filtered;
  }, [tasks, filter, searchTerm]);

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const groups = {};
    
    filteredTasks.forEach(task => {
      const taskDate = new Date(task.createdAt);
      const dateKey = taskDate.toDateString(); // This gives us a consistent date key
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
    });

    // Sort tasks within each group
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => {
        switch (sortBy) {
          case 'alphabetical':
            return a.text.localeCompare(b.text);
          case 'completed':
            return a.completed - b.completed;
          case 'date':
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
    });

    // Sort date groups (most recent first)
    const sortedDateKeys = Object.keys(groups).sort((a, b) => {
      return new Date(b) - new Date(a);
    });

    return sortedDateKeys.map(dateKey => ({
      date: dateKey,
      tasks: groups[dateKey]
    }));
  }, [filteredTasks, sortBy]);

  // Task statistics
  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(task => task.completed).length,
    active: tasks.filter(task => !task.completed).length,
  }), [tasks]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white min-h-screen">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">📝 Daily Task Manager</h1>
        <div className="flex gap-4 text-sm">
          <span>Total: {stats.total}</span>
          <span>Active: {stats.active}</span>
          <span>Completed: {stats.completed}</span>
        </div>
      </div>

      {/* Add Task Form */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (errors.input) {
                  validateTask(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTask(e);
                }
              }}
              placeholder="Add a new task for today..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.input ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.input && (
              <p className="text-red-500 text-sm mt-1">{errors.input}</p>
            )}
          </div>
          <button
            onClick={addTask}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2"
          >
            ➕ Add Task
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search tasks..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">🔽 Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600">📊 Sort within date:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Time Created</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="completed">Completion Status</option>
            </select>
          </div>

          {stats.completed > 0 && (
            <button
              onClick={clearCompleted}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              🧹 Clear All Completed
            </button>
          )}
        </div>
      </div>

      {/* Grouped Tasks List */}
      <div className="space-y-6">
        {groupedTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? '🔍 No tasks match your search.' : 
             filter === 'completed' ? '✅ No completed tasks yet.' :
             filter === 'active' ? '📋 No active tasks.' : 
             '📝 No tasks yet. Add one above!'}
          </div>
        ) : (
          groupedTasks.map((group) => {
            const completedInGroup = group.tasks.filter(task => task.completed).length;
            
            return (
              <div key={group.date} className="bg-gray-50 rounded-xl p-4">
                <DateGroupHeader 
                  date={group.date}
                  taskCount={group.tasks.length}
                  completedCount={completedInGroup}
                />
                
                <div className="space-y-2">
                  {group.tasks.map((task) => (
                    <Task
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={removeTask}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {tasks.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {filteredTasks.length} of {tasks.length} tasks across {groupedTasks.length} {groupedTasks.length === 1 ? 'day' : 'days'}
        </div>
      )}
    </div>
  );
};

export default TodoApp;