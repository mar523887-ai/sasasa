from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from datetime import datetime
import hashlib

app = Flask(__name__)
CORS(app)  # تمكين CORS لجميع المصادر

# إعدادات قاعدة البيانات
SPREADSHEET_ID = '1zIe1SIQSG0SjTHzvcSDTLBNkjPfqo-11KEQ4syrKVuk'
SHEETS_API_KEY = 'YOUR_API_KEY_HERE'  # يجب الحصول عليه من Google Cloud Console

# أسماء الأوراق في Google Sheets
SHEETS = {
    'inventory': 'المخزون',
    'incoming': 'الواردات', 
    'outgoing': 'الصادرات',
    'users': 'المستخدمين',
    'alerts': 'التنبيهات',
    'reports': 'التقارير',
    'login_attempts': 'محاولات الدخول',
    'backup': 'النسخ الاحتياطي',
    'log': 'السجل'
}

# بيانات وهمية للاختبار (نفس البيانات من JavaScript)
mock_data = {
    'users': [
        {
            'id': 1,
            'fullName': 'أحمد محمد',
            'username': 'admin',
            'password': 'admin123',
            'role': 'مدير',
            'status': 'نشط',
            'email': 'admin@company.com',
            'phone': '+966501234567',
            'createdAt': '2024-01-01',
            'lastLogin': '2024-08-06',
            'permissions': 'جميع الصلاحيات',
            'expiryDate': '2025-12-31',
            'lastPasswordChange': '2024-06-01',
            'failedLoginAttempts': 0
        }
    ],
    'inventory': [
        {
            'id': 1,
            'type': 'أحذية رياضية',
            'size': '42',
            'brand': 'نايك',
            'quantity': 25,
            'minLevel': 10,
            'location': 'المستودع A',
            'notes': 'منتج جديد',
            'lastUpdate': '2024-08-05',
            'updatedBy': 'أحمد محمد'
        },
        {
            'id': 2,
            'type': 'قميص قطني',
            'size': 'L',
            'brand': 'أديداس',
            'quantity': 5,
            'minLevel': 15,
            'location': 'المستودع B',
            'notes': 'مخزون منخفض',
            'lastUpdate': '2024-08-04',
            'updatedBy': 'أحمد محمد'
        }
    ],
    'incoming': [
        {
            'id': 1,
            'type': 'أحذية رياضية',
            'supplier': 'شركة الرياضة المحدودة',
            'size': '42',
            'brand': 'نايك',
            'quantity': 50,
            'price': 150.00,
            'date': '2024-08-01',
            'currency': 'SYP',
            'exchangeRate': 1.0,
            'paymentMethod': 'تحويل بنكي',
            'invoiceNumber': 'INV-2024-001',
            'notes': 'شحنة جديدة',
            'recordedBy': 'أحمد محمد',
            'recordDate': '2024-08-01'
        }
    ],
    'outgoing': [
        {
            'id': 1,
            'type': 'أحذية رياضية',
            'customer': 'متجر الرياضة الذهبي',
            'size': '42',
            'brand': 'نايك',
            'quantity': 25,
            'price': 200.00,
            'date': '2024-08-03',
            'currency': 'TRY',
            'exchangeRate': 1.0,
            'paymentMethod': 'نقد',
            'invoiceNumber': 'OUT-2024-001',
            'notes': 'بيع بالجملة',
            'recordedBy': 'أحمد محمد',
            'recordDate': '2024-08-03'
        }
    ],
    'alerts': [
        {
            'id': 1,
            'type': 'مخزون منخفض',
            'message': 'قميص قطني - L - أديداس: الكمية المتبقية (5) أقل من الحد الأدنى (15)',
            'date': '2024-08-06',
            'status': 'جديد',
            'priority': 'عالي',
            'targetUser': 'جميع المستخدمين',
            'isRead': False
        },
        {
            'id': 2,
            'type': 'تنبيه نظام',
            'message': 'تم تسجيل دخول جديد من عنوان IP غير معروف',
            'date': '2024-08-06',
            'status': 'جديد',
            'priority': 'متوسط',
            'targetUser': 'المدير',
            'isRead': False
        }
    ],
    'reports': [
        {
            'id': 1,
            'type': 'تقرير المخزون',
            'date': '2024-08-01',
            'operationsCount': 25,
            'totalValue': 12500.00,
            'notes': 'تقرير شهري'
        }
    ]
}

