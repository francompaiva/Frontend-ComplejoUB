import React, { useState } from 'react';
import RoleSelector, { type UserRole } from './RoleSelector';

interface LoginFormProps {
  onSubmit?: (data: { role: UserRole; identifier: string; pass: string }) => void;
  onForgotPassword?: () => void;
  onRegisterClick?: () => void;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  onRegisterClick,
  className = ''
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Cliente / Capitán');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ role: selectedRole, identifier, pass: password });
    }
  };

  return (
    <div
      className={`login-card ${className}`}
      style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#293827',
        border: '1px solid #5A7056',
        borderRadius: '12px', // PSP: 12px
        padding: '32px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif",
        textAlign: 'left'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#65C556', margin: 0 }}>
          Iniciar Sesión
        </h2>
        <p style={{ fontSize: '13px', color: '#A3B8A1', margin: 0 }}>
          Ingresá a tu cuenta de Complejo Deportivo UB
        </p>
      </div>

      {/* RoleSelector */}
      <div style={{ width: '100%' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#FFFFFF', marginBottom: '8px' }}>
          Seleccioná tu perfil
        </label>
        <RoleSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Email / Identificador */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label htmlFor="user-identifier" style={{ fontSize: '12px', fontWeight: 500, color: '#FFFFFF' }}>
            Correo electrónico o DNI
          </label>
          <input
            id="user-identifier"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="usuario@ejemplo.com"
            style={{
              width: '100%',
              height: '44px',
              padding: '0 14px',
              backgroundColor: '#1E281D',
              border: '1px solid #5A7056',
              borderRadius: '8px', // PSP: 8px
              fontSize: '13px',
              color: '#FFFFFF',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: "'Inter', sans-serif"
            }}
          />
        </div>

        {/* Contraseña */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="user-pass" style={{ fontSize: '12px', fontWeight: 500, color: '#FFFFFF' }}>
              Contraseña
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '11px',
                fontWeight: 500,
                color: '#65C556',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <input
            id="user-pass"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            style={{
              width: '100%',
              height: '44px',
              padding: '0 14px',
              backgroundColor: '#1E281D',
              border: '1px solid #5A7056',
              borderRadius: '8px', // PSP: 8px
              fontSize: '13px',
              color: '#FFFFFF',
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: "'Inter', sans-serif"
            }}
          />
        </div>

        {/* Botón Primario */}
        <button
          type="submit"
          style={{
            width: '100%',
            height: '46px',
            marginTop: '8px',
            backgroundColor: '#65C556',
            color: '#293827',
            fontWeight: 600,
            fontSize: '14px',
            borderRadius: '8px', // PSP: 8px
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          Iniciar Sesión
        </button>
      </form>

      {/* Footer */}
      <div style={{ textAlign: 'center', paddingTop: '4px' }}>
        <p style={{ fontSize: '12px', color: '#A3B8A1', margin: 0 }}>
          ¿No tenés una cuenta?{' '}
          <button
            type="button"
            onClick={onRegisterClick}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '12px',
              fontWeight: 600,
              color: '#65C556',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Registrate aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
