import React, { useState, useEffect } from 'react';
import biometricService, { BiometricDevice } from '../services/biometric.service';
import './BiometricDevices.css';

const BiometricDevices: React.FC = () => {
    const [devices, setDevices] = useState<BiometricDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Partial<BiometricDevice> | null>(null);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        loadDevices();
    }, []);

    const handleScan = async () => {
        try {
            setIsScanning(true);
            const found = await biometricService.discoverDevices();
            if (found.length === 0) {
                alert('⚠️ لم يتم العثور على أجهزة\n\nالبحث التلقائي قد لا يعمل في بعض الشبكات.\n\nنصائح:\n1. تأكد من أن الجهاز متصل بنفس الشبكة\n2. تأكد من تفعيل SADP في الجهاز\n3. جرّب الإضافة اليدوية بدلاً من ذلك');
            } else {
                // For simplicity, we'll just show the first found device in the modal
                const device = found[0];
                setEditingDevice({
                    ...device,
                    username: 'admin',
                    password: ''
                });
                setShowModal(true);
                alert(`✅ تم العثور على ${found.length} جهاز\n\nالجهاز: ${device.model}\nIP: ${device.ipAddress}`);
            }
        } catch (error) {
            alert('❌ حدث خطأ أثناء البحث\n\nجرّب الإضافة اليدوية');
        } finally {
            setIsScanning(false);
        }
    };

    const loadDevices = async () => {
        try {
            setLoading(true);
            const data = await biometricService.getDevices();

            // Set initial status as 'checking'
            const devicesWithStatus = data.map((d: BiometricDevice) => ({ ...d, connectionStatus: 'checking' as const }));
            setDevices(devicesWithStatus);

            // Check connection for each device in parallel
            const statusChecks = data.map(async (device: BiometricDevice) => {
                try {
                    await biometricService.testConnection(device.id);
                    return { id: device.id, status: 'online' as const };
                } catch {
                    return { id: device.id, status: 'offline' as const };
                }
            });

            const statuses = await Promise.all(statusChecks);

            // Update devices with actual status
            setDevices(prev => prev.map(device => {
                const status = statuses.find(s => s.id === device.id);
                return { ...device, connectionStatus: status?.status || 'offline' };
            }));

        } catch (error) {
            console.error('Failed to load devices', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDevice) return;

        try {
            if (editingDevice.id) {
                await biometricService.updateDevice(editingDevice.id, editingDevice);
            } else {
                await biometricService.createDevice(editingDevice);
            }
            setShowModal(false);
            loadDevices();
        } catch (error) {
            alert('فشل حفظ بيانات الجهاز');
        }
    };

    const handleTest = async (id: string) => {
        try {
            const result = await biometricService.testConnection(id);
            if (result.success) {
                alert('تم الاتصال بالجهاز بنجاح');
            } else {
                alert('فشل الاتصال: ' + result.error);
            }
        } catch (error) {
            alert('حدث خطأ أثناء اختبار الاتصال');
        }
    };

    const handleSync = async (id: string) => {
        try {
            setIsSyncing(id);
            const result = await biometricService.syncAttendance(id);
            alert(`تمت المزامنة بنجاح. السجلات الجديدة: ${result.synced}`);
            loadDevices();
        } catch (error) {
            alert('فشل مزامنة البيانات من الجهاز');
        } finally {
            setIsSyncing(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الجهاز؟')) {
            try {
                await biometricService.deleteDevice(id);
                loadDevices();
            } catch (error) {
                alert('فشل حذف الجهاز');
            }
        }
    };

    return (
        <div className="biometric-container animate-fade-in" dir="rtl">
            <div className="biometric-header">
                <div>
                    <h1>إدارة أجهزة البصمة (Hikvision)</h1>
                    <p className="text-secondary">ربط وإدارة أجهزة تسجيل الحضور والغياب المباشرة</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-icon btn-outline"
                        onClick={handleScan}
                        disabled={isScanning}
                    >
                        {isScanning ? 'جاري البحث...' : '🔍 بحث تلقائي'}
                    </button>
                    <button
                        className="btn-icon btn-primary"
                        onClick={() => {
                            setEditingDevice({ name: '', ipAddress: '', port: 80, username: 'admin', password: '', protocol: 'ISAPI' });
                            setShowModal(true);
                        }}
                    >
                        <i>+</i> إضافة يدوي
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner">جاري التحميل...</div>
            ) : (
                <div className="device-grid">
                    {devices.map(device => (
                        <div key={device.id} className="device-card">
                            <div className="device-info">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3>{device.name}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        {device.connectionStatus === 'checking' ? (
                                            <span className="status-badge" style={{ background: '#FFA500', color: 'white' }}>
                                                🔄 جاري الفحص...
                                            </span>
                                        ) : device.connectionStatus === 'online' ? (
                                            <span className="status-badge status-online">
                                                🟢 متصل
                                            </span>
                                        ) : (
                                            <span className="status-badge status-offline">
                                                🔴 غير متصل
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">IP: {device.ipAddress}:{device.port}</p>
                            </div>

                            <div className="device-stats">
                                <div className="stat-item">
                                    <span className="stat-label">آخر مزامنة</span>
                                    <span className="stat-value">
                                        {device.lastSync ? new Date(device.lastSync).toLocaleString('ar-EG') : 'لم تتم بعد'}
                                    </span>
                                </div>
                            </div>

                            <div className="device-actions">
                                <button className="btn-icon btn-success" onClick={() => handleSync(device.id)} disabled={isSyncing === device.id}>
                                    {isSyncing === device.id ? 'جاري السحب...' : 'سحب السجلات'}
                                </button>
                                <button
                                    className="btn-icon"
                                    style={{ background: '#10B981', color: 'white' }}
                                    onClick={async () => {
                                        if (confirm('هل تريد مزامنة الموظفين من الجهاز؟')) {
                                            try {
                                                const result = await biometricService.syncEmployees(device.id);
                                                alert(result.message || 'تم مزامنة الموظفين بنجاح');
                                                loadDevices();
                                            } catch (error: any) {
                                                alert(error.response?.data?.error || 'فشل مزامنة الموظفين');
                                            }
                                        }
                                    }}
                                >
                                    👥 مزامنة الموظفين
                                </button>
                                <button className="btn-icon btn-outline" onClick={() => handleTest(device.id)}>
                                    اختبار الاتصال
                                </button>
                                <button className="btn-icon btn-outline" onClick={() => {
                                    setEditingDevice(device);
                                    setShowModal(true);
                                }}>
                                    تعديل
                                </button>
                                <button className="btn-icon btn-outline text-danger" onClick={() => handleDelete(device.id)}>
                                    حذف
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingDevice?.id ? 'تعديل جهاز' : 'إضافة جهاز جديد'}</h2>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>اسم الجهاز</label>
                                <input
                                    type="text"
                                    value={editingDevice?.name || ''}
                                    onChange={e => setEditingDevice({ ...editingDevice, name: e.target.value })}
                                    required
                                    placeholder="مثلاً: بوابة الموظفين الرئيسية"
                                />
                            </div>
                            <div className="form-group">
                                <label>عنوان IP</label>
                                <input
                                    type="text"
                                    value={editingDevice?.ipAddress || ''}
                                    onChange={e => setEditingDevice({ ...editingDevice, ipAddress: e.target.value })}
                                    required
                                    placeholder="192.168.1.100"
                                />
                            </div>
                            <div className="form-group">
                                <label>المنفذ (Port)</label>
                                <input
                                    type="number"
                                    value={editingDevice?.port || 80}
                                    onChange={e => setEditingDevice({ ...editingDevice, port: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>اسم المستخدم</label>
                                <input
                                    type="text"
                                    value={editingDevice?.username || 'admin'}
                                    onChange={e => setEditingDevice({ ...editingDevice, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>كلمة المرور</label>
                                <input
                                    type="password"
                                    value={editingDevice?.password || ''}
                                    onChange={e => setEditingDevice({ ...editingDevice, password: e.target.value })}
                                    required={!editingDevice?.id}
                                    placeholder={editingDevice?.id ? 'اتركها فارغة لعدم التغيير' : 'كلمة مرور الجهاز'}
                                />
                            </div>
                            <div className="device-actions" style={{ justifyContent: 'flex-end', marginTop: '2rem' }}>
                                <button type="button" className="btn-icon btn-outline" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn-icon btn-primary">حفظ الجهاز</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BiometricDevices;
