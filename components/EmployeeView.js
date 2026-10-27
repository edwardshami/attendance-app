function EmployeeView({ currentUser, employees, logs, allLeaveRequests, settings, onAddLog, leaveRequests, onAddLeave, onUpdateLeave, isCenterNetwork, timeOffset }) {
    const [currentTime, setCurrentTime] = React.useState(new Date(Date.now() + timeOffset));
    const [message, setMessage] = React.useState(null);
    const [exportDate, setExportDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [isLogging, setIsLogging] = React.useState(false);
    
    // Leave Request States
    const [showLeaveForm, setShowLeaveForm] = React.useState(false);
    const [leaveDate, setLeaveDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [leaveType, setLeaveType] = React.useState('administrative');
    const [leaveStartTime, setLeaveStartTime] = React.useState('09:00');
    const [leaveDuration, setLeaveDuration] = React.useState(1);
    const [isSubmittingLeave, setIsSubmittingLeave] = React.useState(false);

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date(Date.now() + timeOffset)), 1000);
        return () => clearInterval(timer);
    }, [timeOffset]);

    const handleAction = async (type) => {
        setIsLogging(true);
        try {
            const realTimestamp = new Date(Date.now() + timeOffset).toISOString();
            await onAddLog(currentUser.id, type, realTimestamp);
            const actionText = type === 'in' ? 'دخول' : 'خروج';
            showMessage(`تم تسجيل ${actionText} بنجاح`, 'success');
        } catch (err) {
            console.error("Error logging action:", err);
            showMessage('حدث خطأ أثناء تسجيل الحركة', 'error');
        } finally {
            setIsLogging(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingLeave(true);
        try {
            await onAddLeave(currentUser.id, leaveDate, leaveType, leaveStartTime, leaveDuration);
            showMessage('تم إرسال طلب الإجازة بنجاح', 'success');
            setShowLeaveForm(false);
            setLeaveType('administrative');
            setLeaveStartTime('09:00');
            setLeaveDuration(1);
        } catch (err) {
            console.error("Error submitting leave request:", err);
            showMessage('حدث خطأ أثناء إرسال الطلب', 'error');
        } finally {
            setIsSubmittingLeave(false);
        }
    };

    const timeOptions = { timeZone: 'Asia/Damascus', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateOptions = { timeZone: 'Asia/Damascus', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    const timeString = currentTime.toLocaleTimeString('ar-EG', timeOptions);
    const dateString = currentTime.toLocaleDateString('ar-EG', dateOptions);

    const getLeaveTypeName = (type) => {
        switch(type) {
            case 'administrative': return 'إدارية';
            case 'sick': return 'مرضية';
            case 'hourly': return 'ساعية';
            default: return 'غير معروف';
        }
    };

    const getLeaveStatusBadge = (status) => {
        switch(status) {
            case 'approved': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">مقبول</span>;
            case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">مرفوض</span>;
            default: return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">قيد الانتظار</span>;
        }
    };

    const getEmployeeName = (id) => {
        return employees?.find(e => e.id === id)?.name || 'مجهول';
    };

    const exportToCSV = () => {
        const filteredLogs = logs.filter(log => log.timestamp.split('T')[0] === exportDate);
        if(filteredLogs.length === 0) {
            showMessage('لا توجد سجلات لهذا اليوم', 'error');
            return;
        }

        const employeeLogs = {};
        filteredLogs.forEach(log => {
            if (!employeeLogs[log.employeeId]) {
                employeeLogs[log.employeeId] = { in: '-', out: '-' };
            }
            const timeStr = new Date(log.timestamp).toLocaleTimeString('ar-EG', { timeZone: 'Asia/Damascus', hour: '2-digit', minute: '2-digit' });
            if (log.type === 'in') employeeLogs[log.employeeId].in = timeStr;
            else employeeLogs[log.employeeId].out = timeStr;
        });

        let csvContent = '\uFEFFالاسم,وقت الدخول,وقت الخروج\n';
        Object.keys(employeeLogs).forEach(empId => {
            csvContent += `${getEmployeeName(empId)},${employeeLogs[empId].in},${employeeLogs[empId].out}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_${exportDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const calculateRemainingLeaves = (type) => {
        const balance = type === 'administrative' ? (currentUser.adminLeaveBalance || 15) : (currentUser.sickLeaveBalance || 30);
        const used = leaveRequests.filter(l => l.type === type && l.status === 'approved').length; // simple 1 day per approved request
        return Math.max(0, balance - used);
    };

    const handleLeaveStatusChange = async (id, status, empId) => {
        try {
            await onUpdateLeave(id, { status });
            // Send notification to user
            const statusText = status === 'approved' ? 'قبول' : 'رفض';
            await window.Store.addNotification(empId, 'تحديث حالة الإجازة', `تم ${statusText} طلب الإجازة الخاص بك.`);
            showMessage('تم التحديث بنجاح', 'success');
        } catch (err) {
            showMessage('حدث خطأ', 'error');
        }
    };

    const formatDuration = (mins) => {
        if (mins <= 0) return null;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0 && m > 0) return `${h} ساعة و ${m} دقيقة`;
        if (h > 0) return `${h} ساعة`;
        return `${m} دقيقة`;
    };

    const getAttendanceStatus = (logTime, type) => {
        if (!settings.workStartTime || !settings.workEndTime) return null;
        
        const logDate = new Date(logTime);
        const logMinutes = logDate.getHours() * 60 + logDate.getMinutes();
        
        if (type === 'in') {
            const [startH, startM] = settings.workStartTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const grace = Number(settings.lateGraceMinutes || 0);
            if (logMinutes > startMinutes + grace) {
                // نقرب وقت الدخول لأقرب نص ساعة للأعلى
                const roundedLogMinutes = Math.ceil(logMinutes / 30) * 30;
                const lateMin = roundedLogMinutes - startMinutes;
                const durationStr = formatDuration(lateMin);
                if (durationStr) return <span className="text-red-500 font-bold mr-2 text-xs">(تأخير: {durationStr})</span>;
            }
        } else if (type === 'out') {
            const [endH, endM] = settings.workEndTime.split(':').map(Number);
            const endMinutes = endH * 60 + endM;
            const grace = Number(settings.earlyLeaveGraceMinutes || 0);
            if (logMinutes < endMinutes - grace) {
                // نقرب وقت الخروج لأقرب نص ساعة للأدنى
                const roundedLogMinutes = Math.floor(logMinutes / 30) * 30;
                const earlyMin = endMinutes - roundedLogMinutes;
                const durationStr = formatDuration(earlyMin);
                if (durationStr) return <span className="text-orange-500 font-bold mr-2 text-xs">(خروج مبكر: {durationStr})</span>;
            }
        }
        return null;
    };

    const pendingManagerLeaves = currentUser.role === 'manager' ? allLeaveRequests.filter(l => l.status === 'pending' && l.employeeId !== currentUser.id).length : 0;

    return (
        <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6" data-name="employee-view" data-file="components/EmployeeView.js">
            
            {pendingManagerLeaves > 0 && (
                <div className="col-span-1 md:col-span-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg flex items-center gap-3">
                    <i className="icon-triangle-alert text-2xl text-yellow-600 dark:text-yellow-500"></i>
                    <div>
                        <p className="font-bold">تنبيه لمدير المركز</p>
                        <p className="text-sm">يوجد لديك {pendingManagerLeaves} طلب إجازة قيد الانتظار لموظفيك.</p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
            <div className="card text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[var(--primary-color)]"></div>
                
                <div className="mt-4 mb-2">
                    <h2 className="text-xl font-bold text-[var(--text-main)]">مرحباً بك، {currentUser.name}</h2>
                </div>

                <div className="my-6 sm:my-8">
                    <div className="text-4xl sm:text-5xl font-bold text-[var(--text-main)] tracking-wider mb-2" dir="ltr">
                        {timeString}
                    </div>
                    <div className="text-sm sm:text-base text-gray-500">{dateString}</div>
                </div>

                {settings.attendanceEnabled !== false && (
                    isCenterNetwork ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                            <button 
                                onClick={() => handleAction('in')}
                                disabled={isLogging}
                                className="btn btn-primary py-4 text-lg flex-col gap-2 h-auto disabled:opacity-50"
                            >
                                {isLogging ? <i className="icon-loader animate-spin text-2xl"></i> : <i className="icon-arrow-right text-2xl"></i>}
                                <span>تسجيل دخول</span>
                            </button>
                            <button 
                                onClick={() => handleAction('out')}
                                disabled={isLogging}
                                className="btn bg-gray-800 text-white hover:bg-gray-900 py-4 text-lg flex-col gap-2 h-auto disabled:opacity-50"
                            >
                                {isLogging ? <i className="icon-loader animate-spin text-2xl"></i> : <i className="icon-arrow-left text-2xl"></i>}
                                <span>تسجيل خروج</span>
                            </button>
                        </div>
                    ) : (
                        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                            <div className="flex flex-col items-center text-yellow-700 dark:text-yellow-400">
                                <i className="icon-wifi-off text-3xl mb-2"></i>
                                <p className="font-bold text-lg mb-1">خارج شبكة المركز</p>
                                <p className="text-sm text-center">يرجى الاتصال بشبكة المركز (الـ Wi-Fi المعتمد) لتتمكن من تسجيل الحضور والانصراف.</p>
                            </div>
                        </div>
                    )
                )}
                
                {message && (
                    <div className={`mt-6 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}
            </div>

            {/* Leave Requests Section */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                        <i className="icon-calendar-days text-[var(--primary-color)]"></i>
                        إجازاتي
                    </h3>
                    <button 
                        onClick={() => setShowLeaveForm(!showLeaveForm)}
                        className="btn btn-outline py-1.5 px-3 text-sm"
                    >
                        <i className={showLeaveForm ? "icon-minus" : "icon-plus"}></i>
                        {showLeaveForm ? "إلغاء" : "طلب إجازة"}
                    </button>
                </div>

                {showLeaveForm && (
                    <form onSubmit={handleLeaveSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">التاريخ</label>
                                <input 
                                    type="date" 
                                    className="input-field"
                                    value={leaveDate}
                                    onChange={(e) => setLeaveDate(e.target.value)}
                                    required
                                    disabled={isSubmittingLeave}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">نوع الإجازة</label>
                                <select 
                                    className="input-field"
                                    value={leaveType}
                                    onChange={(e) => setLeaveType(e.target.value)}
                                    disabled={isSubmittingLeave}
                                >
                                    <option value="administrative">إدارية (متبقي {calculateRemainingLeaves('administrative')} يوم)</option>
                                    <option value="sick">مرضية (متبقي {calculateRemainingLeaves('sick')} يوم)</option>
                                    <option value="hourly">ساعية</option>
                                </select>
                            </div>
                            
                            {leaveType === 'hourly' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">وقت البدء</label>
                                        <input 
                                            type="time" 
                                            className="input-field"
                                            value={leaveStartTime}
                                            onChange={(e) => setLeaveStartTime(e.target.value)}
                                            required
                                            disabled={isSubmittingLeave}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">عدد الساعات</label>
                                        <input 
                                            type="number" 
                                            min="0.5" 
                                            max="8"
                                            step="0.5"
                                            className="input-field"
                                            value={leaveDuration}
                                            onChange={(e) => setLeaveDuration(e.target.value)}
                                            required
                                            disabled={isSubmittingLeave}
                                        />
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="btn btn-primary w-full"
                                disabled={isSubmittingLeave}
                            >
                                {isSubmittingLeave ? <i className="icon-loader animate-spin"></i> : 'إرسال الطلب'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-3">
                    {leaveRequests.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">لا توجد طلبات إجازة سابقة</p>
                    ) : (
                        leaveRequests.sort((a,b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()).map(leave => (
                            <div key={leave.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow">
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{leave.date}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {getLeaveTypeName(leave.type)}
                                        {leave.type === 'hourly' && ` (من ${leave.startTime} لمدة ${leave.duration} ساعة)`}
                                    </span>
                                </div>
                                <div>
                                    {getLeaveStatusBadge(leave.status)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            </div>

            {/* Role specific panels */}
            {(currentUser.role === 'manager' || currentUser.role === 'assistant') && (
                <div className="space-y-6">
                    {currentUser.role === 'manager' && (
                        <div className="card">
                            <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2 mb-4">
                                <i className="icon-check-square text-[var(--primary-color)]"></i>
                                طلبات إجازة الموظفين
                            </h3>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {allLeaveRequests.filter(l => l.employeeId !== currentUser.id).length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">لا توجد طلبات</p>
                                ) : (
                                    allLeaveRequests
                                        .filter(l => l.employeeId !== currentUser.id)
                                        .sort((a,b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
                                        .map(leave => (
                                        <div key={leave.id} className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-sm text-[var(--text-main)]">{getEmployeeName(leave.employeeId)}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{leave.date} - {getLeaveTypeName(leave.type)}</div>
                                                </div>
                                                {getLeaveStatusBadge(leave.status)}
                                            </div>
                                            {leave.status === 'pending' && (
                                                <div className="flex gap-2 mt-3">
                                                    <button onClick={() => handleLeaveStatusChange(leave.id, 'approved', leave.employeeId)} className="btn bg-green-500 text-white hover:bg-green-600 flex-1 py-1 text-xs">قبول</button>
                                                    <button onClick={() => handleLeaveStatusChange(leave.id, 'rejected', leave.employeeId)} className="btn bg-red-500 text-white hover:bg-red-600 flex-1 py-1 text-xs">رفض</button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {currentUser.role === 'assistant' && (
                        <div className="card">
                            <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2 mb-4">
                                <i className="icon-file-spreadsheet text-[var(--primary-color)]"></i>
                                تقارير الحضور
                            </h3>
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="date" 
                                    className="input-field py-1.5 text-sm"
                                    value={exportDate}
                                    onChange={e => setExportDate(e.target.value)}
                                />
                                <button onClick={exportToCSV} className="btn btn-primary text-sm whitespace-nowrap">
                                    <i className="icon-download"></i> تصدير
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">حضور اليوم ({exportDate})</h4>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {logs.filter(l => l.timestamp.split('T')[0] === exportDate).map(log => (
                                            <div key={log.id} className="text-xs flex flex-col sm:flex-row sm:justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded gap-1 border border-gray-100 dark:border-gray-700">
                                                <span className="font-bold text-[var(--text-main)]">{getEmployeeName(log.employeeId)}</span>
                                                <div className="flex items-center">
                                                    <span className={log.type === 'in' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                                                        {log.type === 'in' ? 'دخول: ' : 'خروج: '}
                                                        {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {getAttendanceStatus(log.timestamp, log.type)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الإجازات المقبولة ({exportDate})</h4>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {allLeaveRequests.filter(l => l.date === exportDate && l.status === 'approved').length === 0 ? (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">لا توجد إجازات مقبولة لهذا اليوم</p>
                                        ) : (
                                            allLeaveRequests.filter(l => l.date === exportDate && l.status === 'approved').map(leave => (
                                                <div key={leave.id} className="text-xs p-2 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded border border-green-100 dark:border-green-800">
                                                    <span className="font-bold ml-2">{getEmployeeName(leave.employeeId)}</span>
                                                    - {getLeaveTypeName(leave.type)} 
                                                    {leave.type === 'hourly' && ` (${leave.startTime} - ${leave.duration}س)`}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
window.EmployeeView = EmployeeView;