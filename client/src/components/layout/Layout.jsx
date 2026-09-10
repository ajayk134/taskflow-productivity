import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useUIStore from '../../stores/uiStore';

export default function Layout() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
