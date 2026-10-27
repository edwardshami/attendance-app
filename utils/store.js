const FirestoreStore = {
  async getEmployees() {
    if (!window.db) return [];
    try {
      const snapshot = await window.db.collection('employees').get();
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (e) {
      console.error('Error fetching employees:', e);
      return [];
    }
  },

  async addEmployee(empData) {
    if (!window.db) throw new Error('Firestore is not initialized');
    try {
      const payload = {
        ...empData,
        password: empData.password ? await hashPassword(empData.password) : '',
        createdAt: new Date().toISOString(),
        requirePasswordChange: !!empData.requirePasswordChange
      };

      const ref = await window.db.collection('employees').add(payload);
      return { id: ref.id, ...payload };
    } catch (e) {
      console.error('Error adding employee:', e);
      throw e;
    }
  },

  async updateEmployee(id, empData) {
    if (!window.db) throw new Error('Firestore is not initialized');
    try {
      const payload = { ...empData };
      if (typeof payload.password === 'string' && payload.password) {
        payload.password = await hashPassword(payload.password);
      }

      await window.db.collection('employees').doc(id).update(payload);
      return { id, ...payload };
    } catch (e) {
      console.error('Error updating employee:', e);
      throw e;
    }
  },

  async deleteEmployee(id) {
    if (!window.db) return;
    try {
      await window.db.collection('employees').doc(id).delete();
    } catch (e) {
      console.error('Error deleting employee:', e);
      throw e;
    }
  },

  async authenticate(name, password) {
    if (!window.db) return null;
    try {
      const snapshot = await window.db.collection('employees').get();
      const hashedInput = await hashPassword(password);

      const found = snapshot.docs.find((docSnap) => {
        const data = docSnap.data();
        return (
          String(data.name || '').trim() === String(name || '').trim() &&
          String(data.password || '') === hashedInput
        );
      });

      if (!found) return null;
      return { id: found.id, ...found.data() };
    } catch (e) {
      console.error('Error authenticating:', e);
      return null;
    }
  },

  async getLogs() {
    if (!window.db) return [];
    try {
      const snapshot = await window.db.collection('attendance_logs').get();
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (e) {
      console.error('Error fetching logs:', e);
      return [];
    }
  },

  async addLog(employeeId, type, timestamp) {
    if (!window.db) throw new Error('Firestore is not initialized');
    try {
      const payload = {
        employeeId,
        type,
        timestamp,
        createdAt: new Date().toISOString()
      };
      const ref = await window.db.collection('attendance_logs').add(payload);
      return { id: ref.id, ...payload };
    } catch (e) {
      console.error('Error adding log:', e);
      throw e;
    }
  },

  async deleteLog(id) {
    if (!window.db) return;
    try {
      await window.db.collection('attendance_logs').doc(id).delete();
    } catch (e) {
      console.error('Error deleting log:', e);
      throw e;
    }
  },

  async getLeaveRequests() {
    if (!window.db) return [];
    try {
      const snapshot = await window.db.collection('leave_requests').get();
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (e) {
      console.error('Error fetching leave requests:', e);
      return [];
    }
  },

  async addLeaveRequest(employeeId, date, type, startTime, duration) {
    if (!window.db) throw new Error('Firestore is not initialized');
    try {
      const payload = {
        employeeId,
        date,
        type,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      if (type === 'hourly') {
        payload.startTime = startTime;
        payload.duration = Number(duration);
      }

      const ref = await window.db.collection('leave_requests').add(payload);
      return { id: ref.id, ...payload };
    } catch (e) {
      console.error('Error adding leave request:', e);
      throw e;
    }
  },

  async updateLeaveRequest(id, data) {
    if (!window.db) throw new Error('Firestore is not initialized');
    try {
      await window.db.collection('leave_requests').doc(id).update(data);
      return { id, ...data };
    } catch (e) {
      console.error('Error updating leave request:', e);
      throw e;
    }
  },

  async deleteLeaveRequest(id) {
    if (!window.db) return;
    try {
      await window.db.collection('leave_requests').doc(id).delete();
    } catch (e) {
      console.error('Error deleting leave request:', e);
      throw e;
    }
  },

  async getSettings() {
    if (!window.db) return {};
    try {
      const snapshot = await window.db.collection('settings').get();
      const result = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        result[data.key] = data.value;
      });
      return result;
    } catch (e) {
      console.error('Error fetching settings:', e);
      return {};
    }
  },

  async saveSetting(key, value) {
    if (!window.db) throw new Error('Firestore is not initialized');
    try {
      const snapshot = await window.db.collection('settings').where('key', '==', key).limit(1).get();
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        await window.db.collection('settings').doc(docSnap.id).update({ key, value });
      } else {
        await window.db.collection('settings').add({ key, value });
      }
    } catch (e) {
      console.error('Error saving setting:', e);
      throw e;
    }
  },

  async getNotifications() {
    if (!window.db) return [];
    try {
      const snapshot = await window.db.collection('notifications').get();
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (e) {
      console.error('Error fetching notifications:', e);
      return [];
    }
  },

  async addNotification(employeeId, title, body) {
    if (!window.db) return;
    try {
      await window.db.collection('notifications').add({
        employeeId,
        title,
        body,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error adding notification:', e);
    }
  },

  async markNotificationRead(id, data) {
    if (!window.db) return;
    try {
      await window.db.collection('notifications').doc(id).update({
        ...data,
        isRead: true
      });
    } catch (e) {
      console.error('Error updating notification:', e);
    }
  },

  async clearEmployeeNotifications(employeeId) {
    if (!window.db) return;
    try {
      const snapshot = await window.db.collection('notifications').where('employeeId', '==', employeeId).get();
      await Promise.all(snapshot.docs.map((docSnap) => docSnap.ref.delete()));
    } catch (e) {
      console.error('Error clearing notifications:', e);
    }
  }
};

window.Store = FirestoreStore;