# وظائف مساعدة
def get_next_id(data_type):
    """الحصول على المعرف التالي للعنصر الجديد"""
    if data_type not in mock_data or not mock_data[data_type]:
        return 1
    return max(item['id'] for item in mock_data[data_type]) + 1

def hash_password(password):
    """تشفير كلمة المرور"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    """التحقق من كلمة المرور"""
    return hash_password(password) == hashed

def log_activity(user, action, details):
    """تسجيل النشاط في السجل"""
    log_entry = {
        'id': get_next_id('log'),
        'user': user,
        'action': action,
        'details': details,
        'timestamp': datetime.now().isoformat(),
        'ip': request.remote_addr
    }
    # في التطبيق الحقيقي، سيتم حفظ هذا في Google Sheets
    print(f"LOG: {log_entry}")

def check_low_stock():
    """فحص المخزون المنخفض وإنشاء تنبيهات"""
    alerts = []
    for item in mock_data['inventory']:
        if item['quantity'] <= item['minLevel']:
            alert = {
                'id': get_next_id('alerts'),
                'type': 'مخزون منخفض',
                'message': f"{item['type']} - {item['size']} - {item['brand']}: الكمية المتبقية ({item['quantity']}) أقل من الحد الأدنى ({item['minLevel']})",
                'date': datetime.now().strftime('%Y-%m-%d'),
                'status': 'جديد',
                'priority': 'عالي',
                'targetUser': 'جميع المستخدمين',
                'isRead': False
            }
            alerts.append(alert)
    return alerts

# Routes للمصادقة
@app.route('/api/login', methods=['POST'])
def login():
    """تسجيل الدخول"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'اسم المستخدم وكلمة المرور مطلوبان'}), 400
    
    # البحث عن المستخدم
    user = next((u for u in mock_data['users'] if u['username'] == username), None)
    
    if not user or user['password'] != password:  # في التطبيق الحقيقي، استخدم hash
        log_activity(username, 'فشل تسجيل الدخول', 'اسم مستخدم أو كلمة مرور خاطئة')
        return jsonify({'success': False, 'message': 'اسم المستخدم أو كلمة المرور غير صحيحة'}), 401
    
    if user['status'] != 'نشط':
        return jsonify({'success': False, 'message': 'الحساب غير نشط'}), 401
    
    # تحديث آخر تسجيل دخول
    user['lastLogin'] = datetime.now().strftime('%Y-%m-%d')
    
    log_activity(username, 'تسجيل دخول ناجح', 'تم تسجيل الدخول بنجاح')
    
    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'fullName': user['fullName'],
            'username': user['username'],
            'role': user['role'],
            'email': user['email'],
            'permissions': user['permissions']
        }
    })

@app.route('/api/logout', methods=['POST'])
def logout():
    """تسجيل الخروج"""
    data = request.get_json()
    username = data.get('username', 'مجهول')
    
    log_activity(username, 'تسجيل خروج', 'تم تسجيل الخروج')
    
    return jsonify({'success': True, 'message': 'تم تسجيل الخروج بنجاح'})

# Routes للمخزون
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    """الحصول على جميع عناصر المخزون"""
    return jsonify({'success': True, 'data': mock_data['inventory']})

@app.route('/api/inventory', methods=['POST'])
def add_inventory():
    """إضافة عنصر جديد للمخزون"""
    data = request.get_json()
    
    # التحقق من البيانات المطلوبة
    required_fields = ['type', 'size', 'brand', 'quantity', 'minLevel', 'location']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'الحقل {field} مطلوب'}), 400
    
    new_item = {
        'id': get_next_id('inventory'),
        'type': data['type'],
        'size': data['size'],
        'brand': data['brand'],
        'quantity': int(data['quantity']),
        'minLevel': int(data['minLevel']),
        'location': data['location'],
        'notes': data.get('notes', ''),
        'lastUpdate': datetime.now().strftime('%Y-%m-%d'),
        'updatedBy': data.get('updatedBy', 'مجهول')
    }
    
    mock_data['inventory'].append(new_item)
    
    log_activity(data.get('updatedBy', 'مجهول'), 'إضافة صنف', f"تم إضافة {new_item['type']} - {new_item['brand']}")
    
    # فحص المخزون المنخفض
    low_stock_alerts = check_low_stock()
    if low_stock_alerts:
        mock_data['alerts'].extend(low_stock_alerts)
    
    return jsonify({'success': True, 'data': new_item})

