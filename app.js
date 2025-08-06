// تهيئة AOS
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
});

// متغيرات عامة
let currentUser = null;
let currentPage = 'dashboard';
let isDarkMode = false;
let sidebarCollapsed = false;
let currentEditId = null;
let currentEditType = null;

// رابط API لقاعدة البيانات السحابية
const API_BASE_URL = window.location.origin + '/api';

// بيانات وهمية للاختبار - متوافقة مع هيكل قاعدة البيانات المرفقة
let mockData = {
    users: [
        {
            id: 1,
            fullName: 'أحمد محمد',
            username: 'admin',
            password: 'admin123',
            role: 'مدير',
            status: 'نشط',
            email: 'admin@company.com',
            phone: '+966501234567',
            createdAt: '2024-01-01',
            lastLogin: '2024-08-06',
            permissions: 'جميع الصلاحيات',
            expiryDate: '2025-12-31',
            lastPasswordChange: '2024-06-01',
            failedLoginAttempts: 0
        }
    ],
    inventory: [
        {
            id: 1,
            type: 'أحذية رياضية',
            size: '42',
            brand: 'نايك',
            quantity: 25,
            minLevel: 10,
            location: 'المستودع A',
            notes: 'منتج جديد',
            lastUpdate: '2024-08-05',
            updatedBy: 'أحمد محمد'
        },
        {
            id: 2,
            type: 'قميص قطني',
            size: 'L',
            brand: 'أديداس',
            quantity: 5,
            minLevel: 15,
            location: 'المستودع B',
            notes: 'مخزون منخفض',
            lastUpdate: '2024-08-04',
            updatedBy: 'أحمد محمد'
        }
    ],
    incoming: [
        {
            id: 1,
            type: 'أحذية رياضية',
            supplier: 'شركة الرياضة المحدودة',
            size: '42',
            brand: 'نايك',
            quantity: 50,
            price: 150.00,
            date: '2024-08-01',
            currency: 'USD',
            exchangeRate: 3.75,
            paymentMethod: 'تحويل بنكي',
            invoiceNumber: 'INV-2024-001',
            notes: 'شحنة جديدة',
            recordedBy: 'أحمد محمد',
            recordDate: '2024-08-01'
        }
    ],
    outgoing: [
        {
            id: 1,
            type: 'أحذية رياضية',
            customer: 'متجر الرياضة الذهبي',
            size: '42',
            brand: 'نايك',
            quantity: 25,
            price: 200.00,
            date: '2024-08-03',
            currency: 'USD',
            exchangeRate: 3.75,
            paymentMethod: 'نقد',
            invoiceNumber: 'OUT-2024-001',
            notes: 'بيع بالجملة',
            recordedBy: 'أحمد محمد',
            recordDate: '2024-08-03'
        }
    ],
    alerts: [
        {
            id: 1,
            type: 'مخزون منخفض',
            message: 'قميص قطني - L - أديداس: الكمية المتبقية (5) أقل من الحد الأدنى (15)',
            date: '2024-08-06',
            status: 'جديد',
            priority: 'عالي',
            targetUser: 'جميع المستخدمين',
            isRead: false
        },
        {
            id: 2,
            type: 'تنبيه نظام',
            message: 'تم تسجيل دخول جديد من عنوان IP غير معروف',
            date: '2024-08-06',
            status: 'جديد',
            priority: 'متوسط',
            targetUser: 'المدير',
            isRead: false
        }
    ],
    reports: [
        {
            id: 1,
            type: 'تقرير المخزون',
            date: '2024-08-01',
            operationsCount: 25,
            totalValue: 12500.00,
            notes: 'تقرير شهري'
        }
    ],
    loginAttempts: [
        {
            id: 1,
            username: 'admin',
            date: '2024-08-06',
            status: 'نجح',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...'
        }
    ],
    backup: [
        {
            id: 1,
            backupDate: '2024-08-01',
            dataType: 'كامل',
            fileSize: '2.5 MB',
            status: 'مكتمل'
        }
    ]
};

