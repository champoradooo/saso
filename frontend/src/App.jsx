import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Layout from './components/Layout'

import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Discipline from './pages/Discipline'
import Activities from './pages/Activities'
import Reports from './pages/Reports'
import Users from './pages/Users'
import StudentCaseHistory from './pages/StudentCaseHistory'
import LostFound from './pages/LostFound'


// =========================================================
// PROTECTED ROUTE
// =========================================================

function ProtectedRoute({ children }) {

  const { user } = useAuth()

  // Still checking authentication
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">

        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />

      </div>
    )
  }

  // Not logged in
  if (user === null) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  // Logged in
  return children
}


// =========================================================
// LOGIN REDIRECT
// =========================================================

function AuthRedirect() {

  const { user } = useAuth()

  // Still checking authentication
  if (user === undefined) {
    return null
  }

  // Already logged in
  if (user) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  // Not logged in
  return <Login />
}


// =========================================================
// APP
// =========================================================

export default function App() {

  return (
    <AuthProvider>

      <Routes>

        {/* =================================================
            LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={<AuthRedirect />}
        />


        {/* =================================================
            FORGOT PASSWORD
            NOT PROTECTED
        ================================================= */}

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* =================================================
            RESET PASSWORD
            NOT PROTECTED
        ================================================= */}

        <Route
          path="/reset-password/:uid/:token"
          element={<ResetPassword />}
        />


        {/* =================================================
            PROTECTED APPLICATION
        ================================================= */}

        <Route
          path="/*"
          element={
            <ProtectedRoute>

              <Layout>

                <Routes>

                  {/* Dashboard */}

                  <Route
                    path="/"
                    element={<Dashboard />}
                  />


                  {/* Students */}

                  <Route
                    path="/students"
                    element={<Students />}
                  />


                  {/* Discipline */}

                  <Route
                    path="/discipline"
                    element={<Discipline />}
                  />


                  {/* Student Case History */}

                  <Route
                    path="/discipline/student/:id"
                    element={<StudentCaseHistory />}
                  />


                  {/* Activities */}

                  <Route
                    path="/activities"
                    element={<Activities />}
                  />


                  {/* Reports */}

                  <Route
                    path="/reports"
                    element={<Reports />}
                  />


                  {/* Lost & Found */}

                  <Route
                    path="/lost-found"
                    element={<LostFound />}
                  />


                  {/* Analytics */}

                  <Route
                    path="/analytics"
                    element={
                      <Navigate
                        to="/"
                        replace
                      />
                    }
                  />


                  {/* Users */}

                  <Route
                    path="/users"
                    element={<Users />}
                  />

                </Routes>

              </Layout>

            </ProtectedRoute>
          }
        />

      </Routes>

    </AuthProvider>
  )
}