@app.route('/api/inventory/<int:item_id>', methods=['PUT'])
def update_inventory(item_id):
    """تحديث عنصر في المخزون"""
    data = request.get_json()
    
    # البحث عن العنصر
    item = next((i for i in mock_data['inventory'] if i['id'] == item_id), None)
    if not item:
        return jsonify({'success': False, 'message': 'العنصر غير موجود'}), 404
    
    # تحديث البيانات
    updatable_fields = ['type', 'size', 'brand', 'quantity', 'minLevel', 'location', 'notes']
    for field in updatable_fields:
        if field in data:
            if field in ['quantity', 'minLevel']:
                item[field] = int(data[field])
            else:
                item[field] = data[field]
    
    item['lastUpdate'] = datetime.now().strftime('%Y-%m-%d')
    item['updatedBy'] = data.get('updatedBy', 'مجهول')
    
    log_activity(data.get('updatedBy', 'مجهول'), 'تحديث صنف', f"تم تحديث {item['type']} - {item['brand']}")
    
    # فحص المخزون المنخفض
    low_stock_alerts = check_low_stock()
    if low_stock_alerts:
        mock_data['alerts'].extend(low_stock_alerts)
    
    return jsonify({'success': True, 'data': item})

@app.route('/api/inventory/<int:item_id>', methods=['DELETE'])
def delete_inventory(item_id):
    """حذف عنصر من المخزون"""
    item = next((i for i in mock_data['inventory'] if i['id'] == item_id), None)
    if not item:
        return jsonify({'success': False, 'message': 'العنصر غير موجود'}), 404
    
    mock_data['inventory'].remove(item)
    
    log_activity('مجهول', 'حذف صنف', f"تم حذف {item['type']} - {item['brand']}")
    
    return jsonify({'success': True, 'message': 'تم حذف العنصر بنجاح'})

# Routes للواردات
@app.route('/api/incoming', methods=['GET'])
def get_incoming():
    """الحصول على جميع الواردات"""
    return jsonify({'success': True, 'data': mock_data['incoming']})

@app.route('/api/incoming', methods=['POST'])
def add_incoming():
    """إضافة وارد جديد"""
    data = request.get_json()
    
    required_fields = ['type', 'supplier', 'size', 'brand', 'quantity', 'price', 'date', 'invoiceNumber']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'الحقل {field} مطلوب'}), 400
    
    new_incoming = {
        'id': get_next_id('incoming'),
        'type': data['type'],
        'supplier': data['supplier'],
        'size': data['size'],
        'brand': data['brand'],
        'quantity': int(data['quantity']),
        'price': float(data['price']),
        'date': data['date'],
        'currency': data.get('currency', 'SYP'),
        'exchangeRate': float(data.get('exchangeRate', 1.0)),
        'paymentMethod': data.get('paymentMethod', 'نقد'),
        'invoiceNumber': data['invoiceNumber'],
        'notes': data.get('notes', ''),
        'recordedBy': data.get('recordedBy', 'مجهول'),
        'recordDate': datetime.now().strftime('%Y-%m-%d')
    }
    
    mock_data['incoming'].append(new_incoming)
    
    # تحديث المخزون
    inventory_item = next((i for i in mock_data['inventory'] 
                          if i['type'] == new_incoming['type'] 
                          and i['size'] == new_incoming['size'] 
                          and i['brand'] == new_incoming['brand']), None)
    
    if inventory_item:
        inventory_item['quantity'] += new_incoming['quantity']
        inventory_item['lastUpdate'] = datetime.now().strftime('%Y-%m-%d')
        inventory_item['updatedBy'] = new_incoming['recordedBy']
    else:
        # إنشاء عنصر جديد في المخزون
        new_inventory_item = {
            'id': get_next_id('inventory'),
            'type': new_incoming['type'],
            'size': new_incoming['size'],
            'brand': new_incoming['brand'],
            'quantity': new_incoming['quantity'],
            'minLevel': 10,  # قيمة افتراضية
            'location': 'المستودع الرئيسي',
            'notes': f"تم إنشاؤه تلقائياً من الوارد {new_incoming['invoiceNumber']}",
            'lastUpdate': datetime.now().strftime('%Y-%m-%d'),
            'updatedBy': new_incoming['recordedBy']
        }
        mock_data['inventory'].append(new_inventory_item)
    
    log_activity(new_incoming['recordedBy'], 'إضافة وارد', f"وارد جديد: {new_incoming['invoiceNumber']}")
    
    return jsonify({'success': True, 'data': new_incoming})

