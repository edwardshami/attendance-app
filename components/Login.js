function Login({ employees, onLogin, onUpdateEmployee, isDarkMode, onToggleTheme }) {
    const [name, setName] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [step, setStep] = React.useState('login'); // 'login' or 'setup_password'
    const [pendingUser, setPendingUser] = React.useState(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        if (!name.trim()) {
            setError('يرجى إدخال اسم المستخدم');
            return;
        }

        const user = employees.find(emp => emp.name === name.trim());
        
        if (!user) {
            setError('الاسم غير صحيح');
            return;
        }

        // If user requires password setup
        if (user.requirePasswordChange || user.password === '') {
            setPendingUser(user);
            setStep('setup_password');
            return;
        }

        // Get or create local device token
        let localToken = localStorage.getItem('deviceToken');
        if (!localToken) {
            localToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('deviceToken', localToken);
        }

        // Normal login
        if (user.password === password) {
            if (!user.deviceToken) {
                // First time login on this device, bind it
                const updatedUser = { ...user, deviceToken: localToken };
                onUpdateEmployee(user.id, updatedUser).then(res => {
                    onLogin(res);
                }).catch(err => {
                    console.error('Error binding device:', err);
                    setError('حدث خطأ أثناء تسجيل الدخول');
                });
            } else if (user.deviceToken !== localToken) {
                setError('هذا الحساب مرتبط بجهاز آخر. لا يمكنك تسجيل الدخول من هذا الجهاز.');
            } else {
                onLogin(user);
            }
        } else {
            setError('كلمة المرور غير صحيحة');
        }
    };

    const handleSetupPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 4) {
            setError('كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }

        setIsSubmitting(true);
        try {
            let localToken = localStorage.getItem('deviceToken');
            if (!localToken) {
                localToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
                localStorage.setItem('deviceToken', localToken);
            }
            
            const updatedData = { ...pendingUser, password: newPassword, requirePasswordChange: false, deviceToken: localToken };
            await onUpdateEmployee(pendingUser.id, updatedData);
            onLogin(updatedData);
        } catch (err) {
            console.error('Error setting password', err);
            setError('حدث خطأ أثناء حفظ كلمة المرور');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)] p-4 transition-colors duration-300" data-name="login" data-file="components/Login.js">
            <button 
                onClick={onToggleTheme} 
                className="absolute top-4 left-4 p-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm"
                title="تبديل المظهر"
            >
                {isDarkMode ? <i className="icon-sun text-lg"></i> : <i className="icon-moon text-lg"></i>}
            </button>
            <div className="card w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center mb-4 p-0 overflow-hidden">
                        <img src="https://app.trickle.so/storage/public/images/usr_1e29a98360000001/1ed4cd2b-327b-47e0-9710-1b450db26e4e.jpeg" alt="شعار النظام" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--text-main)]">
                        {step === 'login' ? 'تسجيل الدخول' : 'إعداد كلمة المرور'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">نظام الحضور والانصراف</p>
                </div>

                {step === 'login' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                                <i className="icon-circle-alert"></i>
                                {error}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم / اسم المستخدم</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <i className="icon-user text-gray-400 dark:text-gray-500"></i>
                                </div>
                                <input 
                                    type="text" 
                                    className="input-field pr-10" 
                                    placeholder="أدخل اسمك"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور (إذا تم إعدادها مسبقاً)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <i className="icon-lock text-gray-400 dark:text-gray-500"></i>
                                </div>
                                <input 
                                    type="password" 
                                    className="input-field pr-10" 
                                    placeholder="أدخل كلمة المرور"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full py-3 mt-6">
                            متابعة
                            <i className="icon-arrow-left mr-2"></i>
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSetupPassword} className="space-y-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm mb-4">
                            مرحباً بك <strong>{pendingUser.name}</strong>، يرجى تعيين كلمة مرور جديدة لحسابك.
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                                <i className="icon-circle-alert"></i>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الجديدة</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <i className="icon-lock text-gray-400 dark:text-gray-500"></i>
                                </div>
                                <input 
                                    type="password" 
                                    className="input-field pr-10" 
                                    placeholder="أدخل كلمة المرور الجديدة"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تأكيد كلمة المرور</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <i className="icon-lock text-gray-400 dark:text-gray-500"></i>
                                </div>
                                <input 
                                    type="password" 
                                    className="input-field pr-10" 
                                    placeholder="أعد إدخال كلمة المرور"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button type="submit" className="btn btn-primary flex-1 py-3" disabled={isSubmitting}>
                                {isSubmitting ? <i className="icon-loader animate-spin"></i> : 'حفظ والدخول'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setStep('login');
                                    setPendingUser(null);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }} 
                                className="btn btn-outline flex-1 py-3"
                                disabled={isSubmitting}
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
}
window.Login = Login;
