import { render, screen } from '@testing-library/react';
import Home from '../page';

describe('Home Page', () => {
  it('renders the Tafy Studio heading', () => {
    render(<Home />);

    const heading = screen.getByRole('heading', { name: /Tafy Studio/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<Home />);

    const description = screen.getByText(/Robot Distributed Operation System/i);
    expect(description).toBeInTheDocument();
  });
});