# Routes للصادرات
@app.route('/api/outgoing', methods=['GET'])
def get_outgoing():
    """الحصول على جميع الصادرات"""
    return jsonify({'success': True, 'data': mock_data['outgoing']})

@app.route('/api/outgoing', methods=['POST'])
def add_outgoing():
    """إضافة صادر جديد"""
    data = request.get_json()
    
    required_fields = ['type', 'customer', 'size', 'brand', 'quantity', 'price', 'date', 'invoiceNumber']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'الحقل {field} مطلوب'}), 400
    
    # التحقق من توفر الكمية في المخزون
    inventory_item = next((i for i in mock_data['inventory'] 
                          if i['type'] == data['type'] 
                          and i['size'] == data['size'] 
                          and i['brand'] == data['brand']), None)
    
    if not inventory_item:
        return jsonify({'success': False, 'message': 'العنصر غير موجود في المخزون'}), 400
    
    if inventory_item['quantity'] < int(data['quantity']):
        return jsonify({'success': False, 'message': f'الكمية المطلوبة ({data["quantity"]}) أكبر من المتوفر ({inventory_item["quantity"]})'}), 400
    
    new_outgoing = {
        'id': get_next_id('outgoing'),
        'type': data['type'],
        'customer': data['customer'],
        'size': data['size'],
        'brand': data['brand'],
        'quantity': int(data['quantity']),
        'price': float(data['price']),
        'date': data['date'],
        'currency': data.get('currency', 'SYP'),
        'exchangeRate': float(data.get('exchangeRate', 1.0)),
        'paymentMethod': data.get('paymentMethod', 'نقد'),
        'invoiceNumber': data['invoiceNumber'],
        'notes': data.get('notes', ''),
        'recordedBy': data.get('recordedBy', 'مجهول'),
        'recordDate': datetime.now().strftime('%Y-%m-%d')
    }
    
    mock_data['outgoing'].append(new_outgoing)
    
    # تحديث المخزون
    inventory_item['quantity'] -= new_outgoing['quantity']
    inventory_item['lastUpdate'] = datetime.now().strftime('%Y-%m-%d')
    inventory_item['updatedBy'] = new_outgoing['recordedBy']
    
    log_activity(new_outgoing['recordedBy'], 'إضافة صادر', f"صادر جديد: {new_outgoing['invoiceNumber']}")
    
    # فحص المخزون المنخفض
    low_stock_alerts = check_low_stock()
    if low_stock_alerts:
        mock_data['alerts'].extend(low_stock_alerts)
    
    return jsonify({'success': True, 'data': new_outgoing})

# Routes للتنبيهات
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """الحصول على جميع التنبيهات"""
    return jsonify({'success': True, 'data': mock_data['alerts']})

@app.route('/api/alerts/<int:alert_id>/read', methods=['PUT'])
def mark_alert_read(alert_id):
    """تحديد التنبيه كمقروء"""
    alert = next((a for a in mock_data['alerts'] if a['id'] == alert_id), None)
    if not alert:
        return jsonify({'success': False, 'message': 'التنبيه غير موجود'}), 404
    
    alert['isRead'] = True
    alert['status'] = 'مقروء'
    
    return jsonify({'success': True, 'data': alert})

@app.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    """حذف تنبيه"""
    alert = next((a for a in mock_data['alerts'] if a['id'] == alert_id), None)
    if not alert:
        return jsonify({'success': False, 'message': 'التنبيه غير موجود'}), 404
    
    mock_data['alerts'].remove(alert)
    
    return jsonify({'success': True, 'message': 'تم حذف التنبيه بنجاح'})

# Routes للتقارير
@app.route('/api/reports', methods=['GET'])
def get_reports():
    """الحصول على جميع التقارير"""
    return jsonify({'success': True, 'data': mock_data['reports']})