// وظائف المساعدة
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');

    // تعيين الأيقونة واللون حسب النوع
    let iconClass = 'fas fa-check';
    let bgColor = 'bg-green-500';

    switch(type) {
        case 'error':
            iconClass = 'fas fa-times';
            bgColor = 'bg-red-500';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            bgColor = 'bg-yellow-500';
            break;
        case 'info':
            iconClass = 'fas fa-info';
            bgColor = 'bg-blue-500';
            break;
    }

    toastIcon.className = `w-8 h-8 rounded-full flex items-center justify-center mr-3 ${bgColor}`;
    toastIcon.innerHTML = `<i class="${iconClass} text-white"></i>`;
    toastTitle.textContent = title;
    toastMessage.textContent = message;

    // إظهار التنبيه
    toast.classList.remove('translate-x-full');
    toast.classList.add('translate-x-0');

    // إخفاء التنبيه تلقائياً بعد 5 ثوان
    setTimeout(() => {
        toast.classList.remove('translate-x-0');
        toast.classList.add('translate-x-full');
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// وظائف تسجيل الدخول
function login(username, password) {
    showLoading();
    
    // محاكاة استدعاء API
    setTimeout(() => {
        const user = mockData.users.find(u => u.username === username && u.password === password);
        
        if (user && user.status === 'نشط') {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // تحديث معلومات المستخدم في الواجهة
            document.getElementById('currentUser').textContent = user.fullName;
            document.getElementById('userRole').textContent = user.role;
            document.getElementById('userInitials').textContent = user.fullName.charAt(0);
            
            // إخفاء شاشة تسجيل الدخول وإظهار التطبيق
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            
            // تحميل لوحة التحكم
            loadDashboard();
            
            showToast('مرحباً', `أهلاً بك ${user.fullName}`, 'success');
        } else {
            showToast('خطأ', 'اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
        }
        
        hideLoading();
    }, 1000);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // إظهار شاشة تسجيل الدخول وإخفاء التطبيق
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    
    // إعادة تعيين النموذج
    document.getElementById('loginForm').reset();
    
    showToast('تم تسجيل الخروج', 'تم تسجيل خروجك بنجاح', 'info');
}

// وظائف التنقل
function showPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });
    
    // إظهار الصفحة المطلوبة
    document.getElementById(pageId + 'Page').classList.remove('hidden');
    
    // تحديث عنوان الصفحة
    const pageTitles = {
        'dashboard': 'لوحة التحكم',
        'inventory': 'إدارة المخزون',
        'incoming': 'إدارة الواردات',
        'outgoing': 'إدارة الصادرات',
        'reports': 'التقارير والإحصائيات',
        'users': 'إدارة المستخدمين',
        'alerts': 'إدارة التنبيهات',
        'settings': 'إعدادات النظام'
    };
    
    document.getElementById('pageTitle').textContent = pageTitles[pageId] || 'لوحة التحكم';
    
    // تحديث الشريط الجانبي
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
    
    currentPage = pageId;
    
    // تحميل بيانات الصفحة
    switch(pageId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'incoming':
            loadIncoming();
            break;
        case 'outgoing':
            loadOutgoing();
            break;
        case 'reports':
            loadReports();
            break;
        case 'users':
            loadUsers();
            break;
        case 'alerts':
            loadAlerts();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// وظائف تحميل البيانات
function loadDashboard() {
    // تحديث الإحصائيات
    document.getElementById('totalItems').textContent = mockData.inventory.length;
    document.getElementById('totalIncoming').textContent = mockData.incoming.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('totalOutgoing').textContent = mockData.outgoing.reduce((sum, item) => sum + item.quantity, 0);
    
    // حساب صافي الربح
    const totalIncomingValue = mockData.incoming.reduce((sum, item) => sum + (item.quantity * item.price * item.exchangeRate), 0);
    const totalOutgoingValue = mockData.outgoing.reduce((sum, item) => sum + (item.quantity * item.price * item.exchangeRate), 0);
    const profit = totalOutgoingValue - totalIncomingValue;
    document.getElementById('totalProfit').textContent = formatCurrency(profit, 'SAR');
    
    // تحميل الرسوم البيانية
    loadCharts();
    
    // تحميل التنبيهات السريعة
    loadQuickAlerts();
    
    // تحديث شارة التنبيهات
    updateAlertBadges();
}

function loadCharts() {
    // رسم بياني لحركة المخزون
    const inventoryCtx = document.getElementById('inventoryChart').getContext('2d');
    new Chart(inventoryCtx, {
        type: 'line',
        data: {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
            datasets: [{
                label: 'الواردات',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }, {
                label: 'الصادرات',
                data: [2, 3, 20, 5, 1, 4],
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

    // رسم بياني لتوزيع الأصناف
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['أحذية رياضية', 'ملابس', 'إكسسوارات'],
            datasets: [{
                data: [12, 19, 3],
                backgroundColor: [
                    'rgb(79, 70, 229)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

function loadQuickAlerts() {
    const quickAlertsContainer = document.getElementById('quickAlerts');
    const recentAlerts = mockData.alerts.slice(0, 3);
    
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

function updateAlertBadges() {
    const unreadAlerts = mockData.alerts.filter(alert => !alert.isRead).length;
    
    const alertBadge = document.getElementById('alertBadge');
    const notificationBadge = document.getElementById('notificationBadge');
    
    if (unreadAlerts > 0) {
        alertBadge.textContent = unreadAlerts;
        alertBadge.classList.remove('hidden');
        notificationBadge.textContent = unreadAlerts;
        notificationBadge.classList.remove('hidden');
    } else {
        alertBadge.classList.add('hidden');
        notificationBadge.classList.add('hidden');
    }
}

function loadInventory() {
    const tableBody = document.getElementById('inventoryTableBody');
    
    if (mockData.inventory.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-300">لا توجد بيانات</td></tr>';
        return;
    }
    
    tableBody.innerHTML = mockData.inventory.map(item => `
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
    
    // تحديث فلاتر البحث
    updateInventoryFilters();
}

function updateInventoryFilters() {
    const typeFilter = document.getElementById('inventoryTypeFilter');
    const brandFilter = document.getElementById('inventoryBrandFilter');
    
    // الحصول على القيم الفريدة
    const types = [...new Set(mockData.inventory.map(item => item.type))];
    const brands = [...new Set(mockData.inventory.map(item => item.brand))];
    
    // تحديث فلتر النوع
    typeFilter.innerHTML = '<option value="">جميع الأنواع</option>' + 
        types.map(type => `<option value="${type}">${type}</option>`).join('');
    
    // تحديث فلتر الماركة
    brandFilter.innerHTML = '<option value="">جميع الماركات</option>' + 
        brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
}

function loadIncoming() {
    const tableBody = document.getElementById('incomingTableBody');
    
    if (mockData.incoming.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-gray-300">لا توجد بيانات</td></tr>';
        return;
    }
    
    tableBody.innerHTML = mockData.incoming.map(item => `
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
    
    // تحديث فلاتر البحث
    updateIncomingFilters();
}

function updateIncomingFilters() {
    const supplierFilter = document.getElementById('incomingSupplierFilter');
    
    // الحصول على القيم الفريدة
    const suppliers = [...new Set(mockData.incoming.map(item => item.supplier))];
    
    // تحديث فلتر المورد
    supplierFilter.innerHTML = '<option value="">جميع الموردين</option>' + 
        suppliers.map(supplier => `<option value="${supplier}">${supplier}</option>`).join('');
}

function loadOutgoing() {
    const tableBody = document.getElementById('outgoingTableBody');
    
    if (mockData.outgoing.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-gray-300">لا توجد بيانات</td></tr>';
        return;
    }
    
    tableBody.innerHTML = mockData.outgoing.map(item => `
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
    
    // تحديث فلاتر البحث
    updateOutgoingFilters();
}

function updateOutgoingFilters() {
    const customerFilter = document.getElementById('outgoingCustomerFilter');
    
    // الحصول على القيم الفريدة
    const customers = [...new Set(mockData.outgoing.map(item => item.customer))];
    
    // تحديث فلتر العميل
    customerFilter.innerHTML = '<option value="">جميع العملاء</option>' + 
        customers.map(customer => `<option value="${customer}">${customer}</option>`).join('');
}

function loadReports() {
    const tableBody = document.getElementById('reportsTableBody');
    
    if (mockData.reports.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-300">لا توجد تقارير</td></tr>';
        return;
    }
    
    tableBody.innerHTML = mockData.reports.map(report => `
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
    
    // تحميل الرسوم البيانية للتقارير
    loadReportCharts();
}

function loadReportCharts() {
    // رسم بياني لتحليل المبيعات
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    new Chart(salesCtx, {
        type: 'bar',
        data: {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
            datasets: [{
                label: 'المبيعات',
                data: [12000, 19000, 3000, 5000, 2000, 3000],
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderColor: 'rgb(79, 70, 229)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

    // رسم بياني لأفضل المنتجات
    const topProductsCtx = document.getElementById('topProductsChart').getContext('2d');
    new Chart(topProductsCtx, {
        type: 'pie',
        data: {
            labels: ['أحذية رياضية', 'ملابس قطنية', 'إكسسوارات'],
            datasets: [{
                data: [45, 30, 25],
                backgroundColor: [
                    'rgb(79, 70, 229)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    
    if (mockData.users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-300">لا توجد مستخدمين</td></tr>';
        return;
    }
    
    tableBody.innerHTML = mockData.users.map(user => `
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

function loadAlerts() {
    const alertsList = document.getElementById('alertsList');
    
    if (mockData.alerts.length === 0) {
        alertsList.innerHTML = '<p class="text-gray-300 text-center">لا توجد تنبيهات</p>';
        return;
    }
    
    alertsList.innerHTML = mockData.alerts.map(alert => `
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

function loadSettings() {
    // تحميل الإعدادات المحفوظة من localStorage
    const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
    
    // تطبيق الإعدادات على النموذج
    if (settings.companyName) document.getElementById('companyName').value = settings.companyName;
    if (settings.defaultCurrency) document.getElementById('defaultCurrency').value = settings.defaultCurrency;
    if (settings.timezone) document.getElementById('timezone').value = settings.timezone;
    if (settings.minStockLevel) document.getElementById('minStockLevel').value = settings.minStockLevel;
    if (settings.sessionTimeout) document.getElementById('sessionTimeout').value = settings.sessionTimeout;
    
    // تطبيق إعدادات المفاتيح
    document.getElementById('emailNotifications').checked = settings.emailNotifications || false;
    document.getElementById('lowStockAlerts').checked = settings.lowStockAlerts !== false;
    document.getElementById('systemAlerts').checked = settings.systemAlerts !== false;
    document.getElementById('autoBackup').checked = settings.autoBackup !== false;
    document.getElementById('twoFactorAuth').checked = settings.twoFactorAuth || false;
    document.getElementById('logLoginAttempts').checked = settings.logLoginAttempts !== false;
    
    if (settings.backupFrequency) document.getElementById('backupFrequency').value = settings.backupFrequency;
}

// وظائف CRUD
function addInventoryItem() {
    // فتح نافذة إضافة صنف جديد
    currentEditId = null;
    currentEditType = 'inventory';
    document.getElementById('inventoryModalTitle').textContent = 'إضافة صنف جديد';
    document.getElementById('inventoryForm').reset();
    document.getElementById('inventoryModal').classList.remove('hidden');
}

function editInventory(id) {
    const item = mockData.inventory.find(i => i.id === id);
    if (!item) return;
    
    currentEditId = id;
    currentEditType = 'inventory';
    document.getElementById('inventoryModalTitle').textContent = 'تعديل الصنف';
    
    // ملء النموذج بالبيانات الحالية
    document.getElementById('inventoryType').value = item.type;
    document.getElementById('inventorySize').value = item.size;
    document.getElementById('inventoryBrand').value = item.brand;
    document.getElementById('inventoryQuantity').value = item.quantity;
    document.getElementById('inventoryMinLevel').value = item.minLevel;
    document.getElementById('inventoryLocation').value = item.location;
    document.getElementById('inventoryNotes').value = item.notes;
    
    document.getElementById('inventoryModal').classList.remove('hidden');
}

function saveInventoryItem(formData) {
    const newItem = {
        type: formData.get('type'),
        size: formData.get('size'),
        brand: formData.get('brand'),
        quantity: parseInt(formData.get('quantity')),
        minLevel: parseInt(formData.get('minLevel')),
        location: formData.get('location'),
        notes: formData.get('notes'),
        lastUpdate: new Date().toISOString().split('T')[0],
        updatedBy: currentUser.fullName
    };
    
    if (currentEditId) {
        // تحديث صنف موجود
        const index = mockData.inventory.findIndex(i => i.id === currentEditId);
        if (index !== -1) {
            mockData.inventory[index] = { ...mockData.inventory[index], ...newItem };
            showToast('تم التحديث', 'تم تحديث الصنف بنجاح', 'success');
        }
    } else {
        // إضافة صنف جديد
        newItem.id = Math.max(...mockData.inventory.map(i => i.id), 0) + 1;
        mockData.inventory.push(newItem);
        showToast('تم الإضافة', 'تم إضافة الصنف بنجاح', 'success');
    }
    
    // إعادة تحميل البيانات
    loadInventory();
    
    // إغلاق النافذة
    document.getElementById('inventoryModal').classList.add('hidden');
}

function deleteItem(type, id) {
    // إظهار نافذة التأكيد
    document.getElementById('deleteMessage').textContent = 'هل أنت متأكد من أنك تريد حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.';
    document.getElementById('deleteModal').classList.remove('hidden');
    
    // حفظ معلومات العنصر المراد حذفه
    window.pendingDelete = { type, id };
}

function confirmDelete() {
    if (!window.pendingDelete) return;
    
    const { type, id } = window.pendingDelete;
    
    // حذف العنصر من البيانات
    const index = mockData[type].findIndex(item => item.id === id);
    if (index !== -1) {
        mockData[type].splice(index, 1);
        showToast('تم الحذف', 'تم حذف العنصر بنجاح', 'success');
        
        // إعادة تحميل البيانات
        switch(type) {
            case 'inventory':
                loadInventory();
                break;
            case 'incoming':
                loadIncoming();
                break;
            case 'outgoing':
                loadOutgoing();
                break;
            case 'users':
                loadUsers();
                break;
            case 'reports':
                loadReports();
                break;
        }
    }
    
    // إغلاق نافذة التأكيد
    document.getElementById('deleteModal').classList.add('hidden');
    window.pendingDelete = null;
}

function markAlertAsRead(id) {
    const alert = mockData.alerts.find(a => a.id === id);
    if (alert) {
        alert.isRead = true;
        loadAlerts();
        updateAlertBadges();
        showToast('تم التحديث', 'تم تحديد التنبيه كمقروء', 'success');
    }
}

function deleteAlert(id) {
    const index = mockData.alerts.findIndex(a => a.id === id);
    if (index !== -1) {
        mockData.alerts.splice(index, 1);
        loadAlerts();
        updateAlertBadges();
        showToast('تم الحذف', 'تم حذف التنبيه بنجاح', 'success');
    }
}

function markAllAlertsAsRead() {
    mockData.alerts.forEach(alert => alert.isRead = true);
    loadAlerts();
    updateAlertBadges();
    showToast('تم التحديث', 'تم تحديد جميع التنبيهات كمقروءة', 'success');
}

function clearAllAlerts() {
    mockData.alerts = [];
    loadAlerts();
    updateAlertBadges();
    showToast('تم المسح', 'تم مسح جميع التنبيهات', 'success');
}

function saveSettings() {
    const settings = {
        companyName: document.getElementById('companyName').value,
        defaultCurrency: document.getElementById('defaultCurrency').value,
        timezone: document.getElementById('timezone').value,
        minStockLevel: document.getElementById('minStockLevel').value,
        sessionTimeout: document.getElementById('sessionTimeout').value,
        emailNotifications: document.getElementById('emailNotifications').checked,
        lowStockAlerts: document.getElementById('lowStockAlerts').checked,
        systemAlerts: document.getElementById('systemAlerts').checked,
        autoBackup: document.getElementById('autoBackup').checked,
        twoFactorAuth: document.getElementById('twoFactorAuth').checked,
        logLoginAttempts: document.getElementById('logLoginAttempts').checked,
        backupFrequency: document.getElementById('backupFrequency').value
    };
    
    localStorage.setItem('appSettings', JSON.stringify(settings));
    showToast('تم الحفظ', 'تم حفظ الإعدادات بنجاح', 'success');
}

function resetSettings() {
    localStorage.removeItem('appSettings');
    loadSettings();
    showToast('تم الإعادة', 'تم إعادة تعيين الإعدادات', 'info');
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;
    const format = document.getElementById('reportFormat').value;
    
    showLoading();
    
    // محاكاة إنشاء التقرير
    setTimeout(() => {
        const newReport = {
            id: Math.max(...mockData.reports.map(r => r.id), 0) + 1,
            type: reportType,
            date: new Date().toISOString().split('T')[0],
            operationsCount: Math.floor(Math.random() * 100) + 1,
            totalValue: Math.floor(Math.random() * 50000) + 1000,
            notes: `تقرير ${reportType} من ${dateFrom} إلى ${dateTo}`
        };
        
        mockData.reports.push(newReport);
        loadReports();
        hideLoading();
        showToast('تم الإنشاء', `تم إنشاء ${reportType} بصيغة ${format}`, 'success');
    }, 2000);
}

function downloadReport(id) {
    const report = mockData.reports.find(r => r.id === id);
    if (!report) return;
    
    showLoading();
    
    // محاكاة تحميل التقرير
    setTimeout(() => {
        hideLoading();
        showToast('تم التحميل', `تم تحميل ${report.type}`, 'success');
    }, 1000);
}

function exportToExcel(data, filename) {
    // محاكاة تصدير إلى Excel
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        showToast('تم التصدير', `تم تصدير البيانات إلى ${filename}.xlsx`, 'success');
    }, 1000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const hamburger = document.querySelector('.hamburger');
    const sidebarTexts = document.querySelectorAll('.sidebar-text');
    
    sidebarCollapsed = !sidebarCollapsed;
    
    if (sidebarCollapsed) {
        sidebar.classList.remove('sidebar-expanded');
        sidebar.classList.add('sidebar-collapsed');
        mainContent.classList.remove('mr-80');
        mainContent.classList.add('mr-20');
        hamburger.classList.add('hamburger-active');
        sidebarTexts.forEach(text => text.classList.add('hidden'));
    } else {
        sidebar.classList.remove('sidebar-collapsed');
        sidebar.classList.add('sidebar-expanded');
        mainContent.classList.remove('mr-20');
        mainContent.classList.add('mr-80');
        hamburger.classList.remove('hamburger-active');
        sidebarTexts.forEach(text => text.classList.remove('hidden'));
    }
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    const body = document.body;
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (isDarkMode) {
        body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        body.classList.remove('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    localStorage.setItem('darkMode', isDarkMode);
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('hidden');
    
    if (!dropdown.classList.contains('hidden')) {
        loadNotificationList();
    }
}

function loadNotificationList() {
    const notificationList = document.getElementById('notificationList');
    const recentAlerts = mockData.alerts.slice(0, 5);
    
    if (recentAlerts.length === 0) {
        notificationList.innerHTML = '<p class="text-gray-300 text-center py-4">لا توجد تنبيهات جديدة</p>';
        return;
    }
    
    notificationList.innerHTML = recentAlerts.map(alert => `
        <div class="p-3 rounded-lg ${alert.isRead ? 'bg-gray-700' : 'bg-gray-600'} mb-2">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-white text-sm font-medium">${alert.type}</p>
                    <p class="text-gray-300 text-xs">${alert.message.substring(0, 50)}...</p>
                </div>
                <span class="text-xs text-gray-400">${formatDate(alert.date)}</span>
            </div>
        </div>
    `).join('');
}

// مستمعي الأحداث
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود مستخدم مسجل دخوله
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        // تحديث معلومات المستخدم
        document.getElementById('currentUser').textContent = currentUser.fullName;
        document.getElementById('userRole').textContent = currentUser.role;
        document.getElementById('userInitials').textContent = currentUser.fullName.charAt(0);
        
        loadDashboard();
    }
    
    // التحقق من الوضع الليلي المحفوظ
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        toggleDarkMode();
    }
    
    // نموذج تسجيل الدخول
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });
    
    // أزرار التنقل
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // أزرار الشريط الجانبي
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // أزرار الشريط العلوي
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('notificationBtn').addEventListener('click', toggleNotificationDropdown);
    
    // أزرار الإضافة
    document.getElementById('addInventoryBtn').addEventListener('click', addInventoryItem);
    
    // نماذج الحفظ
    document.getElementById('inventoryForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        saveInventoryItem(formData);
    });
    
    // أزرار إغلاق النوافذ المنبثقة
    document.getElementById('closeInventoryModal').addEventListener('click', function() {
        document.getElementById('inventoryModal').classList.add('hidden');
    });
    
    document.getElementById('cancelInventoryBtn').addEventListener('click', function() {
        document.getElementById('inventoryModal').classList.add('hidden');
    });
    
    // نافذة تأكيد الحذف
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
        document.getElementById('deleteModal').classList.add('hidden');
        window.pendingDelete = null;
    });
    
    // أزرار التنبيهات
    document.getElementById('markAllReadBtn').addEventListener('click', markAllAlertsAsRead);
    document.getElementById('clearAlertsBtn').addEventListener('click', clearAllAlerts);
    
    // أزرار الإعدادات
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('resetSettingsBtn').addEventListener('click', resetSettings);
    
    // أزرار التقارير
    document.getElementById('generateReportBtn').addEventListener('click', generateReport);
    
    // إغلاق التنبيه Toast
    document.getElementById('closeToast').addEventListener('click', function() {
        const toast = document.getElementById('toast');
        toast.classList.remove('translate-x-0');
        toast.classList.add('translate-x-full');
    });
    
    // إغلاق القوائم المنسدلة عند النقر خارجها
    document.addEventListener('click', function(e) {
        const notificationDropdown = document.getElementById('notificationDropdown');
        const notificationBtn = document.getElementById('notificationBtn');
        
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.classList.add('hidden');
        }
    });
    
    // البحث العام
    document.getElementById('globalSearch').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        // تنفيذ البحث حسب الصفحة الحالية
        performGlobalSearch(searchTerm);
    });
});

function performGlobalSearch(searchTerm) {
    if (!searchTerm) {
        // إعادة تحميل البيانات الأصلية
        switch(currentPage) {
            case 'inventory':
                loadInventory();
                break;
            case 'incoming':
                loadIncoming();
                break;
            case 'outgoing':
                loadOutgoing();
                break;
            case 'users':
                loadUsers();
                break;
        }
        return;
    }
    
    // تنفيذ البحث حسب الصفحة
    switch(currentPage) {
        case 'inventory':
            searchInventory(searchTerm);
            break;
        case 'incoming':
            searchIncoming(searchTerm);
            break;
        case 'outgoing':
            searchOutgoing(searchTerm);
            break;
        case 'users':
            searchUsers(searchTerm);
            break;
    }
}

function searchInventory(searchTerm) {
    const filteredData = mockData.inventory.filter(item => 
        item.type.toLowerCase().includes(searchTerm) ||
        item.brand.toLowerCase().includes(searchTerm) ||
        item.size.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm)
    );
    
    displayInventoryResults(filteredData);
}

function searchIncoming(searchTerm) {
    const filteredData = mockData.incoming.filter(item => 
        item.type.toLowerCase().includes(searchTerm) ||
        item.supplier.toLowerCase().includes(searchTerm) ||
        item.brand.toLowerCase().includes(searchTerm) ||
        item.invoiceNumber.toLowerCase().includes(searchTerm)
    );
    
    displayIncomingResults(filteredData);
}

function searchOutgoing(searchTerm) {
    const filteredData = mockData.outgoing.filter(item => 
        item.type.toLowerCase().includes(searchTerm) ||
        item.customer.toLowerCase().includes(searchTerm) ||
        item.brand.toLowerCase().includes(searchTerm) ||
        item.invoiceNumber.toLowerCase().includes(searchTerm)
    );
    
    displayOutgoingResults(filteredData);
}

function searchUsers(searchTerm) {
    const filteredData = mockData.users.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm)
    );
    
    displayUsersResults(filteredData);
}

function displayInventoryResults(data) {
    const tableBody = document.getElementById('inventoryTableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-300">لا توجد نتائج</td></tr>';
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

function displayIncomingResults(data) {
    const tableBody = document.getElementById('incomingTableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-gray-300">لا توجد نتائج</td></tr>';
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

function displayOutgoingResults(data) {
    const tableBody = document.getElementById('outgoingTableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-gray-300">لا توجد نتائج</td></tr>';
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

function displayUsersResults(data) {
    const tableBody = document.getElementById('usersTableBody');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-300">لا توجد نتائج</td></tr>';
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

