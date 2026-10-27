function AdminView({ employees, logs, leaveRequests, settings, onAddEmployee, onUpdateEmployee, onDeleteEmployee, onDeleteLog, onUpdateLeave, onDeleteLeave, onRefresh }) {
    const [activeTab, setActiveTab] = React.useState('employees'); // 'employees', 'logs', 'leaves', 'settings'
    const [selectedLogs, setSelectedLogs] = React.useState([]);
    const [selectedLeaves, setSelectedLeaves] = React.useState([]);
    
    const [newEmpName, setNewEmpName] = React.useState('');
    const [newEmpRole, setNewEmpRole] = React.useState('employee');
    const [newEmpAdminLeaves, setNewEmpAdminLeaves] = React.useState(15);
    const [newEmpSickLeaves, setNewEmpSickLeaves] = React.useState(30);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [filterDateLogs, setFilterDateLogs] = React.useState(new Date().toISOString().split('T')[0]);
    const [filterDateLeaves, setFilterDateLeaves] = React.useState('');
    const [filterEmp, setFilterEmp] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Settings State
    const [workSettings, setWorkSettings] = React.useState({
        workStartTime: settings.workStartTime || '09:00',
        workEndTime: settings.workEndTime || '17:00',
        lateGraceMinutes: settings.lateGraceMinutes || 15,
        earlyLeaveGraceMinutes: settings.earlyLeaveGraceMinutes || 15,
        attendanceEnabled: settings.attendanceEnabled !== undefined ? settings.attendanceEnabled : true
    });
    const [selectedEmpRoleChange, setSelectedEmpRoleChange] = React.useState('');
    const [selectedEmpNewRole, setSelectedEmpNewRole] = React.useState('employee');

    // Modals and Actions states
    const [editingEmp, setEditingEmp] = React.useState(null);
    const [empToDelete, setEmpToDelete] = React.useState(null);
    const [logToDelete, setLogToDelete] = React.useState(null);
    const [leaveToDelete, setLeaveToDelete] = React.useState(null);
    const [empToReset, setEmpToReset] = React.useState(null);
    const [message, setMessage] = React.useState(null);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        if (newEmpName.trim()) {
            setIsSubmitting(true);
            try {
                await onAddEmployee({ 
                    name: newEmpName.trim(), 
                    password: '',
                    requirePasswordChange: true,
                    role: newEmpRole,
                    adminLeaveBalance: Number(newEmpAdminLeaves),
                    sickLeaveBalance: Number(newEmpSickLeaves)
                });
                setNewEmpName('');
                setNewEmpRole('employee');
                setNewEmpAdminLeaves(15);
                setNewEmpSickLeaves(30);
                showMessage('تمت إضافة المستخدم بنجاح');
            } catch (err) {
                console.error("Error adding employee:", err);
                showMessage('حدث خطأ أثناء الإضافة', 'error');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleSaveEdit = async () => {
        if (editingEmp.name.trim()) {
            setIsSubmitting(true);
            try {
                await onUpdateEmployee(editingEmp.id, {
                    name: editingEmp.name.trim(),
                    adminLeaveBalance: Number(editingEmp.adminLeaveBalance),
                    sickLeaveBalance: Number(editingEmp.sickLeaveBalance)
                });
                setEditingEmp(null);
                showMessage('تم تحديث بيانات المستخدم بنجاح');
            } catch (err) {
                console.error("Error updating employee:", err);
                showMessage('حدث خطأ أثناء التحديث', 'error');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const confirmDeleteEmp = async () => {
        setIsSubmitting(true);
        try {
            await onDeleteEmployee(empToDelete);
            setEmpToDelete(null);
            showMessage('تم حذف المستخدم بنجاح');
        } catch (err) {
            console.error("Error deleting employee:", err);
            showMessage('حدث خطأ أثناء الحذف', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteLog = async () => {
        setIsSubmitting(true);
        try {
            const idsToDelete = Array.isArray(logToDelete) ? logToDelete : [logToDelete];
            await Promise.all(idsToDelete.map(id => onDeleteLog(id)));
            setSelectedLogs(prev => prev.filter(id => !idsToDelete.includes(id)));
            setLogToDelete(null);
            showMessage('تم الحذف بنجاح');
        } catch (err) {
            console.error("Error deleting log(s):", err);
            showMessage('حدث خطأ أثناء الحذف', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteLeave = async () => {
        setIsSubmitting(true);
        try {
            const idsToDelete = Array.isArray(leaveToDelete) ? leaveToDelete : [leaveToDelete];
            await Promise.all(idsToDelete.map(id => onDeleteLeave(id)));
            setSelectedLeaves(prev => prev.filter(id => !idsToDelete.includes(id)));
            setLeaveToDelete(null);
            showMessage('تم الحذف بنجاح');
        } catch (err) {
            console.error("Error deleting leave(s):", err);
            showMessage('حدث خطأ أثناء الحذف', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmResetDevice = async (empId) => {
        setIsSubmitting(true);
        try {
            const emp = employees.find(e => e.id === empId);
            if (emp) {
                await onUpdateEmployee(emp.id, {
                    ...emp,
                    deviceToken: ''
                });
                showMessage('تم إعادة تعيين جهاز المستخدم بنجاح. يمكنه الآن تسجيل الدخول من جهاز جديد.');
            }
        } catch (err) {
            console.error("Error resetting device:", err);
            showMessage('حدث خطأ', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectAllLogs = (e) => {
        if (e.target.checked) {
            setSelectedLogs(filteredLogs.map(l => l.id));
        } else {
            setSelectedLogs([]);
        }
    };

    const handleSelectLog = (id) => {
        if (selectedLogs.includes(id)) {
            setSelectedLogs(selectedLogs.filter(l => l !== id));
        } else {
            setSelectedLogs([...selectedLogs, id]);
        }
    };

    const handleSelectAllLeaves = (e) => {
        if (e.target.checked) {
            setSelectedLeaves(filteredLeaves.map(l => l.id));
        } else {
            setSelectedLeaves([]);
        }
    };

    const handleSelectLeave = (id) => {
        if (selectedLeaves.includes(id)) {
            setSelectedLeaves(selectedLeaves.filter(l => l !== id));
        } else {
            setSelectedLeaves([...selectedLeaves, id]);
        }
    };

    const confirmResetPassword = async () => {
        setIsSubmitting(true);
        try {
            const emp = employees.find(e => e.id === empToReset);
            if (emp) {
                await onUpdateEmployee(emp.id, {
                    ...emp,
                    password: '',
                    requirePasswordChange: true
                });
                setEmpToReset(null);
                showMessage('تمت إعادة تعيين كلمة المرور. سيطلب منه تعيين كلمة سر جديدة عند تسجيل الدخول.');
            }
        } catch (err) {
            console.error("Error resetting password:", err);
            showMessage('حدث خطأ أثناء إعادة التعيين', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const emp = employees.find(e => e.id === log.employeeId);
        if (emp && emp.role === 'admin') return false;
        
        const logDate = log.timestamp.split('T')[0];
        const matchDate = filterDateLogs ? logDate === filterDateLogs : true;
        const matchEmp = filterEmp ? log.employeeId === filterEmp : true;
        return matchDate && matchEmp;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const getEmployeeName = (id) => {
        return employees.find(e => e.id === id)?.name || 'مستخدم محذوف';
    };

    const handleRefreshClick = async () => {
        setIsRefreshing(true);
        try {
            if (onRefresh) await onRefresh();
            showMessage('تم تحديث البيانات بنجاح');
        } catch (err) {
            console.error("Error refreshing data:", err);
            showMessage('حدث خطأ أثناء التحديث', 'error');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLeaveStatusChange = async (id, status) => {
        setIsSubmitting(true);
        try {
            await onUpdateLeave(id, { status });
            showMessage('تم تحديث حالة الإجازة بنجاح');
        } catch (err) {
            console.error("Error updating leave:", err);
            showMessage('حدث خطأ أثناء التحديث', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getLeaveTypeName = (type) => {
        switch(type) {
            case 'administrative': return 'إدارية';
            case 'sick': return 'مرضية';
            case 'hourly': return 'ساعية';
            default: return 'غير معروف';
        }
    };

    const filteredLeaves = (leaveRequests || []).filter(leave => {
        const emp = employees.find(e => e.id === leave.employeeId);
        if (emp && emp.role === 'admin') return false;
        
        const matchDate = filterDateLeaves ? leave.date === filterDateLeaves : true;
        const matchEmp = filterEmp ? leave.employeeId === filterEmp : true;
        return matchDate && matchEmp;
    }).sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('ar-EG', { timeZone: 'Asia/Damascus', hour: '2-digit', minute: '2-digit' });
    };

    // Calculate approx DB usage
    const dbUsageCount = employees.length + logs.length + (leaveRequests?.length || 0) + Object.keys(settings).length;

    return (
        <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6" data-name="admin-view" data-file="components/AdminView.js">
            
            {/* Custom Modals */}
            {empToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] p-6 rounded-xl max-w-sm w-full shadow-lg border border-[var(--border-color)]">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                            <i className="icon-triangle-alert"></i> تأكيد الحذف
                        </h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-300">هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.</p>
                        <div className="flex gap-3">
                            <button onClick={confirmDeleteEmp} disabled={isSubmitting} className="btn btn-danger flex-1">
                                {isSubmitting ? <i className="icon-loader animate-spin"></i> : 'حذف'}
                            </button>
                            <button onClick={() => setEmpToDelete(null)} disabled={isSubmitting} className="btn btn-outline flex-1">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {logToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] p-6 rounded-xl max-w-sm w-full shadow-lg border border-[var(--border-color)]">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                            <i className="icon-triangle-alert"></i> تأكيد الحذف
                        </h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-300">
                            {Array.isArray(logToDelete) && logToDelete.length > 1 
                                ? `هل أنت متأكد من حذف ${logToDelete.length} سجلات؟`
                                : 'هل أنت متأكد من حذف سجل الحضور هذا؟'}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={confirmDeleteLog} disabled={isSubmitting} className="btn btn-danger flex-1">
                                {isSubmitting ? <i className="icon-loader animate-spin"></i> : 'حذف'}
                            </button>
                            <button onClick={() => setLogToDelete(null)} disabled={isSubmitting} className="btn btn-outline flex-1">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {leaveToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] p-6 rounded-xl max-w-sm w-full shadow-lg border border-[var(--border-color)]">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                            <i className="icon-triangle-alert"></i> تأكيد الحذف
                        </h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-300">
                            {Array.isArray(leaveToDelete) && leaveToDelete.length > 1 
                                ? `هل أنت متأكد من حذف ${leaveToDelete.length} طلبات إجازة؟`
                                : 'هل أنت متأكد من حذف طلب الإجازة هذا؟'}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={confirmDeleteLeave} disabled={isSubmitting} className="btn btn-danger flex-1">
                                {isSubmitting ? <i className="icon-loader animate-spin"></i> : 'حذف'}
                            </button>
                            <button onClick={() => setLeaveToDelete(null)} disabled={isSubmitting} className="btn btn-outline flex-1">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {empToReset && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] p-6 rounded-xl max-w-sm w-full shadow-lg border border-[var(--border-color)]">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                            <i className="icon-key"></i> إعادة تعيين كلمة المرور
                        </h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-300">
                            هل أنت متأكد من إعادة تعيين كلمة المرور لهذا المستخدم؟
                            <br/>
                            <span className="text-sm">سيُطلب منه إدخال كلمة مرور جديدة عند تسجيل دخوله القادم.</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={confirmResetPassword} disabled={isSubmitting} className="btn bg-yellow-500 hover:bg-yellow-600 text-white flex-1">
                                {isSubmitting ? <i className="icon-loader animate-spin"></i> : 'تأكيد'}
                            </button>
                            <button onClick={() => setEmpToReset(null)} disabled={isSubmitting} className="btn btn-outline flex-1">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {message && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded z-50 flex items-center gap-2 shadow-md ${
                    message.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'
                }`}>
                    <i className={message.type === 'error' ? 'icon-circle-alert' : 'icon-circle-check'}></i>
                    <span className="block sm:inline">{message.text}</span>
                </div>
            )}

            <div className="lg:col-span-3 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-2">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <i className="icon-database"></i>
                    <span className="font-bold text-sm sm:text-base">استهلاك قاعدة البيانات:</span>
                </div>
                <div className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-bold">
                    {dbUsageCount} عنصر
                </div>
            </div>

            <div className="lg:col-span-3">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 card p-0 px-4 flex-wrap">
                    <button 
                        onClick={() => setActiveTab('employees')}
                        className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'employees' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'}`}
                    >
                        <i className="icon-users inline-block ml-2"></i>
                        إدارة الموظفين
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'}`}
                    >
                        <i className="icon-list inline-block ml-2"></i>
                        سجل الحضور والانصراف
                    </button>
                    <button 
                        onClick={() => setActiveTab('leaves')}
                        className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'leaves' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'}`}
                    >
                        <i className="icon-calendar-days inline-block ml-2"></i>
                        طلبات الإجازة
                        {leaveRequests?.filter(l => l.status === 'pending').length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                {leaveRequests.filter(l => l.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'}`}
                    >
                        <i className="icon-settings inline-block ml-2"></i>
                        الإعدادات
                    </button>
                </div>

                {activeTab === 'employees' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="card lg:col-span-1 h-fit">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                                <i className="icon-user-plus text-[var(--primary-color)]"></i>
                                إضافة مستخدم جديد
                            </h2>
                            <form onSubmit={handleAddEmployee}>
                                <div className="mb-4 space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الاسم</label>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            placeholder="الاسم الثلاثي"
                                            value={newEmpName}
                                            onChange={(e) => setNewEmpName(e.target.value)}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الصلاحية</label>
                                        <select 
                                            className="input-field"
                                            value={newEmpRole}
                                            onChange={(e) => setNewEmpRole(e.target.value)}
                                            disabled={isSubmitting}
                                        >
                                            <option value="employee">موظف عادي</option>
                                            <option value="manager">مدير مركز</option>
                                            <option value="assistant">مساعد إداري</option>
                                            <option value="admin">مدير نظام</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الإجازات الإدارية (أيام)</label>
                                            <input 
                                                type="number" 
                                                className="input-field" 
                                                value={newEmpAdminLeaves}
                                                onChange={(e) => setNewEmpAdminLeaves(e.target.value)}
                                                min="0"
                                                required
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الإجازات المرضية (أيام)</label>
                                            <input 
                                                type="number" 
                                                className="input-field" 
                                                value={newEmpSickLeaves}
                                                onChange={(e) => setNewEmpSickLeaves(e.target.value)}
                                                min="0"
                                                required
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                        <i className="icon-info inline-block ml-1"></i>
                                        سيقوم المستخدم بتعيين كلمة المرور الخاصة به عند تسجيل الدخول لأول مرة.
                                    </p>
                                </div>
                                <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <i className="icon-loader animate-spin"></i> : 'إضافة المستخدم'}
                                </button>
                            </form>
                        </div>

                        <div className="card lg:col-span-2">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                                <i className="icon-users text-[var(--primary-color)]"></i>
                                قائمة المستخدمين ({employees.length})
                            </h2>
                            <div className="overflow-y-auto pr-2">
                                {employees.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">لا يوجد مستخدمين مسجلين.</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {employees.map(emp => (
                                            <li key={emp.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 transition-all hover:shadow-sm">
                                                {editingEmp && editingEmp.id === emp.id ? (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 dark:text-gray-400">الاسم</label>
                                                            <input 
                                                                className="input-field text-sm p-2 w-full" 
                                                                value={editingEmp.name} 
                                                                onChange={e => setEditingEmp({...editingEmp, name: e.target.value})} 
                                                                placeholder="الاسم" 
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[10px] text-gray-500 dark:text-gray-400">الإدارية</label>
                                                                <input 
                                                                    type="number"
                                                                    className="input-field text-sm p-2 w-full" 
                                                                    value={editingEmp.adminLeaveBalance} 
                                                                    onChange={e => setEditingEmp({...editingEmp, adminLeaveBalance: e.target.value})} 
                                                                    disabled={isSubmitting}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-gray-500 dark:text-gray-400">المرضية</label>
                                                                <input 
                                                                    type="number"
                                                                    className="input-field text-sm p-2 w-full" 
                                                                    value={editingEmp.sickLeaveBalance} 
                                                                    onChange={e => setEditingEmp({...editingEmp, sickLeaveBalance: e.target.value})} 
                                                                    disabled={isSubmitting}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <button onClick={handleSaveEdit} disabled={isSubmitting} className="btn btn-primary flex-1 py-1 px-2 text-xs">حفظ</button>
                                                            <button onClick={() => setEditingEmp(null)} disabled={isSubmitting} className="btn btn-outline flex-1 py-1 px-2 text-xs dark:bg-gray-800">إلغاء</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex flex-col gap-1 overflow-hidden">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm font-bold text-[var(--text-main)]">{emp.name}</span>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-md ${
                                                                    emp.role === 'admin' ? 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400' :
                                                                    emp.role === 'manager' ? 'text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                    emp.role === 'assistant' ? 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    'text-gray-700 bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                    {emp.role === 'admin' ? 'مدير نظام' : emp.role === 'manager' ? 'مدير مركز' : emp.role === 'assistant' ? 'مساعد إداري' : 'موظف عادي'}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                                                                    إدارية: {emp.adminLeaveBalance || 0} | مرضية: {emp.sickLeaveBalance || 0}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-1 mt-1">
                                                                {(emp.requirePasswordChange || !emp.password) && (
                                                                    <span className="text-[10px] text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 border border-yellow-200 dark:border-yellow-800 rounded-md inline-block w-fit">
                                                                        بانتظار إعداد كلمة المرور
                                                                    </span>
                                                                )}
                                                                {emp.deviceToken && (
                                                                    <span className="text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 border border-green-200 dark:border-green-800 rounded-md inline-block w-fit">
                                                                        الجهاز مرتبط
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 shrink-0 flex-wrap justify-end max-w-[120px]">
                                                            <button 
                                                                onClick={() => setEmpToReset(emp.id)} 
                                                                className="p-1.5 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-gray-700 rounded transition-colors"
                                                                title="إعادة تعيين كلمة المرور"
                                                            >
                                                                <i className="icon-key text-sm"></i>
                                                            </button>
                                                            {emp.deviceToken && (
                                                                <button 
                                                                    onClick={() => confirmResetDevice(emp.id)} 
                                                                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded transition-colors"
                                                                title="إلغاء ارتباط الجهاز"
                                                                >
                                                                    <i className="icon-smartphone text-sm"></i>
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => setEditingEmp({id: emp.id, name: emp.name, adminLeaveBalance: emp.adminLeaveBalance || 15, sickLeaveBalance: emp.sickLeaveBalance || 30})} 
                                                                className="p-1.5 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors"
                                                                title="تعديل الموظف"
                                                            >
                                                                <i className="icon-pencil text-sm"></i>
                                                            </button>
                                                            <button 
                                                                onClick={() => setEmpToDelete(emp.id)} 
                                                                className="p-1.5 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded transition-colors"
                                                                title="حذف"
                                                            >
                                                                <i className="icon-trash text-sm"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                                <i className="icon-clock text-[var(--primary-color)]"></i>
                                إعدادات الدوام
                            </h2>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setIsSubmitting(true);
                                try {
                                    await window.Store.saveSetting('workStartTime', workSettings.workStartTime, settings._workStartTime_id);
                                    await window.Store.saveSetting('workEndTime', workSettings.workEndTime, settings._workEndTime_id);
                                    await window.Store.saveSetting('lateGraceMinutes', workSettings.lateGraceMinutes, settings._lateGraceMinutes_id);
                                    await window.Store.saveSetting('earlyLeaveGraceMinutes', workSettings.earlyLeaveGraceMinutes, settings._earlyLeaveGraceMinutes_id);
                                    await window.Store.saveSetting('attendanceEnabled', workSettings.attendanceEnabled, settings._attendanceEnabled_id);
                                    if(onRefresh) await onRefresh();
                                    showMessage('تم حفظ إعدادات الدوام بنجاح');
                                } catch (err) {
                                    showMessage('حدث خطأ أثناء الحفظ', 'error');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">وقت بدء الدوام</label>
                                        <input type="time" className="input-field" value={workSettings.workStartTime} onChange={e => setWorkSettings({...workSettings, workStartTime: e.target.value})} disabled={isSubmitting} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">وقت نهاية الدوام</label>
                                        <input type="time" className="input-field" value={workSettings.workEndTime} onChange={e => setWorkSettings({...workSettings, workEndTime: e.target.value})} disabled={isSubmitting} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">فترة السماح للتأخير (دقائق)</label>
                                        <input type="number" min="0" className="input-field" value={workSettings.lateGraceMinutes} onChange={e => setWorkSettings({...workSettings, lateGraceMinutes: e.target.value})} disabled={isSubmitting} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">فترة السماح للخروج المبكر (دقائق)</label>
                                        <input type="number" min="0" className="input-field" value={workSettings.earlyLeaveGraceMinutes} onChange={e => setWorkSettings({...workSettings, earlyLeaveGraceMinutes: e.target.value})} disabled={isSubmitting} required />
                                    </div>
                                </div>
                                
                                <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                            checked={workSettings.attendanceEnabled} 
                                            onChange={e => setWorkSettings({...workSettings, attendanceEnabled: e.target.checked})} 
                                            disabled={isSubmitting} 
                                        />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">تفعيل خدمة تسجيل الدخول والخروج للموظفين</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1 mr-8">عند إلغاء تفعيل هذا الخيار، سيتم إخفاء أزرار تسجيل الدخول والخروج من حسابات الموظفين وتبقى خدمة طلبات الإجازات فقط.</p>
                                </div>

                                <button type="submit" className="btn btn-primary w-full mt-4" disabled={isSubmitting}>
                                    {isSubmitting ? <i className="icon-loader animate-spin"></i> : 'حفظ الإعدادات'}
                                </button>
                            </form>
                        </div>

                        <div className="card h-fit">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-main)]">
                                <i className="icon-shield text-[var(--primary-color)]"></i>
                                تغيير تصنيف الموظف
                            </h2>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if(!selectedEmpRoleChange) return;
                                setIsSubmitting(true);
                                try {
                                    const emp = employees.find(e => e.id === selectedEmpRoleChange);
                                    if (emp) {
                                        await onUpdateEmployee(emp.id, { ...emp, role: selectedEmpNewRole });
                                        showMessage('تم تغيير صلاحية الموظف بنجاح');
                                        setSelectedEmpRoleChange('');
                                    }
                                } catch (err) {
                                    showMessage('حدث خطأ', 'error');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">اختر الموظف</label>
                                    <select className="input-field" value={selectedEmpRoleChange} onChange={e => setSelectedEmpRoleChange(e.target.value)} required disabled={isSubmitting}>
                                        <option value="">-- اختر --</option>
                                        {employees.filter(e => e.role !== 'admin').map(e => (
                                            <option key={e.id} value={e.id}>{e.name} (حالياً: {e.role === 'manager' ? 'مدير مركز' : e.role === 'assistant' ? 'مساعد إداري' : 'موظف عادي'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">التصنيف الجديد</label>
                                    <select className="input-field" value={selectedEmpNewRole} onChange={e => setSelectedEmpNewRole(e.target.value)} disabled={isSubmitting}>
                                        <option value="employee">موظف عادي</option>
                                        <option value="manager">مدير مركز</option>
                                        <option value="assistant">مساعد إداري</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-outline w-full text-[var(--primary-color)] border-[var(--primary-color)] hover:bg-green-50 dark:hover:bg-gray-800" disabled={!selectedEmpRoleChange || isSubmitting}>
                                    {isSubmitting ? <i className="icon-loader animate-spin"></i> : 'تحديث التصنيف'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {(activeTab === 'logs' || activeTab === 'leaves') && (
                <div className="card">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            {activeTab === 'logs' ? 'سجل الحضور والانصراف' : 'طلبات الإجازات'}
                        </h2>
                        <button 
                            onClick={handleRefreshClick} 
                            disabled={isRefreshing}
                            className="p-2 text-gray-500 hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:bg-opacity-10 rounded-full transition-all focus:outline-none"
                            title="تحديث البيانات"
                        >
                            <i className={`icon-refresh-cw text-lg ${isRefreshing ? 'animate-spin text-[var(--primary-color)]' : ''}`}></i>
                        </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 items-center">
                        {activeTab === 'logs' && selectedLogs.length > 0 && (
                            <button 
                                onClick={() => setLogToDelete(selectedLogs)}
                                className="btn btn-danger py-1.5 px-3 text-sm w-full sm:w-auto whitespace-nowrap"
                            >
                                <i className="icon-trash"></i>
                                حذف المحدد ({selectedLogs.length})
                            </button>
                        )}
                        {activeTab === 'leaves' && selectedLeaves.length > 0 && (
                            <button 
                                onClick={() => setLeaveToDelete(selectedLeaves)}
                                className="btn btn-danger py-1.5 px-3 text-sm w-full sm:w-auto whitespace-nowrap"
                            >
                                <i className="icon-trash"></i>
                                حذف المحدد ({selectedLeaves.length})
                            </button>
                        )}
                        <input 
                            type="date" 
                            className="input-field py-1.5 text-sm w-full sm:w-auto"
                            value={activeTab === 'logs' ? filterDateLogs : filterDateLeaves}
                            onChange={(e) => activeTab === 'logs' ? setFilterDateLogs(e.target.value) : setFilterDateLeaves(e.target.value)}
                        />
                        <select 
                            className="input-field py-1.5 text-sm w-full sm:w-auto sm:max-w-[150px]"
                            value={filterEmp}
                            onChange={(e) => setFilterEmp(e.target.value)}
                        >
                            <option value="">كل الموظفين</option>
                            {employees.filter(emp => emp.role !== 'admin').map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto pb-4">
                    {activeTab === 'logs' ? (
                        <table className="w-full text-right border-collapse min-w-[500px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-3 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)] cursor-pointer"
                                            onChange={handleSelectAllLogs} 
                                            checked={filteredLogs.length > 0 && selectedLogs.length === filteredLogs.length} 
                                        />
                                    </th>
                                    <th className="p-3 font-medium">المستخدم</th>
                                    <th className="p-3 font-medium">النوع</th>
                                    <th className="p-3 font-medium">الوقت</th>
                                    <th className="p-3 font-medium">التاريخ</th>
                                    <th className="p-3 font-medium text-center w-16">إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            لا توجد سجلات مطابقة للبحث
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map(log => (
                                        <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="p-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)] cursor-pointer"
                                                    checked={selectedLogs.includes(log.id)} 
                                                    onChange={() => handleSelectLog(log.id)} 
                                                />
                                            </td>
                                            <td className="p-3 font-medium text-[var(--text-main)]">{getEmployeeName(log.employeeId)}</td>
                                            <td className="p-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    log.type === 'in' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {log.type === 'in' ? 'دخول' : 'خروج'}
                                                    <i className={log.type === 'in' ? 'icon-arrow-right text-[10px]' : 'icon-arrow-left text-[10px]'}></i>
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400" dir="ltr">{formatTime(log.timestamp)}</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">{log.timestamp.split('T')[0]}</td>
                                            <td className="p-3 text-center">
                                                <button 
                                                    onClick={() => setLogToDelete([log.id])} 
                                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded transition-colors"
                                                    title="حذف السجل"
                                                >
                                                    <i className="icon-trash text-sm"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-right border-collapse min-w-[500px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-3 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)] cursor-pointer"
                                            onChange={handleSelectAllLeaves} 
                                            checked={filteredLeaves.length > 0 && selectedLeaves.length === filteredLeaves.length} 
                                        />
                                    </th>
                                    <th className="p-3 font-medium">المستخدم</th>
                                    <th className="p-3 font-medium">النوع</th>
                                    <th className="p-3 font-medium">التاريخ</th>
                                    <th className="p-3 font-medium">الحالة</th>
                                    <th className="p-3 font-medium text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeaves.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            لا توجد طلبات إجازة مطابقة للبحث
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeaves.map(leave => (
                                        <tr key={leave.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="p-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-gray-300 dark:border-gray-600 w-4 h-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)] cursor-pointer"
                                                    checked={selectedLeaves.includes(leave.id)} 
                                                    onChange={() => handleSelectLeave(leave.id)} 
                                                />
                                            </td>
                                            <td className="p-3 font-medium text-[var(--text-main)]">{getEmployeeName(leave.employeeId)}</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">
                                                {getLeaveTypeName(leave.type)}
                                                {leave.type === 'hourly' && (
                                                    <div className="text-xs mt-1 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded inline-block">
                                                        {leave.startTime} - {leave.duration} س
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">{leave.date}</td>
                                            <td className="p-3">
                                                {leave.status === 'approved' && <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs">مقبول</span>}
                                                {leave.status === 'rejected' && <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full text-xs">مرفوض</span>}
                                                {leave.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full text-xs">قيد الانتظار</span>}
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleLeaveStatusChange(leave.id, 'approved')} 
                                                        disabled={leave.status === 'approved' || isSubmitting}
                                                        className="text-green-600 hover:bg-green-50 dark:hover:bg-gray-800 p-1.5 rounded transition-colors disabled:opacity-30"
                                                        title="قبول"
                                                    >
                                                        <i className="icon-check text-sm"></i>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleLeaveStatusChange(leave.id, 'rejected')} 
                                                        disabled={leave.status === 'rejected' || isSubmitting}
                                                        className="text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 p-1.5 rounded transition-colors disabled:opacity-30"
                                                        title="رفض"
                                                    >
                                                        <i className="icon-x text-sm"></i>
                                                    </button>
                                                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                                    <button 
                                                        onClick={() => setLeaveToDelete([leave.id])} 
                                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 p-1.5 rounded transition-colors"
                                                        title="حذف"
                                                    >
                                                        <i className="icon-trash text-sm"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                </div>
                )}
            </div>

        </div>
    );
}
window.AdminView = AdminView;