// Trickle Database wrapper
const Store = {
    getEmployees: async () => {
        try {
            const res = await trickleListObjects('employee', 1000, false);
            return res.items.map(item => ({ id: item.objectId, createdAt: item.createdAt, ...item.objectData }));
        } catch (e) {
            console.error('Error fetching employees:', e);
            return [];
        }
    },
    addEmployee: async (empData) => {
        try {
            const res = await trickleCreateObject('employee', empData);
            return { id: res.objectId, createdAt: res.createdAt, ...res.objectData };
        } catch (e) {
            console.error('Error adding employee:', e);
            throw e;
        }
    },
    getLogs: async () => {
        try {
            const res = await trickleListObjects('attendance_log', 1000, false);
            return res.items.map(item => ({ id: item.objectId, createdAt: item.createdAt, ...item.objectData }));
        } catch (e) {
            console.error('Error fetching logs:', e);
            return [];
        }
    },
    addLog: async (employeeId, type, timestamp) => {
        try {
            const res = await trickleCreateObject('attendance_log', { employeeId, type, timestamp });
            return { id: res.objectId, createdAt: res.createdAt, ...res.objectData };
        } catch (e) {
            console.error('Error adding log:', e);
            throw e;
        }
    },
    updateEmployee: async (id, empData) => {
        try {
            const res = await trickleUpdateObject('employee', id, empData);
            return { id: res.objectId, createdAt: res.createdAt, ...res.objectData };
        } catch (e) {
            console.error('Error updating employee:', e);
            throw e;
        }
    },
    deleteEmployee: async (id) => {
        try {
            await trickleDeleteObject('employee', id);
        } catch (e) {
            console.error('Error deleting employee:', e);
            throw e;
        }
    },
    deleteLog: async (id) => {
        try {
            await trickleDeleteObject('attendance_log', id);
        } catch (e) {
            console.error('Error deleting log:', e);
            throw e;
        }
    },
    getLeaveRequests: async () => {
        try {
            const res = await trickleListObjects('leave_request', 1000, false);
            return res.items.map(item => ({ id: item.objectId, createdAt: item.createdAt, ...item.objectData }));
        } catch (e) {
            console.error('Error fetching leave requests:', e);
            return [];
        }
    },
    addLeaveRequest: async (employeeId, date, type, startTime, duration) => {
        try {
            const payload = { employeeId, date, type, status: 'pending' };
            if (type === 'hourly') {
                payload.startTime = startTime;
                payload.duration = Number(duration);
            }
            const res = await trickleCreateObject('leave_request', payload);
            return { id: res.objectId, createdAt: res.createdAt, ...res.objectData };
        } catch (e) {
            console.error('Error adding leave request:', e);
            throw e;
        }
    },
    updateLeaveRequest: async (id, data) => {
        try {
            const res = await trickleUpdateObject('leave_request', id, data);
            return { id: res.objectId, createdAt: res.createdAt, ...res.objectData };
        } catch (e) {
            console.error('Error updating leave request:', e);
            throw e;
        }
    },
    deleteLeaveRequest: async (id) => {
        try {
            await trickleDeleteObject('leave_request', id);
        } catch (e) {
            console.error('Error deleting leave request:', e);
            throw e;
        }
    },
    getSettings: async () => {
        try {
            const res = await trickleListObjects('setting', 1000, false);
            const settings = {};
            res.items.forEach(item => {
                settings[item.objectData.key] = JSON.parse(item.objectData.value);
                settings[`_${item.objectData.key}_id`] = item.objectId;
            });
            return settings;
        } catch (e) {
            console.error('Error fetching settings:', e);
            return {};
        }
    },
    saveSetting: async (key, value, existingId) => {
        try {
            const stringValue = JSON.stringify(value);
            if (existingId) {
                await trickleUpdateObject('setting', existingId, { key, value: stringValue });
            } else {
                await trickleCreateObject('setting', { key, value: stringValue });
            }
        } catch (e) {
            console.error('Error saving setting:', e);
            throw e;
        }
    },
    getNotifications: async () => {
        try {
            const res = await trickleListObjects('notification', 1000, false);
            return res.items.map(item => ({ id: item.objectId, createdAt: item.createdAt, ...item.objectData }));
        } catch (e) {
            console.error('Error fetching notifications:', e);
            return [];
        }
    },
    addNotification: async (employeeId, title, body) => {
        try {
            await trickleCreateObject('notification', { employeeId, title, body, isRead: false });
        } catch (e) {
            console.error('Error adding notification:', e);
        }
    },
    markNotificationRead: async (id, data) => {
        try {
            await trickleUpdateObject('notification', id, { ...data, isRead: true });
        } catch (e) {
            console.error('Error updating notification:', e);
        }
    },
    clearEmployeeNotifications: async (employeeId) => {
        try {
            const res = await trickleListObjects('notification', 1000, false);
            const toDelete = res.items.filter(item => item.objectData.employeeId === employeeId);
            await Promise.all(toDelete.map(item => trickleDeleteObject('notification', item.objectId)));
        } catch (e) {
            console.error('Error clearing notifications:', e);
        }
    }
};
window.Store = Store;
      
