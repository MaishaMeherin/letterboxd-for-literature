import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";
import BookPage from "./pages/BookPage";
import PlaylistPage from './pages/PlaylistPage';
import WelcomePage from "./pages/Welcome/WelcomePage";
import BookPreviewPage from "./pages/BookPreviewPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import StatsPage from "./pages/StatsPage";
import SpotifyCallbackPage from "./pages/SpotifyCallbackPage";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/user/me" element={<UserProfile />} />
          <Route path="/book/:id/" element={<BookPage />} />
          <Route path="/book/:id/playlist" element={<PlaylistPage />} />
          <Route path="/book/:id/preview" element={<BookPreviewPage/>} />
          <Route path="/recommendations" element={<RecommendationsPage/>} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/spotify-callback" element={<SpotifyCallbackPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;