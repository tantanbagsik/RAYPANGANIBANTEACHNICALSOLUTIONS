import React, { useState } from 'react';

const TaskList = ({ tasks, deleteTask }) => {
  return (
    <ul className='task-list'>
      {tasks.length === 0 ? (
        <p>No tasks yet</p>
      ) : (
        tasks.map((task, index) => (
          <li className='task-item' key={index}>
            <div>
              <strong>{task.title}</strong>
              <p>{task.description}</p>
              <small>Deadline: {task.deadline}</small>
              <small>Priority: {task.priority}</small>
            </div>
            <button onClick={() => deleteTask(index)}>Delete</button>
          </li>
        ))
      )}
    </ul>
  );
};

export default TaskList;