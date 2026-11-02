import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { PageLoader } from './components/ui/Bits.jsx';
import HomePage from './pages/HomePage.jsx';
import ArticlePage from './pages/ArticlePage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import PlayersPage from './pages/PlayersPage.jsx';
import PlayerPage from './pages/PlayerPage.jsx';
import PollsPage from './pages/PollsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx';
import { AccountPage, BookmarksPage } from './pages/AccountPages.jsx';

// The dashboard (editor, charts) is code-split so readers never download it.
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout.jsx'));
const Overview = lazy(() => import('./pages/dashboard/Overview.jsx'));
const ArticlesAdmin = lazy(() => import('./pages/dashboard/ArticlesAdmin.jsx'));
const ArticleEditor = lazy(() => import('./pages/dashboard/ArticleEditor.jsx'));
const TaxonomyAdmin = lazy(() => import('./pages/dashboard/TaxonomyAdmin.jsx'));
const PlayersAdmin = lazy(() => import('./pages/dashboard/PlayersAdmin.jsx'));
const PlayerEditor = lazy(() => import('./pages/dashboard/PlayerEditor.jsx'));
const PollsAdmin = lazy(() => import('./pages/dashboard/PollsAdmin.jsx'));
const CommentsAdmin = lazy(() => import('./pages/dashboard/CommentsAdmin.jsx'));
const UsersAdmin = lazy(() => import('./pages/dashboard/UsersAdmin.jsx'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="article/:slug" element={<ArticlePage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="players" element={<PlayersPage />} />
          <Route path="players/:slug" element={<PlayerPage />} />
          <Route path="polls" element={<PollsPage />} />
          <Route path="u/:username" element={<ProfilePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="account" element={<AccountPage />} />
            <Route path="account/bookmarks" element={<BookmarksPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="dashboard"
          element={
            <ProtectedRoute role="EDITOR">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="articles" element={<ArticlesAdmin />} />
          <Route path="articles/new" element={<ArticleEditor />} />
          <Route path="articles/:id" element={<ArticleEditor />} />
          <Route element={<ProtectedRoute role="ADMIN" />}>
            <Route path="taxonomy" element={<TaxonomyAdmin />} />
            <Route path="players" element={<PlayersAdmin />} />
            <Route path="players/new" element={<PlayerEditor />} />
            <Route path="players/:id" element={<PlayerEditor />} />
            <Route path="polls" element={<PollsAdmin />} />
            <Route path="comments" element={<CommentsAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
