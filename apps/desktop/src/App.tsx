import { RouterProvider } from "react-router-dom";
import { Toaster } from "@skill-platform/ui";
import { router } from "./routes";
import { AuthInitializer } from "./components/AuthInitializer";
import { SettingsInitializer } from "./components/SettingsInitializer";

function App() {
  return (
    <AuthInitializer>
      <SettingsInitializer>
        <RouterProvider router={router} />
        <Toaster />
      </SettingsInitializer>
    </AuthInitializer>
  );
}

export default App;
