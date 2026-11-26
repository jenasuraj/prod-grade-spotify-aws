import { useState } from 'react';
import { createBrowserRouter, Navigate, RouterProvider, type RouteObject } from 'react-router';
import AuthPage from './features/auth/AuthPage';
import GuestRoute from './features/auth/GuestRoute';
import ProtectedRoute from './features/auth/ProtectedRoute';
import HomePage from './features/home/HomePage';
import ProfilePage from './features/profile/ProfilePage';
import UploadSongPage from './features/songs/UploadSongPage';
import Layout from './layouts/Layout';

const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { element: <GuestRoute />, children: [{ path: '/login', element: <AuthPage /> }] },
      {
        element: <ProtectedRoute />,
        children: [{ path: '/songs/new', element: <UploadSongPage /> }],
      },
      // Public profile, e.g. /suraj. Fixed paths above win over this one
      { path: '/:name', element: <ProfilePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

export default function App() {
  const [router] = useState(() => createBrowserRouter(routes));
  return <RouterProvider router={router} />;
}
