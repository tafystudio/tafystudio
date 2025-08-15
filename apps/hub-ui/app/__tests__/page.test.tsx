import { render, screen } from '@testing-library/react';
import Home from '../page';

describe('Home Page', () => {
  it('renders the welcome heading', () => {
    render(<Home />);

    const heading = screen.getByRole('heading', {
      name: /Welcome to Tafy Studio/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    render(<Home />);

    const tagline = screen.getByText(
      /Go from blank hardware to moving robot in 30 minutes/i
    );
    expect(tagline).toBeInTheDocument();
  });
});
