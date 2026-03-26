import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useSearchParams, useRouter } from 'next/navigation';

const TaskSearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm) {
      const params = new URLSearchParams(searchParams);
      params.set('search', searchTerm);
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <SearchForm onSubmit={handleSubmit}>
      <SearchInput
        type="search"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search tasks..."
        aria-label="Search tasks"
      />{
        searchTerm && (
          <ClearButton
            type="button"
            onClick={() => {
              setSearchTerm('');
              onSearch('');
            }}
            aria-label="Clear search"
          >
            &times;
          </ClearButton>
        )
      }
    </SearchForm>
  );
};

const SearchForm = styled.form`
  display: flex;
  position: relative;
  margin-bottom: 2rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);

  &:hover {
    color: #6b7280;
  }
`;

export default TaskSearchBar;