@app.route('/api/reports/generate', methods=['POST'])
def generate_report():
    """إنشاء تقرير جديد"""
    data = request.get_json()
    
    report_type = data.get('type', 'تقرير عام')
    date_from = data.get('dateFrom')
    date_to = data.get('dateTo')
    
    # حساب الإحصائيات حسب نوع التقرير
    if report_type == 'تقرير المخزون':
        operations_count = len(mock_data['inventory'])
        total_value = sum(item['quantity'] * 100 for item in mock_data['inventory'])  # قيمة تقديرية
    elif report_type == 'تقرير الواردات':
        operations_count = len(mock_data['incoming'])
        total_value = sum(item['quantity'] * item['price'] * item['exchangeRate'] for item in mock_data['incoming'])
    elif report_type == 'تقرير الصادرات':
        operations_count = len(mock_data['outgoing'])
        total_value = sum(item['quantity'] * item['price'] * item['exchangeRate'] for item in mock_data['outgoing'])
    else:
        operations_count = 0
        total_value = 0
    
    new_report = {
        'id': get_next_id('reports'),
        'type': report_type,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'operationsCount': operations_count,
        'totalValue': total_value,
        'notes': f"تقرير من {date_from} إلى {date_to}" if date_from and date_to else 'تقرير عام',
        'createdBy': data.get('createdBy', 'مجهول')
    }
    
    mock_data['reports'].append(new_report)
    
    log_activity(data.get('createdBy', 'مجهول'), 'إنشاء تقرير', f"تم إنشاء {report_type}")
    
    return jsonify({'success': True, 'data': new_report})

# Routes للمستخدمين
@app.route('/api/users', methods=['GET'])
def get_users():
    """الحصول على جميع المستخدمين"""
    # إخفاء كلمات المرور
    users_safe = []
    for user in mock_data['users']:
        user_safe = user.copy()
        user_safe.pop('password', None)
        users_safe.append(user_safe)
    
    return jsonify({'success': True, 'data': users_safe})

# Routes للإحصائيات
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """الحصول على إحصائيات لوحة التحكم"""
    total_items = len(mock_data['inventory'])
    total_incoming = sum(item['quantity'] for item in mock_data['incoming'])
    total_outgoing = sum(item['quantity'] for item in mock_data['outgoing'])
    
    # حساب صافي الربح
    total_incoming_value = sum(item['quantity'] * item['price'] * item['exchangeRate'] for item in mock_data['incoming'])
    total_outgoing_value = sum(item['quantity'] * item['price'] * item['exchangeRate'] for item in mock_data['outgoing'])
    profit = total_outgoing_value - total_incoming_value
    
    # عدد التنبيهات غير المقروءة
    unread_alerts = len([alert for alert in mock_data['alerts'] if not alert['isRead']])
    
    return jsonify({
        'success': True,
        'data': {
            'totalItems': total_items,
            'totalIncoming': total_incoming,
            'totalOutgoing': total_outgoing,
            'profit': profit,
            'unreadAlerts': unread_alerts,
            'lowStockItems': len([item for item in mock_data['inventory'] if item['quantity'] <= item['minLevel']])
        }
    })

# Routes للبحث
@app.route('/api/search', methods=['GET'])
def search():
    """البحث العام في النظام"""
    query = request.args.get('q', '').lower()
    search_type = request.args.get('type', 'all')
    
    results = {}
    
    if search_type in ['all', 'inventory']:
        results['inventory'] = [
            item for item in mock_data['inventory']
            if query in item['type'].lower() or 
               query in item['brand'].lower() or 
               query in item['size'].lower() or 
               query in item['location'].lower()
        ]
    
    if search_type in ['all', 'incoming']:
        results['incoming'] = [
            item for item in mock_data['incoming']
            if query in item['type'].lower() or 
               query in item['supplier'].lower() or 
               query in item['brand'].lower() or 
               query in item['invoiceNumber'].lower()
        ]
    
    if search_type in ['all', 'outgoing']:
        results['outgoing'] = [
            item for item in mock_data['outgoing']
            if query in item['type'].lower() or 
               query in item['customer'].lower() or 
               query in item['brand'].lower() or 
               query in item['invoiceNumber'].lower()
        ]
    
    return jsonify({'success': True, 'data': results})

# Route للصحة
@app.route('/api/health', methods=['GET'])
def health_check():
    """فحص صحة الخدمة"""
    return jsonify({
        'success': True,
        'message': 'API يعمل بشكل طبيعي',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# معالج الأخطاء
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'المسار غير موجود'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'خطأ داخلي في الخادم'}), 500

if __name__ == '__main__':
    print("🚀 بدء تشغيل خادم API...")
    print("📊 نظام إدارة المخزون والحسابات")
    print("🌐 الخادم يعمل على: http://0.0.0.0:5000")
    print("📖 وثائق API متاحة على: http://0.0.0.0:5000/api/health")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

