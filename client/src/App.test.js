import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SoleCRM app', () => {
  render(<App />);
  const appElement = screen.getByText(/SoleCRM/i);
  expect(appElement).toBeInTheDocument();
});
