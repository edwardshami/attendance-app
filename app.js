class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center card">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">حدث خطأ غير متوقع</h1>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary mx-auto"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  try {
    const [currentUser, setCurrentUser] = React.useState(null);
    const [employees, setEmployees] = React.useState([]);
    const [logs, setLogs] = React.useState([]);
    const [leaveRequests, setLeaveRequests] = React.useState([]);
    const [settings, setSettings] = React.useState({});
    const [notifications, setNotifications] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isCenterNetwork, setIsCenterNetwork] = React.useState(false);
    const [timeOffset, setTimeOffset] = React.useState(0);
    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const [isFirstRun, setIsFirstRun] = React.useState(false);

    React.useEffect(() => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    }, []);

    const toggleTheme = () => {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    };

    const checkNetworkAndTime = async () => {
      try {
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json');
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            setIsCenterNetwork(ipData.ip === '178.253.103.150');
          } else {
            setIsCenterNetwork(false);
          }
        } catch (e) {
          console.error('IP Check Failed', e);
          setIsCenterNetwork(false);
        }

        try {
          const timeRes = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Damascus');
          if (timeRes.ok) {
            const timeData = await timeRes.json();
            const realTime = new Date(timeData.dateTime + 'Z').getTime() - (3 * 60 * 60 * 1000);
            const localTime = Date.now();
            setTimeOffset(realTime - localTime);
          }
        } catch (e) {
          console.error('Time Check Failed', e);
        }
      } catch (err) {
        console.error('Error checking network or time', err);
      }
    };

    const loadData = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        if (!window.Store) {
          throw new Error('Firestore store is not initialized');
        }

        const emps = await window.Store.getEmployees();
        const lgs = await window.Store.getLogs();
        const leaves = await window.Store.getLeaveRequests();
        const sets = await window.Store.getSettings();
        const notifs = await window.Store.getNotifications();

        setEmployees(emps);
        setLogs(lgs);
        setLeaveRequests(leaves);
        setSettings(sets);
        setNotifications(notifs);

        const hasAdmin = emps.some((emp) => emp.role === 'admin');
        setIsFirstRun(!hasAdmin);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    React.useEffect(() => {
      checkNetworkAndTime();
      loadData();
    }, []);

    const handleRefresh = async () => {
      await loadData(true);
    };

    const handleLogin = async (user) => {
      setCurrentUser(user);
      await handleRefresh();
    };

    const handleLogout = () => {
      setCurrentUser(null);
    };

    const handleCreateInitialAdmin = async ({ name, password }) => {
      try {
        const created = await window.Store.addEmployee({
          name: String(name || '').trim(),
          role: 'admin',
          password,
          requirePasswordChange: true,
          department: 'إدارة',
          phone: '',
          email: '',
          deviceToken: '',
          createdAt: new Date().toISOString()
        });

        setEmployees((prev) => [...prev, created]);
        setIsFirstRun(false);
        setCurrentUser(created);
        await handleRefresh();
      } catch (err) {
        console.error('Failed to create initial admin', err);
        throw err;
      }
    };

    const handleAddEmployee = async (empData) => {
      const newEmp = await window.Store.addEmployee(empData);
      setEmployees((prev) => [...prev, newEmp]);
    };

    const handleAddLog = async (employeeId, type, timestamp) => {
      const newLog = await window.Store.addLog(employeeId, type, timestamp);
      setLogs((prev) => [...prev, newLog]);
    };

    const handleAddLeave = async (employeeId, date, type, startTime, duration) => {
      const newLeave = await window.Store.addLeaveRequest(employeeId, date, type, startTime, duration);
      setLeaveRequests((prev) => [...prev, newLeave]);
    };

    const handleUpdateLeave = async (id, data) => {
      const updated = await window.Store.updateLeaveRequest(id, data);
      setLeaveRequests((prev) => prev.map((l) => l.id === id ? updated : l));
    };

    const handleUpdateEmployee = async (id, empData) => {
      const updated = await window.Store.updateEmployee(id, empData);
      setEmployees((prev) => prev.map((e) => e.id === id ? updated : e));
      if (currentUser && currentUser.id === id) {
        setCurrentUser(updated);
      }
    };

    const handleDeleteEmployee = async (id) => {
      await window.Store.deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    };

    const handleDeleteLog = async (id) => {
      await window.Store.deleteLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    };

    const handleDeleteLeave = async (id) => {
      await window.Store.deleteLeaveRequest(id);
      setLeaveRequests((prev) => prev.filter((l) => l.id !== id));
    };

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
          <div className="flex flex-col items-center gap-4">
            <i className="icon-loader animate-spin text-4xl text-[var(--primary-color)]"></i>
            <span className="text-gray-500 font-medium">جاري تحميل البيانات...</span>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return (
        <window.Login
          employees={employees}
          onLogin={handleLogin}
          onUpdateEmployee={handleUpdateEmployee}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          isFirstRun={isFirstRun}
          onCreateInitialAdmin={handleCreateInitialAdmin}
        />
      );
    }

    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300" data-name="app" data-file="app.js">
        <window.Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onRefresh={handleRefresh}
          notifications={notifications.filter((n) => n.employeeId === currentUser.id)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          {currentUser.role === 'admin' ? (
            <window.AdminView
              employees={employees}
              logs={logs}
              leaveRequests={leaveRequests}
              settings={settings}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onDeleteLog={handleDeleteLog}
              onUpdateLeave={handleUpdateLeave}
              onDeleteLeave={handleDeleteLeave}
              onRefresh={handleRefresh}
            />
          ) : (
            <window.EmployeeView
              currentUser={currentUser}
              employees={employees}
              logs={logs}
              allLeaveRequests={leaveRequests}
              settings={settings}
              onAddLog={handleAddLog}
              leaveRequests={leaveRequests.filter((l) => l.employeeId === currentUser.id)}
              onAddLeave={handleAddLeave}
              onUpdateLeave={handleUpdateLeave}
              isCenterNetwork={isCenterNetwork}
              timeOffset={timeOffset}
            />
          )}
        </main>
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
