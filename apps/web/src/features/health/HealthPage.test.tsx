import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { Provider } from 'react-redux';
import { api } from '../../lib/api';
import { makeStore } from '../../store';
import HealthPage from './HealthPage';

const renderPage = () =>
  render(
    <Provider store={makeStore()}>
      <HealthPage />
    </Provider>,
  );

describe('HealthPage', () => {
  const get = jest.spyOn(api, 'get');

  afterEach(() => get.mockReset());

  it('shows each service status from the api', async () => {
    get.mockResolvedValue({ data: { status: 'error', db: 'up', redis: 'down' } });
    renderPage();
    expect(await screen.findByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Up')).toBeInTheDocument();
    expect(screen.getByText('Down')).toBeInTheDocument();
  });

  it('shows an error when the server is unreachable', async () => {
    get.mockRejectedValue(new AxiosError('Network Error'));
    renderPage();
    expect(await screen.findByText(/cannot reach the server/i)).toBeInTheDocument();
  });

  it('checks again on click', async () => {
    get.mockResolvedValue({ data: { status: 'ok', db: 'up', redis: 'up' } });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Check again' }));
    expect(get).toHaveBeenCalledTimes(2);
  });
});
