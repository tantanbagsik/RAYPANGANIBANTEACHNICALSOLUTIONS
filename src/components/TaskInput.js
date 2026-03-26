// src/components/TaskInput.js
import React, { useState } from 'react';

const TaskInput = ({ addTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description || !deadline) return;
    addTask({ title, description, deadline, priority });
    setTitle('');
    setDescription('');
    setDeadline('');
    setPriority('Medium');
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      {/* Title Input */}
      <div className="form-group">
        <label>
          Title:
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
      </div>

      {/* Description TextArea */}
      <div className="form-group">
        <label>
          Description:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </label>
      </div>

      {/* Deadline DateTime */}
      <div className="form-group">
        <label>
          Deadline:
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </label>
      </div>

      {/* Priority Select */}
      <div className="form-group">
        <label>
          Priority:
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>
      </div>

      {/* Submit Button */}
      <button type="submit">Add Task</button>
    </form>
  );
};

export default TaskInput;
