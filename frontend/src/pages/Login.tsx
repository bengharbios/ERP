import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login(credentials);

            if (response.success && response.data) {
                const { user, accessToken, refreshToken } = response.data;
                setAuth(user, accessToken, refreshToken);
                navigate('/dashboard');
            } else {
                setError(response.error?.message || 'فشل تسجيل الدخول / Login failed');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(
                err.response?.data?.error?.message ||
                'حدث خطأ أثناء تسجيل الدخول / An error occurred'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>🎓 نظام ERP التعليمي</h1>
                    <p>تسجيل الدخول / Login</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">
                            اسم المستخدم / Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={credentials.username}
                            onChange={(e) =>
                                setCredentials({ ...credentials, username: e.target.value })
                            }
                            placeholder="أدخل اسم المستخدم"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            كلمة المرور / Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={credentials.password}
                            onChange={(e) =>
                                setCredentials({ ...credentials, password: e.target.value })
                            }
                            placeholder="أدخل كلمة المرور"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-login"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                جاري التسجيل... Loading
                                <span className="spinner"></span>
                            </>
                        ) : (
                            'تسجيل الدخول / Login'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        ليس لديك حساب؟{' '}
                        <a href="/register">
                            إنشاء حساب جديد / Register
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
