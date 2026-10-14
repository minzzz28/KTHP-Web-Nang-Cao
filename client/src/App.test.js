import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ id: 1, name: 'John Doe' }],
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders the page layout and displays users returned by the API', async () => {
  render(<App />);

  expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /good morning/i })).toBeInTheDocument();
  expect(screen.getByText(/loading users/i)).toBeInTheDocument();
  expect(await screen.findByText('John Doe')).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: '1' })).toBeInTheDocument();
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    'https://jsonplaceholder.typicode.com/users?_limit=1',
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});

test('shows an error and retries when the API request fails', async () => {
  global.fetch
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 2, name: 'Jane Doe' }],
    });

  render(<App />);

  expect(await screen.findByText(/could not load users/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /try again/i }));
  await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
});
