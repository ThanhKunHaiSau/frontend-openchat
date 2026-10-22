import { AuthProvider } from './contexts';
import { AppRouter } from './routers';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
