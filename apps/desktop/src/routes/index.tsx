import { createHashRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "../components/AuthGuard";
import { AdminGuard } from "../components/AdminGuard";
import { Layout } from "../components/Layout";
import { Dashboard } from "../pages/Dashboard/index";
import { Runtime } from "../pages/Runtime/index";
import { Evaluation } from "../pages/Evaluation/index";
import { Skills } from "../pages/Skills/index";
import { SkillDetail } from "../pages/Skills/SkillDetail";
import { SkillUpload } from "../pages/Skills/SkillUpload";
import { MySkills } from "../pages/MySkills";
import { InstalledSkills } from "../pages/InstalledSkills";
import { ThirdPartyRepos } from "../pages/ThirdPartyRepos";
import { Users } from "../pages/Users";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { ForgotPassword } from "../pages/ForgotPassword";
import { Settings } from "../pages/Settings";

export const routePaths = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  dashboard: "/",
  skills: "/skills",
  mySkills: "/my-skills",
  installedSkills: "/installed-skills",
  thirdPartyRepos: "/third-party-repos",
  skillUpload: "/skills/upload",
  runtime: "/runtime",
  evaluation: "/evaluation",
  skillDetail: "/skill/:id",
  userManagement: "/users",
  settings: "/settings",
} as const;

export const router = createHashRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "skills", element: <Skills /> },
      { path: "my-skills", element: <MySkills /> },
      { path: "installed-skills", element: <InstalledSkills /> },
      { path: "third-party-repos", element: <ThirdPartyRepos /> },
      { path: "skills/upload", element: <SkillUpload /> },
      { path: "runtime", element: <Runtime /> },
      { path: "evaluation", element: <Evaluation /> },
      { path: "skill/:id", element: <SkillDetail /> },
      { path: "users", element: (
        <AdminGuard>
          <Users />
        </AdminGuard>
      )},
      { path: "settings", element: <Settings /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
