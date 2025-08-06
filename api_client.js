// عميل API للتعامل مع الخادم
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    // وظائف مساعدة
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'حدث خطأ في الطلب');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // المصادقة
    async login(username, password) {
        return this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async logout(username) {
        return this.request('/logout', {
            method: 'POST',
            body: JSON.stringify({ username })
        });
    }

    // المخزون
    async getInventory() {
        return this.request('/inventory');
    }

    async addInventory(item) {
        return this.request('/inventory', {
            method: 'POST',
            body: JSON.stringify(item)
        });
    }

    async updateInventory(id, item) {
        return this.request(`/inventory/${id}`, {
            method: 'PUT',
            body: JSON.stringify(item)
        });
    }

    async deleteInventory(id) {
        return this.request(`/inventory/${id}`, {
            method: 'DELETE'
        });
    }

    // الواردات
    async getIncoming() {
        return this.request('/incoming');
    }

    async addIncoming(item) {
        return this.request('/incoming', {
            method: 'POST',
            body: JSON.stringify(item)
        });
    }

    async updateIncoming(id, item) {
        return this.request(`/incoming/${id}`, {
            method: 'PUT',
            body: JSON.stringify(item)
        });
    }

    async deleteIncoming(id) {
        return this.request(`/incoming/${id}`, {
            method: 'DELETE'
        });
    }

    // الصادرات
    async getOutgoing() {
        return this.request('/outgoing');
    }

    async addOutgoing(item) {
        return this.request('/outgoing', {
            method: 'POST',
            body: JSON.stringify(item)
        });
    }

    async updateOutgoing(id, item) {
        return this.request(`/outgoing/${id}`, {
            method: 'PUT',
            body: JSON.stringify(item)
        });
    }

    async deleteOutgoing(id) {
        return this.request(`/outgoing/${id}`, {
            method: 'DELETE'
        });
    }

    // التنبيهات
    async getAlerts() {
        return this.request('/alerts');
    }

    async markAlertRead(id) {
        return this.request(`/alerts/${id}/read`, {
            method: 'PUT'
        });
    }

    async deleteAlert(id) {
        return this.request(`/alerts/${id}`, {
            method: 'DELETE'
        });
    }

    // التقارير
    async getReports() {
        return this.request('/reports');
    }

    async generateReport(reportData) {
        return this.request('/reports/generate', {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
    }

    // المستخدمين
    async getUsers() {
        return this.request('/users');
    }

    // الإحصائيات
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }

    // البحث
    async search(query, type = 'all') {
        return this.request(`/search?q=${encodeURIComponent(query)}&type=${type}`);
    }

    // فحص صحة الخدمة
    async healthCheck() {
        return this.request('/health');
    }
}

// إنشاء مثيل من عميل API
const apiClient = new APIClient(API_BASE_URL);

// تحديث وظائف JavaScript لاستخدام API الحقيقي
async function login(username, password) {
    showLoading();
    
    try {
        const response = await apiClient.login(username, password);
        
        if (response.success) {
            currentUser = response.user;
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            // تحديث معلومات المستخدم في الواجهة
            document.getElementById('currentUser').textContent = response.user.fullName;
            document.getElementById('userRole').textContent = response.user.role;
            document.getElementById('userInitials').textContent = response.user.fullName.charAt(0);
            
            // إخفاء شاشة تسجيل الدخول وإظهار التطبيق
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            
            // تحميل لوحة التحكم
            await loadDashboard();
            
            showToast('مرحباً', `أهلاً بك ${response.user.fullName}`, 'success');
        }
    } catch (error) {
        showToast('خطأ', error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function logout() {
    try {
        if (currentUser) {
            await apiClient.logout(currentUser.username);
        }
        
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        // إظهار شاشة تسجيل الدخول وإخفاء التطبيق
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        
        // إعادة تعيين النموذج
        document.getElementById('loginForm').reset();
        
        showToast('تم تسجيل الخروج', 'تم تسجيل خروجك بنجاح', 'info');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('تحذير', 'حدث خطأ أثناء تسجيل الخروج', 'warning');
    }
}

async function loadDashboard() {
    try {
        const stats = await apiClient.getDashboardStats();
        
        if (stats.success) {
            // تحديث الإحصائيات
            document.getElementById('totalItems').textContent = stats.data.totalItems;
            document.getElementById('totalIncoming').textContent = stats.data.totalIncoming;
            document.getElementById('totalOutgoing').textContent = stats.data.totalOutgoing;
            document.getElementById('totalProfit').textContent = formatCurrency(stats.data.profit, 'SAR');
            
            // تحديث شارة التنبيهات
            updateAlertBadge(stats.data.unreadAlerts);
        }
        
        // تحميل الرسوم البيانية
        loadCharts();
        
        // تحميل التنبيهات السريعة
        await loadQuickAlerts();
        
    } catch (error) {
        console.error('Dashboard loading error:', error);
        showToast('خطأ', 'حدث خطأ أثناء تحميل لوحة التحكم', 'error');
    }
}

async function loadInventory() {
    try {
        const response = await apiClient.getInventory();
        
        if (response.success) {
            displayInventoryData(response.data);
            updateInventoryFilters(response.data);
        }
    } catch (error) {
        console.error('Inventory loading error:', error);
        showToast('خطأ', 'حدث خطأ أثناء تحميل المخزون', 'error');
    }
}

async function loadIncoming() {
    try {
        const response = await apiClient.getIncoming();
        
        if (response.success) {
            displayIncomingData(response.data);
            updateIncomingFilters(response.data);
        }
    } catch (error) {
        console.error('Incoming loading error:', error);
        showToast('خطأ', 'حدث خطأ أثناء تحميل الواردات', 'error');
    }
}

async function loadOutgoing() {
    try {
        const response = await apiClient.getOutgoing();
        
        if (response.success) {
            displayOutgoingData(response.data);
            updateOutgoingFilters(response.data);
        }
    } catch (error) {
        console.error('Outgoing loading error:', error);
        showToast('خطأ', 'حدث خطأ أثناء تحميل الصادرات', 'error');
    }
}

async function loadAlerts() {
    try {
        const response = await apiClient.getAlerts();
        
        if (response.success) {
            displayAlertsData(response.data);
        }
    } catch (error) {
        console.error('Alerts loading error:', error);
        showToast('خطأ', 'حدث خطأ أثناء تحميل التنبيهات', 'error');
    }
}

async function loadQuickAlerts() {
    try {
        const response = await apiClient.getAlerts();
        
        if (response.success) {
            const quickAlertsContainer = document.getElementById('quickAlerts');
            const recentAlerts = response.data.slice(0, 3);
            
            if (recentAlerts.length === 0) {
                quickAlertsContainer.innerHTML = '<p class="text-gray-300 text-center">لا توجد تنبيهات جديدة</p>';
                return;
            }
            
            quickAlertsContainer.innerHTML = recentAlerts.map(alert => `
                <div class="alert alert-${alert.priority === 'عالي' ? 'danger' : alert.priority === 'متوسط' ? 'warning' : 'info'} p-3 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="fas fa-${alert.type === 'مخزون منخفض' ? 'exclamation-triangle' : 'info-circle'} mr-3"></i>
                            <div>
                                <p class="text-white font-medium">${alert.type}</p>
                                <p class="text-gray-200 text-sm">${alert.message}</p>
                            </div>
                        </div>
                        <span class="text-xs text-gray-300">${formatDate(alert.date)}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Quick alerts loading error:', error);
    }
}

async function loadReports() {
    try {
        const response = await apiClient.getReports();
        
        if (response.success) {
            displayReportsData(response.data);
        }
        
        // تحميل الرسوم البيانية للتقارير
        loadReportCharts();
    } catch (error) {
        console.error('Reports loading error:', error);
        showToast('خطأ', 'حدث خطأ أثناء تحميل التقارير', 'error');
    }
}

async function loadUsers() {
    try {
        const response = await apiClient.getUsers();
        
        if (response.success) {
            displayUsersData(response.data);
        }
    } catch (error) {
        console.error('Users loading error:', error);
        showToast('خطأ', 'حدث خطأ أثناء تحميل المستخدمين', 'error');
    }
}

async function saveInventoryItem(formData) {
    const newItem = {
        type: formData.get('type'),
        size: formData.get('size'),
        brand: formData.get('brand'),
        quantity: parseInt(formData.get('quantity')),
        minLevel: parseInt(formData.get('minLevel')),
        location: formData.get('location'),
        notes: formData.get('notes'),
        updatedBy: currentUser ? currentUser.fullName : 'مجهول'
    };
    
    try {
        showLoading();
        
        let response;
        if (currentEditId) {
            // تحديث صنف موجود
            response = await apiClient.updateInventory(currentEditId, newItem);
            showToast('تم التحديث', 'تم تحديث الصنف بنجاح', 'success');
        } else {
            // إضافة صنف جديد
            response = await apiClient.addInventory(newItem);
            showToast('تم الإضافة', 'تم إضافة الصنف بنجاح', 'success');
        }
        
        // إعادة تحميل البيانات
        await loadInventory();
        
        // إغلاق النافذة
        document.getElementById('inventoryModal').classList.add('hidden');
        
    } catch (error) {
        showToast('خطأ', error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteItem(type, id) {
    // إظهار نافذة التأكيد
    document.getElementById('deleteMessage').textContent = 'هل أنت متأكد من أنك تريد حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.';
    document.getElementById('deleteModal').classList.remove('hidden');
    
    // حفظ معلومات العنصر المراد حذفه
    window.pendingDelete = { type, id };
}

async function confirmDelete() {
    if (!window.pendingDelete) return;
    
    const { type, id } = window.pendingDelete;
    
    try {
        showLoading();
        
        // حذف العنصر من الخادم
        switch(type) {
            case 'inventory':
                await apiClient.deleteInventory(id);
                await loadInventory();
                break;
            case 'incoming':
                await apiClient.deleteIncoming(id);
                await loadIncoming();
                break;
            case 'outgoing':
                await apiClient.deleteOutgoing(id);
                await loadOutgoing();
                break;
            case 'alerts':
                await apiClient.deleteAlert(id);
                await loadAlerts();
                break;
        }
        
        showToast('تم الحذف', 'تم حذف العنصر بنجاح', 'success');
        
    } catch (error) {
        showToast('خطأ', error.message, 'error');
    } finally {
        hideLoading();
        
        // إغلاق نافذة التأكيد
        document.getElementById('deleteModal').classList.add('hidden');
        window.pendingDelete = null;
    }
}

async function markAlertAsRead(id) {
    try {
        await apiClient.markAlertRead(id);
        await loadAlerts();
        await loadDashboard(); // لتحديث عدد التنبيهات
        showToast('تم التحديث', 'تم تحديد التنبيه كمقروء', 'success');
    } catch (error) {
        showToast('خطأ', error.message, 'error');
    }
}

async function deleteAlert(id) {
    try {
        await apiClient.deleteAlert(id);
        await loadAlerts();
        await loadDashboard(); // لتحديث عدد التنبيهات
        showToast('تم الحذف', 'تم حذف التنبيه بنجاح', 'success');
    } catch (error) {
        showToast('خطأ', error.message, 'error');
    }
}

async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;
    const format = document.getElementById('reportFormat').value;
    
    try {
        showLoading();
        
        const reportData = {
            type: reportType,
            dateFrom: dateFrom,
            dateTo: dateTo,
            format: format,
            createdBy: currentUser ? currentUser.fullName : 'مجهول'
        };
        
        const response = await apiClient.generateReport(reportData);
        
        if (response.success) {
            await loadReports();
            showToast('تم الإنشاء', `تم إنشاء ${reportType} بصيغة ${format}`, 'success');
        }
        
    } catch (error) {
        showToast('خطأ', error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function performGlobalSearch(searchTerm) {
    if (!searchTerm) {
        // إعادة تحميل البيانات الأصلية
        switch(currentPage) {
            case 'inventory':
                await loadInventory();
                break;
            case 'incoming':
                await loadIncoming();
                break;
            case 'outgoing':
                await loadOutgoing();
                break;
            case 'users':
                await loadUsers();
                break;
        }
        return;
    }
    
    try {
        const response = await apiClient.search(searchTerm, currentPage);
        
        if (response.success) {
            // عرض نتائج البحث حسب الصفحة
            switch(currentPage) {
                case 'inventory':
                    displayInventoryData(response.data.inventory || []);
                    break;
                case 'incoming':
                    displayIncomingData(response.data.incoming || []);
                    break;
                case 'outgoing':
                    displayOutgoingData(response.data.outgoing || []);
                    break;
            }
        }
    } catch (error) {
        console.error('Search error:', error);
        showToast('خطأ', 'حدث خطأ أثناء البحث', 'error');
    }
}

// وظائف عرض البيانات
function displayInventoryData(data) {
    const tableBody = document.getElementById('inventoryTableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-300">لا توجد بيانات</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(item => `
        <tr class="table-row text-gray-200">
            <td class="px-6 py-4">${item.type}</td>
            <td class="px-6 py-4">${item.size}</td>
            <td class="px-6 py-4">${item.brand}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-xs ${item.quantity <= item.minLevel ? 'bg-red-500' : 'bg-green-500'} text-white">
                    ${item.quantity}
                </span>
            </td>
            <td class="px-6 py-4">${item.minLevel}</td>
            <td class="px-6 py-4">${item.location}</td>
            <td class="px-6 py-4">${formatDate(item.lastUpdate)}</td>
            <td class="px-6 py-4">
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="editInventory(${item.id})" class="btn micro-btn bg-blue-500 text-white p-2 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteItem('inventory', ${item.id})" class="btn micro-btn bg-red-500 text-white p-2 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function displayIncomingData(data) {
    const tableBody = document.getElementById('incomingTableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-gray-300">لا توجد بيانات</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(item => `
        <tr class="table-row text-gray-200">
            <td class="px-6 py-4">${item.type}</td>
            <td class="px-6 py-4">${item.supplier}</td>
            <td class="px-6 py-4">${item.size}</td>
            <td class="px-6 py-4">${item.brand}</td>
            <td class="px-6 py-4">${item.quantity}</td>
            <td class="px-6 py-4">${formatCurrency(item.price, item.currency)}</td>
            <td class="px-6 py-4">${formatDate(item.date)}</td>
            <td class="px-6 py-4">${item.invoiceNumber}</td>
            <td class="px-6 py-4">
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="editIncoming(${item.id})" class="btn micro-btn bg-blue-500 text-white p-2 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteItem('incoming', ${item.id})" class="btn micro-btn bg-red-500 text-white p-2 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function displayOutgoingData(data) {
    const tableBody = document.getElementById('outgoingTableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-gray-300">لا توجد بيانات</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(item => `
        <tr class="table-row text-gray-200">
            <td class="px-6 py-4">${item.type}</td>
            <td class="px-6 py-4">${item.customer}</td>
            <td class="px-6 py-4">${item.size}</td>
            <td class="px-6 py-4">${item.brand}</td>
            <td class="px-6 py-4">${item.quantity}</td>
            <td class="px-6 py-4">${formatCurrency(item.price, item.currency)}</td>
            <td class="px-6 py-4">${formatDate(item.date)}</td>
            <td class="px-6 py-4">${item.invoiceNumber}</td>
            <td class="px-6 py-4">
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="editOutgoing(${item.id})" class="btn micro-btn bg-blue-500 text-white p-2 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteItem('outgoing', ${item.id})" class="btn micro-btn bg-red-500 text-white p-2 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function displayAlertsData(data) {
    const alertsList = document.getElementById('alertsList');
    
    if (data.length === 0) {
        alertsList.innerHTML = '<p class="text-gray-300 text-center">لا توجد تنبيهات</p>';
        return;
    }
    
    alertsList.innerHTML = data.map(alert => `
        <div class="glass-card p-4 ${alert.isRead ? 'opacity-75' : ''}" data-alert-id="${alert.id}">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full ${alert.priority === 'عالي' ? 'bg-red-500' : alert.priority === 'متوسط' ? 'bg-yellow-500' : 'bg-blue-500'} flex items-center justify-center mr-4">
                        <i class="fas fa-${alert.type === 'مخزون منخفض' ? 'exclamation-triangle' : 'info-circle'} text-white"></i>
                    </div>
                    <div>
                        <h4 class="text-white font-semibold">${alert.type}</h4>
                        <p class="text-gray-200 text-sm">${alert.message}</p>
                        <div class="flex items-center mt-2 text-xs text-gray-400">
                            <span class="mr-4">${formatDate(alert.date)}</span>
                            <span class="px-2 py-1 rounded-full ${alert.priority === 'عالي' ? 'bg-red-500' : alert.priority === 'متوسط' ? 'bg-yellow-500' : 'bg-blue-500'} text-white">
                                ${alert.priority}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2 space-x-reverse">
                    ${!alert.isRead ? `<button onclick="markAlertAsRead(${alert.id})" class="btn micro-btn bg-green-500 text-white p-2 rounded" title="تحديد كمقروء">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
                    <button onclick="deleteAlert(${alert.id})" class="btn micro-btn bg-red-500 text-white p-2 rounded" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function displayReportsData(data) {
    const tableBody = document.getElementById('reportsTableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-300">لا توجد تقارير</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(report => `
        <tr class="table-row text-gray-200">
            <td class="px-6 py-4">${report.type}</td>
            <td class="px-6 py-4">${formatDate(report.date)}</td>
            <td class="px-6 py-4">${report.operationsCount}</td>
            <td class="px-6 py-4">${formatCurrency(report.totalValue, 'SAR')}</td>
            <td class="px-6 py-4">${report.notes}</td>
            <td class="px-6 py-4">
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="downloadReport(${report.id})" class="btn micro-btn bg-green-500 text-white p-2 rounded">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="deleteItem('reports', ${report.id})" class="btn micro-btn bg-red-500 text-white p-2 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function displayUsersData(data) {
    const tableBody = document.getElementById('usersTableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-300">لا توجد مستخدمين</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.map(user => `
        <tr class="table-row text-gray-200">
            <td class="px-6 py-4">${user.fullName}</td>
            <td class="px-6 py-4">${user.username}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-xs ${user.role === 'مدير' ? 'bg-purple-500' : user.role === 'موظف' ? 'bg-blue-500' : 'bg-gray-500'} text-white">
                    ${user.role}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-xs ${user.status === 'نشط' ? 'bg-green-500' : 'bg-red-500'} text-white">
                    ${user.status}
                </span>
            </td>
            <td class="px-6 py-4">${user.email}</td>
            <td class="px-6 py-4">${formatDate(user.lastLogin)}</td>
            <td class="px-6 py-4">
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="editUser(${user.id})" class="btn micro-btn bg-blue-500 text-white p-2 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteItem('users', ${user.id})" class="btn micro-btn bg-red-500 text-white p-2 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateAlertBadge(count) {
    const alertBadge = document.getElementById('alertBadge');
    const notificationBadge = document.getElementById('notificationBadge');
    
    if (count > 0) {
        alertBadge.textContent = count;
        alertBadge.classList.remove('hidden');
        notificationBadge.textContent = count;
        notificationBadge.classList.remove('hidden');
    } else {
        alertBadge.classList.add('hidden');
        notificationBadge.classList.add('hidden');
    }
}

function updateInventoryFilters(data) {
    const typeFilter = document.getElementById('inventoryTypeFilter');
    const brandFilter = document.getElementById('inventoryBrandFilter');
    
    // الحصول على القيم الفريدة
    const types = [...new Set(data.map(item => item.type))];
    const brands = [...new Set(data.map(item => item.brand))];
    
    // تحديث فلتر النوع
    typeFilter.innerHTML = '<option value="">جميع الأنواع</option>' + 
        types.map(type => `<option value="${type}">${type}</option>`).join('');
    
    // تحديث فلتر الماركة
    brandFilter.innerHTML = '<option value="">جميع الماركات</option>' + 
        brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
}

function updateIncomingFilters(data) {
    const supplierFilter = document.getElementById('incomingSupplierFilter');
    
    // الحصول على القيم الفريدة
    const suppliers = [...new Set(data.map(item => item.supplier))];
    
    // تحديث فلتر المورد
    supplierFilter.innerHTML = '<option value="">جميع الموردين</option>' + 
        suppliers.map(supplier => `<option value="${supplier}">${supplier}</option>`).join('');
}

function updateOutgoingFilters(data) {
    const customerFilter = document.getElementById('outgoingCustomerFilter');
    
    // الحصول على القيم الفريدة
    const customers = [...new Set(data.map(item => item.customer))];
    
    // تحديث فلتر العميل
    customerFilter.innerHTML = '<option value="">جميع العملاء</option>' + 
        customers.map(customer => `<option value="${customer}">${customer}</option>`).join('');
}

