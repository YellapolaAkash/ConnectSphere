import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const { hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  return <AppRoutes />;
}

export default App;