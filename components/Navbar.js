function Navbar({ currentUser, onLogout, onRefresh, notifications = [], isDarkMode, onToggleTheme }) {
    const [showNotifs, setShowNotifs] = React.useState(false);
    if (!currentUser) return null;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkRead = async (notif) => {
        if (!notif.isRead) {
            await window.Store.markNotificationRead(notif.id, notif);
            if (onRefresh) onRefresh();
        }
    };

    return (
        <nav className="bg-[var(--bg-card)] shadow-sm border-b border-[var(--border-color)] transition-colors duration-300" data-name="navbar" data-file="components/Navbar.js">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center p-0 shrink-0 overflow-hidden">
                            <img src="https://app.trickle.so/storage/public/images/usr_1e29a98360000001/1ed4cd2b-327b-47e0-9710-1b450db26e4e.jpeg" alt="شعار النظام" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-xl text-[var(--text-main)] hidden sm:block whitespace-nowrap">نظام الحضور</span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-4">
                        <button 
                            onClick={onToggleTheme} 
                            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            title="تبديل المظهر"
                        >
                            {isDarkMode ? <i className="icon-sun text-lg"></i> : <i className="icon-moon text-lg"></i>}
                        </button>
                        
                        <button 
                            onClick={onRefresh}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            title="تحديث البيانات"
                        >
                            <i className="icon-refresh-cw text-lg"></i>
                        </button>
                        
                        {currentUser.role !== 'admin' && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowNotifs(!showNotifs)}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative"
                                >
                                    <i className="icon-bell text-lg"></i>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                {showNotifs && (
                                    <div className="absolute left-1/2 sm:left-0 transform -translate-x-1/2 sm:translate-x-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-[var(--bg-card)] rounded-lg shadow-xl border border-[var(--border-color)] z-50 overflow-hidden max-w-[90vw]">
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                            <span>الإشعارات</span>
                                            {notifications.length > 0 && (
                                                <button 
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await window.Store.clearEmployeeNotifications(currentUser.id);
                                                        if (onRefresh) onRefresh();
                                                    }}
                                                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded"
                                                >
                                                    <i className="icon-trash"></i>
                                                    حذف الكل
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">لا توجد إشعارات</div>
                                            ) : (
                                                notifications.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(n => (
                                                    <div 
                                                        key={n.id} 
                                                        onClick={() => handleMarkRead(n)}
                                                        className={`p-3 border-b border-gray-50 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                    >
                                                        <div className="font-bold text-sm text-[var(--text-main)]">{n.title}</div>
                                                        <div className="text-xs text-gray-500 mt-1">{n.body}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-2 sm:pl-4 mr-1 sm:mr-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                <i className="icon-user text-gray-600 dark:text-gray-300"></i>
                            </div>
                            <div className="flex flex-col hidden sm:flex">
                                <span className="text-sm font-medium text-[var(--text-main)] whitespace-nowrap">{currentUser.name}</span>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {currentUser.role === 'admin' ? 'مدير النظام' : currentUser.role === 'manager' ? 'مدير مركز' : currentUser.role === 'assistant' ? 'مساعد إداري' : 'موظف'}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={onLogout}
                            className="text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 text-sm font-medium p-2 rounded-md hover:bg-red-50 shrink-0"
                            title="تسجيل خروج"
                        >
                            <i className="icon-log-out text-lg"></i>
                            <span className="hidden sm:inline whitespace-nowrap">خروج</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
window.Navbar = Navbar;