import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Signup from "../pages/Signup";

// Layout
import MainLayout from "../layouts/MainLayout";

// Pages
import Home from "../pages/Home";
import Chat from "../pages/Chat";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";

// Protected Route
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* APP ROUTES (WITH LAYOUT + PROTECTION) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default */}
          <Route index element={<Home />} />

          {/* Tabs */}
          <Route path="chat" element={<Chat />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;