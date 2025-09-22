import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders loading state correctly', () => {
    render(<Button disabled>Loading...</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading...');
  });

  it('renders variant styles correctly', () => {
    const { rerender } = render(<Button variant="outline">Outline Button</Button>);
    
    let button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    rerender(<Button variant="secondary">Secondary Button</Button>);
    button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small Button</Button>);
    
    let button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    rerender(<Button size="lg">Large Button</Button>);
    button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});