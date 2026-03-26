import { useEffect, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/tasks')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        return response.json();
      })
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tasks:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <h1>Task List</h1>
        <Link href="/create">
          <CreateButton>Add Task</CreateButton>
        </Link>
      </Header>
      <TaskGrid>
        {tasks.map(task => (
          <TaskCard key={task._id.toString()}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <Tags>
              <Tag>Priority: {task.priority}</Tag>
              <Tag>Status: {task.status}</Tag>
            </Tags>
            <Link href={`/task/${task._id}`}>View Details</Link>
          </TaskCard>
        ))}
      </TaskGrid>
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const CreateButton = styled.button`
  background: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  &:hover {
    background: #1d4ed8;
  }
`;

const TaskGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const TaskCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  h3 {
    margin: 0 0 0.5rem 0;
    color: #1e3a8a;
  }
  p {
    margin: 0 0 1rem 0;
    color: #4b5563;
  }
  a {
    color: #2563eb;
    text-decoration: none;
    &:hover {
       text-decoration: underline;
    }
  }
`;

const Tags = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
`;

export default TaskList;