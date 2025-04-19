import { render, screen, fireEvent } from '@testing-library/react';
import TaskForm from './TaskForm';

test('renders task form and submits data', () => {
  const handleSubmit = jest.fn();
  render(<TaskForm onSubmit={handleSubmit} />);

  const titleInput = screen.getByPlaceholderText('Title');
  const descriptionInput = screen.getByPlaceholderText('Description');
  const budgetInput = screen.getByPlaceholderText('Budget');
  const submitButton = screen.getByText('Post Task');

  fireEvent.change(titleInput, { target: { value: 'Fix leaking faucet' } });
  fireEvent.change(descriptionInput, { target: { value: 'Need a plumber' } });
  fireEvent.change(budgetInput, { target: { value: 50 } });
  fireEvent.click(submitButton);

  expect(handleSubmit).toHaveBeenCalledWith({
    title: 'Fix leaking faucet',
    description: 'Need a plumber',
    budget: 50
  });
});