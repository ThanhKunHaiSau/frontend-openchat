import { AuthProvider, SocketProvider } from './contexts';
import { AppRouter } from './routers';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRouter />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
