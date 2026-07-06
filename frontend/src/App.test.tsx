import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('ChainGuardian App Component', () => {
  it('renders the application title after loading', async () => {
    render(<App />);
    const titleElement = await screen.findByText(/ChainGuardian/i);
    expect(titleElement).not.toBeNull();
  });

  it('renders the AI Risk Intelligence sidebar after loading', async () => {
    render(<App />);
    const sidebarTitle = await screen.findByText(/AI Risk Intelligence/i);
    expect(sidebarTitle).not.toBeNull();
  });
  
  it('renders the Global Risk Trend chart container after loading', async () => {
    render(<App />);
    const trendTitle = await screen.findByText(/Global Risk Trend/i);
    expect(trendTitle).not.toBeNull();
  });

  it('renders the action buttons for rerouting after loading', async () => {
    render(<App />);
    const rerouteButton = await screen.findByText(/Execute Rerouting Plan/i);
    const notifyButton = await screen.findByText(/Notify Suppliers/i);
    expect(rerouteButton).not.toBeNull();
    expect(notifyButton).not.toBeNull();
  });
});
